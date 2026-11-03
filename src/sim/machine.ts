import { LATENT, MOLAR_MASS, MOLAR_VOLUME } from './gas/species';

// Every number of every machine, with its word beside it, as in docs/research.md. `src/three/dims.ts` imports from here and adds only what the simulation does not need:
//   reported   said by a source (K and S numbers of docs/research.md)
//   derived    computed from reported figures, the formula is beside it
//   estimate   the sources are silent: a choice with its reason, made before any comparison
//   assumption a choice of how to run it
//
// One machine's values, with no rule from a power to a size anywhere (research §A.2, R2). This is not a plan. The numbers under `NOT_PRINTED` are geometry for the 3D: they never reach a state key, a sheet or a voice, and a test holds that.

export type MachineId = 'mf-1100' | 'scania-l8050';

/** The machine drawn in the 3D, in every world. */
export const DRAWN_MACHINE: MachineId = 'mf-1100';

export interface Machine {
  id: MachineId;
  /** Swept volume, m³. Reported: K2 5.8 dm³, K32 7.8 dm³. */
  displacement: number;
  /** m. MF: third party, S10, 5 in. Scania: estimate, no source read. */
  stroke: number;
  /** Speed at idle, part and test maximum, rpm. MF reported: K9. Scania: estimate, it has no such test. */
  rpmIdle: number;
  rpmPart: number;
  rpmMax: number;
  /** Speed of the highest power measured, rpm. Reported: K22, K33. */
  rpmFull: number;
  /** The power of the test maximum and of part load, W. Reported: K10. */
  powerMax: number;
  powerPart: number;
  /** Straight diesel, W. Reported: K22, K33. An input: the smoke limit decides it, and the model has no smoke. */
  powerDiesel: number;
  /** Filter's cloth, m². Reported: K4, K32. */
  filterArea: number;
  /** Mass of the filter boxes, kg. Derived: 65.5 kg for a 3 m² box (S1 §3.1.3), by the cloth. */
  filterMass: number;
  /** Cooler's surface, m². Reported: K4, K32. */
  coolerArea: number;
  /** Fuel bunker, m³. MF reported: K3. Scania: the 304 dm³ row of S1 Table 3.2, as research §2.10 took it: Table 3.14 prints 0.031, conflict 6. */
  bunkerVolume: number;
  /** m. Reported: S1 Table 3.2's 199 dm³ row for the MF, research §3. */
  bunkerDiameter: number;
  bunkerHeight: number;
  /** Fuel's bulk density, kg/m³. Reported: K8. */
  bulkDensity: number;
  /** Diesel per engine revolution in dual fuel, kg/rev. MF derived: K12's 2.2 kg/h at 1,855 rpm, and S1 §3.1.4 says a constant injection per stroke. Scania: the same per litre, assumption. NEVER shown (R4). */
  pilotPerRev: number;
  /** Ground speed while working, m/s. MF: estimate, a soil tool at about 7 km/h. Scania: reported, 60 km/h on average (K35). */
  groundSpeed: number;
  /** Scale of the gasifier's pressure drop: the flow at which K60's measured drops are read, Nm³/s. Assumption: about the most this gasifier was reported to pass on each machine. One machine's number, no rule. NEVER shown (R2). */
  hearthRefFlow: number;
  /** Mass of the whole system, kg. Reported: K5, K32. */
  systemMass: number;
  /** Vehicle in the gas version, kg. Reported: K1, K32. */
  vehicleMass: number;
}

/**
 * Sizes of the hot parts of this one machine, for the 3D and for nothing else that a visitor reads. Reported: S1 Table 3.12 for the throat and nozzle bore; the rest the F-5 family's, read by the research (§3). No rule goes with them.
 * The model does not read them. The hearth load is computed from the throat in `figures.test.ts`, nowhere else.
 */
export const NOT_PRINTED = {
  'mf-1100': {
    throatDiameter: 0.12,
    nozzleBore: 0.012,
    nozzleCount: 7,
    fireboxDiameter: 0.37,
    nozzlePlaneAboveThroat: 0.145,
    grateBelowThroat: 0.185,
    nozzleLength: 0.05,
  },
} as const;

const MF_PILOT_PER_REV = 2.2 / 3600 / (1855 / 60);

