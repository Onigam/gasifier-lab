import type { ChipGrade, DoorState, MachineId } from './machine';
import type { EngineMode } from './motor';
import type { TruckLoad } from './reported';

// The shared types of the simulation. The engine writes `GasState` every frame; the 3D worlds, the strip and the panel only read it. SI inside (m, Pa, W, Nm³/s, mol), temperatures in °C; the state speaks the sources' units: kW, kg/h, Nm³/h, mbar, ppm.
// Flat keys: a film sets and reads them directly. Nothing here holds a size of the hot parts, a hearth load, a speed of gas at the throat, a filter's load, a pilot quantity, a compression, a timing, a dose or a time left for a person: `NEVER_DISPLAYED` in tags.ts
// lists them, and a test holds it.

export type PresetId = MachineId;
export type Place = 'field' | 'garage';

export type ScenarioId =
  | 'measured-hour'
  | 'part-load'
  | 'idling'
  | 'wet-chips'
  | 'fines'
  | 'filter-ageing'
  | 'three-engines'
  | 'air-leak'
  | 'working-shift'
  | 'engine-stops'
  | 'closed-garage'
  | 'truck';

export type AlarmKey =
  | 'engineShort'
  | 'gasTooPoor'
  | 'moistureAboveLimit'
  | 'moistureNoBurn'
  | 'filterWet'
  | 'filterHot'
  | 'filterAged'
  | 'airLeak'
  | 'vesselOverfull'
  | 'gasOutAfterStop'
  | 'lidLeak'
  | 'fanOut'
  | 'exhaustIndoors'
  | 'coWorkLimit'
  | 'coShortLimit'
  | 'coLadder'
  | 'coRoomAbove'
  | 'coDoorOpen'
  | 'coNoAllClear';

/** Which zone a point of the journey is in. */
export type ZoneId = 'drying' | 'pyrolysis' | 'oxidation' | 'reduction' | 'ash';

/** Everything the visitor can edit live. Ranges in presets.ts. Conditions only: no geometry, no setting of an engine, nothing that would tune a build (R1, R2, R4). */
export interface GasParams {
  slowMo: number;
  /** Simulated seconds per real second. */
  timeScale: number;
  running: boolean;
  preset: PresetId | 'custom';
  machine: MachineId;

  /** A published mode of a published engine. */
  engineMode: EngineMode;
  engineOn: boolean;
  /** Share of the test maximum, %. The speed follows the test's line. */
  load: number;
  /** The highest power measured: full throttle at its reported speed. */
  fullPower: boolean;
  /** The truck's load on the road. */
  truckLoad: TruckLoad;

  /** Moisture of the chips, wet basis, %. */
  moistureWet: number;
  chipGrade: ChipGrade;
  /** Hours since the filter was cleaned. Ages by itself if `filterAges`. */
  filterHours: number;
  filterAges: boolean;
  /** A fault: the fabric got wet, whatever the temperature. */
  filterWetFault: boolean;
  /** A fault: air reaches the gas below the reduction zone. */
  airLeak: boolean;
  /** A fault of K44's kind: the cooler's vessel is not emptied. */
  vesselNeglected: boolean;
  ambientT: number;

  // ---- the room
  place: Place;
  /** m³: S3's two sizes. */
  garageVolume: 50 | 1000;
  door: DoorState;
  /** The whole volume of gas that leaves after a stop, m³. Estimate: no source. */
  postGasVolume: number;
  /** Its time, min. About 20 by S3, « sometimes for hours » by S2. Past it the gas has not ended, it has thinned: the source has no end. */
  postGasMinutes: number;
  /** A fault S3 describes: a lid that does not seal. */
  lidLeak: boolean;
  /** S3's starting fan as a source of carbon monoxide. A source, not a gesture: no sentence here says when or how it ran. */
  fanSource: boolean;

  /** Where the journey's cursor is, 0 at the top of the bunker to 1 under the grate. Its zones are in order, not to scale. */
  journey: number;
}

