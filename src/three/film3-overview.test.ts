import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createFarmScene, OVERVIEW_TALL, OVERVIEW_WIDE } from './farm/scene';
import { meshBox, stateWith, view } from './test-utils';

// Film round 3, item 6 (docs/qa.md, « Film round 2: the scoped review », m4): the farm's overview by the shape of the view.

const farm = createFarmScene();
farm.update(stateWith(), 1 / 60, view());
farm.scene.updateMatrixWorld(true);
describe('the farm’s overview by the shape of the view (docs/qa.md, film round 2, m4)', () => {
  const draw = (aspect: number): void => {
    const cam = new THREE.PerspectiveCamera(35, aspect, 0.1, 5000);
    cam.position.set(0, 30, 80);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true);
    farm.scene.onBeforeRender(null as never, farm.scene, cam, null as never, null as never, null as never);
  };
  const all = (): THREE.Box3 => {
    const b = new THREE.Box3();
    for (const p of farm.registry.parts.values()) b.union(farm.registry.bounds(p.id));
    return b;
  };

  it('what the kit frames is the yard’s box and nothing else: not the 80 m of ditch, not the gas over the tractor', () => {
    draw(16 / 9);
    expect(all().equals(OVERVIEW_WIDE.box)).toBe(true);
    // a part keeps its own box for whoever asks for it by name while it is selected, and for its own framing
    expect(farm.registry.frameBounds('field-ditch').getSize(new THREE.Vector3()).x).toBeGreaterThan(15);
  });

  it('a wide view looks from the south, low; a view taller than wide from higher, and holds the house, the garage, the barn and the start of the tractor’s rounds', () => {
    draw(16 / 9);
    const wide = farm.home.position.clone().sub(farm.home.target).normalize();
    expect(farm.home).toBe(OVERVIEW_WIDE.home);
    draw(390 / 700);
    expect(farm.home).toBe(OVERVIEW_TALL.home);
    expect(all().equals(OVERVIEW_TALL.box)).toBe(true);
    const tall = farm.home.position.clone().sub(farm.home.target).normalize();
    expect(Math.asin(wide.y)).toBeLessThan((20 * Math.PI) / 180);
    expect(Math.asin(tall.y)).toBeGreaterThan((35 * Math.PI) / 180);
    for (const box of [OVERVIEW_WIDE.box, OVERVIEW_TALL.box]) {
      for (const id of ['farmhouse', 'farm-garage', 'chip-barn']) {
        const c = meshBox(farm.registry.get(id)!.object).getCenter(new THREE.Vector3());
        // in plan: the tall view's box is the yard's ground, the kit's own margin takes the roofs in
        expect(c.x > box.min.x && c.x < box.max.x && c.z > box.min.z && c.z < box.max.z, id).toBe(true);
      }
      const drive = farm.scene.getObjectByName('drive')!.position;
      expect(drive.x > box.min.x && drive.x < box.max.x && drive.z > box.min.z && drive.z < box.max.z).toBe(true);
    }
    draw(16 / 9);
  });
});
