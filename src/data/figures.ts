// The figures the texts of src/data write by {placeholder}: the French and English spellings of a number can never drift apart, and each one carries its mark by construction, so that a computed or an estimated number cannot be written without it.
//
// What the marks mean to the visitor (the same as the simulation's TAG_NOTE, src/sim/texts.ts, and the sheets' legend, `marksLegend` in src/drawings/draw.ts):
//   no mark    REPORTED: stated by a source of docs/research.md. Written in the text itself, and checked against the list of data.test.ts.
//   †          a model result, or a sum on published figures, where THIS machine was measured (research: derived; the model at the bench's three points).
//   *          an estimate, or the same model where this machine was not measured: past 20 % moisture, in a fault, on another engine, and everything about the garage.
// Nothing here is tuned to anything. `figures.test.ts` recomputes the model's and the derived figures from src/sim and src/three/dims.ts, so that a change of either cannot go unnoticed.
//
// **No figure here is a size of the hot parts** (the throat, the nozzles, the firebox, the zones: `NOT_PRINTED` in src/sim/machine.ts, `HOT` and `HEARTH` in dims.ts). `refusals.test.ts` holds that, for this file and for every text and sheet.
import { COOLER, FARM, FAN, FILTER, GARAGE, TRACTOR } from '../three/dims';
import { MF_1100, MODEL } from '../sim/machine';
import { nEn, nFr } from './units';

export type FigStatus = 'derived' | 'model' | 'elsewhere' | 'assumption' | 'estimate';

export interface Fig {
  /** The value, in the unit shown. */
  v: number;
  /** Decimals shown. */
  d: number;
  s: FigStatus;
  /** Unit with its leading space when it takes one: a string, or [fr, en] when the languages differ. */
  u?: string | readonly [string, string];
  /** A value that is no plain number: a range, a size, a span of time in words. */
  t?: readonly [string, string];
}

/** † for what is computed or modelled where this machine was measured, * for what is estimated or modelled where it was not. The one place that decides it. */
export const markOf = (s: FigStatus): string => (s === 'derived' || s === 'model' ? '†' : '*');

const pct: readonly [string, string] = [' %', '%'];
const kgh: readonly [string, string] = [' kg/h', ' kg/h'];
const lph: readonly [string, string] = [' L/h', ' L/h'];
const turns: readonly [string, string] = [' tour par seconde', ' turn a second'];
const cmmin: readonly [string, string] = [' cm par minute', ' cm a minute'];
const perHour: readonly [string, string] = [' par heure', ' an hour'];
const mmWater: readonly [string, string] = [' mm d’eau', ' mm of water'];

const d = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'derived', u });
const m = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'model', u });
const w = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'elsewhere', u });
const e = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'estimate', u });
const words = (s: FigStatus, fr: string, en: string, v = 0): Fig => ({ v, d: 0, s, t: [fr, en] });

const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;
/** A size read from dims.ts, in both languages: `size('m', 20, 10)` is « 20 × 10 m ». */
const size = (s: FigStatus, unit: string, ...values: number[]): Fig =>
  words(
    s,
    `${values.map((x) => trim(nFr(x, 2), ',')).join(' × ')} ${unit}`,
    `${values.map((x) => trim(nEn(x, 2), '.')).join(' × ')} ${unit}`,
  );

const circumference = (r: number): number => 2 * Math.PI * r;

