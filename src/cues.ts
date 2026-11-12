import type { GasifierSim } from './sim/engine';
import type { ChipGrade, DoorState } from './sim/machine';
import type { EngineMode } from './sim/motor';
import { PRESET_IDS, RANGES, SCENARIO_IDS } from './sim/presets';
import type { PresetId, ScenarioId } from './sim/types';

// The lab's own cues of the spoken guide: `[[lab:<name>:<arg>]]` in a segment of narration/<lang>.json, which the kit hands to `LabDefinition.narration.onCue` (docs/narration.md in the kit). The kit's cues (`scene`, `home`, `frame`, `select`, `explode`, `xray`, `cutaway`, `flows`, `isolate`, `mode`) move the 3D; these move the simulation, so that a voice can say
// « regardez la plaquette descendre » and have it happen. Each is idempotent: the kit replays the last cue of each name after a seek. None is a gesture of use: a stop is a change of the state, as the simulation has it (docs/physics.md, the film contract), and nothing here lights, fills or empties.
//
//   [[lab:scenario:engine-stops]]   one of the twelve scenarios (src/sim/presets.ts SCENARIO_IDS)
//   [[lab:preset:mf-1100]]          the tractor, or `scania-l8050`, the truck (numbers only: the 3D draws the tractor)
//   [[lab:reset]]                   start again from the last starting point or scenario
//   [[lab:journey:0.62]]            the cursor of the journey of a chip, 0 at the lid to 1 under the grate (not to scale)
//   [[lab:load:100]]                the load, % of the test maximum, 0 to 100
//   [[lab:moisture:30]]             the chips' moisture, % wet basis, 8 to 45
//   [[lab:engine:off]]              `on` or `off`: the engine running or stopped (the stop is what the garage is about)
//   [[lab:fuel:dual]]               `dual` (gas with a thread of diesel), `diesel` or `spark`
//   [[lab:grade:10-40]]             the sieve: `unsieved`, `5-40`, `10-40`, `15-40`
//   [[lab:place:garage]]            `field` or `garage`: only a machine in the garage fills the room
//   [[lab:volume:50]]               the garage's volume, 50 or 1000 m³
//   [[lab:door:shut]]               `shut`, `ajar` or `open`
//   [[lab:speed:60]]                simulated seconds per second (1, 10, 60, 600, 3600); starts the clock
//   [[lab:pause]]  [[lab:play]]     stops and starts the clock

const range = (arg: string | undefined, min: number, max: number): number | null => {
  if (arg === undefined || arg.trim() === '') return null;
  const v = Number(arg);
  return Number.isFinite(v) && v >= min && v <= max ? v : null;
};

/** The names a segment may use, for a test of the scripts. */
export const LAB_CUE_NAMES = [
  'scenario',
  'preset',
  'reset',
  'journey',
  'load',
  'moisture',
  'engine',
  'fuel',
  'grade',
  'place',
  'volume',
  'door',
  'speed',
  'pause',
  'play',
] as const;

type Patch = Parameters<GasifierSim['set']>[0];

/** What `runCue` would do with a cue, without doing it: a patch of the parameters, a scenario, a preset, a reset, or nothing (unknown). */
export type CuePlan =
  | { kind: 'scenario'; id: ScenarioId }
  | { kind: 'preset'; id: PresetId }
  | { kind: 'reset' }
  | { kind: 'set'; patch: Patch }
  | null;

const set = (patch: Patch): CuePlan => ({ kind: 'set', patch });

export function planCue(name: string, arg?: string): CuePlan {
  switch (name) {
    case 'scenario':
      return SCENARIO_IDS.includes(arg as ScenarioId) ? { kind: 'scenario', id: arg as ScenarioId } : null;
    case 'preset':
      return PRESET_IDS.includes(arg as PresetId) ? { kind: 'preset', id: arg as PresetId } : null;
    case 'reset':
      return { kind: 'reset' };
    case 'pause':
      return set({ running: false });
    case 'play':
      return set({ running: true });
    case 'journey': {
      const v = range(arg, RANGES.journey.min, RANGES.journey.max);
      return v === null ? null : set({ journey: v });
    }
    case 'load': {
      const v = range(arg, RANGES.load.min, RANGES.load.max);
      return v === null ? null : set({ load: v, fullPower: false });
    }
    case 'moisture': {
      const v = range(arg, RANGES.moistureWet.min, RANGES.moistureWet.max);
      return v === null ? null : set({ moistureWet: v });
    }
    case 'engine':
      return arg === 'on' || arg === 'off' ? set({ engineOn: arg === 'on' }) : null;
    case 'fuel':
      return arg === 'dual' || arg === 'diesel' || arg === 'spark' ? set({ engineMode: arg as EngineMode }) : null;
    case 'grade':
      return arg === 'unsieved' || arg === '5-40' || arg === '10-40' || arg === '15-40'
        ? set({ chipGrade: arg as ChipGrade })
        : null;
    case 'place':
      return arg === 'field' || arg === 'garage' ? set({ place: arg }) : null;
    case 'volume':
      return arg === '50' || arg === '1000' ? set({ garageVolume: Number(arg) as 50 | 1000 }) : null;
    case 'door':
      return arg === 'shut' || arg === 'ajar' || arg === 'open' ? set({ door: arg as DoorState }) : null;
    case 'speed': {
      const v = range(arg, 1, 3600);
      return v === null ? null : set({ timeScale: v, running: true });
    }
    default:
      return null;
  }
}

/** Run a cue of the spoken guide on the simulation. Returns false for a cue it does not know (nothing happens). */
export function runCue(sim: GasifierSim, name: string, arg?: string): boolean {
  const plan = planCue(name, arg);
  if (!plan) return false;
  // a scenario starts the clock, as `speed` does: a guide closed in a paused window (the kit does not run closing cues) must not leave the next clip over a frozen simulation
  if (plan.kind === 'scenario') {
    sim.applyScenario(plan.id);
    sim.set({ running: true });
  } else if (plan.kind === 'preset') sim.applyPreset(plan.id);
  else if (plan.kind === 'reset') sim.reset();
  else sim.set(plan.patch);
  return true;
}
