import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildUnit } from './unit/unit';

// What the browser review found in the section and what holds it now (docs/qa.md D4): a nozzle is cut along its axis, and the hot parts' cut faces are hot metal, not the pale face of the casing's walls.

describe('a nozzle is cut along its axis in the section (D4)', () => {
  it('one nozzle lies in the plane of the cut and shows its walls and its bore; the whole unit keeps all of them', () => {
    const cutUnit = buildUnit({ cut: true });
    const whole = buildUnit({ cut: false });
    // the nozzles are on a ring; exactly one of them is on the plane z = 0
    const inPlane = cutUnit.nozzles.filter((n) => Math.abs(n.tip.z) < 1e-6);
    expect(inPlane.length).toBe(1);
    // its cut: a face in the plane of the section, dark steel that takes the fire's glow, in front of the bed's cap
    const nozzles = cutUnit.parts.get('air-nozzles')!;
    nozzles.updateWorldMatrix(true, true);
    const caps: THREE.Mesh[] = [];
    nozzles.traverse((o) => {
      const mm = o as THREE.Mesh;
      if (mm.isMesh && Math.abs(new THREE.Box3().setFromObject(mm, true).getSize(new THREE.Vector3()).z) < 1e-3)
        caps.push(mm);
    });
    expect(caps.length).toBeGreaterThanOrEqual(1);
    // the nozzle's cut stands a hair (under 2 mm) in front of the bed's, which is drawn at the same plane; nothing else of the nozzles is in front of the cut
    const zmin = new THREE.Box3().setFromObject(nozzles, true).min.z;
    expect(zmin).toBeLessThan(-0.0005);
    expect(zmin).toBeGreaterThan(-0.002);
    // the whole unit has its seven, on both sides
    expect(whole.nozzles.length).toBe(cutUnit.nozzles.length);
    expect(whole.nozzles.some((n) => n.tip.z < -0.01)).toBe(true);
  });

  it('the hot parts’ cut faces are of hot metal, which takes the fire’s glow, and not the pale face of the casing walls', () => {
    const u = buildUnit({ cut: true });
    for (const id of ['throat-ring', 'fire-box', 'air-nozzles', 'grate'] as const) {
      const part = u.parts.get(id)!;
      part.updateWorldMatrix(true, true);
      const flat: THREE.Mesh[] = [];
      part.traverse((o) => {
        const mm = o as THREE.Mesh;
        if (mm.isMesh && new THREE.Box3().setFromObject(mm, true).getSize(new THREE.Vector3()).z < 1e-3) flat.push(mm);
      });
      expect(flat.length, `${id} has cut faces`).toBeGreaterThan(0);
      // (but for the dark bore of the nozzle that is cut open: no chips in a nozzle)
      for (const f of flat.filter((m) => (m.material as THREE.Material).name !== 'black-paint'))
        expect((f.material as THREE.Material).userData.noShare, `${id} cut face`).toBe(true);
    }
    // the casing's wall keeps the pale face of every section
    const wall = u.parts.get('outer-casing')!;
    const pale = (wall.children as THREE.Mesh[]).filter(
      (c) => c.isMesh && (c.material as THREE.Material).name === 'cut-metal',
    );
    expect(pale.length).toBeGreaterThan(0);
  });
});
