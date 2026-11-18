import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGasTrainScene, CYCLONE_AT, CYCLONE_RING } from './gastrain/scene';
import { meshBox, stateWith, view } from './test-utils';

// Film round 5, N3 (docs/qa.md, « Film round 4: the scoped review »): the gas line's home was tuned for the film's 16:9 frame; the app at 1280 with its panel open has a narrower view, and the kit, which fits a wide view by its height,
// kept the same distance and lost the cyclone at the side that the overview's text names. Here the kit's fit is played at every shape of view from 16:9 down to square: the cyclone and every part stay in the picture.

const train = createGasTrainScene();
train.update(stateWith(), 1 / 60, view());
train.scene.updateMatrixWorld(true);

/** The kit's overview (`Stage.frameAll` with no insets: the union of the parts' boxes, its sphere fitted with the world's padding in the narrower field of a 35-degree lens), for a view of this shape. */
function homeCamera(aspect: number): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(35, aspect, 0.05, 5000);
  train.scene.onBeforeRender(null as never, train.scene, cam, null as never, null as never, null as never);
  const box = new THREE.Box3();
  for (const p of train.registry.parts.values()) box.union(train.registry.bounds(p.id));
  const c = box.getCenter(new THREE.Vector3());
  const r = box.getBoundingSphere(new THREE.Sphere()).radius;
  const v = (35 * Math.PI) / 180;
  const fit = Math.min(v, 2 * Math.atan(Math.tan(v / 2) * aspect));
  const dir = train.home.position.clone().sub(train.home.target).normalize();
  cam.position.copy(c).addScaledVector(dir, (r * train.homePadding!) / Math.sin(fit / 2));
  cam.lookAt(c);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}

function screenBox(b: THREE.Box3, cam: THREE.Camera): [number, number, number, number] {
  const o: [number, number, number, number] = [9, -9, 9, -9];
  for (const x of [b.min.x, b.max.x])
    for (const y of [b.min.y, b.max.y])
      for (const z of [b.min.z, b.max.z]) {
        const q = new THREE.Vector3(x, y, z).project(cam);
        o[0] = Math.min(o[0], q.x);
        o[1] = Math.max(o[1], q.x);
        o[2] = Math.min(o[2], q.y);
        o[3] = Math.max(o[3], q.y);
      }
  return o;
}

describe('the gas line’s home holds the cyclone at every shape of a wide view (docs/qa.md, film round 4, N3)', () => {
  // 16:9 the film; 1.6 the app at 1280 × 800 with the panel closed; about 1.25 with it open; down to square
  for (const aspect of [16 / 9, 1.6, 1.25, 1.1, 1.0])
    it(`at ${aspect.toFixed(2)}: the cyclone, its ring and the line's two ends are inside the picture`, () => {
      const cam = homeCamera(aspect);
      const cyc = meshBox(train.registry.get('cyclone')!.object);
      const ring = new THREE.Box3(
        new THREE.Vector3(CYCLONE_AT.x - CYCLONE_RING[1], 0, CYCLONE_AT.z - CYCLONE_RING[1]),
        new THREE.Vector3(CYCLONE_AT.x + CYCLONE_RING[1], 0.01, CYCLONE_AT.z + CYCLONE_RING[1]),
      );
      for (const [name, b] of [
        ['cyclone', cyc],
        ['its ring', ring],
        ['the exhaust', meshBox(train.registry.get('exhaust-pipe')!.object)],
        ['the fan’s stack', meshBox(train.registry.get('fan-stack')!.object)],
      ] as const) {
        const s = screenBox(b, cam);
        expect(Math.max(-s[0], s[1], -s[2], s[3]), `${name}: ${s.map((v) => v.toFixed(2)).join(' ')}`).toBeLessThan(
          0.97,
        );
      }
    });

  it('the film’s 16:9 frame is the one round 4 made: the narrower views only stand further back', () => {
    const d = (a: number): number => homeCamera(a).position.distanceTo(train.home.target);
    expect(d(1.25)).toBeGreaterThan(d(16 / 9) * 1.3);
    expect(d(2.2)).toBeCloseTo(d(16 / 9), 5);
  });

  it('the cyclone’s ring lies clear of the starting fan’s stand, by 0.3 m at least', () => {
    const stand = new THREE.Box3().setFromObject(train.scene.getObjectByName('fan-stand')!);
    const dx = Math.max(stand.min.x - CYCLONE_AT.x, 0, CYCLONE_AT.x - stand.max.x);
    const dz = Math.max(stand.min.z - CYCLONE_AT.z, 0, CYCLONE_AT.z - stand.max.z);
    expect(Math.hypot(dx, dz) - CYCLONE_RING[1]).toBeGreaterThan(0.3);
  });
});
