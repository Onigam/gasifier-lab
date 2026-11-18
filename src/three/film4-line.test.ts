import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGasTrainScene, CYCLONE_AT, SANKEY_Z } from './gastrain/scene';
import { meshBox, stateWith, view } from './test-utils';

// Film round 4, item 6 (docs/qa.md, « Film round 3: the scoped review », m4): the gas line's home is the line, the cyclone off the way between the ribbons and the line, the diesel's ribbon fed from somewhere and going into the engine's.

const train = createGasTrainScene();
train.update(stateWith(), 1 / 60, view());
train.scene.updateMatrixWorld(true);

describe('the gas line’s home frame (docs/qa.md, film round 3, m4)', () => {
  it('at 16:9 the line’s pieces take over four fifths of the picture’s width (they took 0.68: the line read as half the picture), the ribbons whole in it', () => {
    const cam = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 5000);
    train.scene.onBeforeRender(null as never, train.scene, cam, null as never, null as never, null as never);
    const box = new THREE.Box3();
    for (const p of train.registry.parts.values()) box.union(train.registry.bounds(p.id));
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2;
    const dir = train.home.position.clone().sub(train.home.target).normalize();
    cam.position.copy(c).addScaledVector(dir, (r * train.homePadding!) / Math.sin((17.5 * Math.PI) / 180));
    cam.lookAt(c);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    const all = new THREE.Box3();
    for (const id of train.registry.ids()) all.union(meshBox(train.registry.get(id)!.object));
    const sankey = new THREE.Box3().setFromObject(train.scene.getObjectByName('sankey')!);
    const span = (b: THREE.Box3): number[] => {
      const o = [9, -9, 9, -9];
      for (const x of [b.min.x, b.max.x])
        for (const y of [b.min.y, b.max.y])
          for (const z of [b.min.z, b.max.z]) {
            const q = new THREE.Vector3(x, y, z).project(cam);
            o[0] = Math.min(o[0]!, q.x);
            o[1] = Math.max(o[1]!, q.x);
            o[2] = Math.min(o[2]!, q.y);
            o[3] = Math.max(o[3]!, q.y);
          }
      return o;
    };
    const line = span(all);
    expect((line[1]! - line[0]!) / 2).toBeGreaterThan(0.8);
    const s = span(sankey);
    expect(Math.min(-s[0]!, s[1]!, -s[2]!, s[3]!)).toBeGreaterThan(-0.97);
  });

  it('the cyclone stands at the unit’s end of the line, not between the ribbons and the line; the ribbons lie within 2.4 m of the line', () => {
    const cyc = meshBox(train.registry.get('cyclone')!.object);
    const sankey = new THREE.Box3().setFromObject(train.scene.getObjectByName('sankey')!);
    expect(cyc.max.x).toBeLessThan(sankey.min.x);
    expect(Math.abs(cyc.getCenter(new THREE.Vector3()).x - CYCLONE_AT.x)).toBeLessThan(0.2);
    expect(SANKEY_Z).toBeGreaterThan(-2.4);
  });

  it('the diesel’s ribbon starts in a swallow’s tail and ends in an arrow’s head', () => {
    const tails = train.scene
      .getObjectByName('sankey')!
      .children.filter((c) => (c as THREE.Mesh).geometry?.userData.tail);
    expect(tails.length).toBe(1);
    expect((tails[0] as THREE.Mesh).geometry.userData.head).toBe(true);
  });
});
