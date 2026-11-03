// What the sources print, in one place, so that a test and the docs can hold the model against it. Nothing in the running model reads these but the tar band and the speeds of the test line. Letters as in docs/research.md; † marks a figure that fails
// its own table's arithmetic (research §2.9, conflicts 3 and 4), kept to be shown as such and never asserted of the model.

/** S1 Table 3.13, read on FAO's page 2026-11-03, against the research: the same. Order: maximum, part, idle. */
export const TABLE_3_13 = {
  rpm: [1855, 1440, 1015], // K9
  powerKw: [40, 29, 0], // K10
  chipsKgH: [41, 27, 8.5], // K11
  dieselKgH: [2.2, 1.9, 1.2], // K12
  gasMJ: [5.6, 5.56, 5.54], // K13
  coldGasPct: [71.1, 66.5, 73.1], // K14
  dieselSharePct: [18.9, 15.0, 26.2], // K15, the first †
  totalEffPct: [18.0, 5.3, 0], // K16, the second †
  lossesKw: [181.5, 143.3, 54.8], // K17, the second †
  gasifierLossKw: [56.3, 43.0, 10.1], // K18
  tarG: [0.13, 0.04, 0.17], // K19
} as const;

/** Hearth load, for the test that shows the throat and the table belong together, and for nothing else (R2). */
export const HEARTH_LOAD_TABLE = [0.79, 0.49, 0.17] as const;

/** The tar band by load: straight between the table's three points. A measurement carried, not a prediction. */
export function tarMeasured(load: number): number {
  const t = TABLE_3_13.tarG;
  const part = 29 / 40;
  if (load <= 0) return t[2];
  if (load < part) return t[2] + ((t[1] - t[2]) * load) / part;
  if (load < 1) return t[1] + ((t[0] - t[1]) * (load - part)) / (1 - part);
  return t[0];
}

/** S1 Table 3.10 and Table 3.11, read as images on FAO's site 2026-11-03: litres, kW original, kW after. Compression-ignition unless said. */
export const FLEET = [
  { name: 'Bolinder Munktell BM 35', litres: 3.4, before: 28, after: 23, spark: false },
  { name: 'David Brown 31D', litres: 2.5, before: 20.2, after: 19, spark: false },
  { name: 'Fordson Major', litres: 3.6, before: 29, after: 27, spark: false },
  { name: 'Fordson Power Major', litres: 3.6, before: 34, after: 27, spark: false },
  { name: 'Nuffield DM 4', litres: 3.4, before: 29, after: 24, spark: false },
  { name: 'Ford 5000', litres: 3.8, before: 42, after: 23, spark: true },
  { name: 'Massey Ferguson MF 1100', litres: 5.8, before: 64, after: 51, spark: false },
  { name: 'Bolinder Munktell BM650', litres: 4.2, before: 48, after: 33, spark: false },
  { name: 'Bolinder Munktell BMG650', litres: 4.2, before: 48, after: 30, spark: false },
  { name: 'Scania Vabis L5150', litres: 6.2, before: 57, after: 52, spark: false },
  { name: 'Volvo L389', litres: 6.7, before: 62, after: 51, spark: false },
  { name: 'Scania Vabis L75', litres: 10.3, before: 90, after: 72, spark: false },
  { name: 'Scania L8050', litres: 7.8, before: 70, after: 50, spark: false },
  { name: 'Scania LBS 110', litres: 11.0, before: 116, after: 68, spark: false },
] as const;

/** S1 Table 3.5: two diesels converted to spark, gas alone. Speed of the power on gas, stroke. */
export const CONVERTED = [
  { name: 'Volvo D47', litres: 4.7, stroke: 0.11, rpm: 2200, before: 71, after: 34 },
  { name: 'Bolinder-Munktell BM 1113', litres: 3.78, stroke: 0.13, rpm: 2200, before: 42, after: 19.6 },
] as const;

/** S1 Table 3.6: dual fuel in the laboratory, full power. rpm, kW, % efficiency. Read 2026-11-03, research cites only its range. */
export const SCANIA_L5150_DUAL = {
  litres: 6.2,
  rows: [
    [1000, 36.7, 36.0],
    [1200, 43.2, 35.6],
    [1400, 49.6, 35.0],
    [1600, 55.5, 34.9],
    [1800, 60.2, 33.8],
    [2000, 62.8, 32.0],
    [2200, 64.6, 30.5],
  ],
} as const;

/** The same table: part load on a Fordson Power Major. rpm, kW, % efficiency. */
export const FORDSON_PART_LOAD = {
  litres: 3.6,
  rows: [
    [1600, 29.6, 32.5],
    [1800, 25.1, 30.8],
    [1840, 22.2, 28.3],
    [1890, 14.8, 21.2],
    [1920, 7.4, 12.0],
  ],
} as const;

/** S1 Table 3.8, K60: at 1,800 rpm on « a gasifier type F5 mounted on a tractor », which tractor is not said. */
export const FINES_POWER_KW = { unsieved: 16.8, '5-40': 18.1, '10-40': 21.1, '15-40': 21.0 } as const;

/** S1 Table 3.16, K35: kg per 10 km, on average 60 km/h. */
export const TRUCK_ROAD = {
  empty: { diesel: 2.44, dualDiesel: 0.5, chips: 7.2, substitution: 80, system: 69 },
  'load-5t': { diesel: 2.61, dualDiesel: 0.5, chips: 7.6, substitution: 81, system: 71 },
  'load-8t': { diesel: 2.87, dualDiesel: 0.55, chips: 7.8, substitution: 81, system: 76 },
} as const;
export type TruckLoad = keyof typeof TRUCK_ROAD;

/** S1 Table 3.17, K40 and K41: interval, h, and time, min, low and high. `withFill` and `withPrep`: the table's footnotes count them inside another job. */
export const SERVICE = [
  { job: 'prep', every: [8, 8], takes: [30, 45] },
  { job: 'fill', every: [40 / 60, 50 / 60], takes: [5, 5] },
  { job: 'cooler-condensate', every: [2, 3], takes: [0, 0], withFill: true },
  { job: 'ash', every: [8, 15], takes: [0, 0], withPrep: true },
  { job: 'gasifier-condensate', every: [8, 10], takes: [0, 0], withPrep: true },
  { job: 'hose', every: [55, 55], takes: [60, 60] },
  { job: 'filter', every: [25, 100], takes: [30, 60] },
  { job: 'jacket', every: [75, 135], takes: [60, 120] },
  { job: 'gaskets', every: [500, 500], takes: [60, 60] },
  { job: 'cooler-clean', every: [500, 500], takes: [60, 120] },
] as const;
