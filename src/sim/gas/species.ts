// The gases of a gas producer, and what follows from a volume share of each: heating value, the air it asks, the energy of a cubic metre of mixture. Pure numbers and functions, no lab's name, nothing
// imported from outside this folder: a piece the kit could take (docs/kit-requests.md). SI: J, mol, Nm³, °C.

/** Nm³/mol at 0 °C and 1 atm. FAO's Table 2.1 divides to 22.41. */
export const MOLAR_VOLUME = 22.414e-3;
/** Share of oxygen in air by volume. Argon counts as nitrogen. */
export const AIR_O2 = 0.21;
export const N2_PER_O2 = (1 - AIR_O2) / AIR_O2;
/** Standard atmosphere, Pa. */
export const ATMOSPHERE = 101325;

/** Lower heating values, J/mol. Reported: FAO Table 2.1 (its heading says kJ/mol, its figures are per kmol). */
export const LHV_MOL = { CO: 283.66e3, H2: 241.3e3, CH4: 801.505e3 } as const;
/** The same per normal cubic metre, J/Nm³. Reported: FAO Table 2.1. */
export const LHV_NM3 = { CO: 12.655e6, H2: 10.77e6, CH4: 35.825e6 } as const;
/** Carbon burnt to CO₂, J/mol. Reported: FAO §2.2 prints 401.9 kJ/mol (the usual figure is 393.5). */
export const LHV_CARBON = 401.9e3;
/** Oxygen for complete burning, m³ per m³. Reported: FAO Table 2.1. */
export const O2_DEMAND = { CO: 0.5, H2: 0.5, CH4: 2 } as const;
/** Latent heat of water at 25 °C, J/kg. General knowledge. */
export const LATENT = 2.44e6;
/** Molar masses, kg/mol. */
export const MOLAR_MASS = {
  CO: 0.02801,
  H2: 0.002016,
  CH4: 0.01604,
  CO2: 0.04401,
  H2O: 0.018015,
  N2: 0.02801,
  O2: 0.031999,
  C: 0.012011,
} as const;

/** Moles of each gas, on whatever basis the caller keeps. */
export interface GasMoles {
  CO: number;
  H2: number;
  CH4: number;
  CO2: number;
  H2O: number;
  N2: number;
}

export const newMoles = (): GasMoles => ({ CO: 0, H2: 0, CH4: 0, CO2: 0, H2O: 0, N2: 0 });

// Mean heat capacity from 25 °C to T, J/mol·K, T in °C. General knowledge, fitted from memory to the usual gas tables: good to about 2 % up to 1,500 °C. Read one before quoting a digit.
const cpN2 = (T: number): number => 29.0 + 0.0029 * T;
const cpCO = (T: number): number => 29.1 + 0.0032 * T;
const cpH2 = (T: number): number => 28.8 + 0.0009 * T;
const cpCO2 = (T: number): number => 37.7 + 0.0155 * T - 3.5e-6 * T * T;
const cpH2O = (T: number): number => 33.4 + 0.0067 * T;
const cpCH4 = (T: number): number => 35 + 0.033 * T;

/** Sensible heat of a mix from 25 °C to T, J, on the mix's own basis. */
export function sensibleHeat(n: GasMoles, T: number): number {
  const c = n.CO * cpCO(T) + n.H2 * cpH2(T) + n.CH4 * cpCH4(T) + n.CO2 * cpCO2(T) + n.H2O * cpH2O(T) + n.N2 * cpN2(T);
  return c * (T - 25);
}

/** The temperature at which a mix holds this sensible heat, °C. Monotonic: a few steps of Newton on the mean heat capacity. */
export function temperatureOf(n: GasMoles, heat: number): number {
  let T = 25 + heat / Math.max(1e-9, 33 * (n.CO + n.H2 + n.CH4 + n.CO2 + n.H2O + n.N2));
  for (let i = 0; i < 5; i++) {
    const c = n.CO * cpCO(T) + n.H2 * cpH2(T) + n.CH4 * cpCH4(T) + n.CO2 * cpCO2(T) + n.H2O * cpH2O(T) + n.N2 * cpN2(T);
    T = 25 + heat / Math.max(1e-9, c);
  }
  return T;
}

/** Chemical energy held by a mix, J on the mix's own basis. */
export const chemicalEnergy = (n: GasMoles): number => n.CO * LHV_MOL.CO + n.H2 * LHV_MOL.H2 + n.CH4 * LHV_MOL.CH4;

/** The dry total. */
export const dryMoles = (n: GasMoles): number => n.CO + n.H2 + n.CH4 + n.CO2 + n.N2;

/** Heating value of a gas from its dry volume shares, J/Nm³: FAO Table 2.1. */
export const heatingValue = (xCO: number, xH2: number, xCH4: number): number =>
  xCO * LHV_NM3.CO + xH2 * LHV_NM3.H2 + xCH4 * LHV_NM3.CH4;

/** Stoichiometric air per volume of gas, m³/m³: FAO Table 2.1's oxygen over air's. */
export const stoichAirToGas = (xCO: number, xH2: number, xCH4: number): number =>
  (O2_DEMAND.CO * xCO + O2_DEMAND.H2 * xH2 + O2_DEMAND.CH4 * xCH4) / AIR_O2;

/** Heating value of the stoichiometric mixture of gas and air, J/Nm³: FAO §2.1.2's formula. */
export function mixtureEnergy(xCO: number, xH2: number, xCH4: number): number {
  return heatingValue(xCO, xH2, xCH4) / (1 + stoichAirToGas(xCO, xH2, xCH4));
}

/** Dew point of a vapour at this partial pressure, °C: Magnus over water, usual constants. */
export function dewPoint(partialPressure: number): number {
  if (partialPressure <= 0) return -Infinity;
  const g = Math.log(partialPressure / 611.2);
  return (243.12 * g) / (17.62 - g);
}

/** Saturation pressure of water, Pa: the same Magnus. */
export const saturationPressure = (T: number): number => 611.2 * Math.exp((17.62 * T) / (243.12 + T));