export const FIG = {
  // ---- arithmetic on reported figures (research §2.10), and the model where the machine was measured
  kwIn: d(221, 0, ' kW'), // 194.8 kW of wood + 26.1 kW of diesel: 41 kg/h × 17.1 MJ/kg ÷ 3.6, 2.2 kg/h × 42.7 MJ/kg ÷ 3.6
  shiftKg: words('derived', '216 à 328 kg', '216 to 328 kg'), // 8 h × 27 to 41 kg/h
  shiftM3: words('derived', '1,4 à 2,2 m³', '1.4 to 2.2 m³'), // ÷ 152 kg/m³
  sieveGain: words('derived', 'un quart de plus', 'a quarter more'), // 21.1 / 16.8 kW
  systemShare: d(8.8, 1, pct), // 450 / 5,090
  unitBelowEye: words('derived', '3 à 18 cm', '3 to 18 cm'), // 2.25 to 2.40 m of the eye less 2.22 m
  rearW: d(Math.round(18.4 * 25.4) / 1000, 3, ' m'), // 18.4 in
  frontW: d(Math.round(7.5 * 25.4) / 1000, 2, ' m'), // 7.5 in
  engineEff: d(24, 0, pct), // 40 kW / (138.5 kW of gas + 26.1 kW of diesel)
  bunkerKg: d(30.4, 1, ' kg'), // 0.2 m³ × 152 kg/m³
  fall: d(1.5, 1, cmmin), // 0.2 m³ in 44 min on the bunker's section
  fallHours: words('derived', 'une heure', 'an hour'),
  gasTime: words('derived', 'quelques centièmes de seconde', 'hundredths of a second'),
  tarShare: d(0.03, 2, pct), // 0.13 g/Nm³ × 2.17 Nm³/kg
  reactEnth: d(165, 0, ' kJ/mol'), // C + CO₂ → 2 CO, from the report's heating values
  woodMJ: d(17.1, 1, ' MJ/kg'), // gasifier losses ÷ (1 − cold-gas efficiency) over the chips' flow
  phenolRatio: words('derived', '150 à 300 fois', '150 to 300 times'), // 1,500 to 3,000 against 10 mg/L
  jacketHand8: words('derived', '2 à 2,6 L/h', '2 to 2.6 L/h'),
  jacketHand20: words('derived', '5 à 6,6 L/h', '5 to 6.6 L/h'),
  airPerKg: words('derived', '1,8 à 1,9 kg d’air', '1.8 to 1.9 kg of air'), // a nitrogen balance on the report's gas
  residueKw: d(8, 0, ' kW'), // 5 % of the wood's power
  mixAir: d(1.08, 2), // m³ of air per m³ of gas, on the composition's middle
  mixMJ: d(2.44, 2, ' MJ/m³'),
  coolRule: words('derived', '1 % de puissance pour 3 K', '1% of power per 3 K'), // by density alone
  fanPpm: d(200, 0, [' ppm par minute', ' ppm a minute']), // 200 L of CO in 1,000 m³
  trueTurns: d(Math.round(MF_1100.rpmMax / 60), 0, [' tours par seconde', ' turns a second']),
  idleIn: d(55, 0, ' kW'), // the table's own losses at idle
  dieselShareMax: d(11.8, 1, pct), // 26.1 / 220.9: the table's 18.9 % does not add up
  bunkerMin: m(53, 0, ' min'),
  hearthMbar: d(50, 0, ' mbar'), // the bed's drop at the bench's maximum, from the measured drops by chip grade
  filterMbar: m(21, 0, ' mbar'),
  bunkerHand: d(44.5, 1, ' min'),
  woodGap: d(16, 0, pct), // 34.3 against 41 kg/h
  lost82: d(82, 0, pct), // 100 % less the 18 % of the bench
  partIn: d(151, 0, ' kW'), // 27 kg/h of chips and 1.9 kg/h of diesel
  partEff: d(19, 0, pct), // 29 / 151
  gasGap: d(6, 0, pct), // 5.27 against 5.60 MJ/Nm³
  vesselHours: d(2.5, 1, ' h'), // the middle of 2 to 3 h

  // ---- the model where this machine was measured: the bench's three points, docs/physics.md
  chipsModel: m(34, 0, kgh),
  effModel: m(21, 0, pct),
  gasWet20: m(5, 1, ' MJ/Nm³'),
  gasModel: m(5.3, 1, ' MJ/Nm³'),
  cgeModel: m(75.5, 1, pct),
  gasCO: m(20.9, 1, pct),
  gasH2: m(16.5, 1, pct),
  gasCH4: m(2.3, 1, pct),
  gasCO2: m(11.3, 1, pct),
  gasN2: m(48.9, 1, pct),
  er: m(0.34, 2),
  powerModel: m(55, 0, ' kW'),
  dropModel: m(216, 0, mmWater),
  jacket8: m(1.9, 1, lph),
  jacket20: m(5.7, 1, lph),
  ashKgH: m(1.2, 1, kgh),
  coolerLph: m(2.2, 1, lph),
  filterAgeLoss: m(3, 0, pct),
  chargeModel: m(55, 0, pct),
  substModel: m(78, 0, pct),
  reductionKw: m(13, 0, ' kW'),
  sieveModel: m(10, 0, pct),
  dew8: m(34, 0, ' °C'),
  fallModel: m(1.2, 1, cmmin),

  // ---- the same model where it was not: past 20 % moisture, in a fault, on another engine, and in the room
  chipsShiftModel: w(274, 0, ' kg'),
  chipsWet40: w(57, 0, kgh),
  gasWet30: w(4.7, 1, ' MJ/Nm³'),
  gasWet40: w(4.4, 1, ' MJ/Nm³'),
  sparkModel: w(31, 0, ' kW'),
  engineLow: w(47, 0, ' kW'), // dual fuel at its highest speed with an indicated efficiency of 0.36, the lowest the book's balances give
  engineHigh: w(60, 0, ' kW'), // and 0.43, the highest
  truckChips: w(9.4, 1, ' kg'),
  wetLimit: w(45, 0, pct),
  wetNoDrain: w(40, 0, pct),
  dew40: w(46, 0, ' °C'),
  dewNoDrain: words('elsewhere', '47 à 57 °C', '47 to 57 °C'),
  dewDrain: words('elsewhere', '38 à 44 °C', '38 to 44 °C'),
  leakGasMJ: w(4.2, 1, ' MJ/Nm³'),
  leakOutT: w(470, 0, ' °C'),
  fleetHigh: w(30, 0, pct),
  filterWetLoss: w(14, 0, pct),
  rpmModel: w(2800, 0, [' tr/min', ' rpm']),

  // ---- estimates: the sources are silent. Lengths from src/three/dims.ts, the rest from docs/research.md §3, docs/physics.md §1 and the model's own constants
  idleChips: e(7, 0, ' kg'),
  fills: e(9, 0),
  serviceModel: e(13, 0, ' minutes'),
  thirdMore: words('estimate', 'un tiers', 'a third'),
  barnSize: size('estimate', 'm', FARM.barn.w, FARM.barn.d),
  houseSize: size('estimate', 'm', FARM.house.w, FARM.house.d),
  houseEave: e(FARM.house.wall, 1, ' m'),
  ditchW: e(FARM.ditch.width, 1, ' m'),
  ditchD: e(FARM.ditch.depth, 2, ' m'),
  groundKmh: e(Math.round(MF_1100.groundSpeed * 3.6), 0, ' km/h'),
  rearDiam: e(TRACTOR.rear.R * 2, 2, ' m'),
  frontDiam: e(TRACTOR.front.R * 2, 1, ' m'),
  rearTurns: e(Math.round((MF_1100.groundSpeed / circumference(TRACTOR.rear.R)) * 100) / 100, 2, turns),
  frontTurns: e(Math.round((MF_1100.groundSpeed / circumference(TRACTOR.front.R)) * 10) / 10, 1, turns),
  machineM3: e(GARAGE.machineM3, 0, ' m³'),
  grossRoom: e(Math.round(GARAGE.small.w * GARAGE.small.d * GARAGE.small.h), 0, ' m³'),
  aboveM3: e(GARAGE.above.w * GARAGE.above.d * GARAGE.above.h, 0, ' m³'),
  aboveAch: e(0.5, 1, perHour),
  floorEx: words('estimate', '0,05 à 1 par heure', '0.05 to 1 an hour'),
  achShut: words('estimate', '0,1 à 1,5 renouvellements par heure', '0.1 to 1.5 air changes an hour'),
  achAjar: words('estimate', '0,5 à 5 renouvellements par heure', '0.5 to 5 air changes an hour'),
  achOpen: words('estimate', '2 à 20 renouvellements par heure', '2 to 20 air changes an hour'),
  postGas: e(1, 0, ' m³'),
  ppm50: e(3500, 0, ' ppm'),
  ppm1000: e(200, 0, ' ppm'),
  shut30: e(3500, 0, ' ppm'),
  ajar30: e(2100, 0, ' ppm'),
  open30: e(690, 0, ' ppm'),
  abovePeak: e(670, 0, ' ppm'),
  leak3: e(3, 0, ' cm²'),
  leakMid: e(10, 0, ' cm²'),
  leak30: e(30, 0, ' cm²'),
  leakHours: e(6, 0, ' h'),
  lidLift: words('estimate', 'quelques millimètres', 'a few millimetres'),
  leakShare: e(Math.round(MODEL.leakAirShare * 100), 0, pct),
  dryT: e(100, 0, ' °C'),
  pyroT: e(370, 0, ' °C'),
  pyroEnd: e(MODEL.pyrolysisEndT, 0, ' °C'),
  char: e(20, 0, pct),
  oxBalance: e(1235, 0, ' °C'),
  oxModel: e(1076, 0, ' °C'),
  oxCharLow: e(940, 0, ' °C'),
  oxCharHigh: e(1263, 0, ' °C'),
  oxWet40: e(926, 0, ' °C'),
  redFrom: e(1235, 0, ' °C'),
  redTo: e(869, 0, ' °C'),
  coolK: e(370, 0, ' K'),
  coolMJ: e(1.5, 1, ' MJ/kg'),
  reductionT: e(710, 0, ' °C'),
  idleHearth: e(370, 0, ' °C'),
  idleFriction: e(9, 0, ' kW'),
  outletModel: e(240, 0, ' °C'),
  casingModel: e(210, 0, ' °C'),
  casingSurfKw: e(12.5, 1, ' kW'),
  casingCalcKw: e(24, 0, ' kW'),
  drainShare: e(Math.round(MODEL.drainShare * 100), 0, pct),
  pipeD: e(MODEL.pipeDiameter * 1000, 0, ' mm'),
  pipeL: e(MODEL.pipeLength, 0, ' m'),
  pipeMbar: e(0.6, 1, ' mbar'),
  pipeLossWK: e(MODEL.pipeLoss, 0, ' W/K'),
  stackTop: e(FAN.stackTop, 1, ' m'),
  bagCount: e(FILTER.bags, 0),
  coolerTubes: words(
    'estimate',
    `${COOLER.tubes} tubes de ${Math.round(COOLER.tubeD * 1000)} mm, longs de ${Math.round(COOLER.tubeL * 1000)} mm`,
    `${COOLER.tubes} tubes of ${Math.round(COOLER.tubeD * 1000)} mm, ${Math.round(COOLER.tubeL * 1000)} mm long`,
  ),
  coolerOut: e(20, 0, ' °C'),
  coolerU: e(MODEL.coolerU, 0, ' W/m²·K'),
  mixAirModel: m(1.12, 2),
  mixT: e(17, 0, ' °C'),
  filterInT: e(218, 0, ' °C'),
  filterT: e(156, 0, ' °C'),
  trainModel: e(72, 0, ' mbar'),
  cylSpeed: e(6, 0, pct),
  cylCap: e(1.2, 1, turns),
  exhaustWork: e(0.3, 1, pct),
  twoThirds: words('estimate', 'les deux tiers', 'two thirds'),
} as const satisfies Record<string, Fig>;

export type FigName = keyof typeof FIG;
