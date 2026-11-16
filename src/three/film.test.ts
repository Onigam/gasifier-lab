import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import { FARM, GARAGE, TRACTOR } from './dims';
import { BIRCH_COARSE_FROM, leafyTree } from './farm/trees';
import { createFarmScene, filmHourOf } from './farm/scene';
import { sunDirection } from './farm/sky';
import { createGarageScene } from './garage/scene';
import { createGasifierScene } from './gasifier/scene';
import { createGasTrainScene } from './gastrain/scene';
import { sunFrom } from './outdoors';
import { createTractorScene } from './tractor/scene';
import { bedRadius } from './unit/unit';
import { meshBox, stateWith, view } from './test-utils';
import type { GasState } from '../sim/types';

// Film round 1: what the film asked of the worlds (docs/3d.md, « Film round 1 »). The ground, the sky and the horizon of the machine worlds and the garage; the evening the film may set on the farm; the stopped tractor's gas; the birches seen from afar; the
// wall fittings looked at with nothing in front of them; the chips of the section as shapes.

const base = stateWith();
const world = <T extends SceneModule<GasState>>(m: T): T => {
  m.update(base, 1 / 60, view({ time: 1 }));
  m.scene.updateMatrixWorld(true);
  return m;
};
const tractor = world(createTractorScene());
const gasifier = world(createGasifierScene());
const train = world(createGasTrainScene());
const garage = world(createGarageScene());
const farm = world(createFarmScene());

