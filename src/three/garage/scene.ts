import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { clamp } from '@onigam/lab-kit/three';
import { GARAGE, UNIT, UNIT_AT } from '../dims';
import { Followers } from '../followers';
import { dynamic } from '../merge';
import { buildMachine, type Machine } from '../tractor/tractor';
import {
  PAPER,
  WorldRegistry,
  anchor,
  hotspots,
  partsNow,
  viewFrom,
  workshopScene,
  type HotspotDef,
  type PartFraming,
} from '../world';
import { buildGarageBuilding, grossVolume, type GarageBuilding } from './building';
import { makeCo, makePlume, coShare } from './plume';
import { buildBench, buildClutter, buildIndicator, buildRescueSet } from './props';
import { v3 } from '../common';
import type { DoorState } from '../../sim/machine';
import type { GasParams, GasState } from '../../sim/types';

// `garage`: what the machine does when it stops. The same tractor, from the same function as everywhere else, parked in the farm's garage with a bedroom over it; the building is cut open (the walls between the eye and the room step aside), nobody is in the
// picture (R5). After a stop the gas goes on forming and leaves the unit, even a tight one: the plume comes out at the primary-air intake and the lid, in proportion to the model's flow. The room's carbon monoxide is the model's well-mixed box, as many dots as
// the ppm says on a logarithmic scale; the CO indicator on the wall reads the same number on a dial with no figure, and its lamp stays lit once it has been reached: there is no all-clear in this lab. The size of the room follows the model's volume.

export interface GarageOptions {
  params?: () => GasParams;
  selected?: () => string | null;
}

export const GARAGE_IDS = [
  'closed-garage',
  'garage-door',
  'room-above',
  'post-gas-plume',
  'exhaust-plume',
  'co-indicator',
  'old-rescue-set',
] as const;
export type GarageId = (typeof GARAGE_IDS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'closed-garage', fr: 'Garage fermé', en: 'Closed garage' },
  { id: 'garage-door', fr: 'Porte', en: 'Garage door' },
  { id: 'room-above', fr: 'Chambre au-dessus', en: 'Room above' },
  { id: 'post-gas-plume', fr: 'Panache après l’arrêt', en: 'Post-gas plume' },
  { id: 'exhaust-plume', fr: 'Gaz d’échappement', en: 'Exhaust plume', minor: true },
  { id: 'co-indicator', fr: 'Indicateur de CO', en: 'CO indicator' },
  { id: 'old-rescue-set', fr: 'Appareil de 1940', en: '1940s rescue set', minor: true },
];

/** How far open the door is for each state of the model: ajar is a gap, open is wide. */
export const DOOR_OPEN: Record<DoorState, number> = { shut: 0, ajar: 0.12, open: 1 };

export interface GarageScene extends SceneModule<GasState> {
  machine: Machine;
  building: GarageBuilding;
}

