import { DIESEL_LHV, MACHINES, MODEL, type DoorState, type Machine, type MachineId } from './machine';
import { solveEngine, type EngineMode } from './motor';
import { Plant, type PlantOptions } from './plant';
import { presetParams } from './presets';
import { SERVICE, type TruckLoad } from './reported';
import { filterDrop, hearthDrop } from './train';
import type { GasParams } from './types';

// Pure runs for the figures tests and docs/physics.md: nothing here reaches the state, and nothing is a design tool. Each takes the published machine and a condition. The hearth load, which needs a size of the throat, is computed in `figures.test.ts` alone.

export interface PointResult {
  power: number;
  rpm: number;
  chips: number;
  diesel: number;
  gasNm3H: number;
  gasMJ: number;
  coldGasPct: number;
  dieselSharePct: number;
  totalEffPct: number;
  lossesKw: number;
  gasifierLossKw: number;
  woodKw: number;
  dieselKw: number;
  xCO: number;
  xH2: number;
  xCH4: number;
  xCO2: number;
  xN2: number;
  mixtureMJ: number;
  airToGas: number;
  equivalenceRatio: number;
  airPerKg: number;
  yieldWet: number;
  outletT: number;
  filterT: number;
  casingT: number;
  hearthT: number;
  oxidationT: number;
  reductionEndT: number;
  oxidationEndT: number;
  coolerOutT: number;
  dewPoint: number;
  filterDropMmWg: number;
  hearthDropMbar: number;
  pipeDropMbar: number;
  trainMbar: number;
  manifoldShare: number;
  substitution: number;
  chipsPerDiesel: number;
  jacketLph: number;
  coolerLph: number;
  short: boolean;
  powerWot: number;
  burn: number;
  exhaustCO: number;
  friction: number;
  throttling: number;
  engineEff: number;
  crackedShare: number;
}

export const params = (patch: Partial<GasParams> = {}, machine: MachineId = 'mf-1100'): GasParams => ({
  ...presetParams(machine),
  ...patch,
});

export function pointOf(pl: Plant): PointResult {
  const op = pl.op;
  const g = pl.gas;
  const wood = pl.chips * g.lhvWet;
  const dieselW = op.diesel * DIESEL_LHV;
  const gasW = op.gas * pl.fedHeating;
  const saved = pl.diesel0 - op.diesel;
  return {
    power: op.power / 1000,
    rpm: op.rpm,
    chips: pl.chips * 3600,
    diesel: op.diesel * 3600,
    gasNm3H: op.gas * 3600,
    gasMJ: pl.fedHeating / 1e6,
    coldGasPct: g.lhvWet > 0 ? ((pl.fedHeating * pl.fedYield) / g.lhvWet) * 100 : 0,
    dieselSharePct: wood + dieselW > 0 ? (dieselW / (wood + dieselW)) * 100 : 0,
    totalEffPct: wood + dieselW > 0 ? (op.power / (wood + dieselW)) * 100 : 0,
    lossesKw: (wood + dieselW - op.power) / 1000,
    gasifierLossKw: (wood - gasW) / 1000,
    woodKw: wood / 1000,
    dieselKw: dieselW / 1000,
    xCO: pl.fedCO,
    xH2: pl.fedH2,
    xCH4: pl.fedCH4,
    xCO2: pl.fedCO2,
    xN2: pl.fedN2,
    mixtureMJ: pl.fedMixture / 1e6,
    airToGas: pl.fedAirToGas,
    equivalenceRatio: g.equivalenceRatio,
    airPerKg: g.airPerKgWet,
    yieldWet: pl.fedYield,
    outletT: pl.outletT,
    filterT: pl.filterT,
    casingT: pl.casingT,
    hearthT: pl.hearthT,
    oxidationT: pl.oxidationT,
    reductionEndT: pl.zones.reductionEndT,
    oxidationEndT: pl.zones.oxidationEndT,
    coolerOutT: pl.coolerOutT,
    dewPoint: g.dewPointC,
    filterDropMmWg: pl.filterDropPa / 9.80665,
    hearthDropMbar: pl.hearthDropPa / 100,
    pipeDropMbar: pl.pipeDropPa / 100,
    trainMbar: (pl.hearthDropPa + pl.filterDropPa + pl.pipeDropPa) / 100,
    manifoldShare: op.manifold / 101325,
    substitution: pl.substitution,
    chipsPerDiesel: saved > 0 ? pl.chips / saved : 0,
    jacketLph: pl.jacketKgS * 3600,
    coolerLph: pl.coolerKgS * 3600,
    short: op.short,
    powerWot: op.powerWot / 1000,
    burn: op.burn,
    exhaustCO: op.exhaustCO,
    friction: op.friction / 1000,
    throttling: op.throttling / 1000,
    engineEff: op.fuelIn > 0 ? (op.power / op.fuelIn) * 100 : 0,
    crackedShare: pl.crackedShare,
  };
}