describe('the machine worlds and the garage stand in the open air', () => {
  const OUT: [string, SceneModule<GasState>][] = [
    ['tractor', tractor],
    ['gasifier', gasifier],
    ['gas-train', train],
    ['garage', garage],
  ];

  it('each has a sky, a sun that casts a shadow, a ground, a tree line and two ridges at the horizon, and no paper floor', () => {
    for (const [w, m] of OUT) {
      expect(m.scene.getObjectByName('sky'), `${w} sky`).toBeTruthy();
      expect(m.scene.getObjectByName('floor'), `${w} floor`).toBeTruthy();
      const hz = m.scene.getObjectByName('horizon')!;
      expect(hz, `${w} horizon`).toBeTruthy();
      expect(hz.getObjectByName('tree-line'), `${w} tree line`).toBeTruthy();
      expect(hz.getObjectByName('ridge-wooded'), `${w} wooded ridge`).toBeTruthy();
      expect(hz.getObjectByName('ridge-far'), `${w} far ridge`).toBeTruthy();
      let sun = 0;
      m.scene.traverse((o) => {
        if ((o as THREE.DirectionalLight).isDirectionalLight && (o as THREE.DirectionalLight).castShadow) sun++;
      });
      expect(sun, `${w} suns`).toBe(1);
      // the far plane reaches the sky's box
      expect(m.far ?? 0, `${w} far`).toBeGreaterThanOrEqual(5000);
      expect(m.scene.background, `${w} background is the sky's, not a colour`).toBeNull();
    }
  });

  it('the horizon is far (nothing of the tree line within 150 m) and casts no shadow, so that it cannot flicker with the sun’s box', () => {
    for (const [w, m] of OUT) {
      const hz = m.scene.getObjectByName('horizon')!;
      hz.traverse((o) => {
        const me = o as THREE.Mesh;
        if (!me.isMesh) return;
        expect(me.castShadow, `${w} ${o.name} casts`).toBe(false);
      });
      const im = hz.getObjectByName('tree-line') as THREE.InstancedMesh;
      const mtx = new THREE.Matrix4();
      const p = new THREE.Vector3();
      let nearest = Infinity;
      for (let i = 0; i < im.count; i++) {
        im.getMatrixAt(i, mtx);
        p.setFromMatrixPosition(mtx);
        nearest = Math.min(nearest, Math.hypot(p.x, p.z));
      }
      expect(nearest, `${w}`).toBeGreaterThan(150);
      expect(im.count, `${w}`).toBeGreaterThan(100);
    }
  });

  it('the machine rests on its ground: the tractor’s wheels on the gravel, the unit’s frame and the line’s feet on the slab, whose top is the floor', () => {
    const land = tractor.scene.getObjectByName('floor') as THREE.Mesh;
    expect(land.position.y).toBe(0);
    const rear = meshBox(tractor.registry.get('rear-wheels')!.object);
    expect(Math.abs(rear.min.y - land.position.y)).toBeLessThan(0.003);
    for (const [w, m] of [
      ['gasifier', gasifier],
      ['gas-train', train],
    ] as const) {
      const slab = m.scene.getObjectByName('slab') as THREE.Mesh;
      expect(slab, `${w} slab`).toBeTruthy();
      const b = new THREE.Box3().setFromObject(slab);
      expect(b.max.y, `${w} the slab's top is the floor`).toBeCloseTo(0, 6);
      // it lies under everything that stands on it, with a margin
      let low = Infinity;
      let all = new THREE.Box3();
      for (const id of m.registry.ids()) {
        const pb = meshBox(m.registry.get(id)!.object, (x) => !!x.userData.noShadow);
        if (pb.isEmpty()) continue;
        all = all.union(pb);
        low = Math.min(low, pb.min.y);
      }
      expect(low, `${w} lowest point`).toBeGreaterThan(-0.01);
      expect(b.min.x, `${w}`).toBeLessThan(all.min.x - 0.5);
      expect(b.max.x, `${w}`).toBeGreaterThan(all.max.x + 0.5);
    }
  });

  it('the sun comes from the side the world’s light always came from, between 30 and 52 degrees up', () => {
    const d = sunFrom([-4, 9, -7], [1.5, 0.8, -0.2]);
    expect(d.length()).toBeCloseTo(1, 6);
    const el = (Math.asin(d.y) * 180) / Math.PI;
    expect(el).toBeGreaterThanOrEqual(30 - 1e-6);
    expect(el).toBeLessThanOrEqual(52 + 1e-6);
    expect(Math.sign(d.x)).toBe(-1);
    expect(Math.sign(d.z)).toBe(-1);
    // a steep key is brought down to 52, a flat one up to 30
    expect((Math.asin(sunFrom([0, 50, 1], [0, 0, 0]).y) * 180) / Math.PI).toBeCloseTo(52, 4);
    expect((Math.asin(sunFrom([30, 1, 0], [0, 0, 0]).y) * 180) / Math.PI).toBeCloseTo(30, 4);
  });

  it('the tractor rolls on a gravel track whose wheel lines stay under its wheels: its ground runs at the model’s speed, backwards', () => {
    const land = tractor.scene.getObjectByName('floor') as THREE.Mesh;
    const mat = land.material as THREE.MeshStandardMaterial;
    // the shader's scroll uniform is shared: read it through the program's compile hook
    const shader = {
      uniforms: {} as Record<string, { value: number }>,
      vertexShader: '#include <common>\n#include <begin_vertex>',
      fragmentShader: '#include <common>\n#include <color_fragment>',
    };
    mat.onBeforeCompile(shader as never, null as never);
    const u = shader.uniforms.uScroll!;
    const run = stateWith({ engineOn: true, groundSpeedMs: 2 });
    const at0 = u.value;
    tractor.update(run, 0.5, view({ time: 2 }));
    expect(u.value - at0).toBeCloseTo(1, 6);
    tractor.update(run, 0.5, view({ time: 3 }));
    expect(u.value - at0).toBeCloseTo(2, 6);
    // stopped, it stays
    const stopped = stateWith({ engineOn: false, groundSpeedMs: 2 });
    tractor.update(stopped, 0.5, view({ time: 4 }));
    expect(u.value - at0).toBeCloseTo(2, 6);
    expect(TRACTOR.rear.tread).toBeGreaterThan(2);
  });
});

