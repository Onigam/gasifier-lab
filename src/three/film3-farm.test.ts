import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createFarmScene, REEDS_FADE } from './farm/scene';
import { LIMB_REACH, SPRAY_REACH, crownReach, leafCard, leafyTree } from './farm/trees';
import { terrainHeight } from './farm/terrain';
import { drawStats, stateWith, view } from './test-utils';

// Film round 3, item 1 (docs/qa.md, « Film round 2: the scoped review », F1, M1, m5): the birch crowns seen from above (no card on a stick, no card's square), the belt of spruce that has depth, the rushes that go down into the bank with the distance, the farm's draw calls.

const farm = createFarmScene();
farm.scene.updateMatrixWorld(true);
describe('the leaf sprays are blobs, not squares (the rectangles over the birches seen from above)', () => {
  const cards = [
    leafCard(11, 0xa9c85a, 0x5f8a2c, 90, 128, 0.62, 0.075),
    leafCard(12, 0x6fa13d, 0x35601f, 80, 128, 0.7, 0.085),
    leafCard(13, 0x8cb749, 0x477a28, 80, 128, 0.62, 0.08),
    leafCard(14, 0x86b845, 0x3f7a26, 80, 128, 0.85, 0.09),
    leafCard(15, 0x6a8a48, 0x2f4d2b, 100, 128, 0.18, 0.1),
  ];

  it('at every level of its mip chain down to eight texels a card’s corners are clear: nothing of a spray lies beyond 0.6 of the card’s width from its middle, so that a card alone is never its own square', () => {
    for (const tex of cards) {
      const mips = tex.mipmaps as unknown as { data: Uint8Array; width: number }[];
      for (const m of mips) {
        if (m.width < 8) continue;
        const n = m.width;
        let corner = 0;
        let edge = 0;
        let all = 0;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            const a = m.data[(j * n + i) * 4 + 3]! / 255;
            all += a;
            if (Math.hypot((i + 0.5) / n - 0.5, (j + 0.5) / n - 0.5) > 0.6) corner += a;
            if (i === 0 || j === 0 || i === n - 1 || j === n - 1) edge += a;
          }
        expect(corner, `${n} texels`).toBe(0);
        // and the card's own border is all but clear (a leaf's tip may touch it): under a fiftieth of the leaves
        if (n >= 32) expect(edge / all, `${n} texels`).toBeLessThan(0.02);
      }
    }
    expect(SPRAY_REACH).toBeLessThan(0.45);
  });
});

describe('a birch seen from above, at 15, 25, 32, 40 and 55 degrees (docs/qa.md, film round 2, F1)', () => {
  for (const coarse of [false, true]) {
    const tree = leafyTree('birch', 1, coarse);
    const { c, rad, droop } = tree.shape!;
    const pos = tree.crown.attributes.position as THREE.BufferAttribute;
    // a spray is two crossed cards of four vertices each
    const sprays: THREE.Vector3[] = [];
    const sizes: number[] = [];
    for (let i = 0; i + 7 < pos.count; i += 8) {
      const m = new THREE.Vector3();
      const v = new THREE.Vector3();
      for (let k = 0; k < 8; k++) m.add(v.fromBufferAttribute(pos, i + k));
      sprays.push(m.multiplyScalar(1 / 8));
      sizes.push(new THREE.Vector3().fromBufferAttribute(pos, i).distanceTo(v.fromBufferAttribute(pos, i + 1)));
    }
    const name = coarse ? 'the coarse birch' : 'the birch';

    it(`${name}: every spray has its middle inside the crown, and no limb or twig ends outside it`, () => {
      expect(sprays.length).toBeGreaterThan(60);
      for (const s of sprays) expect(crownReach([s.x, s.y, s.z], c, rad, droop)).toBeLessThan(1.02);
      // the wood: above the crown's foot nothing of a limb stands out of the ellipsoid by more than its own thickness
      const wood = tree.trunk.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      let worst = 0;
      for (let i = 0; i < wood.count; i++) {
        v.fromBufferAttribute(wood, i);
        if (v.y < c[1]) continue;
        worst = Math.max(worst, crownReach([v.x, v.y, v.z], c, rad, droop));
      }
      expect(worst).toBeLessThan(LIMB_REACH + 0.12);
    });

    it(`${name}: from each of the five elevations and eight sides, no spray stands alone: each has three others within a card’s width of it on the picture`, () => {
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      const dir = new THREE.Vector3();
      for (const el of [15, 25, 32, 40, 55])
        for (let az = 0; az < 360; az += 45) {
          const e = (el * Math.PI) / 180;
          const a = (az * Math.PI) / 180;
          dir.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
          right.crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
          up.crossVectors(dir, right).normalize();
          const pts = sprays.map((s) => [s.dot(right), s.dot(up)] as const);
          let alone = 0;
          pts.forEach((p, i) => {
            let near = 0;
            for (let j = 0; j < pts.length && near < 3; j++)
              if (j !== i && Math.hypot(pts[j]![0] - p[0], pts[j]![1] - p[1]) < sizes[i]!) near++;
            if (near < 3) alone++;
          });
          expect(alone, `${el}° from ${az}°`).toBe(0);
        }
    });
  }
});