/** What surrounds the chip at the journey's cursor. Every value but the chip's zone is an estimate beside the model's end points. */
export interface Analyser {
  zone: ZoneId;
  chipT: number;
  /** Water left in the chip, share of its wet mass at the start. */
  chipWater: number;
  /** What is left of the chip's dry mass, share. */
  chipMass: number;
  gasT: number;
  xCO: number;
  xH2: number;
  xCH4: number;
  xCO2: number;
  xH2O: number;
  xN2: number;
  xO2: number;
  /** Tar vapour against its peak at the end of pyrolysis, 0 to 1. Not a concentration: the only measured tar is at the outlet. */
  tarShare: number;
}

/** The state handed to the 3D scene, the strip and the panel every frame (read only). */
export interface GasState {
  // ---- clock
  simTime: number;
  /** Hours since the start of the run, on the clock. */
  hour: number;
  /** Minutes since the engine stopped; 0 while it runs. */
  minutesSinceStop: number;
  stoppedOnce: boolean;

  // ---- the engine (tractor, gas-train)
  engineOn: boolean;
  engineMode: EngineMode;
  engineRpm: number;
  /** kW at the shaft. */
  powerKw: number;
  /** kW asked; null at full throttle. */
  powerAskedKw: number | null;
  /** kW it could give at this speed. */
  powerWotKw: number;
  /** Asked more than it can give. */
  powerShort: boolean;
  /** Reported straight-diesel power of this machine, kW. */
  dieselRatedKw: number;
  /** kW at the highest speed, full throttle, on this gas now. */
  fullPowerKw: number;
  /** Lost against straight diesel at that speed, share. */
  deratingVsDiesel: number;
  /** Energy of a m³ of mixture, MJ/Nm³. */
  mixtureMJ: number;
  /** Petrol's, reported, MJ/m³. */
  petrolMixtureMJ: number;
  /** Lost against petrol's mixture, share: the first of the losses. */
  deratingVsPetrol: number;
  /** m³ of air per m³ of gas to burn it. A fact of the gas, not a setting: no slider moves it. */
  airToGas: number;
  /** The charge in the cylinder against a full one at atmospheric pressure, share. */
  chargeShare: number;
  /** Share of the gas's energy that burns in the cylinder. */
  burnShare: number;
  /** CO in the exhaust, share. Reported only at idle (S3), on other engines. */
  exhaustCO: number;
  /** Friction and throttling, kW. */
  frictionKw: number;
  throttlingKw: number;

  // ---- the flows
  chipsKgH: number;
  dieselKgH: number;
  /** Dry gas, Nm³/h. */
  gasNm3H: number;
  airNm3H: number;
  /** Gas against the test maximum's 89 Nm³/h, for the speed of the 3D's dots. */
  gasFlowShare: number;
  /** Share of the diesel saved against diesel alone at this power and speed. */
  dieselSubstitution: number;
  /** kg of chips per kg of diesel saved. */
  chipsPerDiesel: number;
  groundSpeedMs: number;

  // ---- the gas
  gasMJ: number;
  gasCO: number;
  gasH2: number;
  gasCH4: number;
  gasCO2: number;
  gasN2: number;
  /** Water in the wet gas after the jacket, share. */
  gasH2O: number;
  /** CO in the gas, ppm, for the ladder: about 200,000. */
  gasCoPpm: number;
  coldGasEff: number;
  /** Oxygen taken against what would burn it all: the fire short of air. */
  equivalenceRatio: number;
  /** Nm³ of gas per kg of chips. */
  gasYield: number;
  /** kg of air per kg of chips. */
  airPerKg: number;
  dewPointC: number;

  // ---- the energy, kW: the Sankey
  woodKw: number;
  dieselKw: number;
  gasKw: number;
  gasifierLossKw: number;
  lossHotGasKw: number;
  lossResidueKw: number;
  lossCasingKw: number;
  shaftKw: number;
  engineLossKw: number;
  totalLossKw: number;
  totalEff: number;
  dieselShare: number;

