import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import en from '../../narration/en.json';
import fr from '../../narration/fr.json';
import { createFarmScene } from './farm/scene';
import { createGarageScene } from './garage/scene';
import { createGasifierScene } from './gasifier/scene';
import { createGasTrainScene } from './gastrain/scene';
import { createTractorScene } from './tractor/scene';
import { WORLD } from './index';
import type { WorldId } from './part-ids';
import { nearShare, stateWith, view } from './test-utils';
import type { GasState } from '../sim/types';

// Film round 4, item 1 (docs/qa.md, « Film round 3: the scoped review », B1): every `[[frame:…]]` and `[[home]]` cue of the spoken guide, in every world and both languages, frames what it names with nothing near standing in front of it; the farm's « Flux » arcs
// never run through a building.

type Cue = { world: WorldId; id: string; xray: boolean };

/** Every frame and home cue of both guides, with the world it is played in and whether X-ray is on at that moment. */
function cues(): Cue[] {
  const out = new Map<string, Cue>();
  for (const doc of [en, fr] as { segments: { scene?: string; text: string }[] }[]) {
    for (const seg of doc.segments) {
      let world = (seg.scene ?? 'farm') as WorldId;
      let xray = false;
      for (const m of seg.text.matchAll(/\[\[(scene|frame|home|xray)(?::([^\]]*))?\]\]/g)) {
        const [, kind, arg] = m;
        if (kind === 'scene') world = arg as WorldId;
        else if (kind === 'xray') xray = arg === 'on';
        else {
          const id = kind === 'home' ? 'home' : arg!;
          out.set(`${world}/${id}/${xray}`, { world, id, xray });
        }
      }
    }
  }
  return [...out.values()];
}

const MAKERS: Record<WorldId, () => SceneModule<GasState>> = {
  farm: () => createFarmScene(),
  tractor: () => createTractorScene(),
  gasifier: () => createGasifierScene(),
  'gas-train': () => createGasTrainScene(),
  garage: () => createGarageScene(),
};
const built = new Map<WorldId, SceneModule<GasState>>();
const world = (w: WorldId): SceneModule<GasState> => {
  let m = built.get(w);
  if (!m) {
    m = MAKERS[w]();
    m.update(stateWith(), 1 / 60, view({ time: 1 }));
    m.scene.updateMatrixWorld(true);
    built.set(w, m);
  }
  return m;
};

/** The kit's camera for a guide's frame cue (`Stage.frameParts` with the guide's padding, `Narration.framePadding`), on a 40-degree lens, fitted in the narrower of its two fields. */
export function guidePose(
  w: WorldId,
  mod: SceneModule<GasState>,
  id: string,
  aspect: number,
): { eye: THREE.Vector3; at: THREE.Vector3 } {
  const v = (40 * Math.PI) / 180;
  const fit = Math.min(v, 2 * Math.atan(Math.tan(v / 2) * aspect));
  if (id === 'home') return { eye: mod.home.position.clone(), at: mod.home.target.clone() };
  const box = mod.registry.frameBounds(id);
  const at = box.getCenter(new THREE.Vector3());
  const r = box.getBoundingSphere(new THREE.Sphere()).radius;
  const padding = Math.min(WORLD[w].partPadding, 1.9);
  const dir = (mod.registry.get(id)?.viewDir ?? mod.home.position.clone().sub(mod.home.target)).clone().normalize();
  const d = Math.min(mod.maxDistance, Math.max(mod.minDistance, (r * padding) / Math.sin(fit / 2)));
  return { eye: at.clone().addScaledVector(dir, d), at };
}

/** The share of the named part's points (up to 120 of its vertices inside its framing box) that a near opaque mesh of something else hides from `eye`. */
export function hiddenShare(
  mod: SceneModule<GasState>,
  id: string,
  eye: THREE.Vector3,
  at: THREE.Vector3,
  aspect: number,
  skipShells: (partId: string) => boolean = () => false,
): { share: number; by: string } {
  const cam = new THREE.PerspectiveCamera(40, aspect, 0.05, 5000);
  cam.position.copy(eye);
  cam.lookAt(at);
  cam.updateMatrixWorld(true);
  mod.scene.onBeforeRender(null as never, mod.scene, cam, null as never, null as never, null as never);
  mod.scene.updateMatrixWorld(true);
  // which part each object is in (the deepest registered one)
  const owner = new Map<THREE.Object3D, string>();
  const reg = mod.registry;
  const depth = (o: THREE.Object3D): number => {
    let n = 0;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) n++;
    return n;
  };
  const parts = [...reg.parts.values()].sort((a, b) => depth(a.object) - depth(b.object));
  for (const p of parts) p.object.traverse((o) => owner.set(o, p.id));
  const shown = (o: THREE.Object3D): boolean => {
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  };
  const opaque = (m: THREE.Mesh): boolean => {
    const mat = m.material as THREE.Material;
    return !Array.isArray(mat) && !mat.transparent && mat.visible !== false && mat.colorWrite !== false;
  };
  const target = reg.get(id)!;
  const box = reg.frameBounds(id).expandByScalar(0.02);
  const pts: THREE.Vector3[] = [];
  target.object.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || !shown(m) || !opaque(m)) return;
    if (owner.get(m) !== id) return;
    const pos = m.geometry.attributes.position as THREE.BufferAttribute;
    const step = Math.max(1, Math.floor(pos.count / 60));
    for (let i = 0; i < pos.count; i += step) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      if (box.containsPoint(v)) pts.push(v);
    }
  });
  // a part drawn only in sprites or glass (the gas): points through its box
  if (!pts.length)
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 4; k++)
          pts.push(
            new THREE.Vector3(
              THREE.MathUtils.lerp(box.min.x, box.max.x, (i + 0.5) / 4),
              THREE.MathUtils.lerp(box.min.y, box.max.y, (j + 0.5) / 4),
              THREE.MathUtils.lerp(box.min.z, box.max.z, (k + 0.5) / 4),
            ),
          );
  // a wall is what stands outside the framed box: the parts that sit on the one named (the unit on the chassis) are inside it and are the picture
  const room = box.clone().expandByVector(box.getSize(new THREE.Vector3()).multiplyScalar(0.1));
  const sample = pts.length > 120 ? pts.filter((_, i) => i % Math.ceil(pts.length / 120) === 0) : pts;
  // in the picture only
  const ndc = new THREE.Vector3();
  const inView = sample.filter((p) => {
    ndc.copy(p).project(cam);
    return Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && ndc.z < 1;
  });
  const meshes: THREE.Object3D[] = [];
  mod.scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || !shown(m) || !opaque(m)) return;
    const own = owner.get(m);
    if (own && skipShells(own)) return;
    meshes.push(m);
  });
  const ray = new THREE.Raycaster();
  const dir = new THREE.Vector3();
  const by = new Map<string, number>();
  let hidden = 0;
  for (const p of inView) {
    const dist = dir.subVectors(p, eye).length();
    dir.normalize();
    ray.set(eye, dir);
    ray.far = dist - 0.03;
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) continue;
    const own = owner.get(hit.object);
    if (own === id || room.containsPoint(hit.point)) continue;
    hidden++;
    let name = hit.object.name;
    for (let q: THREE.Object3D | null = hit.object; q && !name; q = q.parent) name = q.name;
    const k = `${own ?? 'scenery'}:${name}`;
    by.set(k, (by.get(k) ?? 0) + 1);
  }
  const worst = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    share: inView.length ? hidden / inView.length : 1,
    by: worst ? `${worst[0]} ×${worst[1]} of ${inView.length}` : '',
  };
}