export const MF_1100: Machine = {
  id: 'mf-1100',
  displacement: 5.8e-3,
  stroke: 0.127,
  rpmIdle: 1015,
  rpmPart: 1440,
  rpmMax: 1855,
  rpmFull: 2170,
  powerMax: 40e3,
  powerPart: 29e3,
  powerDiesel: 64e3,
  filterArea: 4.9,
  filterMass: (65.5 * 4.9) / 3,
  coolerArea: 5.8,
  bunkerVolume: 0.2,
  bunkerDiameter: 0.627,
  bunkerHeight: 0.93,
  bulkDensity: 152,
  pilotPerRev: MF_PILOT_PER_REV,
  groundSpeed: 2,
  hearthRefFlow: 113 / 3600,
  systemMass: 450,
  vehicleMass: 5090,
};

export const SCANIA_L8050: Machine = {
  id: 'scania-l8050',
  displacement: 7.8e-3,
  stroke: 0.125,
  rpmIdle: 700,
  rpmPart: 1500,
  rpmMax: 1900,
  rpmFull: 2230,
  powerMax: 49.8e3,
  powerPart: 30e3,
  powerDiesel: 70.5e3,
  filterArea: 6,
  filterMass: 2 * 65.5,
  coolerArea: 5.8,
  bunkerVolume: 0.304,
  bunkerDiameter: 0.627,
  bunkerHeight: 1.27,
  bulkDensity: 152,
  pilotPerRev: (MF_PILOT_PER_REV * 7.8) / 5.8,
  groundSpeed: 60 / 3.6,
  hearthRefFlow: 177 / 3600,
  systemMass: 456,
  vehicleMass: 8350,
};

export const MACHINES: Record<MachineId, Machine> = { 'mf-1100': MF_1100, 'scania-l8050': SCANIA_L8050 };

/** Height of the gasifier's top above ground, its clearance, and the driver's eye, m. Reported: K6. */
export const LAYOUT = { unitTop: 2.22, unitClearance: 0.5, eyeLow: 2.25, eyeHigh: 2.4 } as const;

/** Lower casing's height, m. Derived: top less clearance less bunker (research §3). May be printed. */
export const lowerCasingHeight = (m: Machine = MF_1100): number =>
  LAYOUT.unitTop - LAYOUT.unitClearance - m.bunkerHeight;

// ---- the fuel

/** The heating value of the test's chips at 8 %, J/kg. Derived: K18 ÷ (1 − K14) over K11, research §2.10. So K14 and K18 are not independent of this input at the maximum. */
export const LHV_AT_8 = ((56.3e3 / (1 - 0.711)) * 3600) / 41;
/** The same dry, J/kg. Derived: (LHV_AT_8 + latent·m)/(1 − m). */
export const LHV_DRY = (LHV_AT_8 + LATENT * 0.08) / 0.92;
/** Moisture of the tests, wet basis. Reported: K8. */
export const TEST_MOISTURE = 0.08;
/** Field tests' range and the limits, wet basis. Reported: K59. */
export const MOISTURE_FIELD_MAX = 0.2;
export const MOISTURE_UPPER = 0.3;
export const MOISTURE_NO_BURN = 0.4;
/** What engines want of the gas, J/Nm³. Reported: K59 (S1 §2.4.3). */
export const GAS_MIN = 4.2e6;
/** Diesel's lower heating value, J/kg. Assumption, general knowledge (research §2.10). */
export const DIESEL_LHV = 42.7e6;

/** Pressure drop across the gasifier at its reference flow, Pa, and sieving's loss. Reported: K60, S1 Table 3.8 (a type F5 on another tractor). */
export const CHIP_GRADES = {
  unsieved: { drop: 0.18e5, sievingLoss: 0, label: 'unsieved' },
  '5-40': { drop: 0.13e5, sievingLoss: 0.03, label: '5-40' },
  '10-40': { drop: 0.09e5, sievingLoss: 0.14, label: '10-40' },
  '15-40': { drop: 0.08e5, sievingLoss: 0.34, label: '15-40' },
} as const;
export type ChipGrade = keyof typeof CHIP_GRADES;

/** Table 3.4: gas flow, Nm³/h·m², against mm of water, dry fabric with a normal layer of dust. Reported, measured. See `filterDrop` on normal cubic metres. */
export const FILTER_TABLE: readonly (readonly [number, number])[] = [
  [10, 130],
  [20, 250],
  [30, 380],
  [40, 500],
];

