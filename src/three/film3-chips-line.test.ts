import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { COLUMN } from './dims';
import { chipBlank, chipPoint } from './unit/chips';
import { buildUnit } from './unit/unit';
import { HOME_WIDE, createGasTrainScene } from './gastrain/scene';
import { arrowHead } from './gastrain/sankey';
import { meshBox, stateWith, view } from './test-utils';

// Film round 3, item 4 (docs/qa.md, « Film round 2: the scoped review »): the chips are chips of wood; the gas line's home view is the line.
describe('the chips are chips of wood (docs/qa.md, film round 2: « still rectangles »)', () => {
  const size = { length: COLUMN.chipLength, width: COLUMN.chipWidth, thick: COLUMN.chipThick };
  const blank = chipBlank(size.length, size.width, size.thick);
  const pos = blank.attributes.position as THREE.BufferAttribute;
  const seeds = (k: number): [number, number, number, number] => {
    const f = (x: number): number => x - Math.floor(x);
    return [f(k * 0.6180339), f(k * 0.7548777 + 0.1), f(k * 0.5698403 + 0.3), f(k * 0.4142135 + 0.7)];
  };

  it('the blank is a plate of the reported size, and a shaped chip lies inside it (a bow of a few tenths of a millimetre apart)', () => {
    const b = new THREE.Box3().setFromBufferAttribute(pos);
    const s = b.getSize(new THREE.Vector3());
    expect(s.x).toBeCloseTo(size.length, 6);
    expect(s.y).toBeCloseTo(size.width, 6);
    expect(s.z).toBeCloseTo(size.thick, 6);
    for (let k = 1; k <= 200; k++)
      for (let i = 0; i < pos.count; i++) {
        const p = chipPoint([pos.getX(i), pos.getY(i), pos.getZ(i)], seeds(k), size);
        expect(Math.abs(p[0])).toBeLessThanOrEqual(size.length / 2 + 1e-9);
        expect(Math.abs(p[1])).toBeLessThanOrEqual(size.width / 2 + 1e-9);
        expect(Math.abs(p[2])).toBeLessThanOrEqual(size.thick / 2 + 0.0005);
      }
  });

  it('no chip is a rectangle and no two are the same: slanted ends, one ragged, edges that are not parallel, a thick end and a feathered one', () => {
    const outlines = new Set<string>();
    let slanted = 0;
    let wedge = 0;
    let taper = 0;
    for (let k = 1; k <= 200; k++) {
      const r = seeds(k);
      const at = (x: number, y: number, z: number): [number, number, number] => chipPoint([x, y, z], r, size);
      const hl = size.length / 2;
      const hw = size.width / 2;
      const ht = size.thick / 2;
      const c = [at(hl, hw, ht), at(hl, -hw, ht), at(-hl, hw, ht), at(-hl, -hw, ht)];
      outlines.add(c.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(' '));
      // an end is slanted when its two corners are not at the same x
      if (Math.abs(c[0]![0] - c[1]![0]) > 0.0008) slanted++;
      // the two ends are not as wide, or not as thick
      if (Math.abs(c[0]![1] - c[1]![1] - (c[2]![1] - c[3]![1])) > 0.0012) taper++;
      if (Math.abs(Math.abs(c[0]![2]) - Math.abs(c[2]![2])) > 0.0003) wedge++;
    }
    expect(outlines.size).toBe(200);
    expect(slanted).toBeGreaterThan(150);
    expect(taper).toBeGreaterThan(100);
    expect(wedge).toBeGreaterThan(100);
  });

  it('every bed of the section and the loose chips on the column are made of them: the blank, four numbers a piece, lit by their own faces, of sizes that differ by half and more', () => {
    const u = buildUnit({ cut: true });
    const layers: THREE.InstancedMesh[] = [];
    u.root.traverse((o) => {
      if (o.name === 'bed-chips' || o.name === 'loose-chips') layers.push(o as THREE.InstancedMesh);
    });
    expect(layers.length).toBe(6);
    const m = new THREE.Matrix4();
    const sc = new THREE.Vector3();
    for (const l of layers) {
      const a = l.geometry.getAttribute('aChip') as THREE.InstancedBufferAttribute;
      expect(a, l.name).toBeTruthy();
      expect(a.itemSize).toBe(4);
      expect(a.count).toBeGreaterThanOrEqual(l.count);
      expect((l.material as THREE.MeshStandardMaterial).flatShading).toBe(true);
      expect(l.geometry.attributes.position!.count).toBe(pos.count);
      let lo = Infinity;
      let hi = 0;
      for (let i = 0; i < l.count; i++) {
        l.getMatrixAt(i, m);
        sc.setFromMatrixScale(m);
        lo = Math.min(lo, sc.x);
        hi = Math.max(hi, sc.x);
      }
      expect(hi / lo, l.name).toBeGreaterThan(1.5);
    }
  });
});