/** A steady working point: the machine run to its temperatures at these conditions. */
export function steadyPoint(
  patch: Partial<GasParams> = {},
  options: PlantOptions = {},
  machine: MachineId = 'mf-1100',
): PointResult {
  const pl = new Plant(params(patch, machine), options);
  pl.solve();
  return pointOf(pl);
}

/** The three lines of Table 3.13. */
export const tableMax = (o: PlantOptions = {}): PointResult => steadyPoint({ load: 100 }, o);
export const tablePart = (o: PlantOptions = {}): PointResult => steadyPoint({ load: 72.5 }, o);
export const tableIdle = (o: PlantOptions = {}): PointResult => steadyPoint({ load: 0 }, o);

/** The highest power on gas, at its reported speed, full throttle. */
export const fullPower = (
  mode: EngineMode = 'dual',
  o: PlantOptions = {},
  machine: MachineId = 'mf-1100',
  patch: Partial<GasParams> = {},
): PointResult => steadyPoint({ fullPower: true, engineMode: mode, ...patch }, o, machine);

/** The whole line of loads, for the sheet and a chart. */
export function loadCurve(
  steps = 20,
  o: PlantOptions = {},
): { load: number; effPct: number; inputRel: number; power: number; chips: number }[] {
  const out: { load: number; effPct: number; inputRel: number; power: number; chips: number }[] = [];
  const top = tableMax(o);
  const refInput = (top.woodKw + top.dieselKw) / (40 / 1);
  for (let i = 0; i <= steps; i++) {
    const load = (i / steps) * 100;
    const r = steadyPoint({ load }, o);
    out.push({
      load,
      effPct: r.totalEffPct,
      inputRel: (r.woodKw + r.dieselKw) / (refInput * 40),
      power: r.power,
      chips: r.chips,
    });
  }
  return out;
}

/** Moisture on the wet basis against the gas. */
export function moistureSweep(
  from = 0,
  to = 60,
  step = 5,
  o: PlantOptions = {},
): (PointResult & { moisture: number })[] {
  const out: (PointResult & { moisture: number })[] = [];
  for (let m = from; m <= to + 1e-9; m += step) out.push({ moisture: m, ...steadyPoint({ moistureWet: m }, o) });
  return out;
}

/** The moisture, wet basis, at which the gas falls to this heating value, %. Bisection through the whole plant. */
export function moistureAtHeating(target: number, o: PlantOptions = {}): number {
  let lo = 0;
  let hi = 80;
  for (let i = 0; i < 18; i++) {
    const m = 0.5 * (lo + hi);
    if (steadyPoint({ moistureWet: m }, o).gasMJ > target) lo = m;
    else hi = m;
  }
  return 0.5 * (lo + hi);
}

/** Another engine of the books, on this model: its displacement, its speed and stroke if printed. K60's drops are read at about this engine's own full throttle: an assumption for this comparison alone. Nothing here sizes anything: the answer is a power, for an engine that existed. */
export function otherEngine(litres: number, rpm: number, stroke: number = MACHINES['mf-1100'].stroke): Machine {
  const m = MACHINES['mf-1100'];
  const swept = (litres * 1e-3 * rpm) / 120;
  return {
    ...m,
    displacement: litres * 1e-3,
    stroke,
    rpmFull: rpm,
    rpmMax: rpm,
    powerMax: (m.powerMax * litres) / 5.8,
    pilotPerRev: (m.pilotPerRev * litres) / 5.8,
    hearthRefFlow: (swept * MODEL.volumetricEff * 0.85 * 0.92) / 2.08,
  };
}

