import {
  chemicalEnergy,
  dewPoint,
  dryMoles,
  heatingValue,
  LATENT,
  LHV_CARBON,
  mixtureEnergy,
  MOLAR_MASS,
  MOLAR_VOLUME,
  N2_PER_O2,
  ATMOSPHERE,
  newMoles,
  sensibleHeat,
  stoichAirToGas,
  temperatureOf,
  type GasMoles,
} from './species';

// One equilibrium, four balances: the method FAO §2.2.1 credits to Tobler and Schläpfer. Mass balances of carbon, hydrogen, oxygen and nitrogen, the water-gas equilibrium frozen at one temperature, a fixed amount
// of methane per kg of dry fuel, and an energy balance whose heat lost is a share of the input. The air is not chosen: it is what closes the energy balance. Everything per kg of DRY fuel inside, as the method is.

/** Water-gas equilibrium [CO][H₂O]/[CO₂][H₂] against temperature. Reported: FAO Table 2.2. */
export const K_WE_TABLE: readonly (readonly [number, number])[] = [
  [600, 0.38],
  [700, 0.62],
  [800, 0.92],
  [900, 1.27],
  [1000, 1.6],
];

/** K_we at a temperature, °C: straight between the table's rows, held at its ends. The method needs no more. */
export function waterGasK(T: number): number {
  const t = K_WE_TABLE;
  if (T <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) {
    if (T <= t[i]![0]) {
      const [a, ka] = t[i - 1]!;
      const [b, kb] = t[i]!;
      return ka + ((kb - ka) * (T - a)) / (b - a);
    }
  }
  return t[t.length - 1]![1];
}

/** Dry wood as CH₁.₄O₀.₆, reported: S2 Table 4-1. */
export const WOOD_H = 1.4;
export const WOOD_O = 0.6;
/** kg/mol of that formula. */
export const WOOD_MOLAR_MASS = MOLAR_MASS.C + WOOD_H * 0.001008 + WOOD_O * 0.015999;
/** Oxygen to burn a mole of it completely, mol. */
export const WOOD_STOICH_O2 = 1 + WOOD_H / 4 - WOOD_O / 2;

export interface GasifyConditions {
  /** Moisture of the fuel, wet basis, 0 to below 1. */
  moistureWet: number;
  /** Lower heating value of the dry fuel, J/kg. */
  lhvDry: number;
  /** Convection and radiation, a share of the fuel's energy as fired. */
  heatLossShare: number;
  /** The gas leaves at this temperature, °C. */
  outletT: number;
  /** The equilibrium freezes at this temperature, °C. */
  frozenT: number;
  /** Share of the fuel's moisture drained at the jacket before the fire, 0 to 1. */
  drainShare: number;
  /** Methane, mol per kg of dry fuel. */
  methane: number;
  /** Unburnt carbon in the ash pit, mol per kg of dry fuel. */
  residueCarbon: number;
}

export interface GasResult {
  /** Moles leaving, per kg of dry fuel, the drained water not among them. */
  moles: GasMoles;
  /** Dry volume shares. */
  xCO: number;
  xH2: number;
  xCH4: number;
  xCO2: number;
  xN2: number;
  /** Water in the wet gas, volume share. */
  xH2OWet: number;
  /** J/Nm³ of dry gas. */
  heatingValue: number;
  /** m³ of air per m³ of gas to burn it completely. */
  airToGas: number;
  /** J/Nm³ of the stoichiometric mixture. */
  mixtureEnergy: number;
  /** Fuel's energy as fired, J/kg of wet fuel. */
  lhvWet: number;
  /** Cold-gas energy over fuel's energy. */
  coldGasEff: number;
  /** Nm³ of dry gas per kg of wet fuel. */
  yieldWet: number;
  /** Oxygen taken from the air, mol per kg of dry fuel. */
  oxygen: number;
  /** Air, kg per kg of wet fuel. */
  airPerKgWet: number;
  /** Oxygen taken over what burning it all would take. */
  equivalenceRatio: number;
  /** Dew point of the wet gas, °C. */
  dewPointC: number;
  /** Per kg of wet fuel, J: */
  lossSensible: number;
  lossCasing: number;
  lossResidue: number;
  /** Water, kg per kg of wet fuel: drained at the jacket, and carried by the gas. */
  drainedWater: number;
  gasWater: number;
  /** Dry mass per kg of wet fuel. */
  wetFraction: number;
}

