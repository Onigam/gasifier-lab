import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGarageScene } from './garage/scene';
import { createGasTrainScene } from './gastrain/scene';
import { nearShare, stateWith, view } from './test-utils';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { GasState } from '../sim/types';

// Film round 3, item 2 (docs/qa.md, « Film round 2: the scoped review », M2, M3): the flights never fill the frame with one material.
describe('a flight never fills the frame with one near surface (docs/qa.md, film round 2, M2 and M3)', () => {
  /** Where the app puts the camera for a part (its side, the box's sphere at the film's padding over the sine of half the lens), or the world's home. */
  const pose = (w: SceneModule<GasState>, id: string): { eye: THREE.Vector3; at: THREE.Vector3 } => {
    if (id === 'home') return { eye: w.home.position.clone(), at: w.home.target.clone() };
    const box = w.registry.frameBounds(id);
    const at = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2;
    return {
      eye: at.clone().addScaledVector(w.registry.get(id)!.viewDir!, (r * 1.9) / Math.sin((17.5 * Math.PI) / 180)),
      at,
    };
  };
  /** The worst frame of the straight flights through `seq` (the kit lerps the eye and its target): the share of the picture a surface nearer than a third of the shorter framing distance fills. */
  const worst = (w: SceneModule<GasState>, seq: string[]): { share: number; where: string } => {
    let share = 0;
    let where = '';
    for (let i = 0; i + 1 < seq.length; i++) {
      const a = pose(w, seq[i]!);
      const b = pose(w, seq[i + 1]!);
      const near = 0.35 * Math.min(a.eye.distanceTo(a.at), b.eye.distanceTo(b.at));
      for (let k = 0; k <= 150; k++) {
        const t = k / 150;
        const s = nearShare(w.scene, a.eye.clone().lerp(b.eye, t), a.at.clone().lerp(b.at, t), near);
        if (s.share > share) {
          share = s.share;
          where = `${seq[i]} to ${seq[i + 1]} at ${k}/150: ${s.name}`;
        }
      }
    }
    return { share, where };
  };

  it('the garage: the film’s flights, the one from the whole building down to the 1940s set among them, never have a third of the frame on a slab, a wall or the machine at arm’s length', () => {
    const garage = createGarageScene();
    garage.update(stateWith(), 1 / 60, view());
    garage.scene.updateMatrixWorld(true);
    const w = worst(garage, [
      'home',
      'room-above',
      'closed-garage',
      'old-rescue-set',
      'post-gas-plume',
      'co-indicator',
      'closed-garage',
      'garage-door',
      'post-gas-plume',
      'room-above',
    ]);
    expect(w.share, w.where).toBeLessThan(1 / 3);
  });

  it('the gas line: from the home view along the line to the cylinder and on to the water gauge, the eye never goes through the cylinder’s cut metal', () => {
    const train = createGasTrainScene();
    train.update(stateWith(), 1 / 60, view());
    train.scene.updateMatrixWorld(true);
    const w = worst(train, ['home', 'filter-box', 'gas-cooler', 'cylinder-cutaway', 'water-gauge', 'home']);
    expect(w.share, w.where).toBeLessThan(1 / 3);
  });
});
