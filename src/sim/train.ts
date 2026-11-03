import { airK, airMu, airPr, effectiveness, tubeFlow, tubePressureDrop } from '@onigam/lab-kit/sim/thermal';
import { saturationPressure, ATMOSPHERE, MOLAR_MASS, MOLAR_VOLUME } from './gas/species';
import {
  CHIP_GRADES,
  FILTER_AGE,
  FILTER_TABLE,
  FILTER_WET_FACTOR,
  MODEL,
  type ChipGrade,
  type Machine,
} from './machine';

// The train, from the gas outlet to the mixer: the pressure each part takes from the engine's charge, and the temperature each hands on. Measured laws where the sources give them (the fabric, its age, a wet fabric, the gasifier by chip grade), the kit's tube law
// and exchanger for the rest. A filter's load in m³/h·m² is a sizing quantity and never leaves this file (R2): the state gets the drop.

/** Dust layer's factor on the drop after so many hours. K63, on a truck: flat to 500–750 km, then 60–75 mm Wg per 1,000 km on about 175 clean. So 3,000 km comes to 1.9 times, « twice the value ». */
export function filterAgeFactor(hours: number): number {
  const km = Math.max(0, hours) * FILTER_AGE.kmPerHour;
  const over = Math.max(0, km - FILTER_AGE.flatKm);
  return 1 + (FILTER_AGE.risePerKm * over) / FILTER_AGE.cleanDrop;
}

/**
 * The fabric's drop, Pa. Table 3.4, straight between rows and through zero below the first, on NORMAL cubic metres: S1's Table 2.1 says that a gas volume is normal « unless otherwise specified, throughout the publication », and the table specifies nothing. The research read it at the
 * filter's temperature (§2.10: 39 mbar at its 89 Nm³/h). On normal metres the same flow gives about 23 mbar, and a truck's 90-odd Nm³/h at 60 km/h on 6 m² lands in K63's 150–200 mm Wg (K63 is about the L75, whose cloth is not printed; 6 m² is the L8050's). docs/physics.md §7 says so: the research should absorb it.
 */
export function filterDrop(gas: number, area: number, hours: number, wet: boolean): number {
  const load = Math.max(0, (gas * 3600) / area);
  const t = FILTER_TABLE;
  let mm: number;
  if (load <= t[0]![0]) mm = (t[0]![1] * load) / t[0]![0];
  else {
    let i = 1;
    while (i < t.length - 1 && load > t[i]![0]) i++;
    const [a, ma] = t[i - 1]!;
    const [b, mb] = t[i]!;
    mm = ma + ((mb - ma) * (load - a)) / (b - a);
  }
  return mm * 9.80665 * filterAgeFactor(hours) * (wet ? FILTER_WET_FACTOR : 1);
}

/** The gasifier's drop, Pa. K60's measured drops, read at a reference flow (an assumption: machine.ts), on the square of the flow. */
export function hearthDrop(gas: number, m: Machine, grade: ChipGrade): number {
  const s = gas / m.hearthRefFlow;
  return CHIP_GRADES[grade].drop * Math.pow(Math.max(0, s), MODEL.hearthExponent);
}

/** Molar mass of a dry gas at the shares of the test, near 0.025 kg/mol, for a density and nothing finer. */
const GAS_MOLAR_MASS = 0.025;

/** Density of the gas, kg/m³, at °C. */
export const gasDensity = (T: number, p: number = ATMOSPHERE): number => (p * GAS_MOLAR_MASS) / (8.314 * (T + 273.15));

/** Pipes, mixer and cooler's tubes as one equivalent length, Pa. Dimensions unknown (research §3). Air's viscosity and conductivity stand in for the gas's: hydrogen and nitrogen pull opposite ways, and this drop is small. */
export function pipeDrop(gas: number, T: number): number {
  const rhoN = gasDensity(0);
  const mdot = gas * rhoN;
  if (mdot <= 0) return 0;
  const rho = gasDensity(T);
  const flow = tubeFlow(mdot, MODEL.pipeDiameter, { rho, mu: airMu(T), k: airK(T), Pr: airPr(T) });
  return tubePressureDrop(flow, MODEL.pipeLength, MODEL.pipeDiameter, rho);
}

/** Heat capacity rate of the wet gas near the cooler's temperatures, W/K, per Nm³/s of dry gas. About 1.4 kJ/Nm³·K, usual for such a gas. */
export const GAS_CAPACITY = 1400;

/** Cooler: gas out, °C. The kit's cross-flow effectiveness on K4's area with an estimated coefficient. */
export function coolerOut(gas: number, Tin: number, Tair: number, m: Machine, U: number = MODEL.coolerU): number {
  const Cg = gas * GAS_CAPACITY;
  if (Cg <= 0) return Tair;
  const Ca = MODEL.coolerAirCapacity;
  const eps = effectiveness(U * m.coolerArea, Math.min(Cg, Ca), Math.max(Cg, Ca), 'cross');
  return Tin - (eps * Cg * (Tin - Tair)) / Math.min(Cg, Ca);
}

/** Water the gas gives up cooling to `T` at this pressure, kg/s, for a gas holding `xWet` of vapour. Above the dew point, none. */
export function condensation(gas: number, xWet: number, T: number, p: number = ATMOSPHERE): number {
  const xSat = saturationPressure(T) / p;
  if (xWet <= xSat) return 0;
  // moles of water per mole of dry gas, before and after
  const before = xWet / (1 - xWet);
  const after = xSat / (1 - xSat);
  return (gas / MOLAR_VOLUME) * (before - after) * MOLAR_MASS.H2O;
}