  // ---- the zones and the bunker (gasifier)
  zoneDryingT: number;
  zonePyrolysisT: number;
  zoneOxidationT: number;
  zoneReductionT: number;
  outletT: number;
  casingT: number;
  /** Heat the reduction takes, kW: why the gas cools as it gains its fuel. */
  reductionKw: number;
  /** Tar left after an estimated plug flow through the flame zone, against the tar that entered. An estimate of a mechanism: the measured tar is `tarG`. */
  tarCrackedShare: number;
  /** Tar measured at this load, g/Nm³: carried, not predicted. */
  tarG: number;
  bunkerShare: number;
  bunkerKg: number;
  bunkerMinutesLeft: number;
  /** The column's fall, cm/min. */
  chipFallCmMin: number;
  /** Hours a chip takes from the top. */
  chipFallHours: number;
  grateMoving: boolean;
  fillCount: number;
  analyser: Analyser;

  // ---- the train (gas-train)
  hearthDropMbar: number;
  filterDropMbar: number;
  filterDropMmWg: number;
  pipeDropMbar: number;
  /** Depression between the air and the mixer, mbar: the suction. */
  trainDropMbar: number;
  filterInT: number;
  filterT: number;
  filterWet: boolean;
  filterHours: number;
  filterAgeKm: number;
  coolerOutT: number;
  mixT: number;
  /** Dust after the fabric, reported, mg/m³. */
  dustMg: number;
  condensateJacketLph: number;
  condensateCoolerLph: number;
  /** Time since the cooler's vessel was emptied against K41's interval. Its size is unknown. */
  coolerVesselShare: number;
  ashKgH: number;

  // ---- the shift (farm)
  workedHours: number;
  serviceMinutes: number;
  serviceMinPerHour: number;
  chipsUsedKg: number;
  dieselUsedKg: number;
  ashKg: number;
  condensateL: number;
  kmDriven: number;
  chipsPer10Km: number;
  dieselPer10Km: number;

  // ---- the stop and the room (garage)
  /** Under way, the train is under suction. After a stop no source gives the pressure: null, and the state says which way it goes. */
  gaugeMbar: number | null;
  pressureSign: 'suction' | 'pressure' | 'none';
  /** Gas leaving the unit, L/min, and its carbon monoxide. Estimate: nobody measured it. */
  plumeLpm: number;
  plumeCoLpm: number;
  /** Against its first minute, 0 to 1, for the 3D's plume. */
  plumeShare: number;
  /** m³ of gas left the unit since the stop. */
  plumeTotalM3: number;
  /** Colour reported for wood: white or yellow, S3, no measure on this machine. */
  plumeVisible: boolean;
  place: Place;
  door: DoorState;
  garageVolume: number;
  /** ppm in an even box, three assumed ventilations of this door: middle, low figure, high figure. */
  garageCoPpm: number;
  garageCoPpmLow: number;
  garageCoPpmHigh: number;
  roomAboveCoPpm: number;
  roomAboveCoPpmLow: number;
  roomAboveCoPpmHigh: number;
  /** Highest rung of the published ladder this box has reached now, -1 under the first. Beside the ladder; never a line to stay under. */
  ladderRung: number;
  /** Once carbon monoxide has been in the room, there is no all-clear in this lab, whatever the number does. */
  coLatched: boolean;

  // ---- honesty
  /** † where this machine was measured, * elsewhere. */
  figureTag: '†' | '*';
  /** Every figure of the room: an estimate. */
  roomTag: '*';
  onDrawnMachine: boolean;

  alarms: AlarmKey[];
}

export interface Scope {
  t: number[];
  powerKw: number[];
  chipsKgH: number[];
  gasMJ: number[];
  gasCO: number[];
  filterDropMbar: number[];
  outletT: number[];
  filterT: number[];
  casingT: number[];
  garageCoPpm: number[];
  garageCoPpmLow: number[];
  garageCoPpmHigh: number[];
  roomAboveCoPpm: number[];
  plumeLpm: number[];
}