export const newGasResult = (): GasResult => ({
  moles: newMoles(),
  xCO: 0,
  xH2: 0,
  xCH4: 0,
  xCO2: 0,
  xN2: 0,
  xH2OWet: 0,
  heatingValue: 0,
  airToGas: 0,
  mixtureEnergy: 0,
  lhvWet: 0,
  coldGasEff: 0,
  yieldWet: 0,
  oxygen: 0,
  airPerKgWet: 0,
  equivalenceRatio: 0,
  dewPointC: 0,
  lossSensible: 0,
  lossCasing: 0,
  lossResidue: 0,
  drainedWater: 0,
  gasWater: 0,
  wetFraction: 1,
});

/**
 * The moles for a given oxygen, carbon pool and water. C′ = CO + CO₂, O = CO + 2CO₂ + H₂O, H′/2 = H₂ + H₂O, and K = CO·H₂O/(CO₂·H₂): one quadratic in the water. Writes into `n`. Returns false when the oxygen cannot carry the carbon.
 */
export function solveAtOxygen(
  carbonPool: number,
  hydrogenAtoms: number,
  oxygenAtoms: number,
  K: number,
  n: GasMoles,
): boolean {
  const A = oxygenAtoms - carbonPool; // CO₂ + H₂O
  const B = hydrogenAtoms / 2; // H₂ + H₂O
  const D = 2 * carbonPool - oxygenAtoms; // CO − H₂O
  if (A <= 0 || B <= 0) return false;
  const a = 1 - K;
  const b = D + K * (A + B);
  const c = -K * A * B;
  const disc = Math.sqrt(Math.max(0, b * b - 4 * a * c));
  const q = -0.5 * (b + (b >= 0 ? disc : -disc));
  let z = q !== 0 ? c / q : 0;
  if (z <= 0 || z >= Math.min(A, B)) z = a !== 0 ? q / a : z;
  if (!(z > 0) || z >= Math.min(A, B) || D + z < 0) return false;
  n.H2O = z;
  n.CO2 = A - z;
  n.H2 = B - z;
  n.CO = D + z;
  return true;
}

const scratch = newMoles();

/** Solve the method for one fuel and one set of losses. Allocates nothing if `out` is given. */
export function gasify(c: GasifyConditions, out: GasResult = newGasResult()): GasResult {
  const m = Math.min(0.9, Math.max(0, c.moistureWet));
  const waterKg = m / (1 - m); // per kg of dry
  const waterFireMol = (waterKg * (1 - c.drainShare)) / MOLAR_MASS.H2O;
  const nWood = 1 / WOOD_MOLAR_MASS;
  const lhvIn = c.lhvDry - LATENT * waterKg;
  const K = waterGasK(c.frozenT);
  const carbonPool = nWood - c.residueCarbon - c.methane;
  const hydrogen = WOOD_H * nWood + 2 * waterFireMol - 4 * c.methane;
  const oxygenFuel = WOOD_O * nWood + waterFireMol;

  const available = lhvIn * (1 - c.heatLossShare) - c.residueCarbon * LHV_CARBON;
  // the fewest oxygen atoms that can carry the carbon, and the most that burns it all
  let lo = Math.max(0, (carbonPool - oxygenFuel) / 2) + 1e-6;
  let hi = WOOD_STOICH_O2 * nWood;
  const n = scratch;
  n.CH4 = c.methane;
  const excess = (y: number): number => {
    n.N2 = N2_PER_O2 * y;
    if (!solveAtOxygen(carbonPool, hydrogen, oxygenFuel + 2 * y, K, n)) return -1e12;
    return available - chemicalEnergy(n) - sensibleHeat(n, c.outletT);
  };
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (excess(mid) < 0) lo = mid;
    else hi = mid;
  }
  const y = 0.5 * (lo + hi);
  excess(y);

  const dry = dryMoles(n);
  const wet = dry + n.H2O;
  const wetFraction = 1 - m;
  const r = out;
  r.moles.CO = n.CO;
  r.moles.H2 = n.H2;
  r.moles.CH4 = n.CH4;
  r.moles.CO2 = n.CO2;
  r.moles.H2O = n.H2O;
  r.moles.N2 = n.N2;
  r.xCO = n.CO / dry;
  r.xH2 = n.H2 / dry;
  r.xCH4 = n.CH4 / dry;
  r.xCO2 = n.CO2 / dry;
  r.xN2 = n.N2 / dry;
  r.xH2OWet = n.H2O / wet;
  r.heatingValue = heatingValue(r.xCO, r.xH2, r.xCH4);
  r.airToGas = stoichAirToGas(r.xCO, r.xH2, r.xCH4);
  r.mixtureEnergy = mixtureEnergy(r.xCO, r.xH2, r.xCH4);
  r.lhvWet = lhvIn * wetFraction;
  r.coldGasEff = chemicalEnergy(n) / lhvIn;
  r.yieldWet = dry * MOLAR_VOLUME * wetFraction;
  r.oxygen = y;
  r.airPerKgWet = (1 + N2_PER_O2) * y * 0.02897 * wetFraction;
  r.equivalenceRatio = y / (WOOD_STOICH_O2 * nWood);
  r.dewPointC = dewPoint(r.xH2OWet * ATMOSPHERE);
  r.lossSensible = sensibleHeat(n, c.outletT) * wetFraction;
  r.lossCasing = lhvIn * c.heatLossShare * wetFraction;
  r.lossResidue = c.residueCarbon * LHV_CARBON * wetFraction;
  r.drainedWater = waterKg * c.drainShare * wetFraction;
  r.gasWater = n.H2O * MOLAR_MASS.H2O * wetFraction;
  r.wetFraction = wetFraction;
  return r;
}