describe('the garage stands against its house', () => {
  it('the farm’s own farmhouse (the same function) stands flush with the side wall, its front in line with the garage’s, and goes when the camera goes round to its side', () => {
    const house = garage.scene.getObjectByName('farmhouse')!;
    expect(house).toBeTruthy();
    expect(house.userData.partId, 'no part of this world').toBeUndefined();
    const hb = new THREE.Box3().setFromObject(house);
    const gap = -(GARAGE.small.w / 2 + GARAGE.wall) - hb.max.x;
    expect(Math.abs(gap)).toBeLessThan(0.05);
    // its front wall in line with the garage's (the porch stands out in front of it, the roof over it)
    expect(house.position.z).toBeCloseTo(-GARAGE.wall + FARM.house.d / 2, 6);
    // a camera on that side: the house is not drawn; on the other it is
    const side = new THREE.PerspectiveCamera();
    side.position.set(-9, 3, -4);
    garage.scene.onBeforeRender(null as never, garage.scene, side, null as never, null as never, null as never);
    expect(house.visible).toBe(false);
    side.position.set(9, 3, -4);
    garage.scene.onBeforeRender(null as never, garage.scene, side, null as never, null as never, null as never);
    expect(house.visible).toBe(true);
  });

  it('the apron before the door is a slab that stops at the front wall and follows the room’s width', () => {
    const slab = garage.scene.getObjectByName('slab') as THREE.Mesh;
    const b = new THREE.Box3().setFromObject(slab);
    expect(b.max.z).toBeLessThan(-GARAGE.wall + 0.001);
    expect(b.max.y).toBeCloseTo(0, 6);
    expect(b.max.x).toBeGreaterThan(GARAGE.small.w / 2);
  });

  it('the plume’s frame is the cloud, and with a lid that leaks it takes the lid in: the lid is framed through the gas that leaves it', () => {
    const reg = garage.registry;
    const eye = reg.frameBounds('post-gas-plume').clone();
    // not stretched from the room’s corner to the cloud: a few metres
    expect(eye.getSize(new THREE.Vector3()).length()).toBeLessThan(5);
    const leak = world(createGarageScene({ params: () => ({ ...stateParams(), lidLeak: true }) as never }));
    leak.update(base, 1 / 60, view({ time: 2 }));
    const both = leak.registry.frameBounds('post-gas-plume');
    expect(both.getSize(new THREE.Vector3()).y).toBeGreaterThan(eye.getSize(new THREE.Vector3()).y + 0.5);
    expect(both.containsBox(eye)).toBe(true);
  });

  it('nothing stands between the eye and the 1940s set or the dial at the distance they are framed from (the tractor stood in front of the set)', () => {
    garage.update(base, 1 / 60, view({ time: 3 }));
    garage.scene.updateMatrixWorld(true);
    const park = garage.scene.getObjectByName('parked')!;
    const ray = new THREE.Raycaster();
    const tractorMeshes: THREE.Mesh[] = [];
    park.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) tractorMeshes.push(o as THREE.Mesh);
    });
    for (const id of ['old-rescue-set', 'co-indicator']) {
      const e = garage.registry.get(id)!;
      const c = garage.registry.frameBounds(id).getCenter(new THREE.Vector3());
      const eye = c.clone().addScaledVector(e.viewDir!, 3.4);
      ray.set(eye, c.clone().sub(eye).normalize());
      ray.far = eye.distanceTo(c) - 0.05;
      const hit = ray
        .intersectObjects(tractorMeshes, false)
        .filter((h) => (h.object as THREE.Mesh).material !== undefined);
      expect(
        hit.map((h) => h.object.name),
        id,
      ).toEqual([]);
    }
  });

  it('the garage’s inside is lined with boards and its slab is concrete: the cut edge is no cream band', () => {
    let lining = 0;
    garage.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m?.map && (o as THREE.Mesh).isMesh) {
        if (m.map.name === 'planks') lining++;
      }
    });
    expect(lining).toBeGreaterThan(3);
  });
});