/** Ageing, reported K63 on a truck: flat to 500–750 km, then 60–75 mm Wg per 1,000 km against 150–200 clean. Middles of each range. */
export const FILTER_AGE = {
  flatKm: 625,
  risePerKm: 67.5 / 1000,
  cleanDrop: 175,
  /** A truck's 60 km/h, reported: S1 §3.1.3 itself turns 3,000 km into 50 h. */
  kmPerHour: 60,
} as const;
/** A wet fabric's drop. Reported: K62, « by a factor of over 6 ». */
export const FILTER_WET_FACTOR = 6;
/** Most the glass cloth takes, °C. Reported: K62. */
export const FILTER_MAX_T = 300;

/** Carbon monoxide in the gas after a stop, share. Reported: K48, middle of 23–27 %. */
export const POST_GAS_CO = 0.25;
/** The same in idling exhaust. Reported: K50, middle of 5–8 %, S3 p. 311, on the wartime engines of that book. */
export const IDLE_EXHAUST_CO = 0.065;
/** The fan's carbon monoxide, m³/s. Reported: K50, 200 L in a minute, S3 p. 311. */
export const FAN_CO = 0.2 / 60;

/** What every estimate of the model is, and why. Each can be moved by `PlantOptions` for a run in `runs.ts`; none is a slider. */
export const MODEL = {
  /** Air around, °C. Assumption: southern Sweden, a mild working day. */
  ambientT: 15,
  /** Heat lost by convection and radiation, a share of the fuel's energy. Reported as the condition of FAO's own calculation, Fig. 2.4 (15 %), not as a measurement of this machine. */
  heatLossShare: 0.15,
  /** The equilibrium freezes here, °C. Reported: FAO §2.2, « below 700 °C ». */
  frozenT: 700,
  /** Moisture drained at the jacket. Reported: K64, middle of 60–80 %. */
  drainShare: 0.7,
  /** Methane, mol per kg of dry fuel. Derived: 2.5 % (K46, middle of 2–3) of FAO's about 2.5 Nm³/kg dry. */
  methane: (0.025 * 2.5) / MOLAR_VOLUME,
  /** Unburnt carbon in the ash pit, mol per kg of dry fuel. Derived: K21's « about 5 % of the power at full load », on the test's chips, as carbon: 1.5 % of the fuel left as ash and so on makes up K21's 3.5 %. */
  residueCarbon: (((0.05 * LHV_AT_8) / 401.9e3) * 1) / 0.92,
  /** Carbon in the char reaching the fire, mol per kg of dry fuel. Estimate: 20 % of the dry mass as char at 85 % carbon, usual for wood in slow heating. It sets the gas after the oxidation zone, not the final gas. */
  charCarbon: (0.2 * 0.85) / MOLAR_MASS.C,
  /** Pyrolysis's end, °C. Estimate: K47 gives its start at about 250 °C. */
  pyrolysisEndT: 450,

  /** Share of a filled cylinder actually filled. Reported: K27, the middle of 0.7–0.9, and FAO's Appendix 1 takes 0.8 at 1,500 rpm. */
  volumetricEff: 0.8,
  /** Indicated efficiency in dual fuel. Estimate, set before the comparison: 0.7 of a fuel-air cycle gives 0.396; S1 Table 3.6's other engines, through the friction below, give 0.415 and 0.43. This tractor's own balance gives 0.36 to 0.39. Not read from that balance. */
  etaDual: 0.4,
  /** Straight diesel. Estimate: gives 243 g/kWh at the MF's rating, about right for its day. */
  etaDiesel: 0.46,
  /** Spark on gas alone, on the converted engines. Estimate: the same 0.7 of a cycle at their lower compression. */
  etaSpark: 0.33,
  /** Friction's peak pressure term, Pa. Estimate. Friction is Chen and Flynn's form, from memory: FMEP = 0.137 bar + p_max/200 + 0.162 bar·s/m × piston speed. */
  peakPressure: 70e5,
  /** Share of the gas burnt in the cylinder at work. Estimate: a little passes, about 0.3 % CO in the exhaust. */
  burnAtWork: 0.97,
  /** Load under which the burn falls towards idle's, a share of the machine's test maximum. Estimate: dual-fuel engines burn poorly below about half load. */
  burnKnee: 0.5,

  /** The gas's wall to the outer casing and its fuel, W/K. Estimate: holds the outlet in FAO's band near full load (250 °C at the least to run the filter, 300 °C the most the filter takes). So the outlet temperature is not a find. */
  outletUA: 97,
  /** The hot gas to the casing, W/K. Estimate. */
  gasToCasing: 25,
  /** Hearth to casing when no gas flows, W/K. Estimate: radiation across the gap, about 0.4 m² at about 60 W/m²·K, then halved for the gas that takes most of it back in work. */
  hearthToCasing: 12,
  /** Heat capacity of what stays hot in the hearth, J/K. Estimate: about 60 kg of steel and 10 kg of char. */
  hearthCapacity: 42e3,
  /** The outer casing, J/K. Estimate: about 130 kg of steel out of K5's 450. */
  casingCapacity: 62e3,
  /** Its surface, m². Estimate: lower casing (research §3's about 0.63 m across) and bunker. */
  casingArea: 3.4,
  /** Emissivity of a dirty steel casing. Estimate. */
  casingEmissivity: 0.8,
  /** Steel's heat capacity, J/kg·K. General knowledge. */
  steelCp: 480,
  /** Filter box to the air, W/K per m² of cloth. Estimate: 10 mm of mineral wool (S1 §3.1.3) and a film, 3.6 W/m²·K, on about 0.8 m² of box per m² of cloth. */
  filterLossPerArea: 2.9,
  /** Hot pipe to the air, W/K. Estimate: about 2.5 m of 75 mm pipe. */
  pipeLoss: 3,
  /** Equivalent diameter and length of everything between outlet and mixer, m. Estimate: dimensions unknown (research §3). */
  pipeDiameter: 0.075,
  pipeLength: 8,
  /** Cooler's overall coefficient on the gas side, W/m²·K. Estimate: a gas film in tubes. */
  coolerU: 20,
  /** Air through the cooler at the test maximum, W/K. Estimate: part of the radiator's fan. */
  coolerAirCapacity: 1000,
  /** Exponent of K60's drop on flow. Estimate: the inertial limit of a packed bed. */
  hearthExponent: 2,
  /** Air reaching the gas in the leak fault, volume per dry volume of gas. Estimate: no source sizes such a leak. */
  leakAirShare: 0.05,
  /** Hours between two emptyings of the cooler's vessel: K41's middle. The vessel's size is unknown. */
  coolerVesselHours: 2.5,
} as const;