export interface HotZones {
  /** Gas leaving the reduction zone, from the balance alone: as if all the losses came after it, °C. The hearth's node takes the wall's part off. */
  reductionEndT: number;
  /** Gas leaving the oxidation zone, °C. */
  oxidationEndT: number;
  /** Heat the reduction takes from the gas, J per kg of dry fuel. */
  reductionHeat: number;
  /** The gas after the oxidation zone, before the char has worked on it, per kg of dry fuel. */
  afterOxidation: GasMoles;
}

export const newHotZones = (): HotZones => ({
  reductionEndT: 0,
  oxidationEndT: 0,
  reductionHeat: 0,
  afterOxidation: newMoles(),
});

/**
 * Why the gas cools as it gets its fuel. The gas leaves the reduction zone holding what it will still hand on: the sensible heat at the outlet and the losses. The drying and warming of the fuel above are paid for at the top of the fire, upward, by radiation and through the char, so they are not in that sum (the
 * overall balance closes either way; a test holds it). So the reduction's end is found. Before it, the volatiles alone, with no char yet, have taken the same oxygen: same method, with only their carbon. The difference in chemical energy, less the char's, is the heat the reduction takes (C + CO₂ → 2CO comes out at FAO's 165 kJ/mol).
 */
export function hotZones(
  c: GasifyConditions,
  g: GasResult,
  charCarbon: number,
  out: HotZones = newHotZones(),
): HotZones {
  const waterKg = c.moistureWet / (1 - c.moistureWet);
  const lhvIn = c.lhvDry - LATENT * waterKg;
  const atThroat = sensibleHeat(g.moles, c.outletT) + lhvIn * c.heatLossShare;
  out.reductionEndT = temperatureOf(g.moles, atThroat);

  const nWood = 1 / WOOD_MOLAR_MASS;
  const waterFireMol = (waterKg * (1 - c.drainShare)) / MOLAR_MASS.H2O;
  const volatileCarbon = nWood - charCarbon - c.methane;
  const hydrogen = WOOD_H * nWood + 2 * waterFireMol - 4 * c.methane;
  const oxygen = WOOD_O * nWood + waterFireMol + 2 * g.oxygen;
  const o = out.afterOxidation;
  o.CH4 = c.methane;
  o.N2 = N2_PER_O2 * g.oxygen;
  if (!solveAtOxygen(volatileCarbon, hydrogen, oxygen, waterGasK(1000), o)) {
    // the oxygen burns every volatile: what is left over waits for the char. No source reads this far: held at the balance.
    o.CO = 0;
    o.H2 = 0;
    o.CO2 = volatileCarbon;
    o.H2O = hydrogen / 2;
  }
  out.reductionHeat = chemicalEnergy(g.moles) - chemicalEnergy(o) - (charCarbon - c.residueCarbon) * LHV_CARBON;
  out.oxidationEndT = temperatureOf(o, sensibleHeat(g.moles, out.reductionEndT) + Math.max(0, out.reductionHeat));
  return out;
}

/** Air reaching the gas after the reduction zone (a fault): it burns what it meets, hydrogen and carbon monoxide alike. Writes the moles, returns the heat released per kg of dry fuel, J. */
export function burnLeak(g: GasMoles, airPerDryMole: number): number {
  const dry = dryMoles(g);
  const o2 = airPerDryMole * dry * 0.21;
  const fuel = g.CO + g.H2;
  const burnt = Math.min(fuel, 2 * o2);
  if (fuel <= 0) return 0;
  const sCO = (burnt * g.CO) / fuel;
  const sH2 = (burnt * g.H2) / fuel;
  const heat = sCO * 283.66e3 + sH2 * 241.3e3;
  g.CO -= sCO;
  g.CO2 += sCO;
  g.H2 -= sH2;
  g.H2O += sH2;
  g.N2 += N2_PER_O2 * o2;
  return heat;
}
