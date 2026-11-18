import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { createFarmScene, OVERVIEW_TALL, OVERVIEW_WIDE } from './farm/scene';
import { createGasTrainScene } from './gastrain/scene';
import { stateWith, view } from './test-utils';

// Film round 4, item 2 (docs/qa.md, « Film round 3: the scoped review », M1 and m5): the overview by the shape of the view is read when it is asked for, before any render; no part of the farm has an empty box at either shape.

/** A page whose 3D canvas has this size, as the kit lays it out (a canvas beside the label layer). */
function page(w: number, h: number): void {
  const canvas = { clientWidth: w, clientHeight: h };
  (globalThis as { document?: unknown }).document = {
    querySelector: (sel: string) =>
      sel === '.label-layer' ? { parentElement: { querySelector: () => canvas } } : sel === 'canvas' ? canvas : null,
  };
}

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

describe('the first framing of a visit has the shape of the view (docs/qa.md, film round 3, M1)', () => {
  it('the farm on a phone, before anything is drawn: the tall overview, its box and its pose', () => {
    page(390, 700);
    const farm = createFarmScene();
    expect(farm.home).toBe(OVERVIEW_TALL.home);
    expect(farm.homePadding).toBe(OVERVIEW_TALL.padding);
    const all = new THREE.Box3();
    for (const p of farm.registry.parts.values()) all.union(farm.registry.bounds(p.id));
    expect(all.equals(OVERVIEW_TALL.box)).toBe(true);
    // and the page turned wide: the next framing is the wide one, with no render between
    page(1280, 720);
    expect(farm.home).toBe(OVERVIEW_WIDE.home);
  });

  it('the gas line on a phone, before anything is drawn: its tall padding', () => {
    page(390, 700);
    const train = createGasTrainScene();
    expect(train.homePadding).toBe(0.62);
    page(1280, 720);
    expect(train.homePadding).not.toBe(0.62);
  });
});

describe('no part of the farm comes back with an empty box, wide or tall (docs/qa.md, film round 3, m5)', () => {
  for (const [name, w, h] of [
    ['wide', 1280, 720],
    ['tall', 390, 844],
  ] as const)
    it(`${name}: the ash bin, the barrel and every other part have a box, inside the overview's`, () => {
      page(w, h);
      const farm = createFarmScene();
      farm.update(stateWith(), 1 / 60, view());
      farm.scene.updateMatrixWorld(true);
      const hold = w > h ? OVERVIEW_WIDE.box : OVERVIEW_TALL.box;
      for (const id of farm.registry.ids()) {
        const b = farm.registry.bounds(id);
        expect(b.isEmpty(), id).toBe(false);
        expect(hold.containsBox(b), id).toBe(true);
      }
      // the residues' own boxes are whole in the overview: the install step that frames them finds them
      for (const id of ['ash-bin', 'condensate-barrel']) {
        const own = farm.registry.frameBounds(id);
        expect(hold.containsBox(own), id).toBe(true);
      }
    });
});

describe('the garage’s home has no tuft at its foot (docs/qa.md, film round 3, M2)', () => {
  it('no tuft within 12 m of where the home camera stands, at 13 to 26 m from its target (16:9 to a phone)', async () => {
    const { createGarageScene, GARAGE_HOME } = await import('./garage/scene');
    const garage = createGarageScene();
    const tufts = garage.scene.getObjectByName('tufts') as THREE.InstancedMesh;
    expect(tufts.count).toBeGreaterThan(3000);
    const dir = GARAGE_HOME.position.clone().sub(GARAGE_HOME.target).normalize();
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (const d of [13, 16, 20, 24]) {
      const eye = GARAGE_HOME.target.clone().addScaledVector(dir, d);
      for (let i = 0; i < tufts.count; i++) {
        tufts.getMatrixAt(i, m);
        p.setFromMatrixPosition(m);
        expect(Math.hypot(p.x - eye.x, p.z - eye.z), `${d} m out`).toBeGreaterThan(11.5);
      }
    }
  });
});