/** Full throttle on another engine of the books. */
export const otherFullPower = (
  litres: number,
  rpm: number,
  mode: EngineMode,
  stroke?: number,
  patch: Partial<GasParams> = {},
  o: PlantOptions = {},
): PointResult =>
  steadyPoint({ fullPower: true, engineMode: mode, ...patch }, { ...o, machine: otherEngine(litres, rpm, stroke) });

/** The same engine asked for a power at a speed: S1 Table 3.6's lines. */
export function otherAtPower(
  litres: number,
  rpm: number,
  kw: number,
  o: PlantOptions = {},
): { power: number; effPct: number; wot: number } {
  const m = otherEngine(litres, rpm);
  const feedPoint = tableMax(o);
  const op = solveEngine(
    m,
    'dual',
    rpm,
    kw * 1e3,
    { heating: feedPoint.gasMJ * 1e6, airToGas: feedPoint.airToGas, xCO: feedPoint.xCO, mixT: 25 },
    (G) => hearthDrop(G, m, '10-40') + filterDrop(G, 4.9, 0, false),
    o,
  );
  return { power: op.power / 1000, effPct: (op.power / op.fuelIn) * 100, wot: op.powerWot / 1000 };
}

/** Full throttle against the speed: where the train and friction alone would put the top, K28. */
export function wotCurve(rpms: readonly number[], o: PlantOptions = {}): { rpm: number; power: number }[] {
  const m = MACHINES['mf-1100'];
  return rpms.map((rpm) => ({
    rpm,
    power: steadyPoint({ fullPower: true }, { ...o, machine: { ...m, rpmFull: rpm } }).power,
  }));
}

/** Truck on the road, K35. */
export function truckRun(
  load: TruckLoad,
  o: PlantOptions = {},
): PointResult & { per10: number; chipsPer10: number; dieselPer10: number; roadKw: number } {
  const pl = new Plant(params({ truckLoad: load }, 'scania-l8050'), o);
  pl.solve();
  const r = pointOf(pl);
  const per10 = 1e4 / pl.m.groundSpeed;
  return {
    ...r,
    per10,
    chipsPer10: pl.chips * per10,
    dieselPer10: pl.op.diesel * per10,
    roadKw: pl.roadPower(load) / 1000,
  };
}

/** K42: the table's service as minutes per working hour, low and high, for an 8-hour day. */
export function serviceRange(): [number, number] {
  let low = 0;
  let high = 0;
  for (const j of SERVICE) {
    low += j.takes[0] / j.every[1];
    high += j.takes[1] / j.every[0];
  }
  return [low, high];
}

export interface StopResult {
  ppm: number;
  ppmHigh: number;
  ppmLow: number;
  abovePpm: number;
  abovePpmHigh: number;
  abovePpmLow: number;
  peakPpm: number;
  peakMinute: number;
  peakAbovePpm: number;
  peakAboveMinute: number;
}

/** The closed room: a stop or a source, followed for so many minutes. For docs/physics.md and the tests; the state never holds a time to a rung. */
export function roomRun(minutes: number, patch: Partial<GasParams> = {}): StopResult {
  const p = params({ place: 'garage', door: 'shut' as DoorState, ...patch });
  const wasOn = p.engineOn;
  p.engineOn = true;
  const pl = new Plant(p);
  p.engineOn = wasOn;
  pl.touch();
  let peak = 0;
  let peakMinute = 0;
  let peakAbove = 0;
  let peakAboveMinute = 0;
  for (let i = 0; i < minutes * 60; i++) {
    pl.step(1);
    const c = pl.room.first * 1e6;
    if (c > peak) {
      peak = c;
      peakMinute = i / 60;
    }
    const a = pl.room.second * 1e6;
    if (a > peakAbove) {
      peakAbove = a;
      peakAboveMinute = i / 60;
    }
  }
  return {
    ppm: pl.room.first * 1e6,
    ppmHigh: pl.garageHigh.first * 1e6,
    ppmLow: pl.garageLow.first * 1e6,
    abovePpm: pl.room.second * 1e6,
    abovePpmHigh: pl.aboveHigh.second * 1e6,
    abovePpmLow: pl.aboveLow.second * 1e6,
    peakPpm: peak,
    peakMinute,
    peakAbovePpm: peakAbove,
    peakAboveMinute,
  };
}
