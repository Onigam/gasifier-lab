import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import { GasifierSim } from '../sim/engine';
import { GARAGE, FARM, TRACTOR } from './dims';
import { createFarmScene, loopAt, LOOP_LENGTH } from './farm/scene';
import { terrainHeight } from './farm/terrain';
import { createGarageScene, DOOR_OPEN } from './garage/scene';
import { garageFor, grossVolume } from './garage/building';
import { createGasifierScene, GASIFIER_REFUSED } from './gasifier/scene';
import { createGasTrainScene } from './gastrain/scene';
import { PART_IDS, PART_NAMES, idsOf, type WorldId } from './part-ids';
import { createTractorScene } from './tractor/scene';
import { PART_OPENS, WORLD } from './index';
import { drawStats, finiteTree, isolateOne, meshBox, stateWith, view } from './test-utils';
import type { GasState } from '../sim/types';

// The five worlds: every id of the research in its world with meshes, a label in both languages and a side to be looked at from; every scenario through every world with nothing that is not a number; the explode takes nothing through the floor; isolate takes the
// scenery with it; the sizes of the hot parts are not on any sheet's box; the budgets (docs/3d.md §Budgets).

const WORLDS: [WorldId, SceneModule<GasState>][] = [
  ['farm', createFarmScene()],
  ['tractor', createTractorScene()],
  ['gasifier', createGasifierScene()],
  ['gas-train', createGasTrainScene()],
  ['garage', createGarageScene()],
];
const base = stateWith();
for (const [, mod] of WORLDS) {
  mod.update(base, 1 / 60, view({ time: 1 }));
  mod.scene.updateMatrixWorld(true);
}
const mod = (id: WorldId): SceneModule<GasState> => WORLDS.find(([w]) => w === id)![1];

