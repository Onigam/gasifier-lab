import { CO_LADDER } from '../sim/ladder';
import { workRows } from '../sim/strip';
import { STATE_TAGS } from '../sim/tags';
import type { Pair } from '../sim/texts';
import type { GasState, Scope } from '../sim/types';
import { PANEL, type PanelKey } from './strings';

// What the simulation panel shows, as plain data: pure functions of the state and the scope, so that a test reads them without a browser and the panel only draws them. Every figure carries the mark its word in `STATE_TAGS` gives it: none for a published figure, † for a sum on published figures or the model where this machine was measured, * for an estimate or the model where it was not (`GasState.figureTag`), and always * in the room (`roomTag`).
// Nothing here is a size of the hot parts, a hearth load, a pilot or a timing, a dose or a time left for a person (`NEVER_DISPLAYED` of src/sim/tags.ts): the room's figures are those of a well-mixed box and are never put against a time or a person.

export type Mark = '†' | '*' | '';

export interface Readout {
  key: string;
  label: Pair;
  value: number;
  digits: number;
  unit: string;
  tag: Mark;
}

/** The mark of a key of the state, by its word. */
export function markOf(key: keyof GasState, s: GasState): Mark {
  switch (STATE_TAGS[key]) {
    case 'derived':
      return '†';
    case 'model':
      return s.figureTag;
    case 'estimate':
      return '*';
    default:
      return '';
  }
}

const decimals = (text: string): number => text.split('.')[1]?.length ?? 0;

/** The strip's nine figures of the work, as numbers: the same rows, the same marks, one source (src/sim/strip.ts). */
export function mainReadouts(s: GasState): Readout[] {
  return workRows(s).map((r) => ({
    key: r.key,
    label: r.label,
    value: Number(r.value),
    digits: decimals(r.value),
    unit: r.unit,
    tag: r.tag,
  }));
}

const pair = (key: PanelKey): Pair => PANEL[key];

/** The rest of the machine's figures, folded under the main ones. */
export function moreReadouts(s: GasState): Readout[] {
  const row = (
    key: PanelKey,
    stateKey: keyof GasState,
    value: number,
    digits: number,
    unit: string,
    tag: Mark = markOf(stateKey, s),
  ): Readout => ({ key, label: pair(key), value, digits, unit, tag });
  return [
    row('moreWood', 'woodKw', s.woodKw, 0, 'kW'),
    row('moreDiesel', 'dieselKw', s.dieselKw, 0, 'kW'),
    row('moreShaft', 'shaftKw', s.shaftKw, 0, 'kW'),
    row('moreLoss', 'totalLossKw', s.totalLossKw, 0, 'kW'),
    row('moreColdGas', 'coldGasEff', s.coldGasEff * 100, 0, '%'),
    row('moreGasFlow', 'gasNm3H', s.gasNm3H, 0, 'Nm³/h'),
    row('moreH2', 'gasH2', s.gasH2 * 100, 0, '%'),
    row('moreCH4', 'gasCH4', s.gasCH4 * 100, 1, '%'),
    row('moreCO2', 'gasCO2', s.gasCO2 * 100, 0, '%'),
    row('moreDew', 'dewPointC', s.dewPointC, 0, '°C'),
    row('moreFilterT', 'filterT', s.filterT, 0, '°C'),
    row('moreCoolerT', 'coolerOutT', s.coolerOutT, 0, '°C'),
    row('moreCasing', 'casingT', s.casingT, 0, '°C'),
    row('moreBunker', 'bunkerShare', s.bunkerShare * 100, 0, '%'),
    row('moreBunkerMin', 'bunkerMinutesLeft', s.bunkerMinutesLeft, 0, 'min'),
    row('moreTar', 'tarG', s.tarG, 2, 'g/Nm³'),
    row('moreMixture', 'mixtureMJ', s.mixtureMJ, 2, 'MJ/m³'),
    row('moreVsPetrol', 'deratingVsPetrol', s.deratingVsPetrol * 100, 0, '%'),
  ];
}

