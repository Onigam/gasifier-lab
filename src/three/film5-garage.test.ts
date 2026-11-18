import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGarageScene, GARAGE_WEAR } from './garage/scene';
import { WORLD } from './index';
import { stateWith, view } from './test-utils';

// Film round 5 (docs/qa.md, « Film round 4: the scoped review »): N2, the yard's wear in film 5c (a pale puddle with round chips on it, a straight green L at the slab's « foot » two metres off the apron), and minor 2, the pale straight-edged wedge in
// film 5b (the plume's click volume drawn as a solid in the film look's occlusion pass).

const garage = createGarageScene();
garage.update(stateWith(), 1 / 60, view());
garage.scene.updateMatrixWorld(true);

const shaderOf = (mat: THREE.Material): { fragment: string; uniforms: Record<string, { value: unknown }> } => {
  const sh = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: THREE.ShaderLib.standard.vertexShader,
    fragmentShader: THREE.ShaderLib.standard.fragmentShader,
  };
  mat.onBeforeCompile(sh as never, null as never);
  return { fragment: sh.fragmentShader, uniforms: sh.uniforms };
};

describe('the garage’s yard (docs/qa.md, film round 4, N2)', () => {
  const land = garage.scene.getObjectByName('floor') as THREE.Mesh;
  const sh = shaderOf(land.material as THREE.Material);

  it('the traces round the slab follow the apron as it is laid out, not the plan the yard was made with', () => {
    const slab = garage.scene.getObjectByName('slab') as THREE.Mesh;
    const box = new THREE.Box3().setFromObject(slab);
    const u = sh.uniforms.uYardSlab!.value as THREE.Vector4;
    expect(u.x).toBeCloseTo(box.min.x, 2);
    expect(u.z).toBeCloseTo(box.max.x, 2);
    expect(u.y).toBeCloseTo(box.min.z, 2);
    expect(sh.fragment).toContain('max( uYardSlab.xy - w, w - uYardSlab.zw )');
  });

  it('no chip on the water or its wet rim, chips of many sizes turned every way, the grass at the foot broken by noise', () => {
    expect(sh.fragment).toMatch(/float chip = [^;]*\( 1\.0 - yardWet \) \* \( 1\.0 - wetRim \)/);
    expect(sh.fragment).toContain('mat2( cos( ca )');
    expect(sh.fragment).toMatch(/float footReach = [^;]*yNoise/);
    expect(sh.fragment).toMatch(/float driven = [^;]*yNoise/);
  });

  it('the puddle is out of the door’s frame (film 5c), at 16:9 and on a phone', () => {
    for (const aspect of [16 / 9, 390 / 844])
      for (const padding of [1.9, WORLD.garage.partPadding]) {
        const v = (40 * Math.PI) / 180;
        const fit = Math.min(v, 2 * Math.atan(Math.tan(v / 2) * aspect));
        const box = garage.registry.frameBounds('garage-door');
        const at = box.getCenter(new THREE.Vector3());
        const r = box.getBoundingSphere(new THREE.Sphere()).radius;
        const dir = garage.registry.get('garage-door')!.viewDir!.clone().normalize();
        const cam = new THREE.PerspectiveCamera(40, aspect, 0.05, 999);
        cam.position
          .copy(at)
          .addScaledVector(dir, Math.max(garage.minDistance ?? 0, (r * padding) / Math.sin(fit / 2)));
        cam.lookAt(at);
        cam.updateMatrixWorld(true);
        const [x, z, rad] = GARAGE_WEAR.puddle;
        for (const [dx, dz] of [
          [0, 0],
          [rad, 0],
          [-rad, 0],
          [0, rad * 1.8],
          [0, -rad * 1.8],
        ] as const) {
          const q = new THREE.Vector3(x + dx, -0.2, z + dz).project(cam);
          expect(
            Math.abs(q.x) > 1 || Math.abs(q.y) > 1,
            `${aspect.toFixed(2)} ${padding}: ${q.x.toFixed(2)}, ${q.y.toFixed(2)}`,
          ).toBe(true);
        }
      }
  });
});

describe('the plume’s click volume is never drawn (docs/qa.md, film round 4, minor 2)', () => {
  it('no colour, no depth: the occlusion pass of the film look leaves it out, and a click still finds it', () => {
    const hazes: THREE.Mesh[] = [];
    garage.scene.traverse((o) => {
      if (o.name === 'plume-haze') hazes.push(o as THREE.Mesh);
    });
    expect(hazes.length).toBeGreaterThanOrEqual(3);
    for (const h of hazes) {
      const m = h.material as THREE.MeshBasicMaterial;
      expect(m.colorWrite).toBe(false);
      expect(m.depthWrite).toBe(false);
      const ray = new THREE.Raycaster(
        h.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, -10)),
        new THREE.Vector3(0, 0, 1),
      );
      expect(ray.intersectObject(h).length).toBeGreaterThan(0);
    }
  });
});