describe('the registry', () => {
  it('every world registers exactly the ids of the research §4 for it, 67 in all, each once', () => {
    const seen = new Set<string>();
    for (const [w, m] of WORLDS) {
      const ids = m.registry.ids().sort();
      expect(ids, w).toEqual(idsOf(w).sort());
      for (const id of ids) {
        expect(seen.has(id), `${id} twice`).toBe(false);
        seen.add(id);
      }
    }
    expect(seen.size).toBe(67);
    expect(PART_IDS.length).toBe(67);
    expect(WORLDS.length).toBe(5);
  });

  it('every part has meshes, a finite box, a side it is looked at from, and a label in both languages', () => {
    for (const [w, m] of WORLDS) {
      for (const id of m.registry.ids()) {
        const e = m.registry.get(id)!;
        expect(e.meshes.length, `${w} ${id}`).toBeGreaterThan(0);
        const b = m.registry.frameBounds(id);
        expect(b.isEmpty(), `${w} ${id} box`).toBe(false);
        expect(Number.isFinite(b.min.x + b.max.y + b.min.z), `${w} ${id} finite`).toBe(true);
        // a part's box is the part's: no hidden dot parked below the world, no plume at the origin
        const sz = b.getSize(new THREE.Vector3());
        expect(Math.max(sz.x, sz.y, sz.z), `${w} ${id} size`).toBeLessThan(w === 'farm' ? 160 : 12);
        expect(e.viewDir, `${w} ${id} viewDir`).toBeDefined();
        expect(
          m.hotspots.some((h) => h.partId === id),
          `${w} ${id} hotspot`,
        ).toBe(true);
      }
      for (const h of m.hotspots) {
        expect(m.registry.get(h.partId), `${w} hotspot ${h.partId}`).toBeDefined();
        expect(h.label.fr.length, h.partId).toBeGreaterThan(0);
        expect(h.label.en.length, h.partId).toBeGreaterThan(0);
        if (h.goto)
          expect(
            WORLDS.some(([id]) => id === h.goto),
            `${h.partId} goto ${h.goto}`,
          ).toBe(true);
        expect(h.anchor, h.partId).toBeDefined();
      }
    }
  });

  it('the parts that open a world are registered where the research puts them', () => {
    for (const [part, world] of Object.entries(PART_OPENS)) {
      const home = PART_NAMES.find((p) => p.id === part)!;
      expect(home.world, part).not.toBe(world);
      expect(
        WORLDS.some(([id]) => id === world),
        world,
      ).toBe(true);
    }
    for (const w of ['farm', 'tractor', 'gasifier', 'gas-train', 'garage'] as const) expect(WORLD[w]).toBeDefined();
  });

  it('a hotspot label is a name: no figure of the machine, none of the banned words', () => {
    const banned =
      /\b(safe|safely|harmless|risk-free|foolproof|non-toxic|clean gas)\b|sûr|sans danger|sans risque|sécurisé|inoffensif|gaz propre/i;
    for (const [, m] of WORLDS)
      for (const h of m.hotspots) {
        expect(h.label.fr, h.partId).not.toMatch(banned);
        expect(h.label.en, h.partId).not.toMatch(banned);
        // but for the ends of the false-colour scale (20 and 1,400 °C: the ramp, not a size) and a year
        const plain = (t: string): string => t.replace('1940', '').replace(/^[\d\s,.\u202f\u00a0]+°C$/, '');
        expect(plain(h.label.fr), h.partId).not.toMatch(/\d/);
        expect(plain(h.label.en), h.partId).not.toMatch(/\d/);
      }
  });

  it('the hot parts’ boxes stay off the sheet while selected, and the camera still has them (R2)', () => {
    let sel: string | null = null;
    const m = createGasifierScene({ selected: () => sel });
    m.update(base, 1 / 60, view({ time: 1 }));
    m.scene.updateMatrixWorld(true);
    for (const id of GASIFIER_REFUSED) {
      sel = id;
      expect(m.registry.bounds(id).isEmpty(), `${id} selected: no box on the sheet`).toBe(true);
      expect(m.registry.frameBounds(id).isEmpty(), `${id} framed`).toBe(false);
      sel = null;
      expect(m.registry.bounds(id).isEmpty(), `${id} not selected`).toBe(false);
    }
    sel = 'spring-lid';
    expect(m.registry.bounds('spring-lid').isEmpty()).toBe(false);
    // the unit's reported envelope is on the sheet of the unit in the tractor world, not the hearth's
    for (const id of ['throat-ring', 'air-nozzles', 'fire-box', 'reduction-zone'])
      expect(GASIFIER_REFUSED.has(id), id).toBe(true);
  });
});

describe('the simulation drives the pictures: every scenario through every world, nothing that is not a number', () => {
  const sim = new GasifierSim();
  const scenarios = [
    'measured-hour',
    'part-load',
    'idling',
    'wet-chips',
    'fines',
    'filter-ageing',
    'three-engines',
    'air-leak',
    'working-shift',
    'engine-stops',
    'closed-garage',
    'truck',
  ] as const;
  it('twelve scenarios, with flows on and the door at each of its states', () => {
    for (const sc of scenarios) {
      sim.applyScenario(sc);
      for (let i = 0; i < 20; i++) sim.step(0.5);
      for (const door of ['shut', 'ajar', 'open'] as const) {
        sim.set({ door });
        sim.step(0.5);
        for (const [w, m] of WORLDS) {
          m.update(sim.state, 1 / 60, view({ time: 3, schematic: true, slowMo: 1 }));
          m.scene.updateMatrixWorld(true);
          expect(finiteTree(m.scene), `${w} ${sc} ${door}`).toBe(true);
        }
      }
    }
  });

  it('dt = 0 moves nothing, at a zero slow motion too', () => {
    const farm = mod('farm');
    const before = farm.scene.getObjectByName('drive')!.position.clone();
    farm.update(base, 0, view({ slowMo: 0 }));
    farm.update(base, 0, view({ slowMo: 1 }));
    expect(farm.scene.getObjectByName('drive')!.position.distanceTo(before)).toBe(0);
    const t = createTractorScene();
    t.update(base, 0, view());
    const a = t.machine.body.wheels.rear[0]!.spin.rotation.z;
    t.update(base, 0, view());
    expect(t.machine.body.wheels.rear[0]!.spin.rotation.z).toBe(a);
  });
});