/** What surrounds the chip at the journey's cursor: the zone, then the figures. Every one but the zone is an estimate (`STATE_TAGS.analyser`). */
export function analyserReadouts(s: GasState): Readout[] {
  const a = s.analyser;
  const row = (key: PanelKey, value: number, digits: number, unit: string): Readout => ({
    key,
    label: pair(key),
    value,
    digits,
    unit,
    tag: '*',
  });
  return [
    row('anChipT', a.chipT, 0, '°C'),
    row('anWater', a.chipWater * 100, 0, '%'),
    row('anMass', a.chipMass * 100, 0, '%'),
    row('anGasT', a.gasT, 0, '°C'),
    row('anCO', a.xCO * 100, 0, '%'),
    row('anH2', a.xH2 * 100, 0, '%'),
    row('anCH4', a.xCH4 * 100, 0, '%'),
    row('anCO2', a.xCO2 * 100, 0, '%'),
    row('anH2O', a.xH2O * 100, 0, '%'),
    row('anN2', a.xN2 * 100, 0, '%'),
    row('anO2', a.xO2 * 100, 1, '%'),
    row('anTar', a.tarShare * 100, 0, '%'),
  ];
}

/** A figure of the room as a span, never as a bare figure and never as a nought: `null` until the box has held any. */
export interface Band {
  low: number;
  high: number;
  digits: number;
}

export function band(low: number, high: number): Band | null {
  if (!(high >= 0.05)) return null;
  return { low, high, digits: high < 10 ? 1 : 0 };
}

export interface RoomFacts {
  garage: Band | null;
  above: Band | null;
  sinceStop: number;
  stopped: boolean;
  plumeLpm: number;
  plumeCoLpm: number;
  /** The highest rung reached and its source, or null under the first (the box says nothing of a real room). */
  rung: { ppm: number; ppmHigh?: number; source: string; text: Pair } | null;
  latched: boolean;
}

export function roomFacts(s: GasState): RoomFacts {
  const r = s.ladderRung >= 0 ? CO_LADDER[s.ladderRung] : undefined;
  return {
    garage: band(s.garageCoPpmLow, s.garageCoPpmHigh),
    above: band(s.roomAboveCoPpmLow, s.roomAboveCoPpmHigh),
    sinceStop: s.minutesSinceStop,
    stopped: !s.engineOn,
    plumeLpm: s.plumeLpm,
    plumeCoLpm: s.plumeCoLpm,
    rung: r ? { ppm: r.ppm, ppmHigh: r.ppmHigh, source: r.source, text: r.text } : null,
    latched: s.coLatched,
  };
}

/** Which line the status shows: running on gas, running on diesel alone, or stopped. */
export type StatusKey = 'statusRunning' | 'statusDiesel' | 'statusStopped';

export function statusOf(s: GasState): StatusKey {
  if (!s.engineOn) return 'statusStopped';
  return s.engineMode === 'diesel' ? 'statusDiesel' : 'statusRunning';
}

// ------------------------------------------------------------------ the curves

export interface Curve {
  xs: number[];
  ys: Record<string, number[]>;
}

/** 1 mbar in mm of water column: the strip's unit. */
const MM_WG_PER_MBAR = 100 / 9.80665;

export const powerCurve = (sc: Scope): Curve => ({ xs: sc.t, ys: { power: sc.powerKw } });

export const tempCurve = (sc: Scope): Curve => ({
  xs: sc.t,
  ys: { outlet: sc.outletT, filter: sc.filterT, casing: sc.casingT },
});

export const filterCurve = (sc: Scope): Curve => ({
  xs: sc.t,
  ys: { drop: sc.filterDropMbar.map((v) => v * MM_WG_PER_MBAR) },
});

/** The decades the room's chart spans: 1 ppm to a million, so that its ticks fall on 1, 100, 10,000 and 1,000,000 and the kit's linear axis serves a logarithmic one (docs/kit-requests.md, 6). */
export const ROOM_DECADES = 6;

/** log10 of a ppm, a figure under 1 ppm standing on the axis' foot. */
export const logPpm = (ppm: number): number => Math.log10(Math.max(1, ppm));

/** A tick of the room's chart, back in ppm. */
export const ppmOfLog = (v: number): number => 10 ** v;

export const roomCurve = (sc: Scope): Curve => ({
  xs: sc.t,
  ys: {
    garage: sc.garageCoPpm.map(logPpm),
    low: sc.garageCoPpmLow.map(logPpm),
    high: sc.garageCoPpmHigh.map(logPpm),
    above: sc.roomAboveCoPpm.map(logPpm),
  },
});

/** The top of an axis that starts at nought: three intervals, each a round number (the kit's chart draws four ticks). */
export function niceCeil3(v: number): number {
  if (!(v > 0)) return 3;
  const p = 10 ** Math.floor(Math.log10(v / 3));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= 3 * m * p) return 3 * m * p;
  return 30 * p;
}
