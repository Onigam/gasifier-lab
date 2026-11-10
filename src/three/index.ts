import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { GasParams, GasState } from '../sim/types';
import { createFarmScene as buildFarm } from './farm/scene';
import { createGarageScene as buildGarage } from './garage/scene';
import { createGasifierScene as buildGasifier } from './gasifier/scene';
import { createGasTrainScene as buildGasTrain } from './gastrain/scene';
import { createTractorScene as buildTractor } from './tractor/scene';

// The five worlds, all `lazyModule`s: nothing is built until the visitor goes there. Use the result as the `module` of a `SceneDef` and spread `WORLD[id]` next to it. They read the simulation's state in `update`; what the state does not carry (the journey's
// cursor, the lid's leak, the fan's source, the selected part) is passed by the application: `createFarmScene({ params: () => sim.params, selected: () => store.state.selected })`.

export interface WorldOptions {
  params?: () => GasParams;
  selected?: () => string | null;
}

export const createFarmScene = (o: WorldOptions = {}): SceneModule<GasState> =>
  lazyModule<GasState>('farm', () => buildFarm(o));
export const createTractorScene = (o: WorldOptions = {}): SceneModule<GasState> =>
  lazyModule<GasState>('tractor', () => buildTractor(o));
export const createGasifierScene = (o: WorldOptions = {}): SceneModule<GasState> =>
  lazyModule<GasState>('gasifier', () => buildGasifier(o));
export const createGasTrainScene = (o: WorldOptions = {}): SceneModule<GasState> =>
  lazyModule<GasState>('gas-train', () => buildGasTrain(o));
export const createGarageScene = (o: WorldOptions = {}): SceneModule<GasState> =>
  lazyModule<GasState>('garage', () => buildGarage(o));

/** The parts that open a detailed world, for `LabDefinition.partLinks` (research §0.4): the label is the application's. */
export const PART_OPENS = {
  'wood-gas-tractor': 'tractor',
  'gasifier-unit': 'gasifier',
  'gas-line-run': 'gas-train',
  'farm-garage': 'garage',
} as const;

/** What `src/lab.ts` needs to know of each world, as `SceneDef` fields: spread it into the definition. */
export const WORLD = {
  farm: {
    /** A farm does not come apart; no section (research §0.4). X-ray only makes sense around a selected part. */
    cutaway: false,
    explode: false,
    xrayNeedsSelection: true,
    partPadding: 1.7,
    stepFrame: { padding: 1.7, minRadius: 1.5 },
  },
  tractor: {
    cutaway: false,
    partPadding: 2.2,
    stepFrame: { padding: 1.6, minRadius: 0.5 },
    /** X-ray opens the cab and the unit; the unit's core, lit from inside, stays. */
    xrayShell: (id: string): boolean => id === 'cab' || id === 'gasifier-unit',
  },
  gasifier: {
    /** Always cut: the unit is drawn in section, there is no tool to press. */
    cutaway: false,
    partPadding: 1.8,
    stepFrame: { padding: 1.5, minRadius: 0.2 },
    xrayShell: (id: string): boolean => id === 'outer-casing' || id === 'fuel-casing' || id === 'fire-box',
  },
  'gas-train': {
    /** The cylinder is a cutaway at all times; nothing else in the line is taught by a cut: X-ray opens the filter, the cooler, the fan. */
    cutaway: false,
    partPadding: 2.0,
    stepFrame: { padding: 1.6, minRadius: 0.3 },
    xrayShell: (id: string): boolean =>
      ['filter-box', 'gas-cooler', 'starting-fan', 'cyclone', 'hot-gas-pipe'].includes(id),
  },
  garage: {
    /** The walls between the eye and the room step aside by themselves: no tool. No person in the picture (R5). */
    cutaway: false,
    partPadding: 2.2,
    stepFrame: { padding: 1.6, minRadius: 0.5 },
    xrayShell: (id: string): boolean => ['closed-garage', 'room-above', 'garage-door'].includes(id),
  },
} as const;