describe('the parts come apart along sensible lines', () => {
  it('exploded, no part of a machine world goes through the floor, and every box is finite', () => {
    for (const w of ['tractor', 'gasifier', 'gas-train', 'garage'] as const) {
      const m = mod(w);
      m.registry.setAllFactors(1);
      m.update(base, 1 / 60, view({ time: 1 }));
      m.scene.updateMatrixWorld(true);
      for (const id of m.registry.ids()) {
        const b = meshBox(m.registry.get(id)!.object, (x) => !!x.userData.noShadow);
        // a plume has no solid in it: its box is empty by design
        if (b.isEmpty()) continue;
        expect(Number.isFinite(b.min.y + b.max.y), `${w} ${id}`).toBe(true);
        if (w === 'garage') continue;
        expect(b.min.y, `${w} ${id} below the floor`).toBeGreaterThan(w === 'gasifier' ? -0.01 : -0.01);
      }
      m.registry.setAllFactors(0);
      m.update(base, 1 / 60, view({ time: 1 }));
    }
  });

  it('the explode of the unit leaves each part along a line that is free: up, out of the open side, or along its fitting', () => {
    const m = mod('gasifier');
    for (const id of m.registry.ids()) {
      const e = m.registry.get(id)!;
      // never down through the stand, never through the cut half (towards +z, behind the section)
      expect(e.explode.y, id).toBeGreaterThanOrEqual(-1e-9);
      expect(e.explode.z, id).toBeLessThanOrEqual(1e-9);
    }
  });

  it('isolating one part takes the scenery that stood with the others', () => {
    const m = mod('gas-train') as SceneModule<GasState> & { unit?: unknown };
    isolateOne(m.registry, 'filter-box', 'hidden');
    m.update(base, 1 / 60, view({ time: 1 }));
    const unit = m.scene.getObjectByName('unit')!;
    expect(unit.visible).toBe(false);
    expect(m.scene.getObjectByName('filter-stand')!.visible).toBe(true);
    for (const id of m.registry.ids()) m.registry.setDisplay(id, 'solid');
    m.update(base, 1 / 60, view({ time: 1 }));
    expect(unit.visible).toBe(true);
  });
});

describe('the garage is the model’s room', () => {
  it('free air plus the machine is the drawn room, at both of the model’s volumes and in between', () => {
    for (const v of [GARAGE.smallM3, 200, 500, GARAGE.largeM3]) {
      const g = garageFor(v);
      const err = Math.abs(grossVolume(g) - GARAGE.machineM3 - v) / v;
      expect(err, `${v} m³`).toBeLessThan(0.01);
    }
  });

  it('the tractor fits in the small garage with room to spare and stands on its floor, nose in', () => {
    const m = createGarageScene();
    m.update(base, 1 / 60, view({ time: 1 }));
    m.scene.updateMatrixWorld(true);
    const park = m.scene.getObjectByName('parked')!;
    const b = meshBox(park, (x) => !!x.userData.noShadow);
    const { w, d, h } = m.building.dims;
    expect(b.min.x).toBeGreaterThan(-w / 2 + 0.05);
    expect(b.max.x).toBeLessThan(w / 2 - 0.05);
    expect(b.min.z).toBeGreaterThan(0.05);
    expect(b.max.z).toBeLessThan(d - 0.05);
    expect(b.max.y).toBeLessThan(h - 0.05);
    expect(Math.abs(b.min.y)).toBeLessThan(0.003);
  });

  it('the room follows the model’s volume, and the door its state', () => {
    const m = createGarageScene();
    const small = m.building.dims.d;
    m.update({ ...base, garageVolume: 1000 }, 1 / 60, view());
    expect(m.building.dims.d).toBeGreaterThan(small * 2);
    m.update({ ...base, garageVolume: 50 }, 1 / 60, view());
    expect(Math.abs(m.building.dims.d - small)).toBeLessThan(1e-6);
    m.update({ ...base, door: 'open' }, 1 / 60, view());
    expect(m.building.door.leaves[0]!.rotation.y).toBeCloseTo((Math.PI / 2) * DOOR_OPEN.open, 6);
    m.update({ ...base, door: 'shut' }, 1 / 60, view());
    expect(m.building.door.leaves[0]!.rotation.y).toBeCloseTo(0, 6);
  });

  it('after a stop the plume shows in proportion to the model’s flow; before it, none', () => {
    const m = createGarageScene();
    const stopped = stateWith({ engineOn: false, pressureSign: 'pressure', plumeShare: 0.8, plumeVisible: true });
    m.update(stopped, 1 / 60, view({ time: 2 }));
    const post = m.scene.getObjectByName('post-gas-plume')!;
    const pts = post.children.find((c) => (c as THREE.Points).isPoints) as THREE.Points;
    const share = (pts.material as THREE.ShaderMaterial).uniforms.uShare!.value as number;
    expect(share).toBeCloseTo(0.8, 6);
    m.update(base, 1 / 60, view({ time: 2 }));
    expect((pts.material as THREE.ShaderMaterial).uniforms.uShare!.value).toBe(0);
    // the same clock gives the same picture
    m.update(stopped, 1 / 60, view({ time: 5 }));
    const t1 = (pts.material as THREE.ShaderMaterial).uniforms.uTime!.value as number;
    m.update(stopped, 1 / 60, view({ time: 5 }));
    expect((pts.material as THREE.ShaderMaterial).uniforms.uTime!.value).toBe(t1);
  });

  it('there is no person in the room: no mesh of a body, nothing named for one', () => {
    const m = mod('garage');
    m.scene.traverse((o) =>
      expect(o.name.toLowerCase(), o.name).not.toMatch(/person|human|man$|woman|child|body|head$|face$/),
    );
  });
});

