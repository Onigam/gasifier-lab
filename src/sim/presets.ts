import { MACHINES, MODEL, ROOM, type MachineId } from './machine';
import type { GasParams, PresetId, ScenarioId } from './types';

// The starting points and the small scripted situations. The truck lives in the simulation only: the 3D draws one machine. What is left out on purpose, and why, is in docs/physics.md §2: no slider of an air-to-gas ratio (R4: it is the mixture's setting), of a heat loss or of a pressure drop (they would tune a build), of any size.

export const PRESET_IDS: PresetId[] = ['mf-1100', 'scania-l8050'];

export const SCENARIO_IDS: ScenarioId[] = [
  'measured-hour',
  'part-load',
  'idling',
  'wet-chips',
  'fines',
  'filter-ageing',
  'three-engines',
  'air-leak',
  'working-shift',
  'engine-stops',
  'closed-garage',
  'truck',
];

/** A minute per second by default: a bunker in 45 s, a stop's twenty minutes in 20 s. */
export const DEFAULT_TIME_SCALE = 60;
export const SPEEDS = [1, 10, 60, 600, 3600];

/** The ranges of the sliders. Conditions, none of them a size, none of them a setting of the engine. */
export const RANGES = {
  load: { min: 0, max: 100, step: 1 },
  moistureWet: { min: 8, max: 45, step: 1 },
  filterHours: { min: 0, max: 100, step: 1 },
  ambientT: { min: -10, max: 30, step: 1 },
  postGasVolume: { min: 0.2, max: 5, step: 0.1 },
  postGasMinutes: { min: 5, max: 180, step: 5 },
  journey: { min: 0, max: 1, step: 0.005 },
} as const;

export type RangedKey = keyof typeof RANGES;

export function presetParams(id: MachineId): GasParams {
  return {
    slowMo: 1,
    timeScale: DEFAULT_TIME_SCALE,
    running: true,
    preset: id,
    machine: MACHINES[id].id,
    engineMode: 'dual',
    engineOn: true,
    load: 100,
    fullPower: false,
    truckLoad: 'empty',
    moistureWet: 8,
    chipGrade: '10-40',
    filterHours: 0,
    filterAges: false,
    filterWetFault: false,
    airLeak: false,
    vesselNeglected: false,
    ambientT: MODEL.ambientT,
    place: 'field',
    garageVolume: 50,
    door: 'shut',
    postGasVolume: ROOM.postGasVolume,
    postGasMinutes: ROOM.postGasMinutes,
    lidLeak: false,
    fanSource: false,
    journey: 0.62,
  };
}

/** A change scheduled in a scenario, in simulated seconds from its start. */
export interface ScheduledEvent {
  t: number;
  patch: Partial<GasParams>;
}

export interface ScenarioSetup {
  params: GasParams;
  events: ScheduledEvent[];
}

/** The minutes each step of a stepped scenario holds, on the simulated clock. */
const HOLD = 5 * 60;

export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const base = presetParams('mf-1100');
  switch (id) {
    case 'measured-hour':
      return { params: base, events: [] };
    case 'part-load':
      return { params: { ...base, load: 72.5 }, events: [] };
    case 'idling':
      return { params: base, events: [{ t: HOLD, patch: { load: 0 } }] };
    case 'wet-chips':
      return {
        params: base,
        events: [
          { t: HOLD, patch: { moistureWet: 20 } },
          { t: 2 * HOLD, patch: { moistureWet: 30 } },
          { t: 3 * HOLD, patch: { moistureWet: 40 } },
        ],
      };
    case 'fines':
      return {
        params: { ...base, fullPower: true, chipGrade: '15-40' },
        events: [
          { t: HOLD, patch: { chipGrade: '10-40' } },
          { t: 2 * HOLD, patch: { chipGrade: '5-40' } },
          { t: 3 * HOLD, patch: { chipGrade: 'unsieved' } },
        ],
      };
    case 'filter-ageing':
      return {
        params: { ...base, fullPower: true, filterAges: true, timeScale: 3600 },
        events: [{ t: 50 * 3600, patch: { filterWetFault: true } }],
      };
    case 'three-engines':
      return {
        params: { ...base, fullPower: true },
        events: [
          { t: HOLD, patch: { engineMode: 'diesel' } },
          { t: 2 * HOLD, patch: { engineMode: 'spark' } },
        ],
      };
    case 'air-leak':
      return { params: base, events: [{ t: HOLD, patch: { airLeak: true } }] };
    case 'working-shift':
      return { params: { ...base, filterAges: true, timeScale: 600 }, events: [] };
    case 'engine-stops':
      return { params: base, events: [{ t: 60, patch: { engineOn: false } }] };
    case 'closed-garage':
      return {
        params: { ...base, place: 'garage', garageVolume: 50, door: 'shut', engineOn: false },
        events: [],
      };
    case 'truck':
      return { params: { ...presetParams('scania-l8050'), truckLoad: 'load-8t', timeScale: 60 }, events: [] };
  }
}
