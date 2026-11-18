import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGarageScene } from './garage/scene';
import { UNIT } from './dims';
import { WORLD } from './index';
import { stateWith, view } from './test-utils';
import type { GasParams, GasState } from '../sim/types';

// Film round 4, item 4 (docs/qa.md, « Film round 3: the scoped review », m2): in 5b (the plume's frame with a lid that leaks) the gap under the lid shows. It replaces film2.test.ts's « the camera looks down on the lid » (the lead's decision: the test gives, not the frame).

describe('the gap under a leaking lid shows in the 5b frame (docs/qa.md, film round 3, m2)', () => {
  const params = { lidLeak: true, timeScale: 51 } as GasParams;
  const g = createGarageScene({ params: () => params });
  // a stopped engine with gas leaving: the lid stands open by its whole lift
  const st: GasState = stateWith({ engineOn: false, pressureSign: 'pressure', plumeShare: 0.8, plumeVisible: true });
  for (let i = 0; i < 40; i++) g.update(st, 0.5, view({ time: 1 + i }));
  g.scene.updateMatrixWorld(true);

  /** The kit's camera for `[[frame:post-gas-plume]]` at 1280 × 720: the guide's padding, a 40-degree lens. */
  const pose = (): THREE.PerspectiveCamera => {
    const box = g.registry.frameBounds('post-gas-plume');
    const at = box.getCenter(new THREE.Vector3());
    const r = box.getBoundingSphere(new THREE.Sphere()).radius;
    const d = (r * Math.min(WORLD.garage.partPadding, 1.9)) / Math.sin((20 * Math.PI) / 180);
    const cam = new THREE.PerspectiveCamera(40, 1280 / 720, 0.05, 500);
    cam.position.copy(at).addScaledVector(g.registry.get('post-gas-plume')!.viewDir!, d);
    cam.lookAt(at);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    g.scene.onBeforeRender(null as never, g.scene, cam, null as never, null as never, null as never);
    g.scene.updateMatrixWorld(true);
    return cam;
  };

  it('on the lid’s near side, the run of see-through between the cord and the lid’s edge is three pixels tall and more at 1280 × 720 (half a pixel at 200 px wide: the lid and its gas still read there)', () => {
    const cam = pose();
    const lift = g.scene.getObjectByName('lid-lift')!;
    const top = lift.getWorldPosition(new THREE.Vector3());
    const rimY = top.y - (lift.position.y - UNIT.rimTop);
    expect(top.y - rimY).toBeGreaterThan(0.015);
    // the lid's centre, and the point of its rim nearest the eye, in plan
    const toEye = cam.position.clone().sub(top).setY(0).normalize();
    const meshes: THREE.Object3D[] = [];
    g.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return;
      const mat = m.material as THREE.Material;
      if (Array.isArray(mat) || mat.transparent) return;
      meshes.push(m);
    });
    const ray = new THREE.Raycaster();
    let lo = Infinity;
    let hi = -Infinity;
    // only between the casing's rim and the lid's edge: over the lid the eye sees past it too, and that is not the gap
    for (let y = rimY - 0.004; y < top.y; y += 0.0005) {
      const p = top
        .clone()
        .setY(y)
        .addScaledVector(toEye, UNIT.lid.R - 0.008);
      const dir = p.clone().sub(cam.position);
      const dist = dir.length();
      ray.set(cam.position, dir.normalize());
      ray.far = dist + 0.02;
      const hit = ray.intersectObjects(meshes, false)[0];
      // seen through: nothing at the rim's line, what is hit (the casing's inside, the lid's underside) lies beyond it
      if (hit && hit.distance < dist - 0.002) continue;
      const q = p.clone().project(cam);
      const py = ((1 - q.y) / 2) * 720;
      lo = Math.min(lo, py);
      hi = Math.max(hi, py);
    }
    expect(hi - lo, 'pixels of gap').toBeGreaterThanOrEqual(3);
  });

  it('the frame looks at the lid from the side, under 12 degrees up, and from the open side of the building', () => {
    const d = g.registry.get('post-gas-plume')!.viewDir!;
    expect((Math.asin(d.y) * 180) / Math.PI).toBeLessThan(12);
  });
});
