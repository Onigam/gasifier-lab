import type { SceneModule } from '@onigam/lab-kit/three';
import type { SceneDef } from '@onigam/lab-kit/ui';
import type { GasifierSim } from '../../sim/engine';
import { createGasifierScene } from '../gasifier/scene';
import { createTractorScene } from '../tractor/scene';
import { createGasTrainScene } from '../gastrain/scene';
import { createGarageScene } from '../garage/scene';
import { createFarmScene } from '../farm/scene';

// The worlds the review page knows, as the lead will wire them: a builder and the `SceneDef` fields of each.

export interface ReviewWorld {
  make: (sim: GasifierSim) => SceneModule;
  def: Partial<SceneDef>;
}

const selected = (): string | null =>
  (window as unknown as { __lab?: { store: { state: { selected: string | null } } } }).__lab?.store.state.selected ??
  null;

export const WORLDS: Record<string, ReviewWorld> = {
  farm: {
    make: (sim) => createFarmScene({ params: () => sim.params, selected }) as unknown as SceneModule,
    def: {
      cutaway: false,
      explode: false,
      xrayNeedsSelection: true,
      partPadding: 1.6,
      stepFrame: { padding: 1.6, minRadius: 1.5 },
    },
  },
  garage: {
    make: (sim) => createGarageScene({ params: () => sim.params, selected }) as unknown as SceneModule,
    def: {
      cutaway: false,
      partPadding: 2.2,
      stepFrame: { padding: 1.6, minRadius: 0.5 },
      xrayShell: (id: string) => ['closed-garage', 'room-above', 'garage-door'].includes(id),
    },
  },
  'gas-train': {
    make: (sim) => createGasTrainScene({ params: () => sim.params, selected }) as unknown as SceneModule,
    def: {
      cutaway: false,
      partPadding: 2.0,
      stepFrame: { padding: 1.6, minRadius: 0.3 },
      xrayShell: (id: string) => ['filter-box', 'gas-cooler', 'starting-fan', 'cyclone', 'hot-gas-pipe'].includes(id),
    },
  },
  tractor: {
    make: (sim) => createTractorScene({ params: () => sim.params, selected }) as unknown as SceneModule,
    def: {
      cutaway: false,
      partPadding: 2.2,
      stepFrame: { padding: 1.6, minRadius: 0.5 },
      xrayShell: (id: string) => id === 'cab' || id === 'gasifier-unit',
    },
  },
  gasifier: {
    make: (sim) =>
      createGasifierScene({
        params: () => sim.params,
        selected: () =>
          (window as unknown as { __lab?: { store: { state: { selected: string | null } } } }).__lab?.store.state
            .selected ?? null,
      }) as unknown as SceneModule,
    def: { cutaway: false, partPadding: 1.8, stepFrame: { padding: 1.5, minRadius: 0.2 } },
  },
};
