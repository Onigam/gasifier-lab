import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createFarmScene } from './farm/scene';
import { SPRUCE_COARSE_FROM, spruceCoarse, spruceGeometry } from './farm/trees';

// The farm's spruces (docs/qa.md D16): beyond a distance from the eye each is drawn with a coarse model of the same height and reach, nearer with its boughs; the shadow pass, which has no eye, changes nothing.

const farm = createFarmScene();
const trees = farm.scene.getObjectByName('trees')!;
const fine = trees.getObjectByName('spruce-crowns') as THREE.InstancedMesh;
const far = trees.getObjectByName('spruce-crowns-coarse') as THREE.InstancedMesh;
const total = fine.count;
const draw = (cam: THREE.Camera): void =>
  fine.onBeforeRender(null as never, null as never, cam, null as never, null as never, null as never);

const eye = (x: number, y: number, z: number): THREE.PerspectiveCamera => {
  const c = new THREE.PerspectiveCamera();
  c.position.set(x, y, z);
  return c;
};
const feet = (): THREE.Vector3[] => {
  const m = new THREE.Matrix4();
  const out: THREE.Vector3[] = [];
  const trunks = trees.getObjectByName('spruce-trunks') as THREE.InstancedMesh;
  for (let i = 0; i < trunks.count; i++) {
    trunks.getMatrixAt(i, m);
    out.push(new THREE.Vector3().setFromMatrixPosition(m));
  }
  return out;
};
/** Which mesh draws the spruce that stands at `foot` (the trunk's place, a few centimetres under the crown's). */
const where = (foot: THREE.Vector3): 'fine' | 'coarse' | 'none' => {
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  for (const [name, mesh] of [
    ['fine', fine],
    ['coarse', far],
  ] as const)
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m);
      if (p.setFromMatrixPosition(m).distanceTo(foot) < 0.2) return name;
    }
  return 'none';
};

describe('the spruces by distance (D16)', () => {
  it('the coarse model stands as tall and as wide as the one with boughs', () => {
    const a = new THREE.Box3().setFromBufferAttribute(
      spruceGeometry(15, 7, 21).attributes.position as THREE.BufferAttribute,
    );
    const b = new THREE.Box3().setFromBufferAttribute(spruceCoarse().attributes.position as THREE.BufferAttribute);
    const sa = a.getSize(new THREE.Vector3());
    const sb = b.getSize(new THREE.Vector3());
    expect(Math.abs(sb.y - sa.y)).toBeLessThan(0.03);
    expect(Math.abs(sb.x - sa.x) / sa.x).toBeLessThan(0.2);
    expect(Math.abs(sb.z - sa.z) / sa.z).toBeLessThan(0.2);
    expect(spruceCoarse().index!.count).toBeLessThan(spruceGeometry(15, 7, 21).index!.count);
  });

  it('every spruce is drawn once, by its distance to the eye', () => {
    expect(far.count).toBe(0);
    // from far away they are all coarse
    draw(eye(0, 60, 220));
    expect(fine.count).toBe(0);
    expect(far.count).toBe(total);
    // an eye close to one tree: that tree is drawn with its boughs, the trees far from it coarse
    const f = feet();
    const eyeAt = new THREE.Vector3(f[0]!.x, f[0]!.y + 2, f[0]!.z + 3);
    draw(eye(eyeAt.x, eyeAt.y, eyeAt.z));
    expect(fine.count + far.count).toBe(total);
    expect(where(f[0]!)).toBe('fine');
    for (const foot of f) {
      const d = foot.distanceTo(eyeAt);
      if (d < SPRUCE_COARSE_FROM * 0.85) expect(where(foot), `at ${d.toFixed(0)} m`).toBe('fine');
      if (d > SPRUCE_COARSE_FROM * 1.15) expect(where(foot), `at ${d.toFixed(0)} m`).toBe('coarse');
    }
  });

  it('a tree does not flip back and forth at the limit, and the shadow pass leaves the choice as it is', () => {
    const foot = feet()[0]!;
    const at = (d: number): THREE.PerspectiveCamera => eye(foot.x, foot.y, foot.z + d);
    draw(at(SPRUCE_COARSE_FROM * 0.5));
    expect(where(foot)).toBe('fine');
    // just past the limit it is still drawn as it was; well past it, coarse; and back just inside, still coarse
    draw(at(SPRUCE_COARSE_FROM * 1.05));
    expect(where(foot)).toBe('fine');
    draw(at(SPRUCE_COARSE_FROM * 1.4));
    expect(where(foot)).toBe('coarse');
    draw(at(SPRUCE_COARSE_FROM * 0.95));
    expect(where(foot)).toBe('coarse');
    const settled = [fine.count, far.count];
    const light = new THREE.OrthographicCamera();
    light.position.set(0, 100, 0);
    draw(light);
    expect([fine.count, far.count]).toEqual(settled);
  });
});
