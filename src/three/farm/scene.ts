import * as THREE from 'three';
import { group, mesh, rng } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { FARM, GARAGE, UNIT, UNIT_AT } from '../dims';
import { Followers } from '../followers';
import { dynamic, mergeStatic } from '../merge';
import { chipsMap, concreteMap, tiled } from '../textures';
import { buildGarageBuilding } from '../garage/building';
import { DOOR_OPEN } from '../garage/scene';
import { makePlume } from '../garage/plume';
import { clamp } from '@onigam/lab-kit/three';
import { buildMachine, type Machine } from '../tractor/tractor';
import { WorldRegistry, anchor, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { buildBarn, buildFarmhouse } from './buildings';
import {
  buildAshBin,
  buildBales,
  buildBarrel,
  buildChipper,
  buildCrusher,
  buildFence,
  buildLadder,
  buildPallets,
  buildSieve,
  buildStoneWall,
  buildTyres,
  buildWheelbarrow,
  buildWoodpile,
  place,
} from './props';
import { FlowDots } from '../flows';
import { createSky } from './sky';
import { buildTerrain, terrainHeight } from './terrain';
import { buildTrees } from './trees';
import { v3 } from '../common';
import type { GasParams, GasState } from '../../sim/types';

// `farm`: the setting. A large farm in southern Sweden around 1970, where the machine worked: a yard of gravel with the red house, its garage and the chip barn; the drum chipper and the sieve where the fuel starts; the woodpile, the ash bin and the barrel
// of black water; a ditch between the yard and the big field, where a tractor with its clod crusher goes round at the speed the model gives. The sun follows the model's clock. Everything is procedural (docs/scenery.md), nothing is a stand-in: the tractor is the
// machine of the other worlds, drawn by the same function.

export interface FarmOptions {
  params?: () => GasParams;
  selected?: () => string | null;
}

export const FARM_IDS = [
  'wood-gas-tractor',
  'chip-barn',
  'drum-chipper',
  'chip-sieve',
  'clod-crusher',
  'farmhouse',
  'farm-garage',
  'ash-bin',
  'condensate-barrel',
  'field-ditch',
] as const;
export type FarmId = (typeof FARM_IDS)[number];

/** The part whose box, printed as « Encombrement », comes out at a length the lab withholds, to the figure that is printed, at some moment of the tractor's loop (`encombrement.test.ts` finds it): its sheet does not print it, the camera still frames it. */
export const FARM_REFUSED: ReadonlySet<string> = new Set(['clod-crusher']);

const HOTSPOTS: HotspotDef[] = [
  { id: 'wood-gas-tractor', fr: 'Tracteur à gaz de bois', en: 'Wood-gas tractor', goto: 'tractor' },
  { id: 'chip-barn', fr: 'Grange à plaquettes', en: 'Chip barn' },
  { id: 'drum-chipper', fr: 'Déchiqueteuse', en: 'Drum chipper', minor: true },
  { id: 'chip-sieve', fr: 'Crible', en: 'Chip sieve', minor: true },
  { id: 'clod-crusher', fr: 'Brise-mottes', en: 'Clod crusher', minor: true },
  { id: 'farmhouse', fr: 'Maison', en: 'Farmhouse' },
  { id: 'farm-garage', fr: 'Garage', en: 'Farm garage', goto: 'garage' },
  { id: 'ash-bin', fr: 'Bac à cendres', en: 'Ash bin', minor: true },
  { id: 'condensate-barrel', fr: 'Fût de condensats', en: 'Condensate barrel', minor: true },
  // minor: the tractor drives along the ditch on its loop, and its name, which goes with it, would cross this one at some moment of the day at 390 px; the ditch's name shows with « all labels » and when it is selected
  { id: 'field-ditch', fr: 'Fossé', en: 'Field ditch', minor: true },
];

/** Where each part of the yard stands, to keep the way it is looked at free of trees. */
const PART_AT: Partial<Record<FarmId, { x: number; z: number }>> = {
  'chip-barn': FARM.barn,
  'drum-chipper': FARM.chipper,
  'chip-sieve': FARM.sieve,
  farmhouse: FARM.house,
  'farm-garage': FARM.garage,
  'ash-bin': FARM.ashBin,
  'condensate-barrel': FARM.barrel,
  'field-ditch': { x: 21, z: FARM.ditch.z },
};

/** Where the tractor is looked at from, in its own frame (x forward, z to its right): in front, a little above, on its left, where the unit stands. The world turns it with the tractor's heading every frame. */
const TRACTOR_VIEW_T = new THREE.Vector3(
  Math.cos(0.3) * Math.cos(1.05),
  Math.sin(0.3),
  -Math.cos(0.3) * Math.sin(1.05),
);

const FRAMING: Record<FarmId, PartFraming> = {
  // the frame is the tractor's own box about where it stands now, set every frame (the whole part's box would carry the camera back by the towbar and the gas of its plume)
  'wood-gas-tractor': {
    viewDir: viewFrom(16, 330),
    frame: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1)),
  },
  'chip-barn': { viewDir: viewFrom(14, 10) },
  'drum-chipper': { viewDir: viewFrom(18, 20) },
  'chip-sieve': { viewDir: viewFrom(18, 340) },
  'clod-crusher': { viewDir: viewFrom(18, 340) },
  farmhouse: { viewDir: viewFrom(12, 15) },
  'farm-garage': { viewDir: viewFrom(12, 25) },
  'ash-bin': { viewDir: viewFrom(20, 30) },
  'condensate-barrel': { viewDir: viewFrom(18, 40) },
  // the ditch is 420 m long: a stretch with the track's culvert is what a click brings the camera to
  'field-ditch': {
    viewDir: viewFrom(38, 190),
    frame: new THREE.Box3(new THREE.Vector3(10, -1.2, 6.2), new THREE.Vector3(31, 2.0, 11)),
  },
};

