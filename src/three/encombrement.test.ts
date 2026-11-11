import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { GasState } from '../sim/types';
import { HEARTH, HOT, UNIT, ZONES } from './dims';
import { createFarmScene } from './farm/scene';
import { createGarageScene } from './garage/scene';
import { createGasifierScene } from './gasifier/scene';
import { createGasTrainScene } from './gastrain/scene';
import { createTractorScene } from './tractor/scene';
import { stateWith, view } from './test-utils';

// The kit prints a part's box as « Encombrement » on its sheet (`envelopeText` of the kit's ui/envelope.js: the three sizes in metres with two decimals if any is a metre or more, else in whole millimetres, a comma in French and a point in English). The
// sizes of the hot parts and of the lower casing are withheld (research §A.2, R2): no figure of the sheet may repeat one, at the precision it is printed, on any axis. A part whose box does is in its world's refused set, which empties the box on the sheet
// while the part is selected (the camera still gets the real one). This holds it in the five worlds, over the states of the model that move a box (the level of the chips, the ash, the jar, the grate, the lid, the engine, the tractor's loop). It prints no
// figure: a failure names the parts, nothing else.

const flatten = (o: unknown): number[] =>
  typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flatten) : [];

/** The withheld lengths: the same set as the guard of src/data (`refusals.test.ts`): the hot parts, the zones, the lower casing. */
const WITHHELD = [
  ...new Set([...flatten(HOT), ...flatten(HEARTH), ...flatten(ZONES), UNIT.lowerR * 2, UNIT.lowerR, UNIT.lowerH]),
]
  .filter((v) => v > 0 && v < 2 && !Number.isInteger(v))
  .sort();

/** The figure the kit prints for a length in a row: metres with two decimals if the row is in metres, else whole millimetres (the decimal mark does not matter: a figure is compared before it). */
const figure = (v: number, inMetres: boolean): string => (inMetres ? v.toFixed(2) : String(Math.round(v * 1000)));

/** The states of the model that move a box. */
function states(): GasState[] {
  const out: GasState[] = [];
  for (const bunker of [0.12, 0.45, 0.8, 1])
    for (const ash of [0, 1.5, 3, 6])
      for (const jar of [0, 5, 12])
        out.push(
          stateWith({
            bunkerShare: bunker,
            ashKg: ash,
            condensateL: jar,
            grateMoving: (bunker * 10 + ash) % 2 > 0.5,
            pressureSign: ash > 2 ? 'pressure' : 'suction',
            plumeShare: ash > 2 ? 1 : 0.3,
            engineOn: jar < 12,
            coolerVesselShare: jar / 12,
          }),
        );
  return out;
}

/** Every part of every world that prints a figure of its box equal to a withheld length, by world and id; the sheet of a part in the refused set prints nothing. */
function repeats(): string[] {
  let selected: string | null = null;
  const worlds: [string, SceneModule<GasState>][] = [
    ['farm', createFarmScene({ selected: () => selected })],
    ['tractor', createTractorScene({ selected: () => selected })],
    ['gasifier', createGasifierScene({ selected: () => selected })],
    ['gas-train', createGasTrainScene({ selected: () => selected })],
    ['garage', createGarageScene({ selected: () => selected })],
  ];
  const bad = new Set<string>();
  const size = new THREE.Vector3();
  states().forEach((state, k) => {
    for (const [name, world] of worlds) {
      // a few steps, so that what moves (the tractor on its loop, the grate, the flap) is somewhere else each time
      for (let i = 0; i < 5; i++) world.update(state, 0.37 + 0.11 * (k % 7), view({ time: 1 + k * 0.7 + i }));
      world.scene.updateMatrixWorld(true);
      for (const id of world.registry.ids()) {
        // the box the sheet would print: the registry's, with the part selected (a refused part has none)
        selected = id;
        const box = world.registry.bounds(id);
        selected = null;
        if (box.isEmpty()) continue;
        box.getSize(size);
        const inMetres = size.x >= 1 || size.y >= 1 || size.z >= 1;
        for (const v of [size.x, size.y, size.z])
          if (WITHHELD.some((w) => figure(w, inMetres) === figure(v, inMetres))) bad.add(`${name}/${id}`);
      }
    }
  });
  return [...bad].sort();
}

const kit = import.meta.glob('/node_modules/@onigam/lab-kit/dist/ui/envelope.js', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('the sheets’ « Encombrement » repeats no withheld length (R2)', () => {
  it('knows what it guards: the withheld lengths, and the kit’s way of printing a box', () => {
    expect(WITHHELD.length).toBeGreaterThan(8);
    // the figures are compared as the kit prints them: if it prints otherwise this guard must change with it
    const src = Object.values(kit)[0] ?? '';
    expect(src).toContain('toFixed(2)');
    expect(src).toContain('Math.round(v * 1000)');
    expect(src).toContain("replace('.', ',')");
  });

  it('no part, in any world and any state of the model, prints a figure of its box that equals one', () => {
    expect(
      repeats(),
      'parts whose printed box repeats a withheld length (put them in their world’s refused set)',
    ).toEqual([]);
  });
});
