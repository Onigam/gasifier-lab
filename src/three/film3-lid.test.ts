import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { UNIT } from './dims';
import { createGarageScene, LEAK_INTAKE } from './garage/scene';
import { LID_HELD, LID_LIFT, buildUnit } from './unit/unit';
import { meshBox, stateWith, view } from './test-utils';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { GasParams, GasState } from '../sim/types';

// Film round 3, item 3 (docs/qa.md, « Film round 2: the scoped review », F3): the lid reads as a lid.
describe('the lid reads as a lid (docs/qa.md, film round 2, F3)', () => {
  const push = (lidPush: number) => ({
    bunkerShare: 0.5,
    engineOn: false,
    gasFlowShare: 0,
    grateMoving: false,
    lidPush,
    ashShare: 0,
    jarShare: 0,
    time: 1,
    slowMo: 1,
    dt: 0.1,
  });

  it('it closes on a pale cord that lies on a seat round the casing’s rim; shut, its edge is on the cord; pushed up whole, a gap of more than a centimetre stands open between them, all round', () => {
    const u = buildUnit({ cut: false });
    const fuel = u.parts.get('fuel-casing')!;
    const lift = u.parts.get('spring-lid')!.getObjectByName('lid-lift')!;
    u.root.updateMatrixWorld(true);
    // the cord: the pale mesh of the casing, a ring as wide as the lid
    let cord: THREE.Mesh | null = null;
    fuel.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.material as THREE.Material).name === 'gasket-cord') cord = m;
    });
    expect(cord, 'the cord is a mesh of its own, in its own colour').toBeTruthy();
    const cb = new THREE.Box3().setFromObject(cord!);
    expect(cb.max.x).toBeGreaterThan(UNIT.lid.R - 0.01);
    expect(cb.max.x).toBeLessThan(UNIT.lid.R);
    u.update(push(0));
    u.root.updateMatrixWorld(true);
    // the plate and its rolled edge, not the rod that goes up through the yoke
    const edge = (): number => meshBox(lift).min.y;
    expect(Math.abs(edge() - cb.max.y)).toBeLessThan(0.002);
    u.update(push(1));
    u.root.updateMatrixWorld(true);
    expect(edge() - cb.max.y).toBeGreaterThan(0.012);
    expect(edge() - cb.max.y).toBeCloseTo(LID_LIFT, 2);
    // a lid that seals is pushed to a part of that at the most
    expect(LID_HELD).toBeLessThan(0.7);
  });

  it('in the garage a lid that leaks stands open by its whole lift while the gas pushes, a lid that seals does not; the intake’s gas is then a fifth of itself and low, and the frame is a medium one about the lid', () => {
    const stopped = stateWith({ engineOn: false, pressureSign: 'pressure', plumeShare: 0.6, plumeVisible: true });
    const liftOf = (g: SceneModule<GasState>): number => g.scene.getObjectByName('lid-lift')!.position.y;
    let params = { lidLeak: false, timeScale: 51 } as GasParams;
    const g = createGarageScene({ params: () => params });
    g.update(stopped, 1 / 60, view());
    const sealed = liftOf(g);
    const eyeFrame = g.registry.frameBounds('post-gas-plume').clone();
    params = { ...params, lidLeak: true };
    g.update(stopped, 1 / 60, view({ time: 2 }));
    expect(liftOf(g) - sealed).toBeCloseTo(LID_LIFT * (1 - LID_HELD * 0.6), 4);
    expect(LEAK_INTAKE.share).toBeLessThan(0.3);
    expect(LEAK_INTAKE.rise).toBeLessThan(0.7);
    const post = g.scene.getObjectByName('post-gas-plume')!;
    const eye = post.children[0] as THREE.Points;
    const u = (eye.material as THREE.ShaderMaterial).uniforms;
    expect(u.uShare!.value as number).toBeCloseTo(0.6 * LEAK_INTAKE.share, 5);
    expect(u.uRise!.value).toBe(LEAK_INTAKE.rise);
    // the frame: about the lid, under a metre a side, smaller than the cloud's
    const f = g.registry.frameBounds('post-gas-plume');
    const size = f.getSize(new THREE.Vector3());
    expect(Math.max(size.x, size.y, size.z)).toBeLessThan(0.8);
    expect(size.length()).toBeLessThan(eyeFrame.getSize(new THREE.Vector3()).length() * 0.5);
    const lidY = g.scene.getObjectByName('lid-lift')!.getWorldPosition(new THREE.Vector3()).y;
    expect(f.min.y).toBeLessThan(lidY);
    expect(f.max.y).toBeGreaterThan(lidY + 0.2);
  });
});