/** True where a crown would stand between the eye and a part: within 7 m of the line from the part along the way the camera looks at it, from 2 to 70 m out. */
export function blocksSight(x: number, z: number): boolean {
  for (const id of FARM_IDS) {
    const at = PART_AT[id];
    const dir = FRAMING[id].viewDir;
    if (!at || !dir) continue;
    const h = Math.hypot(dir.x, dir.z) || 1;
    const dx = dir.x / h;
    const dz = dir.z / h;
    const rx = x - at.x;
    const rz = z - at.z;
    const along = rx * dx + rz * dz;
    const across = Math.abs(rx * dz - rz * dx);
    if (along > 2 && along < 70 && across < 7) return true;
  }
  return false;
}

/**
 * The hour a film asks the farm's sun to stand at, or null for the model's own day (the clock from `FARM.dayStart`, 06:30, held at 15:24 over a clock of ×600). A film sets it with `?hour=19.5` in the address (read once, when the world is built) or live with
 * `scene.userData.filmHour = 19.5`; the sun then stands at that hour whatever the clock does (a film's clock runs fast: a day would race past it). Nothing else reads it: the model's day is unchanged.
 */
export function filmHourOf(scene: THREE.Scene, fromAddress: number | null = urlHour()): number | null {
  const live = scene.userData.filmHour;
  if (typeof live === 'number' && live >= 0 && live < 24) return live;
  return fromAddress;
}

function urlHour(): number | null {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search).get('hour');
  const v = q === null || q.trim() === '' ? NaN : Number(q);
  return Number.isFinite(v) && v >= 0 && v < 24 ? v : null;
}

/** The loop the tractor drives: a rounded rectangle, parameterised by the distance along it. */
export function loopAt(s: number): { x: number; z: number; hx: number; hz: number } {
  const { x: cx, z: cz, len, r } = FARM.loop;
  const half = len / 2;
  const arc = Math.PI * r;
  const P = 2 * len + 2 * arc;
  let u = ((s % P) + P) % P;
  // 1: along +x on the near side (z = cz − r), 2: the end at +x, 3: back along −x on the far side, 4: the end at −x
  if (u < len) return { x: cx - half + u, z: cz - r, hx: 1, hz: 0 };
  u -= len;
  if (u < arc) {
    const a = -Math.PI / 2 + u / r;
    return { x: cx + half + Math.cos(a) * r, z: cz + Math.sin(a) * r, hx: -Math.sin(a), hz: Math.cos(a) };
  }
  u -= arc;
  if (u < len) return { x: cx + half - u, z: cz + r, hx: -1, hz: 0 };
  u -= len;
  const a = Math.PI / 2 + u / r;
  return { x: cx - half + Math.cos(a) * r, z: cz + Math.sin(a) * r, hx: -Math.sin(a), hz: Math.cos(a) };
}