describe('the farm in the film', () => {
  it('the sun is the model’s own unless a film sets the hour, in the address or live, and then it stands at that hour whatever the clock does', () => {
    const s = new THREE.Scene();
    expect(filmHourOf(s, null)).toBeNull();
    expect(filmHourOf(s, 19.5)).toBe(19.5);
    s.userData.filmHour = 20.25;
    expect(filmHourOf(s, 19.5)).toBe(20.25);
    s.userData.filmHour = 31;
    expect(filmHourOf(s, null)).toBeNull();
    // at 19:30 the sun is low and in the west, as an evening's; at 06:30, the model's start, low in the east
    const eve = sunDirection(19.5);
    const morn = sunDirection(FARM.dayStart);
    expect((Math.asin(eve.y) * 180) / Math.PI).toBeGreaterThan(8);
    expect((Math.asin(eve.y) * 180) / Math.PI).toBeLessThan(22);
    expect(eve.x).toBeLessThan(0);
    expect(morn.x).toBeGreaterThan(0);
  });

  it('a film that sets the hour moves the light and nothing else, even over a clock of ×600 and more, where the model holds the afternoon', () => {
    const sunOf = (f: SceneModule<GasState>): THREE.Vector3 => {
      let d: THREE.DirectionalLight | null = null;
      f.scene.traverse((o) => {
        if ((o as THREE.DirectionalLight).isDirectionalLight && !d) d = o as THREE.DirectionalLight;
      });
      return d!.position.clone().sub(d!.target.position).normalize();
    };
    const fast = createFarmScene({ params: () => ({ timeScale: 3600 }) as never });
    fast.update(base, 1 / 60, view({ time: 1 }));
    const held = sunOf(fast);
    fast.scene.userData.filmHour = 19.6;
    fast.update(base, 1 / 60, view({ time: 1 }));
    const eve = sunOf(fast);
    expect(held.distanceTo(eve)).toBeGreaterThan(0.4);
    // the evening sun is low and to the west
    expect(eve.y).toBeLessThan(0.38);
    expect(eve.x).toBeLessThan(0);
    // the clock moving on changes nothing while the film holds the hour
    fast.update({ ...base, hour: base.hour + 3 }, 1 / 60, view({ time: 2 }));
    expect(sunOf(fast).distanceTo(eve)).toBeLessThan(1e-6);
  });

  it('a stopped tractor lets its gas out where the model says: at the intake and at the lid, in proportion to the push, nothing while it runs', () => {
    const drive = farm.scene.getObjectByName('drive')!;
    const dots: THREE.Points[] = [];
    drive.traverse((o) => {
      if ((o as THREE.Points).isPoints && o.name === 'plume-dots') dots.push(o as THREE.Points);
    });
    expect(dots.length).toBe(2);
    const share = (p: THREE.Points): number => (p.material as THREE.ShaderMaterial).uniforms.uShare!.value as number;
    farm.update(stateWith({ engineOn: true }), 1 / 60, view({ time: 5 }));
    expect(dots.map(share)).toEqual([0, 0]);
    const stopped = stateWith({}, { engineOn: false }, 60);
    expect(stopped.pressureSign).toBe('pressure');
    farm.update(stopped, 1 / 60, view({ time: 6 }));
    expect(share(dots[0]!)).toBeGreaterThan(0.05);
    expect(share(dots[1]!)).toBeCloseTo(share(dots[0]!) * 0.4, 6);
  });

  it('the tractor is looked at from its left, where the unit stands, wherever on its loop it stands', () => {
    const f = world(createFarmScene());
    const e = f.registry.get('wood-gas-tractor')!;
    const run = stateWith({ engineOn: true, groundSpeedMs: 10 });
    const seen: number[] = [];
    for (let k = 0; k < 8; k++) {
      // eleven metres at a step: the straights and both ends of the loop
      f.update(run, 1.1, view({ time: 10 + k }));
      f.scene.updateMatrixWorld(true);
      const drive = f.scene.getObjectByName('drive')!;
      // the tractor's left is −z in its own frame; the camera's direction must lie on that side of it
      const left = new THREE.Vector3(0, 0, -1).applyQuaternion(drive.quaternion);
      expect(e.viewDir!.dot(left), `step ${k}`).toBeGreaterThan(0.6);
      expect(e.viewDir!.y).toBeGreaterThan(0.1);
      seen.push(Math.round((Math.atan2(left.z, left.x) * 180) / Math.PI));
    }
    // the loop turns the tractor round: the side it is looked at from turns with it
    expect(new Set(seen).size).toBeGreaterThan(3);
  });
});