describe('the spoken guide’s frames are free: what a cue names is not behind a near wall (docs/qa.md, film round 3, B1)', () => {
  const all = cues();

  it('the guide has frame cues in all five worlds', () => {
    const worlds = new Set(all.map((c) => c.world));
    expect(worlds.size).toBe(5);
    expect(all.filter((c) => c.id !== 'home').length).toBeGreaterThan(25);
  });

  for (const aspect of [16 / 9, 390 / 844])
    for (const c of all) {
      it(`${c.world}: [[${c.id === 'home' ? 'home' : `frame:${c.id}`}]]${c.xray ? ' with X-ray' : ''} at ${aspect > 1 ? '16:9' : '390 × 844'}`, () => {
        const mod = world(c.world);
        const pose = guidePose(c.world, mod, c.id, aspect);
        if (c.id === 'home') {
          // the home looks at its world: no surface at under a third of the way fills a third of the picture
          const s = nearShare(mod.scene, pose.eye, pose.at, 0.33 * pose.eye.distanceTo(pose.at));
          expect(s.share, s.name).toBeLessThan(1 / 3);
          return;
        }
        const def = WORLD[c.world] as { xrayShell?: (id: string) => boolean };
        const shells = c.xray && def.xrayShell ? (p: string) => p !== c.id && def.xrayShell!(p) : undefined;
        const h = hiddenShare(mod, c.id, pose.eye, pose.at, aspect, shells);
        expect(h.share, h.by).toBeLessThanOrEqual(1 / 3);
      });
    }
});

describe('the farm’s « Flux » arcs never run through a building (docs/qa.md, film round 3, B1)', () => {
  it('at forty places of the tractor on its rounds, no stretch of any arc crosses the house, the garage or the barn', () => {
    const farm = createFarmScene();
    const st = stateWith({ engineOn: true });
    const buildings = ['farmhouse', 'farm-garage', 'chip-barn'].map((id) => farm.registry.get(id)!.object);
    const meshes: THREE.Object3D[] = [];
    for (const b of buildings)
      b.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes.push(o);
      });
    const ray = new THREE.Raycaster();
    const d = new THREE.Vector3();
    const step = 120 / 40 / Math.max(0.1, st.groundSpeedMs);
    let checked = 0;
    for (let k = 0; k < 40; k++) {
      farm.update(st, k === 0 ? 1 / 60 : step, view({ schematic: true, time: 1 + k }));
      farm.scene.updateMatrixWorld(true);
      let flows: { live: { points: THREE.Vector3[] }[] } | undefined;
      farm.scene.traverse((o) => (flows ??= o.userData.flows));
      if (!flows) throw new Error('no « Flux » paths in the farm');
      for (const [n, l] of flows.live.entries())
        for (let i = 0; i + 1 < l.points.length; i++) {
          const a = l.points[i]!;
          const b = l.points[i + 1]!;
          const len = d.subVectors(b, a).length();
          ray.set(a, d.normalize());
          ray.far = len;
          // an arc that ends in a building (the chips into the barn, on its heap, through the open door) may meet what it ends on
          const end = l.points[l.points.length - 1]!;
          const hit = ray.intersectObjects(meshes, true).find((h) => h.point.distanceTo(end) > 2.5);
          let who = '';
          for (let o: THREE.Object3D | null = hit?.object ?? null; o && !who; o = o.parent)
            who = o.userData.partId ?? '';
          checked++;
          expect(
            hit,
            `arc ${n}, stretch ${i}, tractor place ${k}: through ${who} (${hit?.object.name}) at ${hit?.point.toArray().map((v) => v.toFixed(1))}`,
          ).toBeUndefined();
        }
    }
    expect(checked).toBeGreaterThan(300);
  });
});