describe('the belt of spruce has depth, and the rushes go down with the distance (docs/qa.md, film round 2, M1)', () => {
  const trees = farm.scene.getObjectByName('trees')!;

  it('rows of spruce stand behind the first, one instanced mesh, each on the land, none casting a shadow, none in the yard', () => {
    const back = trees.getObjectByName('spruce-back') as THREE.InstancedMesh;
    expect(back).toBeTruthy();
    expect(back.count).toBeGreaterThan(150);
    expect(back.castShadow).toBe(false);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (let i = 0; i < back.count; i++) {
      back.getMatrixAt(i, m);
      p.setFromMatrixPosition(m);
      expect(Math.abs(p.y - terrainHeight(p.x, p.z))).toBeLessThan(0.1);
      // behind the first rows: north of the belt, or beyond it to the west and the east
      expect(p.z < -56 || p.x < -83 || p.x > 97, `${p.x.toFixed(0)}, ${p.z.toFixed(0)}`).toBe(true);
    }
  });

  it('a rush is never drawn thinner than about two pixels and is gone into the bank between two distances from the eye', () => {
    const reeds: THREE.InstancedMesh[] = [];
    farm.scene.traverse((o) => {
      if (o.name === 'reeds') reeds.push(o as THREE.InstancedMesh);
    });
    expect(reeds.length).toBe(3);
    expect(REEDS_FADE[0]).toBeGreaterThan(20);
    expect(REEDS_FADE[1]).toBeGreaterThan(REEDS_FADE[0] + 15);
    for (const r of reeds) {
      const shader = {
        uniforms: {} as Record<string, { value: unknown }>,
        vertexShader: THREE.ShaderLib.standard.vertexShader,
        fragmentShader: THREE.ShaderLib.standard.fragmentShader,
      };
      (r.material as THREE.Material).onBeforeCompile(shader as never, null as never);
      expect(shader.uniforms.uReedFade).toBeTruthy();
      expect(shader.vertexShader).toContain('smoothstep( uReedFade.x, uReedFade.y, reedD )');
      expect(r.castShadow).toBe(false);
    }
  });
});

describe('the farm’s draw calls (docs/qa.md, film round 2, m5: it stood at 495 of 500)', () => {
  it('the colour pass of the farm is at most 450 calls: the garage, which no wall of steps aside here, is one mesh a material, the house’s panes are one mesh, and two maps that are the same picture laid the same way are one material to the merge', () => {
    farm.update(stateWith(), 1 / 60, view());
    const s = drawStats(farm.scene);
    expect(s.calls, `${s.calls} calls`).toBeLessThanOrEqual(450);
    // the garage of the farm: its shell and its room above, the door's two leaves and the lamp apart
    const garage = farm.scene.getObjectByName('farm-garage')!;
    expect(drawStats(garage).calls).toBeLessThan(45);
    // the house's panes: one mesh
    const house = farm.scene.getObjectByName('farmhouse')!;
    let panes = 0;
    house.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.material as THREE.Material).transparent) panes++;
    });
    expect(panes).toBe(1);
  });
});