export function createGarageScene(opts: GarageOptions = {}): GarageScene {
  const scene = workshopScene({
    name: 'garage',
    key: [8, 12, -6],
    target: [0, 2, 2.5],
    shadowHalf: 9,
    shadowFar: 40,
    exposure: 1.0,
  });
  scene.background = new THREE.Color(0xe9e1d0);
  const registry = new WorldRegistry(new Set(), opts.selected ?? (() => null));
  const followers = new Followers();

  const building = buildGarageBuilding({ roof: false, volume: GARAGE.smallM3 });
  scene.add(building.shell, building.above);
  // the ground outside: a slab of paper-coloured earth round the building, and a yard in front of the door
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 48),
    new THREE.MeshStandardMaterial({ color: 0xcbbf9f, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.21;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- the tractor, nose in, the unit on the side of the room that is open to the eye
  const machine = buildMachine();
  const park = group('parked');
  park.rotation.y = -Math.PI / 2;
  park.position.set(0, 0, 1.07);
  park.add(machine.root);
  scene.add(park);
  // the sheet of the CO of the period, on the back wall; the rescue set on the left wall; the bench along the other
  const indicator = buildIndicator();
  const rescue = buildRescueSet();
  const bench = buildBench();
  const clutter = buildClutter();
  scene.add(indicator.group, rescue, bench, clutter);
  const placeProps = (): void => {
    const { w, d } = building.dims;
    // the dial on the back wall, high and to the right, facing the room
    indicator.group.position.set(w / 2 - 0.7, 2.25, d);
    indicator.group.rotation.y = Math.PI;
    // the rescue set on its board on the left wall
    rescue.position.set(-w / 2, 1.8, 2.2);
    rescue.rotation.y = Math.PI / 2;
    // the bench against the back wall, the clutter by the other corner
    bench.position.set(-w / 2 + 1.0, 0, d - 0.02);
    bench.rotation.y = Math.PI;
    clutter.position.set(w / 2 - 0.5, 0, d - 0.4);
    clutter.rotation.y = Math.PI;
    building.lamp.position.set(0, building.dims.h, building.dims.d * 0.5);
  };
  placeProps();

  // ---- the plume: out of the fan's open eye (the primary-air intake of the model) and out of the lid
  const eye = v3(1.38, UNIT_AT.y + 0.18, -1.16 - 0.068);
  const lid = v3(UNIT_AT.x, UNIT.top + UNIT_AT.y - 0.0, UNIT_AT.z);
  const toRoom = (p: THREE.Vector3): THREE.Vector3 => park.localToWorld(p.clone());
  park.updateMatrixWorld(true);
  const plumeEye = makePlume({
    origin: toRoom(eye),
    color: 0xf4f0e0,
    rise: 1.6,
    spread: 0.9,
    n: 220,
    size: 0.9,
    speed: 0.1,
    seed: 5,
  });
  const plumeLid = makePlume({
    origin: toRoom(lid),
    color: 0xefe7c4,
    rise: 0.8,
    spread: 0.6,
    n: 140,
    size: 0.8,
    speed: 0.09,
    seed: 6,
  });
  const post = group('post-gas-plume');
  post.add(plumeEye.points, plumeEye.haze, plumeLid.points, plumeLid.haze);
  scene.add(post);
  // the exhaust's mouth, in the world: the machine's own frame carried by the parked group's turn
  const exMouthWorld = machine.exhaust.group.localToWorld(machine.exhaust.mouth.clone());
  const plumeEx = makePlume({
    origin: exMouthWorld,
    color: 0x8d949a,
    rise: 1.2,
    spread: 0.7,
    n: 160,
    size: 0.7,
    speed: 0.22,
    seed: 7,
  });
  const exhaustG = group('exhaust-plume');
  exhaustG.add(plumeEx.points, plumeEx.haze);
  scene.add(exhaustG);
  const co = makeCo(1800);
  scene.add(co.points);
  co.fit(building.inside);

  // ---- parts and their places
  const groups: Record<GarageId, THREE.Object3D> = {
    'closed-garage': building.shell,
    'garage-door': building.door.group,
    'room-above': building.above,
    'post-gas-plume': post,
    'exhaust-plume': exhaustG,
    'co-indicator': indicator.group,
    'old-rescue-set': rescue,
  };
  const EX: Record<GarageId, [number, number, number]> = {
    'closed-garage': [0, 0, 0],
    'garage-door': [0, 0, -2.6],
    'room-above': [0, 3.2, 0],
    'post-gas-plume': [0, 0, 0],
    'exhaust-plume': [0, 0, 0],
    'co-indicator': [0, 0, -1.0],
    'old-rescue-set': [-1.6, 0, 0],
  };
  const FRAME: Record<GarageId, PartFraming> = {
    'closed-garage': { viewDir: viewFrom(22, 60) },
    'garage-door': { viewDir: viewFrom(8, 340) },
    'room-above': { viewDir: viewFrom(30, 60) },
    'post-gas-plume': { viewDir: viewFrom(14, 80) },
    'exhaust-plume': { viewDir: viewFrom(14, 60) },
    'co-indicator': { viewDir: viewFrom(0, 0) },
    'old-rescue-set': { viewDir: viewFrom(5, 270) },
  };
  const anchorAt: Record<GarageId, [number, number, number]> = {
    'closed-garage': [GARAGE.small.w / 2, 0.6, 3.5],
    'garage-door': [0, 3.1, 0],
    'room-above': [GARAGE.small.w / 2, 4.6, 3.5],
    'post-gas-plume': [0.0, 0.0, 0.0],
    'exhaust-plume': [0.0, 0.0, 0.0],
    'co-indicator': [0, 0.17, 0.09],
    'old-rescue-set': [0, 0.1, 0.1],
  };
  const anchors: Record<string, THREE.Object3D> = {};
  // a part nested in another is registered first, so that it keeps its own meshes: the door stands in the garage's front wall
  const order: GarageId[] = ['garage-door', ...GARAGE_IDS.filter((i) => i !== 'garage-door')];
  for (const id of order) {
    const g = groups[id];
    registry.add(id, g, new THREE.Vector3(...EX[id]), undefined, FRAME[id]);
    let a = anchorAt[id];
    if (id === 'post-gas-plume') a = [plumeEye.points.position.x, 0, 0];
    anchors[id] = anchor(g, a[0], a[1], a[2], `anchor-${id}`);
  }
  // the plume's and the exhaust's anchors stand in world places
  anchors['post-gas-plume']!.position.copy(toRoom(eye)).add(v3(0, 0.7, 0));
  anchors['exhaust-plume']!.position.copy(exMouthWorld).add(v3(0, 0.4, 0));
  // the tractor, the bench and the rest follow the garage
  followers.add('closed-garage', park, { shell: false, explode: 0 });
  followers.add('closed-garage', bench, { shell: false, explode: 0 });
  followers.add('closed-garage', clutter, { shell: false, explode: 0 });
  followers.add('closed-garage', ground, { shell: false, explode: 0 });
  followers.add('closed-garage', co.points, { shell: false, explode: 0 });
  registry.overview(() => {
    const { w, d, h, aboveH } = building.dims;
    return [
      new THREE.Box3(
        new THREE.Vector3(-w / 2 - 0.5, -0.2, -0.6),
        new THREE.Vector3(w / 2 + 0.5, h + 0.3 + aboveH, d + 0.6),
      ),
    ];
  });

  const hs: Hotspot[] = hotspots(HOTSPOTS, anchors);
  let volume: number = GARAGE.smallM3;
  const camPos = new THREE.Vector3();
  const rn = new THREE.Vector3();
  scene.onBeforeRender = (_r, _s, camera) => {
    // the walls between the eye and the room step aside: a wall is not drawn when the camera is beyond its plane (outside the room on that side), but the front wall, which holds the door
    camera.getWorldPosition(camPos);
    const { w, d } = building.dims;
    for (const wall of building.walls) {
      const id = wall.id.replace('above-', '');
      let hide = false;
      if (id === 'plus-x') hide = camPos.x > w / 2;
      else if (id === 'minus-x') hide = camPos.x < -w / 2;
      else if (id === 'back') hide = camPos.z > d;
      else if (id === 'front') hide = camPos.z < 0 && Math.abs(camPos.x) < w * 0.4 + 0.3;
      wall.mesh.visible = !hide;
      void rn;
    }
  };
  const setDoor = (open: number): void => building.door.set(open);
  const keepPlumeSpeed = { v: 0 };
  void keepPlumeSpeed;

  return {
    id: 'garage',
    scene,
    registry,
    hotspots: hs,
    machine,
    building,
    home: { position: new THREE.Vector3(12.5, 4.6, -7.4), target: new THREE.Vector3(0, 2.9, 2.4) },
    minDistance: 0.3,
    maxDistance: 45,
    near: 0.05,
    far: 400,
    declutter: true,
    homePadding: 0.9,
    update(state: GasState, dt: number, view: ViewOpts) {
      // the room follows the model's volume (never a printed one): the free air plus what the tractor displaces
      if (state.garageVolume !== volume) {
        volume = state.garageVolume;
        building.setVolume(volume);
        placeProps();
        co.fit(building.inside);
        registry
          .get('closed-garage')
          ?.meshes.splice(0, registry.get('closed-garage')!.meshes.length, ...collect(building.shell));
        registry
          .get('room-above')
          ?.meshes.splice(0, registry.get('room-above')!.meshes.length, ...collect(building.above));
        void grossVolume;
      }
      // the machine: parked, so nothing rolls
      machine.update(state, dt, {
        slowMo: view.slowMo,
        time: view.time,
        params: opts.params?.(),
        parked: true,
        schematic: false,
      });
      setDoor(DOOR_OPEN[state.door] ?? 0);
      // the plume: in proportion to the model's flow, as white or yellow gas for wood (S3)
      const p = opts.params?.();
      const share = state.pressureSign === 'pressure' ? clamp(state.plumeShare, 0, 1) : 0;
      const op = state.plumeVisible ? 0.55 : 0.12;
      plumeEye.set({ share, opacity: op, time: view.time * view.slowMo });
      plumeLid.set({
        share: p?.lidLeak ? clamp(0.3 + 0.7 * state.plumeShare, 0, 1) : share * 0.3,
        opacity: op,
        time: view.time * view.slowMo,
      });
      // the exhaust of an engine running inside: grey, only while the engine runs in the garage
      const exOn = state.engineOn && state.place === 'garage' ? 0.8 : 0;
      plumeEx.set({ share: exOn, opacity: 0.38, time: view.time * view.slowMo });
      // the CO's dots, the dial and the lamp
      co.set({ share: view.schematic ? coShare(state.garageCoPpm) : 0, time: view.time * view.slowMo });
      const a = clamp(Math.log10(1 + state.garageCoPpm) / 4.6, 0, 1) * indicator.sweep - indicator.sweep / 2;
      indicator.needle.rotation.z = -a;
      (indicator.lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = state.coLatched ? 1.4 : 0;
      // the lamp on its cord sways a little with the draught of an open door
      building.lamp.rotation.z = Math.sin(view.time * 0.8) * 0.01 * (state.door === 'open' ? 2 : 1);
      // scenery follows its parts
      const now = partsNow(registry);
      void now;
      followers.update(registry);
      void dynamic;
      void PAPER;
    },
  };
}

function collect(o: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh);
  });
  return out;
}
