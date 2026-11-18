import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import { UNIT } from './dims';
import { filmHourOf, createFarmScene } from './farm/scene';
import { leafCard, leafMips } from './farm/trees';
import { createGarageScene } from './garage/scene';
import { makePlume } from './garage/plume';
import { stateWith, view } from './test-utils';
import type { GasParams, GasState } from '../sim/types';

// Film round 2 (docs/qa.md, « Film round 1: the scoped review »): the leaf cards' mip chain, the bedroom's windows that go with their wall, the lid's ring of gas, the hour that a film sets and can give back.

describe('the leaf cards keep their leaves at every distance (the dark rectangles over the birches)', () => {
  const N = 128;
  const tex = leafCard(11, 0xa9c85a, 0x5f8a2c, 90, N, 0.62, 0.075);
  const mips = tex.mipmaps as unknown as { data: Uint8Array; width: number }[];
  const base = new Uint8Array((tex.image as unknown as { data: Uint8Array }).data);
  const share = (d: Uint8Array): number => {
    let c = 0;
    for (let i = 3; i < d.length; i += 4) c += d[i]! / 255;
    return c / (d.length / 4);
  };

  it('has its own mip chain down to one texel, and no generated one', () => {
    expect(tex.generateMipmaps).toBe(false);
    expect(mips.length).toBe(Math.log2(N) + 1);
    expect(mips[0]!.width).toBe(N);
    expect(mips[mips.length - 1]!.width).toBe(1);
  });

  it('every level down to eight texels a side covers the share the base covers, to a few per cent: neither a solid card nor a gone one', () => {
    const cover = share(base);
    expect(cover).toBeGreaterThan(0.25);
    expect(cover).toBeLessThan(0.75);
    for (const m of mips) {
      if (m.width < 8) continue;
      const c = share(m.data);
      expect(Math.abs(c - cover), `${m.width} texels: ${c.toFixed(3)} against ${cover.toFixed(3)}`).toBeLessThan(0.04);
    }
  });

  it('a box filter would not: the same card, filtered as a driver does, reads solid at a distance (what the new chain replaces)', () => {
    // the mean alpha at the coarse levels is the share, which is over the alpha test of 0.45 for this card: every texel over it, a whole rectangle
    const cover = share(base);
    expect(cover).toBeGreaterThan(0.45);
    const boxed = leafMips(base, N)[3]!;
    expect(boxed.width).toBe(16);
    // and the chain's texels are not all one: the leaves are still there at 16 texels a side
    const a = new Set<number>();
    for (let i = 3; i < boxed.data.length; i += 4) a.add(boxed.data[i]!);
    expect(a.size).toBeGreaterThan(1);
  });

  it('the colour of a covered texel is a leaf’s, never the black of a transparent one', () => {
    for (const m of mips) {
      if (m.width < 8) continue;
      const d = m.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) expect(d[i + 1]).toBeGreaterThan(40);
    }
  });
});

describe('the bedroom’s windows go with their wall', () => {
  const garage = createGarageScene() as SceneModule<GasState> & {
    building: { shell: THREE.Group; above: THREE.Group; walls: { id: string; mesh: THREE.Object3D }[] };
  };
  garage.update(stateWith(), 1 / 60, view());

  it('every pane of glass of the building stands under a wall that steps aside: none is left in the air at the cut', () => {
    const walls = new Set<THREE.Object3D>(garage.building.walls.map((w) => w.mesh));
    const panes: THREE.Mesh[] = [];
    for (const root of [garage.building.shell, garage.building.above])
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh && ((o as THREE.Mesh).material as THREE.Material).name === 'cab-glass')
          panes.push(o as THREE.Mesh);
      });
    expect(panes.length).toBeGreaterThanOrEqual(6);
    for (const p of panes) {
      let up: THREE.Object3D | null = p;
      let found = false;
      while (up) {
        if (walls.has(up)) found = true;
        up = up.parent;
      }
      expect(found, 'a pane that no wall holds').toBe(true);
    }
  });

  it('the back wall of the room and of the bedroom each hold their window, and hide it', () => {
    const holds = (id: string): number => {
      const w = garage.building.walls.find((x) => x.id === id)!;
      let n = 0;
      w.mesh.traverse((o) => {
        if ((o as THREE.Mesh).isMesh && ((o as THREE.Mesh).material as THREE.Material).name === 'cab-glass') n++;
      });
      return n;
    };
    expect(holds('back')).toBe(1);
    expect(holds('above-back')).toBe(1);
    expect(holds('above-front')).toBe(4);
  });
});

