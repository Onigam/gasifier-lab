import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GHOST } from '@onigam/lab-kit/three';
import { createTractorScene, IN_FRONT } from './tractor/scene';
import { BELT, buildBelt } from './tractor/engine';
import { stateWith, view } from './test-utils';

// What the browser review found under the bonnet and what holds it now (docs/qa.md D3): a part inside the engine bay is read through what stands in front of it, and the extra governor's V-belt is on both its pulleys.

const s = stateWith();

/** True for a mesh under the pulley on the fan's shaft, the one the governor's belt rides on, which stays solid under the ghost engine. */
const underPulley = (m: THREE.Mesh, pulley: THREE.Object3D): boolean => {
  for (let o: THREE.Object3D | null = m; o; o = o.parent) if (o === pulley) return true;
  return false;
};

describe('a part inside the engine bay is read through what stands in front of it (D3)', () => {
  it('while the pump, the shield or the governor is the one selected, the engine and the line go to the ghost; the part itself stays solid', () => {
    let sel: string | null = null;
    const w = createTractorScene({ selected: () => sel });
    const frame = (): void => {
      w.update(s, 1 / 60, view({ time: 1 }));
    };
    frame();
    for (const id of ['injection-pump', 'heat-shield', 'extra-governor'] as const) {
      sel = id;
      frame();
      for (const front of IN_FRONT[id]!) {
        const e = w.registry.get(front)!;
        expect(e.display, `${front} is solid for the registry`).toBe('solid');
        // but, for the governor, the pulley its belt rides on
        const stays = id === 'extra-governor' && front === 'diesel-engine' ? w.machine.engine.pulleys[2]! : null;
        expect(
          e.meshes.every((m) => (stays && underPulley(m, stays) ? m.material !== GHOST : m.material === GHOST)),
          `${front} ghosted while ${id} is selected`,
        ).toBe(true);
      }
      expect(
        w.registry.get(id)!.meshes.every((m) => m.material !== GHOST),
        `${id} itself solid`,
      ).toBe(true);
      // what the registry shows is untouched, and what is not in the way stays solid
      expect(w.registry.get('gasifier-unit')!.meshes.every((m) => m.material !== GHOST)).toBe(true);
      sel = null;
      frame();
      for (const front of IN_FRONT[id]!)
        expect(
          w.registry.get(front)!.meshes.every((m) => m.material !== GHOST),
          `${front} solid again`,
        ).toBe(true);
    }
  });

  it('a part the registry hides (isolate) or ghosts (X-ray) is left to the registry, and comes back as the registry says', () => {
    let sel: string | null = 'extra-governor';
    const w = createTractorScene({ selected: () => sel });
    w.update(s, 1 / 60, view({ time: 1 }));
    const engine = w.registry.get('diesel-engine')!;
    const pulley = w.machine.engine.pulleys[2]!;
    const ghosted = (): boolean =>
      engine.meshes.every((m) => (underPulley(m, pulley) ? m.material !== GHOST : m.material === GHOST));
    expect(ghosted()).toBe(true);
    // isolate: the registry hides the engine; its meshes take the solid material back and are not drawn
    w.registry.setDisplay('diesel-engine', 'hidden');
    w.update(s, 1 / 60, view({ time: 1 }));
    expect(engine.meshes.every((m) => !m.visible)).toBe(true);
    expect(engine.display).toBe('hidden');
    // and back to solid: the part under the selection is on the ghost again, not left on a stale material
    w.registry.setDisplay('diesel-engine', 'solid');
    w.update(s, 1 / 60, view({ time: 1 }));
    expect(ghosted()).toBe(true);
    sel = null;
    w.update(s, 1 / 60, view({ time: 1 }));
    expect(engine.meshes.every((m) => m.material !== GHOST)).toBe(true);
  });
});

describe('the extra governor’s V-belt (D3)', () => {
  const m = createTractorScene().machine;
  // the belt's inner face is on the pulley's rim, a groove's depth out
  const onRim = (r: number): number => r + BELT.groove;

  /** The smallest distance in the belt's plane (y, z) from a point to the belt's inner face, over its vertices: the belt rides on the rim where this is the rim's radius. */
  const gap = (centre: THREE.Vector3, r: number): number => {
    const belt = m.governor.belt.mesh;
    belt.updateWorldMatrix(true, false);
    const p = belt.geometry.attributes.position as THREE.BufferAttribute;
    let best = Infinity;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(belt.matrixWorld);
      best = Math.min(best, Math.abs(Math.hypot(v.y - centre.y, v.z - centre.z) - r));
    }
    return best;
  };
  const centres = (): { fan: THREE.Vector3; gov: THREE.Vector3 } => {
    m.root.updateWorldMatrix(true, true);
    return {
      fan: m.engine.engine.localToWorld(m.engine.beltPulley.at.clone()),
      gov: m.governor.group.localToWorld(m.governor.pulley.at.clone()),
    };
  };

  it('rides on the rim of the fan shaft’s pulley and of the governor’s, to within 2 mm', () => {
    m.update(s, 1 / 60, { slowMo: 1, time: 1 });
    const c = centres();
    expect(gap(c.fan, onRim(m.engine.beltPulley.r))).toBeLessThan(0.002);
    expect(gap(c.gov, onRim(m.governor.pulley.r))).toBeLessThan(0.002);
    // it is seen: a closed band of some length between them, not a speck
    const box = new THREE.Box3().setFromObject(m.governor.belt.mesh, true);
    expect(box.getSize(new THREE.Vector3()).length()).toBeGreaterThan(0.2);
  });

  it('stays on both pulleys when the engine and the governor leave along their own lines', () => {
    // the explode of the tractor world: the engine up, the governor up and out
    m.engine.engine.position.y += 0.95;
    m.governor.group.position.add(new THREE.Vector3(0.9, 0.95, -0.9));
    m.update(s, 1 / 60, { slowMo: 1, time: 1 });
    const c = centres();
    expect(gap(c.fan, onRim(m.engine.beltPulley.r))).toBeLessThan(0.002);
    expect(gap(c.gov, onRim(m.governor.pulley.r))).toBeLessThan(0.002);
    // and the belt reaches from one to the other
    const box = new THREE.Box3().setFromObject(m.governor.belt.mesh, true);
    expect(box.max.distanceTo(box.min)).toBeGreaterThan(c.fan.distanceTo(c.gov) - 0.1);
  });

  it('a belt that cannot reach is left as it was, and its vertices are finite', () => {
    const b = buildBelt();
    b.set(new THREE.Vector3(0, 0, 0), 0.05, new THREE.Vector3(0, 0, 0.001), 0.01);
    const p = b.mesh.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.array.length; i++) expect(Number.isFinite(p.array[i]!)).toBe(true);
  });
});