describe('the farm', () => {
  it('the tractor goes round a loop inside the field, at the model’s speed, continuously', () => {
    expect(LOOP_LENGTH).toBeGreaterThan(100);
    let prev = loopAt(0);
    for (let s = 0.5; s < LOOP_LENGTH + 1; s += 0.5) {
      const p = loopAt(s);
      expect(Math.hypot(p.x - prev.x, p.z - prev.z), `s=${s}`).toBeLessThan(0.55);
      expect(p.z).toBeGreaterThan(FARM.field.z0 + 3);
      expect(p.z).toBeLessThan(FARM.field.z1);
      expect(Math.abs(p.x)).toBeLessThan(FARM.field.x1);
      expect(Math.hypot(p.hx, p.hz)).toBeCloseTo(1, 6);
      prev = p;
    }
    const farm = createFarmScene();
    const drive = farm.scene.getObjectByName('drive')!;
    farm.update(base, 1 / 60, view());
    const p0 = drive.position.clone();
    farm.update(base, 10, view());
    // the model's ground speed times the time (the step is the frame's: 10 s asked, but a frame is a frame)
    expect(drive.position.distanceTo(p0)).toBeGreaterThan(5);
    expect(base.groundSpeedMs).toBeGreaterThan(0);
  });

  it('the tractor stands while the engine is stopped and while it is the part selected', () => {
    const farm = createFarmScene({ selected: () => 'wood-gas-tractor' });
    farm.update(base, 1 / 60, view());
    const drive = farm.scene.getObjectByName('drive')!;
    const p0 = drive.position.clone();
    farm.update(base, 5, view());
    expect(drive.position.distanceTo(p0)).toBe(0);
    const farm2 = createFarmScene();
    farm2.update(stateWith({ engineOn: false }), 1 / 60, view());
    const d2 = farm2.scene.getObjectByName('drive')!;
    const q0 = d2.position.clone();
    farm2.update(stateWith({ engineOn: false }), 5, view());
    expect(d2.position.distanceTo(q0)).toBe(0);
  });

  it('the buildings stand on flat land and the trees on the land', () => {
    for (const [x, z, w, d] of [
      [FARM.house.x, FARM.house.z, FARM.house.w, FARM.house.d],
      [FARM.barn.x, FARM.barn.z, FARM.barn.w, FARM.barn.d],
    ] as const) {
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          expect(Math.abs(terrainHeight(x + (sx * w) / 2, z + (sz * d) / 2)), `${x},${z}`).toBeLessThan(0.3);
    }
    const farm = createFarmScene();
    farm.scene.updateMatrixWorld(true);
    for (const id of ['farmhouse', 'chip-barn']) {
      const b = meshBox(farm.registry.get(id)!.object);
      expect(b.min.y, id).toBeLessThan(0.05);
      expect(b.min.y, id).toBeGreaterThan(-1.0);
    }
  });

  it('every prop rests on the ground within a few centimetres', () => {
    const farm = createFarmScene();
    farm.scene.updateMatrixWorld(true);
    for (const id of ['drum-chipper', 'chip-sieve', 'ash-bin', 'condensate-barrel']) {
      const o = farm.registry.get(id)!.object;
      const b = meshBox(o, (m) => !!m.userData.noShadow);
      const ground = Math.min(
        terrainHeight(b.min.x, b.min.z),
        terrainHeight(b.max.x, b.max.z),
        terrainHeight((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2),
      );
      expect(Math.abs(b.min.y - ground), id).toBeLessThan(0.06);
    }
  });

  it('the crusher is 4 m wide, behind the tractor, its rod from the tractor’s pin to its hitch', () => {
    const farm = createFarmScene();
    farm.update(base, 1 / 60, view());
    farm.scene.updateMatrixWorld(true);
    const b = meshBox(farm.registry.get('clod-crusher')!.object);
    const size = b.getSize(new THREE.Vector3());
    expect(Math.max(size.x, size.z)).toBeGreaterThan(FARM.crusher.width - 0.1);
    const link = farm.scene.children.find(
      (c) => (c as THREE.Mesh).isMesh && (c as THREE.Mesh).geometry.type === 'CylinderGeometry' && c.scale.y > 0.2,
    ) as THREE.Mesh | undefined;
    expect(link).toBeDefined();
    // the rod's ends: the tractor's pin and the crusher's hitch
    const pin = new THREE.Vector3(-0.84, 0.54, 0);
    farm.scene.getObjectByName('drive')!.localToWorld(pin);
    const a = new THREE.Vector3(0, 0.5, 0);
    const end1 = link!.localToWorld(a.set(0, 0.5, 0));
    const end2 = link!.localToWorld(new THREE.Vector3(0, -0.5, 0));
    expect(Math.min(end1.distanceTo(pin), end2.distanceTo(pin))).toBeLessThan(0.02);
    expect(TRACTOR.mass).toBeGreaterThan(0);
  });
});

describe('the pictures carry no text and no timer', () => {
  it('no canvas, no text in a texture, no wall clock in a world', () => {
    const sources = import.meta.glob('./**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
      string,
      string
    >;
    for (const [file, text] of Object.entries(sources)) {
      if (file.endsWith('.test.ts')) continue;
      expect(text, file).not.toMatch(
        /canvasTexture\(|new THREE\.CanvasTexture|fillText|document\.createElement\('canvas'\)/,
      );
      expect(text, file).not.toMatch(/Date\.now\(|performance\.now\(|setInterval\(|setTimeout\(|Math\.random\(/);
    }
  });
});

describe('budgets (docs/3d.md §Budgets)', () => {
  const BUDGET: Record<WorldId, { calls: number; triangles: number }> = {
    farm: { calls: 500, triangles: 1_500_000 },
    tractor: { calls: 450, triangles: 700_000 },
    gasifier: { calls: 220, triangles: 400_000 },
    'gas-train': { calls: 520, triangles: 800_000 },
    garage: { calls: 520, triangles: 800_000 },
  };
  it('the colour pass of each world is under its budget', () => {
    for (const [w, m] of WORLDS) {
      const s = drawStats(m.scene);
      expect(s.calls, `${w} calls ${s.calls}`).toBeLessThan(BUDGET[w].calls);
      expect(s.triangles, `${w} triangles ${s.triangles}`).toBeLessThan(BUDGET[w].triangles);
    }
  });
});