export const LOOP_LENGTH = 2 * FARM.loop.len + 2 * Math.PI * FARM.loop.r;

/** The ditch's water: a ribbon along the bottom, its UVs running along x so that the flow can be scrolled. Decoration: nothing in the model says how the ditch runs (docs/water.md). */
function ditchWater(x0: number, x1: number, shared?: THREE.DataTexture): { mesh: THREE.Mesh; map: THREE.DataTexture } {
  const N = Math.max(4, Math.round((x1 - x0) / 2));
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const y = -FARM.ditch.depth + 0.28;
  const wHalf = FARM.ditch.width / 2 + 0.28 * FARM.ditch.slope * 0.9;
  for (let i = 0; i <= N; i++) {
    const x = x0 + (i * (x1 - x0)) / N;
    for (const s of [-1, 1]) {
      pos.push(x, y, FARM.ditch.z + s * wHalf);
      uv.push(x * 0.3, s > 0 ? 1 : 0);
    }
    if (i < N) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // a small ripple map: streaks along the flow, darker in the middle
  const S = 64;
  const d = new Uint8Array(S * S * 4);
  const r = rng(3);
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const k = (j * S + i) * 4;
      const streak = 0.5 + 0.5 * Math.sin((i / S) * Math.PI * 2 * 4 + Math.sin((j / S) * Math.PI * 2 * 2) * 1.2);
      const v = 70 + 30 * streak + 8 * r();
      d[k] = v * 0.7;
      d[k + 1] = v * 0.85;
      d[k + 2] = v;
      d[k + 3] = 255;
    }
  const map = shared ?? new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  if (!shared) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
  }
  const m = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({
      map,
      color: 0x6f8a86,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.86,
    }),
  );
  m.name = 'ditch-water';
  m.receiveShadow = true;
  return { mesh: m, map };
}

/** Rushes and sedge along the ditch's banks: instanced blades. */
function reeds(x0: number, x1: number, n: number, seed: number): THREE.Object3D {
  const r = rng(seed);
  const blade = new THREE.PlaneGeometry(0.06, 1);
  blade.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(
    blade,
    new THREE.MeshStandardMaterial({ color: 0x6f8a3a, side: THREE.DoubleSide, roughness: 0.9 }),
    n,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const side = r() > 0.5 ? 1 : -1;
    const off = FARM.ditch.width / 2 + 0.25 + r() * 0.7;
    const z = FARM.ditch.z + side * off;
    const h = 0.5 + 0.9 * r();
    e.set((r() - 0.5) * 0.4, r() * Math.PI, (r() - 0.5) * 0.5);
    q.setFromEuler(e);
    m.compose(v3(x, terrainHeight(x, z), z), q, v3(1, h, 1));
    im.setMatrixAt(i, m);
    const t = 0.7 + 0.5 * r();
    col.setRGB(t * 0.8, t, t * 0.45);
    im.setColorAt(i, col);
  }
  im.castShadow = false;
  im.name = 'reeds';
  return im;
}

const UP = new THREE.Vector3(0, 1, 0);

export interface FarmScene extends SceneModule<GasState> {
  machine: Machine;
}