describe('the lid’s gas leaves round its rim, and follows the model’s flow as it rises', () => {
  const lidPlume = (m: SceneModule<GasState>): THREE.Points => {
    const post = m.scene.getObjectByName('post-gas-plume')!;
    const dots: THREE.Points[] = [];
    post.traverse((o) => {
      if ((o as THREE.Points).isPoints && o.name === 'plume-dots') dots.push(o as THREE.Points);
    });
    return dots[1]!;
  };
  const u = (p: THREE.Points): Record<string, { value: number | THREE.Vector2 }> =>
    (p.material as THREE.ShaderMaterial).uniforms as never;

  it('the lid’s plume is a ring as wide as the lid and thin, so that the lid is seen inside it', () => {
    const params = { lidLeak: true, timeScale: 51 } as GasParams;
    const g = createGarageScene({ params: () => params });
    g.update(stateWith({ pressureSign: 'pressure', plumeShare: 0.4 }), 1 / 60, view());
    const lid = lidPlume(g);
    expect(u(lid).uRing!.value as number).toBeGreaterThan(UNIT.lid.R * 0.9);
    expect(u(lid).uRing!.value as number).toBeLessThan(UNIT.lid.R);
    // the rise of a lid’s gas is under a metre: it does not bury the unit
    expect(u(lid).uRise!.value as number).toBeLessThan(1);
  });

  it('a lid that starts to leak mid-run does not make the cloud jump: it rises over the model’s five minutes, and a world that meets a run under way is set at once', () => {
    let params = { lidLeak: false, timeScale: 51 } as GasParams;
    const g = createGarageScene({ params: () => params });
    const stopped = stateWith({ pressureSign: 'pressure', plumeShare: 0.4 });
    g.update(stopped, 1 / 60, view());
    const share = (): number => u(lidPlume(g)).uShare!.value as number;
    const before = share();
    params = { ...params, lidLeak: true };
    g.update(stopped, 1 / 60, view({ time: 2 }));
    // one frame later it has moved a little, not to the whole of the leak
    expect(share()).toBeGreaterThan(before);
    expect(share()).toBeLessThan(0.45);
    // five model minutes at ×51 are six seconds: after twenty it is there
    for (let i = 0; i < 1200; i++) g.update(stopped, 1 / 60, view({ time: 3 + i / 60 }));
    expect(share()).toBeGreaterThan(0.55);
    // a world built over a run that already leaks shows it from its first frame
    params = { ...params, lidLeak: true };
    const late = createGarageScene({ params: () => params });
    late.update(stopped, 1 / 60, view());
    expect(u(lidPlume(late)).uShare!.value as number).toBeGreaterThan(0.55);
  });

  // (film round 4: « the camera looks down on the lid while it leaks » is replaced by `film4-lid.test.ts`: the gap under the lid shows by three pixels and more in the 5b frame, from the side; docs/qa.md, film round 3, m2, the lead's decision « the test gives, not the frame »)

  it('a plume can fade near the eye, start on a ring and keep a least size', () => {
    const p = makePlume({
      origin: new THREE.Vector3(),
      color: 0xffffff,
      rise: 1,
      spread: 1,
      ring: 0.3,
      fade: [2, 8],
      minPx: 4,
    });
    const m = p.points.material as THREE.ShaderMaterial;
    expect(m.uniforms.uRing!.value).toBe(0.3);
    expect((m.uniforms.uFade!.value as THREE.Vector2).toArray()).toEqual([2, 8]);
    expect(m.uniforms.uMinPx!.value).toBe(4);
    expect(m.vertexShader).toContain('uMinPx');
    expect(m.vertexShader).toContain('smoothstep( uFade.x, uFade.y');
  });
});

describe('the farm’s hour is a film’s to set, once, and to give back', () => {
  it('an address sets it, the scene can set it live, `null` live gives the model’s own day back, out of range falls back to the address', () => {
    const s = new THREE.Scene();
    expect(filmHourOf(s, null)).toBeNull();
    expect(filmHourOf(s, 19.5)).toBe(19.5);
    s.userData.filmHour = 7;
    expect(filmHourOf(s, 19.5)).toBe(7);
    s.userData.filmHour = null;
    expect(filmHourOf(s, 19.5)).toBeNull();
    s.userData.filmHour = 40;
    expect(filmHourOf(s, 19.5)).toBe(19.5);
    delete s.userData.filmHour;
    expect(filmHourOf(s, 19.5)).toBe(19.5);
  });

  it('the address is read when the world is built and not at every frame: a later change of the address moves nothing', () => {
    const f = createFarmScene();
    const sunY = (): number => {
      let y = 0;
      f.scene.traverse((o) => {
        if ((o as THREE.DirectionalLight).isDirectionalLight && !y)
          y = (o as THREE.DirectionalLight).position.y - (o as THREE.DirectionalLight).target.position.y;
      });
      return y;
    };
    const st = stateWith();
    f.update(st, 1 / 60, view());
    const a = sunY();
    (globalThis as { location?: { search: string } }).location = { search: '?hour=20.5' };
    f.update(st, 1 / 60, view({ time: 2 }));
    expect(sunY()).toBeCloseTo(a, 6);
    delete (globalThis as { location?: unknown }).location;
  });
});