describe('the birches from afar (docs/qa.md D16: the worst shimmer of the lab)', () => {
  const trees = farm.scene.getObjectByName('trees')!;
  const fine = trees.getObjectByName('birch-crowns') as THREE.InstancedMesh;
  const coarse = trees.getObjectByName('birch-crowns-coarse') as THREE.InstancedMesh;
  const trunks = trees.getObjectByName('birch-trunks') as THREE.InstancedMesh;
  const trunksCoarse = trees.getObjectByName('birch-trunks-coarse') as THREE.InstancedMesh;

  it('beyond their distance a birch has its main limbs and a crown of the same leaves in fewer, larger sprays, as tall and as wide as the one with the full set', () => {
    expect(coarse).toBeTruthy();
    expect(trunksCoarse).toBeTruthy();
    // the same material as the crowns near: the same leaves, so that a tree does not change colour as the camera goes by
    expect(coarse.material).toBe(fine.material);
    const a = leafyTree('birch', 1);
    const b = leafyTree('birch', 1, true);
    const box = (g: THREE.BufferGeometry): THREE.Vector3 =>
      new THREE.Box3()
        .setFromBufferAttribute(g.attributes.position as THREE.BufferAttribute)
        .getSize(new THREE.Vector3());
    const sa = box(a.crown);
    const sb = box(b.crown);
    // a seeded scatter of fewer sprays reaches a little less far: within 30 % either way, never a different tree
    expect(Math.abs(sb.y - sa.y) / sa.y).toBeLessThan(0.3);
    expect(Math.abs(sb.x - sa.x) / sa.x).toBeLessThan(0.3);
    // fewer edges for the eye: well under half the sprays, and a trunk that keeps its main limbs and loses the forks
    expect(b.crown.index!.count).toBeLessThan(a.crown.index!.count * 0.5);
    expect(b.trunk.index!.count).toBeLessThan(a.trunk.index!.count * 0.6);
  });

  it('each birch is drawn once, by its distance, with a margin so that none flips back and forth (the same rule as the spruces)', () => {
    const total = fine.count;
    const draw = (cam: THREE.Camera): void => {
      fine.onBeforeRender(null as never, null as never, cam, null as never, null as never, null as never);
      trunks.onBeforeRender(null as never, null as never, cam, null as never, null as never, null as never);
    };
    const eye = (x: number, y: number, z: number): THREE.PerspectiveCamera => {
      const c = new THREE.PerspectiveCamera();
      c.position.set(x, y, z);
      return c;
    };
    draw(eye(0, 50, 260));
    expect(fine.count).toBe(0);
    expect(coarse.count).toBe(total);
    expect(trunks.count).toBe(0);
    expect(trunksCoarse.count).toBe(total);
    // a camera among them: the near ones are fine, the rest coarse, and nothing is lost
    draw(eye(-26, 2, -6));
    expect(fine.count + coarse.count).toBe(total);
    expect(trunks.count + trunksCoarse.count).toBe(total);
    expect(fine.count).toBeGreaterThan(0);
    expect(fine.count).toBeLessThan(total);
    expect(BIRCH_COARSE_FROM).toBeGreaterThan(20);
  });
});

describe('the chips of the section are shapes', () => {
  const unit = (gasifier as unknown as { unit: { root: THREE.Object3D } }).unit;
  const layers: THREE.InstancedMesh[] = [];
  unit.root.traverse((o) => {
    if (o.name === 'bed-chips') layers.push(o as THREE.InstancedMesh);
  });

  it('five beds, a thousand pieces and more in all, each a flake of the reported size lying on the cut face inside the bed’s own outline', () => {
    expect(layers.length).toBe(5);
    const total = layers.reduce((n, l) => n + l.count, 0);
    expect(total).toBeGreaterThan(1000);
    expect(total).toBeLessThan(6000);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (const l of layers)
      for (let i = 0; i < l.count; i += 7) {
        l.getMatrixAt(i, m);
        p.setFromMatrixPosition(m);
        // inside the bed at its height, a flake's own half-length from the wall at most
        expect(Math.abs(p.x), `${l.parent?.name} ${i}`).toBeLessThanOrEqual(bedRadius(p.y) + 1e-6);
        // on the kept side, standing at most a few millimetres proud of the plane
        expect(p.z).toBeGreaterThan(-0.006);
        expect(p.z).toBeLessThan(0.006);
      }
  });

  it('they are held by the part they lie on: the explode takes them with it, and a part keeps its chips', () => {
    for (const l of layers) {
      expect(l.parent?.userData.partId).toBeTruthy();
      expect(gasifier.registry.get(l.parent!.userData.partId as string)).toBeTruthy();
    }
  });
});

