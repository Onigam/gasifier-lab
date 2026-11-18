import * as THREE from 'three';
import type { PartRegistry, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { GasifierSim } from '../sim/engine';
import type { GasParams, GasState } from '../sim/types';

// Helpers of the 3D tests: view options, simulation states, the real box of a part, draw statistics.

export const view = (patch: Partial<ViewOpts> = {}): ViewOpts => ({
  slowMo: 1,
  cutaway: false,
  schematic: false,
  time: 1,
  ...patch,
});

/** A state of the simulation at an hour of its settled day; `params` edits the simulation first, `over` overrides fields of the state. */
export function stateWith(over: Partial<GasState> = {}, params: Partial<GasParams> = {}, steps = 30): GasState {
  const sim = new GasifierSim();
  sim.set(params);
  for (let i = 0; i < steps; i++) sim.step(0.5);
  return { ...sim.state, ...over };
}

/** The box of every visible mesh under `root` flagged in by `keep`. Caps count only if shown. */
export function meshBox(root: THREE.Object3D, skip: (m: THREE.Mesh) => boolean = () => false): THREE.Box3 {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || skip(m) || m.userData.cap) return;
    let visible = true;
    for (let p: THREE.Object3D | null = m; p; p = p.parent) if (!p.visible) visible = false;
    if (!visible) return;
    tmp.setFromObject(m, true);
    box.union(tmp);
  });
  return box;
}

export const sceneBoxes = (mod: SceneModule<GasState>): Map<string, THREE.Box3> => {
  mod.scene.updateMatrixWorld(true);
  const out = new Map<string, THREE.Box3>();
  for (const id of mod.registry.ids()) out.set(id, meshBox(mod.registry.get(id)!.object));
  return out;
};

export const touches = (a: THREE.Box3, b: THREE.Box3, tol: number): boolean =>
  a.clone().expandByScalar(tol).intersectsBox(b);

/** Parts whose box touches no other part's box (nor any extra support box) within `tol`. */
export function floating(boxes: Map<string, THREE.Box3>, tol: number, supports: THREE.Box3[] = []): string[] {
  const bad: string[] = [];
  for (const [id, box] of boxes) {
    const other = [...boxes].some(([oid, ob]) => oid !== id && touches(box, ob, tol));
    if (!other && !supports.some((s) => touches(box, s, tol))) bad.push(id);
  }
  return bad;
}

/** True when every object of the tree has finite transforms and finite vertices. */
export function finiteTree(root: THREE.Object3D): boolean {
  let ok = true;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const v = [
      o.position.x,
      o.position.y,
      o.position.z,
      o.rotation.x,
      o.rotation.y,
      o.rotation.z,
      o.scale.x,
      o.scale.y,
      o.scale.z,
    ];
    if (!v.every(Number.isFinite)) ok = false;
    const m = (o as THREE.Mesh).geometry?.attributes?.position;
    if (m) for (let i = 0; i < m.array.length; i++) if (!Number.isFinite(m.array[i])) ok = false;
  });
  return ok;
}

export function isolateOne(reg: PartRegistry, id: string, mode: 'hidden' | 'ghost'): void {
  for (const other of reg.ids()) reg.setDisplay(other, other === id ? 'solid' : mode);
}

/** Draw calls (visible meshes, each instanced mesh once) and triangles (instances counted) of a scene, as the colour pass would issue them. */
export function drawStats(root: THREE.Object3D): { calls: number; triangles: number } {
  let calls = 0;
  let triangles = 0;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh && !(o as THREE.Points).isPoints) return;
    let visible = true;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) visible = false;
    if (!visible) return;
    const g = m.geometry;
    const n =
      (g.drawRange.count === Infinity ? (g.index ? g.index.count : g.attributes.position.count) : g.drawRange.count) /
      3;
    const ig = g as THREE.InstancedBufferGeometry;
    const inst = (m as THREE.InstancedMesh).isInstancedMesh
      ? (m as THREE.InstancedMesh).count
      : ig.isInstancedBufferGeometry
        ? ig.instanceCount
        : 1;
    calls++;
    if (m.isMesh) triangles += n * inst;
  });
  return { calls, triangles };
}

/** Every world built with its default options, once per test file. */
export function worldsOf<T>(make: () => T): () => T {
  let built: T | null = null;
  return () => (built ??= make());
}

/**
 * How much of the picture a near surface fills, for an eye at `eye` looking at `at` (a lens of 35 degrees, 16:9): the share of 45 rays through the frame whose first hit, among the opaque meshes that are drawn for that eye (the world's own `onBeforeRender` is run first: walls that step
 * aside are aside), is nearer than `near` metres, and the name of what most of them hit. A flight that passes through a slab or a casting shows as a frame where this is most of the picture.
 */
export function nearShare(
  scene: THREE.Scene,
  eye: THREE.Vector3,
  at: THREE.Vector3,
  near: number,
): { share: number; name: string } {
  const cam = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 5000);
  cam.position.copy(eye);
  cam.lookAt(at);
  cam.updateMatrixWorld(true);
  scene.onBeforeRender(null as never, scene, cam, null as never, null as never, null as never);
  const meshes: THREE.Mesh[] = [];
  const c = new THREE.Vector3();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh) return;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return;
    const mat = m.material as THREE.Material;
    if (Array.isArray(mat) || mat.transparent) return;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    const bs = m.geometry.boundingSphere!;
    if (
      c.copy(bs.center).applyMatrix4(m.matrixWorld).distanceTo(eye) - bs.radius * m.matrixWorld.getMaxScaleOnAxis() >
      near
    )
      return;
    meshes.push(m);
  });
  const ray = new THREE.Raycaster();
  ray.far = near;
  const by = new Map<string, number>();
  let hits = 0;
  for (let j = 0; j < 5; j++)
    for (let i = 0; i < 9; i++) {
      ray.setFromCamera(new THREE.Vector2(-0.9 + (1.8 * i) / 8, -0.9 + (1.8 * j) / 4), cam);
      const hit = ray.intersectObjects(meshes, false)[0];
      if (!hit) continue;
      hits++;
      let name = hit.object.name;
      for (let p: THREE.Object3D | null = hit.object; p && !name; p = p.parent) name = p.name;
      by.set(name, (by.get(name) ?? 0) + 1);
    }
  let best = '';
  let n = 0;
  for (const [k, v] of by)
    if (v > n) {
      best = k;
      n = v;
    }
  return { share: hits / 45, name: best };
}