// ---- the room: no source gives any of these for this machine (research §2.11). Every one is an estimate, wide on purpose.

export type DoorState = 'shut' | 'ajar' | 'open';

/** Outside air through the garage, changes per hour: low, middle, high. Assumption, wide: the books give usual values for old buildings, nobody measured this room. S3 found open doors « far from satisfactory ». */
export const DOOR_ACH: Record<DoorState, readonly [number, number, number]> = {
  shut: [0.1, 0.5, 1.5],
  ajar: [0.5, 2, 5],
  open: [2, 6, 20],
};

export const ROOM = {
  /** Garage's volumes, m³. Reported: K50, S3's two sizes. */
  garageSmall: 50,
  garageLarge: 1000,
  /** Room above, m³. Estimate. */
  aboveVolume: 60,
  /** Its own air, changes per hour. Estimate. */
  aboveAch: 0.5,
  /** Exchange through the floor, as changes per hour of the room above: low, middle, high. Estimate, wide: S3 says « for instance under a living room » and gives nothing else. */
  floorExchange: [0.05, 0.3, 1] as const,
  /** Post-gassing's whole volume, m³. Default estimate: S3's own « 1 m³ of generator gas in 1,000 m³ of air », an illustration and not a measure. Hand reasoning: the bed's heat could drive off 0.2 to 5 m³ (docs/physics.md §3.6). */
  postGasVolume: 1,
  /** Its time, min. Reported: K49, about 20 min of rising pressure. S2: « sometimes for hours ». */
  postGasMinutes: 20,
  /** A lid that does not seal: its gap, m². Estimate: about 0.6 mm on a seal about 1.6 m round (a 0.5 m lid, research §3's bunker). At 3 cm² the fire fades in about 1.5 h, at 30 cm² it holds itself until the bunker is empty, which is what S3 describes: docs/physics.md §3.6. */
  lidLeakArea: 1e-3,
  /** Height of the hot column that draws it, m: the lower casing, research §3. */
  lidLeakHeight: 0.79,
} as const;