export function createFarmScene(opts: FarmOptions = {}): FarmScene {
  const scene = new THREE.Scene();
  scene.name = 'farm';
  // the sky gives the world its own environment (docs/scenery.md); the look is the labs' day light
  scene.userData.look = { exposure: 1.1, ao: true, aoRadius: 0.9 };
  const sky = createSky(scene);
  const land = buildTerrain();
  scene.add(land.mesh);
  const trees = buildTrees(blocksSight);
  scene.add(trees.group);
  const registry = new WorldRegistry(FARM_REFUSED, opts.selected ?? (() => null));
  const followers = new Followers();
  const scenery = group('scenery');
  scene.add(scenery);

  // ---- buildings
  const house = buildFarmhouse();
  house.group.position.x = FARM.house.x;
  house.group.position.z = FARM.house.z;
  scene.add(house.group);
  const barn = buildBarn();
  barn.group.position.x = FARM.barn.x;
  barn.group.position.z = FARM.barn.z;
  scene.add(barn.group);
  // the garage, attached to the house's east gable: the same building that `garage` shows cut open, here roofed, its door to the south
  const gar = buildGarageBuilding({ roof: true, volume: GARAGE.smallM3 });
  const farmGarage = group('farm-garage');
  farmGarage.userData.partId = 'farm-garage';
  farmGarage.add(gar.shell, gar.above, gar.roof);
  farmGarage.rotation.y = Math.PI;
  farmGarage.position.set(FARM.garage.x, 0, FARM.garage.z);
  scene.add(farmGarage);

  // ---- the fuel's places
  const chipper = buildChipper();
  place(chipper.group, FARM.chipper.x, FARM.chipper.z, 0.25, 1.4);
  scene.add(chipper.group);
  const sieve = buildSieve();
  place(sieve.group, FARM.sieve.x, FARM.sieve.z, -0.2, 1.4);
  scene.add(sieve.group);
  // the chip pile under the chute: a mound of chips
  const pileG = new THREE.SphereGeometry(1, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  {
    const p = pileG.attributes.position as THREE.BufferAttribute;
    const rr = rng(4);
    for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (0.9 + 0.2 * rr()));
    pileG.computeVertexNormals();
    // UVs in metres on a unit sphere that will be scaled: planar
    const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      uv[i * 2] = p.getX(i) * 2.2;
      uv[i * 2 + 1] = p.getZ(i) * 2.2;
    }
    pileG.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
  const pile = mesh(
    pileG,
    new THREE.MeshStandardMaterial({ color: 0xe4cf9f, map: tiled(chipsMap(), 0.8, 0.8), roughness: 1 }),
  );
  pile.scale.set(2.2, 1.5, 2.0);
  place(pile, FARM.chipPile.x, FARM.chipPile.z, 0, 1.4);
  pile.position.y -= 0.05;
  dynamic(pile);
  scene.add(pile);
  const wood = buildWoodpile();
  place(wood, FARM.woodpile.x, FARM.woodpile.z, Math.PI / 2, 2);
  scene.add(wood);
  const ash = buildAshBin();
  place(ash.group, FARM.ashBin.x, FARM.ashBin.z, 0.2, 0.7);
  scene.add(ash.group);
  const barrel = buildBarrel();
  place(barrel.group, FARM.barrel.x, FARM.barrel.z, 0.5, 0.4);
  scene.add(barrel.group);

  // ---- walls, fences, small things: the yard's life
  const lane = buildStoneWall(60, 3);
  place(lane, 36, -4.9, 0.0, 1);
  scene.add(lane);
  const wall2 = buildStoneWall(30, 8);
  place(wall2, -24, 3.6, 0.0, 1);
  scene.add(wall2);
  const fence = buildFence(150);
  place(fence, 0, FARM.field.z0 - 1.5, 0, 1);
  scene.add(fence);
  const fence2 = buildFence(60);
  place(fence2, -8, -30, 0, 1);
  scene.add(fence2);
  const props: [THREE.Group, number, number, number][] = [
    [buildWheelbarrow(), -13.5, -3.2, 0.7],
    [buildLadder(4.4), 7.8, -16.5, 0.0],
    [buildBales(5), 12.5, -15.8, 0.2],
    [buildPallets(), 24.5, -15.5, 0.1],
    [buildTyres(), 14.6, -6.8, 0.0],
  ];
  props.forEach(([p, x, z, yaw]) => {
    place(p, x, z, yaw, 0.8);
    scenery.add(p);
  });
  // the ladder leans on the barn's front
  props[1]![0].rotation.z = 0.0;
  props[1]![0].rotation.y = Math.PI / 2;
  props[1]![0].rotation.x = 0.0;
  // a clothesline between two posts, a mailbox at the lane's end
  const posts = group('line');
  posts.add(
    mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b5238 }),
      [0, 1.1, 0],
    ),
  );
  posts.add(
    mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b5238 }),
      [6, 1.1, 0],
    ),
  );
  posts.add(
    mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 6, 4).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xcfcfcf }),
      [3, 2.05, 0],
    ),
  );
  for (const x of [1.0, 1.9, 2.6, 3.6, 4.7])
    posts.add(
      mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.01),
        new THREE.MeshStandardMaterial({ color: x > 3 ? 0xf0eee6 : 0x9bb0c4, roughness: 1, side: THREE.DoubleSide }),
        [x, 1.68, 0],
      ),
    );
  place(posts, -26, -16, 0.1, 1);
  scenery.add(posts);
  const mail = group('mailbox');
  mail.add(
    mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), new THREE.MeshStandardMaterial({ color: 0x5b4330 }), [0, 0.55, 0]),
  );
  mail.add(
    mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x9c2f2a, roughness: 0.6 }),
      [0, 1.2, 0],
    ),
  );
  place(mail, 60, -2.0, 0, 0.3);
  scenery.add(mail);

  // ---- the ditch: its water, its reeds, a culvert where the field track crosses
  const water = ditchWater(-30, 50);
  const ditch = group('field-ditch');
  ditch.userData.partId = 'field-ditch';
  ditch.add(water.mesh);
  ditch.add(reeds(-30, 50, 420, 12));
  // the rest of the ditch, scenery: it runs on to the east and the west, to something
  for (const [a, b] of [
    [-130, -30],
    [50, 130],
  ] as const) {
    const far = ditchWater(a, b, water.map);
    scenery.add(far.mesh);
    scenery.add(reeds(a, b, 500, 13 + a));
  }
  // the culvert's mouth at each side of the track
  for (const x of [FARM.track.x - 3.4, FARM.track.x + 3.4]) {
    ditch.add(
      mesh(
        new THREE.CylinderGeometry(0.46, 0.46, 0.5, 18, 1, true).rotateZ(Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: 0x9a968c,
          map: tiled(concreteMap(), 1, 1),
          roughness: 0.95,
          side: THREE.DoubleSide,
        }),
        [x, -FARM.ditch.depth + 0.46, FARM.ditch.z],
      ),
    );
  }
  scene.add(ditch);

  // ---- the tractor, and the crusher it tows
  const machine = buildMachine();
  // the registry puts a part back at its base position every frame (the explode): what moves is a child of a part that stays
  const tractorPart = group('wood-gas-tractor');
  tractorPart.userData.partId = 'wood-gas-tractor';
  const drive = group('drive');
  drive.add(machine.root);
  tractorPart.add(drive);
  scene.add(tractorPart);
  const crusher = buildCrusher();
  const crusherPart = group('clod-crusher');
  crusherPart.userData.partId = 'clod-crusher';
  crusherPart.add(crusher.group);
  scene.add(crusherPart);
  // the link: a rod from the tractor's pin to the crusher's hitch, drawn between them every frame
  const link = mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
    new THREE.MeshStandardMaterial({ color: 0x3d3a36, roughness: 0.6, metalness: 0.6 }),
  );
  link.castShadow = true;
  dynamic(link);
  scene.add(link);
  // the sun's smoke: the chimney of the house
  const chimney = v3(FARM.house.x + FARM.house.w / 2 - 2.0, FARM.house.wall + 2.7 + 1.6, FARM.house.z);
  const smoke = makePlume({
    origin: chimney,
    color: 0xd6d6d0,
    rise: 5,
    spread: 1.6,
    n: 60,
    size: 3.5,
    speed: 0.04,
    seed: 9,
  });
  scene.add(smoke.points);
  // the gas of a stopped tractor: it leaves at the primary-air intake and the lid for as long as the model says (`plumeShare`), a column the size of a man at the tractor and a thin white-yellow veil against the field from a long way. It rides with the tractor (a child of its group,
  // in its own frame). The shape is ours, how much leaves is the model's (docs/water.md); a running tractor shows none
  const stopEye = v3(1.38, UNIT_AT.y + 0.18, -1.16 - 0.068);
  const stopLid = v3(UNIT_AT.x, UNIT.top + UNIT_AT.y, UNIT_AT.z);
  const stopPlumes = [
    makePlume({ origin: stopEye, color: 0xf2eddc, rise: 3.4, spread: 1.7, n: 260, size: 1.9, speed: 0.07, seed: 15 }),
    makePlume({ origin: stopLid, color: 0xefe7c4, rise: 2.6, spread: 1.3, n: 180, size: 1.6, speed: 0.06, seed: 16 }),
  ];
  for (const pl of stopPlumes) drive.add(pl.points);

  // ---- registered parts
  const groups: Record<FarmId, THREE.Object3D> = {
    'wood-gas-tractor': tractorPart,
    'chip-barn': barn.group,
    'drum-chipper': chipper.group,
    'chip-sieve': sieve.group,
    'clod-crusher': crusherPart,
    farmhouse: house.group,
    'farm-garage': farmGarage,
    'ash-bin': ash.group,
    'condensate-barrel': barrel.group,
    'field-ditch': ditch,
  };
  // Where each name stands, in its part's own frame. The names of the buildings are raised and drawn to one side so that none lies on another at home, at 1280, 768 and 390 px (the first set stood the house's name under the garage's: docs/qa.md D17); each still stands on or over the part it names.
  const anchorAt: Record<FarmId, [number, number, number]> = {
    'wood-gas-tractor': [0.6, 3.5, 0],
    'chip-barn': [-4.6, FARM.barn.wall + 4, FARM.barn.d / 2 + 0.6],
    'drum-chipper': [0.2, 3.1, 0],
    'chip-sieve': [0, 2.4, 0],
    'clod-crusher': [0.0, 1.2, 0],
    farmhouse: [-0.5, FARM.house.wall + 6, FARM.house.d / 2 - 2.3],
    'farm-garage': [-0.45, 3.6, -0.6],
    'ash-bin': [0, 1.2, 0],
    'condensate-barrel': [0, 1.5, 0],
    'field-ditch': [-6, 1.2, FARM.ditch.z],
  };
  const anchors: Record<string, THREE.Object3D> = {};
  for (const id of FARM_IDS) {
    const g = groups[id];
    registry.add(id, g, new THREE.Vector3(0, 0, 0), undefined, FRAMING[id]);
    const a = anchorAt[id];
    const host = id === 'wood-gas-tractor' ? drive : id === 'clod-crusher' ? crusher.group : g;
    anchors[id] = anchor(host, a[0], a[1], a[2], `anchor-${id}`);
  }
  // scenery follows: the pile with the chipper, the ladder with the barn, the rest by the land
  followers.add('drum-chipper', pile, { shell: false, explode: 0 });
  followers.add('chip-barn', props[1]![0], { shell: false, explode: 0 });
  followers.add('chip-barn', props[2]![0], { shell: false, explode: 0 });
  followers.add('wood-gas-tractor', link, { shell: false, explode: 0 });
  registry.overview(() => [new THREE.Box3(new THREE.Vector3(-30, -1, -28), new THREE.Vector3(36, 8, 34))]);

  // ---- « Flux »: the fuel's way and what comes out of the machine, for the eye (the speed is nowhere the true one)
  const flows = new FlowDots(900, 0.34, 0.012, true);
  scene.add(flows.object);
  const at = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);
  const woodAt = at(FARM.woodpile.x, 1.3, FARM.woodpile.z);
  const chipperIn = at(FARM.chipper.x - 2.4, 1.2, FARM.chipper.z);
  const chute = at(FARM.chipper.x + 1.7, 2.3, FARM.chipper.z);
  const pileTop = at(FARM.chipPile.x, 1.6, FARM.chipPile.z);
  const sieveIn = at(FARM.sieve.x - 1.7, 2.0, FARM.sieve.z);
  const sieveOut = at(FARM.sieve.x + 0.1, 0.4, FARM.sieve.z);
  const barnDoor = at(FARM.barn.x, 1.8, FARM.barn.z + FARM.barn.d / 2 + 0.5);
  const barnIn = at(FARM.barn.x - 1.0, 1.6, FARM.barn.z + FARM.barn.d / 2 - 3.5);
  const bin = at(FARM.ashBin.x, 1.0, FARM.ashBin.z);
  const barrelTop = at(FARM.barrel.x, 1.3, FARM.barrel.z);
  const mid = (a: THREE.Vector3, b: THREE.Vector3, up = 3): THREE.Vector3 =>
    a
      .clone()
      .lerp(b, 0.5)
      .add(at(0, up, 0));
  const fixed: [THREE.Vector3[], number][] = [
    [[woodAt, mid(woodAt, chipperIn, 2), chipperIn], 0xe2cfa4],
    [[chute, mid(chute, pileTop, 1), pileTop], 0xd9b36a],
    [[pileTop, mid(pileTop, sieveIn, 2), sieveIn], 0xd9b36a],
    [[sieveOut, mid(sieveOut, barnDoor, 2), barnDoor, barnIn], 0xd9b36a],
  ];
  for (const [pts, c] of fixed) flows.add({ points: pts, color: c, spacing: 0.7 });
  // the three that end on the tractor, which moves: chips to its rack, ash to the bin, black water to the barrel (rebuilt each frame)
  const rack = at(0, 3.3, 0);
  const base = at(UNIT_AT.x, 0.6, UNIT_AT.z);
  const dyn = [
    flows.add({ points: [barnDoor, at(0, 3, 0), rack], color: 0xd9b36a, spacing: 1.4 }),
    flows.add({ points: [base, at(0, 1, 0), bin], color: 0xa9a6a0, spacing: 1.4 }),
    flows.add({ points: [base, at(0, 1, 0), barrelTop], color: 0x4a3322, spacing: 1.4 }),
  ];
  const tr = new THREE.Vector3();
  const tb = new THREE.Vector3();
  const hs: Hotspot[] = hotspots(HOTSPOTS, anchors);
  let s = 0;
  let waterFlow = 0;
  const tmp = new THREE.Vector3();
  const pin = new THREE.Vector3();
  const hitch = new THREE.Vector3();
  void UNIT;
  void mergeStatic;

  // the sun's shadow box follows what the camera looks at when it is near it: 2,048 texels over 240 m are 12 cm each, a blur under a tyre; over 40 m they are 2 cm. From the overview it is the whole yard, as before
  const camAt = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const focusAt = new THREE.Vector3();
  scene.onBeforeRender = (_r, _s, camera) => {
    if (!(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    camera.getWorldPosition(camAt);
    camera.getWorldDirection(camDir);
    // where the line of sight meets the ground, or 30 m ahead when it does not
    const t = camDir.y < -0.05 ? Math.min(150, -camAt.y / camDir.y) : 30;
    focusAt.copy(camAt).addScaledVector(camDir, t);
    const half = t < 45 ? clamp(t * 1.5, 12, 60) : 120;
    sky.focusShadow(focusAt, half, 12);
  };

  return {
    id: 'farm',
    scene,
    registry,
    hotspots: hs,
    machine,
    home: { position: new THREE.Vector3(14, 52, 50), target: new THREE.Vector3(4, 0.5, -8) },
    minDistance: 1.2,
    maxDistance: 420,
    near: 0.1,
    far: 5000,
    declutter: true,
    homePadding: 1.0,
    update(state: GasState, dt: number, view: ViewOpts) {
      const p = opts.params?.();
      const sel = opts.selected?.() ?? null;
      // the sun: the model's clock from the farm's day start; at a fast clock the light holds
      const film = filmHourOf(scene);
      const hour = film ?? (FARM.dayStart + state.hour) % 24;
      sky.update(hour, view.time, 170, film === null && (p?.timeScale ?? 60) >= 600);
      // the tractor goes round at the model's ground speed while it works, and stands while the engine does not, or while it is the one selected
      const moving = state.engineOn && sel !== 'wood-gas-tractor' && sel !== 'clod-crusher';
      if (moving) s += state.groundSpeedMs * dt * view.slowMo;
      const at = loopAt(s);
      const yaw = -Math.atan2(at.hz, at.hx);
      drive.position.set(at.x, terrainHeight(at.x, at.z), at.z);
      drive.rotation.y = yaw;
      // the part is looked at from the side of the unit, wherever on its loop the tractor stands
      const tp = registry.get('wood-gas-tractor');
      tp?.viewDir?.copy(TRACTOR_VIEW_T).applyAxisAngle(UP, yaw);
      if (tp?.frame) {
        // the middle of the machine, turned with its heading, a box a little over its own size round it
        tmp.set(1.45, 1.35, -0.1).applyAxisAngle(UP, yaw).add(drive.position);
        tp.frame.setFromCenterAndSize(tmp, v3(3.1, 2.7, 3.1));
      }
      machine.update(state, dt, { slowMo: view.slowMo, time: view.time, params: p, parked: !moving, schematic: false });
      // the crusher trails on the loop, its rings rolling as the ground says
      const back = loopAt(s - 4.8);
      crusher.group.position.set(back.x, terrainHeight(back.x, back.z), back.z);
      crusher.group.rotation.y = -Math.atan2(back.hz, back.hx);
      if (moving) for (const g of crusher.gangs) g.rotation.z -= (state.groundSpeedMs * dt * view.slowMo) / 0.31;
      // the pole: from the tractor's drawbar pin to the crusher's hitch
      pin.set(-0.84, 0.54, 0);
      drive.localToWorld(pin);
      hitch.copy(crusher.hitch);
      crusher.group.localToWorld(hitch);
      tmp.subVectors(hitch, pin);
      const len = tmp.length();
      link.position.copy(pin).addScaledVector(tmp, 0.5);
      link.scale.set(1, Math.max(0.01, len), 1);
      link.quaternion.setFromUnitVectors(v3(0, 1, 0), tmp.normalize());
      // stocks: the heap of chips at the chipper and in the barn go down with what the tractor has burnt; the ash bin fills
      const used = Math.min(1, state.chipsUsedKg / 500);
      pile.scale.set(2.2 * (1 - 0.35 * used), 1.5 * (1 - 0.5 * used), 2.0 * (1 - 0.35 * used));
      barn.heap.scale.set(4.2, 2.6 * (1 - 0.4 * used), 3.4);
      ash.ash.scale.y = 0.02 + 0.5 * Math.min(1, state.ashKg / 12);
      // the barn's doors: one leaf stands open
      barn.leaves[0]!.position.x = -(FARM.barn.w * 0.0) - 3.0 * 0.5 - 2.2;
      // the garage's door follows the model's
      gar.door.set(DOOR_OPEN[state.door] ?? 0);
      // the ditch's water runs: decoration
      waterFlow += dt * view.slowMo * 0.05;
      water.map.offset.x = -waterFlow;
      smoke.set({ share: 0.5, opacity: 0.35, time: view.time * view.slowMo });
      // the stopped tractor's gas, in proportion to the model's flow
      const leaving = state.pressureSign === 'pressure' ? clamp(state.plumeShare, 0, 1) : 0;
      const veil = state.plumeVisible ? 0.5 : 0.1;
      stopPlumes[0]!.set({ share: leaving, opacity: veil, time: view.time * view.slowMo });
      stopPlumes[1]!.set({ share: leaving * 0.4, opacity: veil, time: view.time * view.slowMo });
      // « Flux »: dots only while it is on; the three paths that end on the tractor follow it
      flows.object.visible = view.schematic;
      if (view.schematic) {
        tr.set(0.55, 3.35, 0);
        drive.localToWorld(tr);
        tb.set(UNIT_AT.x, UNIT_AT.y + 0.4, UNIT_AT.z);
        drive.localToWorld(tb);
        flows.setPoints(dyn[0]!, [barnDoor, mid(barnDoor, tr, 3), tr]);
        flows.setPoints(dyn[1]!, [tb, mid(tb, bin, 1.5), bin]);
        flows.setPoints(dyn[2]!, [tb, mid(tb, barrelTop, 1.5), barrelTop]);
        const run = state.engineOn ? 1 : 0;
        const fuel = Math.min(1, Math.max(0, state.gasFlowShare));
        for (let i = 0; i < 4; i++) flows.set(i, 1.2 * run, run ? 0.25 + 0.75 * fuel : 1);
        flows.set(dyn[0]!, 1.2 * run, run ? 0.2 + 0.8 * fuel : 1);
        flows.set(dyn[1]!, 1.0 * run, run ? 0.25 + 0.75 * fuel : 1);
        flows.set(dyn[2]!, 1.0 * run, run ? 0.25 + 0.75 * fuel : 1);
        flows.step(dt * view.slowMo);
      }
      followers.update(registry);
    },
  };
}