describe('what the film frames is in view: nothing stands between the eye and the middle of each part it points at', () => {
  // from where the app's own camera frames each part (its viewDir, at about twice the part's own size), five rays to the middle of its camera-facing side and its corners: at least four reach it. The walls that step aside and the house that goes when the camera goes round
  // are as the garage draws them; the sky, the ground and the horizon are no obstacle (the camera is above the ground), nor are the gas and the glass.
  const FILM: Record<string, string[]> = {
    farm: ['farmhouse', 'farm-garage', 'wood-gas-tractor'],
    gasifier: ['chip-column', 'pyrolysis-zone', 'oxidation-zone', 'reduction-zone', 'gas-outlet'],
    'gas-train': ['filter-box', 'gas-cooler', 'cylinder-cutaway', 'water-gauge'],
    tractor: ['cab'],
    garage: ['room-above', 'closed-garage', 'old-rescue-set', 'post-gas-plume', 'co-indicator', 'garage-door'],
  };
  const mods: Record<string, SceneModule<GasState>> = { farm, gasifier, 'gas-train': train, tractor, garage };
  const ray = new THREE.Raycaster();
  const WORLD_PAD: Record<string, number> = { farm: 1.7, tractor: 2.2, gasifier: 1.8, 'gas-train': 2.0, garage: 2.2 };

  it('from the framing’s own side and distance the part is seen: at least four of five rays are free, in every world and for every part the film points at', () => {
    const bad: string[] = [];
    for (const [w, ids] of Object.entries(FILM)) {
      const m = mods[w]!;
      m.update(stateWith({ engineOn: false }), 1 / 60, view({ time: 9 }));
      m.scene.updateMatrixWorld(true);
      const blockers: THREE.Mesh[] = [];
      m.scene.traverse((o) => {
        const me = o as THREE.Mesh;
        if (!me.isMesh || (me as THREE.InstancedMesh).isInstancedMesh || o.userData.noShadow) return;
        const mat = me.material as THREE.Material;
        if (mat.transparent || ['floor', 'slab', 'sky', 'land'].includes(o.name)) return;
        for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p.name === 'horizon' || p.name === 'trees') return;
        blockers.push(me);
      });
      for (const id of ids) {
        const e = m.registry.get(id)!;
        const box = m.registry.frameBounds(id);
        const c = box.getCenter(new THREE.Vector3());
        const half = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        // where the kit puts the camera: the box's bounding sphere times the padding over the sine of half the field of view (a lens of about 35 degrees here)
        const reach = (half.length() * Math.min(WORLD_PAD[w]!, 1.9)) / Math.sin((17.5 * Math.PI) / 180);
        const eye = c.clone().addScaledVector(e.viewDir!, reach);
        const own = new Set<THREE.Object3D>();
        e.object.traverse((o) => own.add(o));
        const hide = new Set<THREE.Object3D>();
        if (w === 'garage') {
          const { w: gw, d } = (m as unknown as { building: { dims: { w: number; d: number } } }).building.dims;
          const walls = (m as unknown as { building: { walls: { id: string; mesh: THREE.Object3D }[] } }).building
            .walls;
          for (const wall of walls) {
            const wid = wall.id.replace('above-', '');
            const away =
              (wid === 'plus-x' && eye.x > gw / 2) ||
              (wid === 'minus-x' && eye.x < -gw / 2) ||
              (wid === 'back' && eye.z > d) ||
              (wid === 'front' && eye.z < 0 && Math.abs(eye.x) < gw * 0.4 + 0.3);
            if (away) wall.mesh.traverse((o) => hide.add(o));
          }
          if (eye.x < -gw / 2 - 0.3) m.scene.getObjectByName('farmhouse')!.traverse((o) => hide.add(o));
        }
        // the middle and the four corners of the face of its box that turns to the camera (a point inside a solid, or behind its cut face, is hidden by the part itself)
        const d = e.viewDir!;
        const axis =
          Math.abs(d.x) >= Math.abs(d.y) && Math.abs(d.x) >= Math.abs(d.z)
            ? 'x'
            : Math.abs(d.y) >= Math.abs(d.z)
              ? 'y'
              : 'z';
        const face = c.clone();
        face[axis] += Math.sign(d[axis]) * half[axis] * 0.8;
        const others = (['x', 'y', 'z'] as const).filter((a) => a !== axis);
        const pts = [face.clone()];
        for (const s1 of [-0.8, 0.8])
          for (const s2 of [-0.8, 0.8]) {
            const q = face.clone();
            q[others[0]!] += half[others[0]!] * s1;
            q[others[1]!] += half[others[1]!] * s2;
            pts.push(q);
          }
        let free = 0;
        const use = blockers.filter((b) => !own.has(b) && !hide.has(b));
        for (const p of pts) {
          const dv = p.clone().sub(eye);
          const len = dv.length();
          ray.set(eye, dv.normalize());
          ray.far = len - 0.03;
          if (ray.intersectObjects(use, false).length === 0) free++;
        }
        if (free < 4) bad.push(`${w}/${id} ${free}/5`);
      }
    }
    expect(bad).toEqual([]);
  });
});

const stateParams = (): Record<string, unknown> => ({ lidLeak: false, timeScale: 1 });
