import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createFarmScene } from './farm/scene';

// Film round 4, items 7 and 9 (docs/qa.md, « Film round 3: the scoped review », item 7, m6): the spruces of the belt are not one cone repeated, and no two broad-leaved crowns of the garden stand in one another.

const farm = createFarmScene();
farm.scene.updateMatrixWorld(true);
const trees = farm.scene.getObjectByName('trees')!;
const at = (name: string): { p: THREE.Vector3; s: THREE.Vector3 }[] => {
  const im = trees.getObjectByName(name) as THREE.InstancedMesh | undefined;
  if (!im) return [];
  const m = new THREE.Matrix4();
  const out: { p: THREE.Vector3; s: THREE.Vector3 }[] = [];
  for (let i = 0; i < im.count; i++) {
    im.getMatrixAt(i, m);
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    m.decompose(p, new THREE.Quaternion(), s);
    out.push({ p, s });
  }
  return out;
};

describe('the belt’s spruces and the garden’s crowns (docs/qa.md, film round 3, item 7 and m6)', () => {
  it('the spruces of the first rows differ in height (a spread over 0.13 of their mean), and in taper', () => {
    const sp = at('spruce-crowns');
    expect(sp.length).toBeGreaterThan(40);
    const h = sp.map((t) => t.s.y);
    const mean = h.reduce((a, b) => a + b, 0) / h.length;
    const sd = Math.sqrt(h.reduce((a, b) => a + (b - mean) ** 2, 0) / h.length);
    expect(sd / mean).toBeGreaterThan(0.13);
    const taper = sp.map((t) => t.s.x / t.s.y);
    expect(Math.max(...taper) - Math.min(...taper)).toBeGreaterThan(0.3);
  });

  it('no two birches, oaks or lindens stand within 4.4 m of each other (the apple row is an orchard, planted at 4 m)', () => {
    const all = ['birch-crowns', 'oak-crowns', 'linden-crowns'].flatMap((n) => at(n).map((t) => t.p));
    expect(all.length).toBeGreaterThan(12);
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++)
        expect(Math.hypot(all[i]!.x - all[j]!.x, all[i]!.z - all[j]!.z), `${all[i]!.x}, ${all[i]!.z}`).toBeGreaterThan(
          4.4,
        );
  });
});

describe('the garage’s yard is used (docs/qa.md, film round 3, item 8)', () => {
  it('its ground draws the worn band, the ruts, oil, a puddle that shines, chips and grass at the slab’s foot, in its own shader (no mesh, no program more); the other yards do not', async () => {
    const { createGarageScene } = await import('./garage/scene');
    const { createTractorScene } = await import('./tractor/scene');
    const shaderOf = (scene: THREE.Scene): string => {
      const land = scene.getObjectByName('floor') as THREE.Mesh;
      const sh = {
        uniforms: {} as Record<string, { value: unknown }>,
        vertexShader: THREE.ShaderLib.standard.vertexShader,
        fragmentShader: THREE.ShaderLib.standard.fragmentShader,
      };
      (land.material as THREE.Material).onBeforeCompile(sh as never, null as never);
      return sh.fragmentShader;
    };
    const g = shaderOf(createGarageScene().scene);
    for (const s of [
      'float rutW',
      'float oil',
      'yardWet = 1.0',
      'float chip',
      'float foot',
      'roughnessFactor = mix( roughnessFactor, 0.06, yardWet )',
    ])
      expect(g).toContain(s);
    expect(shaderOf(createTractorScene().scene)).not.toContain('float rutW');
  });
});

describe('the pines’ limbs (docs/qa.md, film round 3, m9)', () => {
  it('above the middle of its crown, no wood of a pine stands out of the crown’s ellipsoid: no tuft of needles on a bare stick against the sky', async () => {
    const { pineTree, crownReach } = await import('./farm/trees');
    const pine = pineTree(9);
    const wood = pine.trunk.attributes.position as THREE.BufferAttribute;
    let worst = 0;
    for (let i = 0; i < wood.count; i++) {
      const y = wood.getY(i);
      if (y < 0.86) continue;
      worst = Math.max(worst, crownReach([wood.getX(i), y, wood.getZ(i)], [0.01, 0.86, 0], [0.22, 0.11, 0.22], 0.2));
    }
    expect(worst).toBeLessThan(1.0);
  });
});