describe('the gas line’s home view is the line (docs/qa.md, film round 2: « tiny line, faint Sankey »)', () => {
  const train = createGasTrainScene();
  train.update(stateWith(), 1 / 60, view());
  train.scene.updateMatrixWorld(true);

  it('at home in a wide view the kit’s camera holds every piece of the line and the ribbons before it, and the box of the line’s pieces takes over two thirds of the picture’s width and three fifths of its height; a tall view is given the line’s own box', () => {
    const all = new THREE.Box3();
    for (const id of train.registry.ids()) all.union(meshBox(train.registry.get(id)!.object));
    const sankey = new THREE.Box3().setFromObject(train.scene.getObjectByName('sankey')!);
    // the kit's pose: the union of the parts' boxes and the overview's, its sphere at the world's padding, along the home's direction
    const pose = (aspect: number): THREE.PerspectiveCamera => {
      const cam = new THREE.PerspectiveCamera(35, aspect, 0.05, 5000);
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
      return cam;
    };
    const cam = pose(16 / 9);
    expect(cam.position.distanceTo(HOME_WIDE.eye)).toBeLessThan(0.05);
    const span = (b: THREE.Box3): { x0: number; x1: number; y0: number; y1: number } => {
      const o = { x0: 9, x1: -9, y0: 9, y1: -9 };
      for (const x of [b.min.x, b.max.x])
        for (const y of [b.min.y, b.max.y])
          for (const z of [b.min.z, b.max.z]) {
            const q = new THREE.Vector3(x, y, z).project(cam);
            o.x0 = Math.min(o.x0, q.x);
            o.x1 = Math.max(o.x1, q.x);
            o.y0 = Math.min(o.y0, q.y);
            o.y1 = Math.max(o.y1, q.y);
          }
      return o;
    };
    for (const b of [all, sankey]) {
      const s = span(b);
      expect(s.x0).toBeGreaterThan(-0.97);
      expect(s.x1).toBeLessThan(0.97);
      expect(s.y0).toBeGreaterThan(-0.97);
      expect(s.y1).toBeLessThan(0.97);
    }
    const line = span(all);
    // (the box of the line's parts on the screen: the pieces themselves take a little less)
    expect((line.x1 - line.x0) / 2).toBeGreaterThan(0.68);
    expect((line.y1 - line.y0) / 2).toBeGreaterThan(0.6);
    // from the front, a little from the unit's end, 20 to 26 degrees up
    const dir = train.home.position.clone().sub(train.home.target).normalize();
    const el = (Math.asin(dir.y) * 180) / Math.PI;
    expect(el).toBeGreaterThan(20);
    expect(el).toBeLessThan(26);
    expect(dir.z).toBeLessThan(-0.8);
    expect(dir.x).toBeLessThan(-0.1);
    // a view taller than wide: the box of the line and its ribbons, no more
    pose(0.6);
    const tall = new THREE.Box3();
    for (const p of train.registry.parts.values()) tall.union(train.registry.bounds(p.id));
    expect(tall.clone().expandByScalar(0.02).containsBox(all)).toBe(true);
    expect(tall.clone().expandByScalar(0.02).containsBox(sankey)).toBe(true);
    expect(tall.getSize(new THREE.Vector3()).x).toBeLessThan(all.union(sankey).getSize(new THREE.Vector3()).x + 1.6);
    pose(16 / 9);
  });

  it('the three ribbons that end (the gasifier’s losses, the shaft’s work, the engine’s losses) end in an arrow’s head, wider than the ribbon and pointing the way it flows', () => {
    const sankey = train.scene.getObjectByName('sankey')!;
    let heads = 0;
    for (const c of sankey.children) {
      const g = (c as THREE.Mesh).geometry;
      if (!g?.attributes.position) continue;
      const p = g.attributes.position as THREE.BufferAttribute;
      if (p.count % 2 === 0) continue;
      heads++;
      // the last three points: the head's two barbs and its tip
      const tip = new THREE.Vector3().fromBufferAttribute(p, p.count - 1);
      const a = new THREE.Vector3().fromBufferAttribute(p, p.count - 3);
      const b = new THREE.Vector3().fromBufferAttribute(p, p.count - 2);
      const endA = new THREE.Vector3().fromBufferAttribute(p, p.count - 5);
      const endB = new THREE.Vector3().fromBufferAttribute(p, p.count - 4);
      const w = Math.abs(endB.z - endA.z);
      expect(Math.abs(b.z - a.z)).toBeGreaterThan(w * 1.3);
      expect(tip.x - a.x).toBeCloseTo(arrowHead(w), 5);
      expect(tip.x).toBeGreaterThan(endA.x + 0.15);
      expect(tip.z).toBeCloseTo((a.z + b.z) / 2, 5);
    }
    expect(heads).toBe(3);
  });
});
