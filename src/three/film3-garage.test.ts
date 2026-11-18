import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FARM, GARAGE } from './dims';
import { createFarmScene } from './farm/scene';
import { createGarageScene } from './garage/scene';
import { TUFTS_FADE, tuftCard } from './outdoors';
import { meshBox, stateWith, view } from './test-utils';

// Film round 3, item 5 (docs/qa.md, « Film round 2: the scoped review », F9): the house on the same side of the garage in the farm and in the garage; the garage's ground is a meadow.

const farm = createFarmScene();
farm.scene.updateMatrixWorld(true);
describe('the house stands on the same side of the garage in the farm and in the garage, and the garage’s ground is a meadow (docs/qa.md, film round 2, F9)', () => {
  it('seen from the garage’s own door, the house is on the same hand in both worlds: against the wall away from the unit', () => {
    // the farm: the house's place in the garage's own frame (x across the door, z in from it)
    const fg = farm.scene.getObjectByName('farm-garage')!;
    const fh = farm.scene.getObjectByName('farmhouse')!;
    farm.scene.updateMatrixWorld(true);
    const inFarm = fg.worldToLocal(fh.getWorldPosition(new THREE.Vector3()));
    const garage = createGarageScene();
    garage.update(stateWith(), 1 / 60, view());
    garage.scene.updateMatrixWorld(true);
    const gh = garage.scene.getObjectByName('farmhouse')!;
    const inGarage = gh.getWorldPosition(new THREE.Vector3());
    expect(Math.sign(inFarm.x)).toBe(Math.sign(inGarage.x));
    expect(inFarm.x).toBeLessThan(0);
    // and at the same place to a few centimetres: flush with the garage's side wall, its front in line with the garage's
    expect(Math.abs(inFarm.x - inGarage.x)).toBeLessThan(0.2);
    expect(Math.abs(inFarm.z - inGarage.z)).toBeLessThan(0.2);
    // the unit, on the tractor's left, is on the other side: the side the garage world is cut open on
    const unit = garage.scene.getObjectByName('unit')!.getWorldPosition(new THREE.Vector3());
    expect(unit.x).toBeGreaterThan(0);
    // in the farm the two buildings touch and do not overlap
    const hb = new THREE.Box3().setFromObject(fh);
    const gb = meshBox(fg.getObjectByName('closed-garage')!);
    expect(gb.max.x).toBeLessThan(FARM.house.x - FARM.house.w / 2 + 0.2);
    expect(hb.min.x - gb.max.x).toBeLessThan(0.6);
    void GARAGE;
  });

  it('the garage’s yard has tufts of grass and stones in its meadow, none on the building, the house, the apron or the track, and a tuft goes down into the turf with the distance', () => {
    const garage = createGarageScene();
    const tufts = garage.scene.getObjectByName('tufts') as THREE.InstancedMesh;
    const stones = garage.scene.getObjectByName('stones') as THREE.InstancedMesh;
    expect(tufts.count).toBeGreaterThan(3000);
    expect(stones.count).toBeGreaterThan(40);
    expect(tufts.castShadow).toBe(false);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (const im of [tufts, stones])
      for (let i = 0; i < im.count; i++) {
        im.getMatrixAt(i, m);
        p.setFromMatrixPosition(m);
        // the garage (the largest the model draws), the apron before its door, the house beside it
        expect(Math.abs(p.x) < 9 && p.z > -10 && p.z < 24, `${p.x.toFixed(1)}, ${p.z.toFixed(1)}`).toBe(false);
        expect(p.x < 0 && p.x > -22 && p.z > -6 && p.z < 12).toBe(false);
        // on the ground, a stone a third in it
        expect(Math.abs(p.y + 0.21)).toBeLessThan(0.08);
      }
    const shader = {
      uniforms: {} as Record<string, { value: unknown }>,
      vertexShader: THREE.ShaderLib.standard.vertexShader,
      fragmentShader: THREE.ShaderLib.standard.fragmentShader,
    };
    (tufts.material as THREE.Material).onBeforeCompile(shader as never, null as never);
    expect(shader.vertexShader).toContain('smoothstep( uTuftFade.x, uTuftFade.y, tuftD )');
    expect(TUFTS_FADE[1]).toBeLessThan(60);
    // the ground's own picture has the track
    const land = garage.scene.getObjectByName('floor') as THREE.Mesh;
    const ls = {
      uniforms: {} as Record<string, { value: unknown }>,
      vertexShader: THREE.ShaderLib.standard.vertexShader,
      fragmentShader: THREE.ShaderLib.standard.fragmentShader,
    };
    (land.material as THREE.Material).onBeforeCompile(ls as never, null as never);
    expect(ls.fragmentShader).toContain('ySeg( w,');
    // a card of grass is blades on a clear ground, its own mips keeping their share
    const card = tuftCard(3);
    const mips = card.mipmaps as unknown as { data: Uint8Array; width: number }[];
    const share = (d: Uint8Array): number => {
      let c = 0;
      for (let i = 3; i < d.length; i += 4) c += d[i]! / 255;
      return c / (d.length / 4);
    };
    const base = share(mips[0]!.data);
    expect(base).toBeGreaterThan(0.08);
    expect(base).toBeLessThan(0.45);
    for (const mip of mips) if (mip.width >= 8) expect(Math.abs(share(mip.data) - base)).toBeLessThan(0.04);
  });
});
