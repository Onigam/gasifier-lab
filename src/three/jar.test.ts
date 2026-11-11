import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { COOLER } from './dims';
import { createTractorScene } from './tractor/scene';

// What the browser review found on the gas line and what holds it now (docs/qa.md D13): the cooler's condensate jar hangs from the cooler's frame, not from a plate that touches nothing.

const vertices = (root: THREE.Object3D, pick: (m: THREE.Mesh) => boolean = () => true): THREE.Vector3[] => {
  root.updateWorldMatrix(true, true);
  const out: THREE.Vector3[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !pick(m)) return;
    const p = m.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++)
      out.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld));
  });
  return out;
};

describe('the cooler’s jar hangs from the cooler’s frame (D13)', () => {
  const m = createTractorScene().machine.train.cooler;
  m.group.updateWorldMatrix(true, true);
  const jarR = COOLER.vessel.R;

  it('has no plate across it: nothing of the vessel is wider than the jar and its hanger’s ears', () => {
    const v = vertices(m.vessel);
    const centre = new THREE.Box3().setFromPoints(v).getCenter(new THREE.Vector3());
    const wide = v.filter((p) => Math.abs(p.z - centre.z) > jarR + 0.025 || Math.abs(p.x - centre.x) > jarR + 0.025);
    expect(wide.length).toBe(0);
  });

  it('has two rods from the band round it up into the cross bar of the frame', () => {
    const v = vertices(m.vessel);
    const frame = new THREE.Box3().setFromObject(m.cooler, true);
    // the vertices of the rods: at the ears' distance from the axis, above the band
    const axis = new THREE.Box3().setFromPoints(v).getCenter(new THREE.Vector3());
    const rods = v.filter(
      (p) => Math.abs(Math.abs(p.z - axis.z) - (jarR + 0.014)) < 0.006 && Math.abs(p.x - axis.x) < 0.006,
    );
    expect(rods.length).toBeGreaterThan(8);
    const top = Math.max(...rods.map((p) => p.y));
    // the top of the rods is inside the cooler's box, in the bar under the lower box, and its bottom hangs lower, at the band
    expect(top).toBeLessThan(frame.min.y + 0.05 + 0.001);
    expect(top).toBeGreaterThan(frame.min.y);
    expect(Math.min(...rods.map((p) => p.y))).toBeLessThan(top - 0.05);
  });
});
