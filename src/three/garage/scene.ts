import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { clamp } from '@onigam/lab-kit/three';
import { FARM, GARAGE, UNIT, UNIT_AT } from '../dims';
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
  type HotspotDef,
  type PartFraming,
} from '../world';
import { createYard } from '../outdoors';
import { buildFarmhouse } from '../farm/buildings';
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
  { id: 'closed-garage', fr: 'Garage fermé', en: 'Closed garage', minor: true },
  { id: 'garage-door', fr: 'Porte', en: 'Garage door', minor: true },
  { id: 'room-above', fr: 'Chambre au-dessus', en: 'Room above' },
  { id: 'post-gas-plume', fr: 'Panache après l’arrêt', en: 'Post-gas plume' },
  { id: 'exhaust-plume', fr: 'Gaz d’échappement', en: 'Exhaust plume', minor: true },
  { id: 'co-indicator', fr: 'Indicateur de CO', en: 'CO indicator' },
  { id: 'old-rescue-set', fr: 'Appareil des années 1940', en: '1940s rescue set', minor: true },
];

/** How far inside a wall's inner face the camera may stand and still have the wall stepped aside: a camera flying into the room crosses the wall's thickness and its boards, and would otherwise fill the frame with them for a moment. */
export const WALL_CLEARANCE = 0.5;

/** Is the wall `id` (`plus-x`, `minus-x`, `back`, `front`, the bedroom's with `above-` taken off) stepped aside for an eye at `cam`, in a room `w` across and `d` deep? */
export function wallHidden(id: string, cam: THREE.Vector3, w: number, d: number, h = 3.35): boolean {
  const M = WALL_CLEARANCE;
  // the slab between the storeys: aside while the eye is in its volume, under its boards or just over its top, within its plan and a little beyond
  if (id === 'ceiling')
    return Math.abs(cam.x) < w / 2 + 0.6 && cam.z > -0.6 && cam.z < d + 0.6 && cam.y > h - 0.4 && cam.y < h + 0.6;
  if (id === 'plus-x') return cam.x > w / 2 - M;
  if (id === 'minus-x') return cam.x < -w / 2 + M;
  if (id === 'back') return cam.z > d - M;
  if (id === 'front') return cam.z < M && Math.abs(cam.x) < w * 0.4 + 0.3;
  return false;
}

const EYE_VIEW = viewFrom(14, 80);
const LID_VIEW = viewFrom(22, 80);

/** How far open the door is for each state of the model: ajar is a gap, open is wide. */
export const DOOR_OPEN: Record<DoorState, number> = { shut: 0, ajar: 0.12, open: 1 };

export interface GarageScene extends SceneModule<GasState> {
  machine: Machine;
  building: GarageBuilding;
}

export function createGarageScene(opts: GarageOptions = {}): GarageScene {
  // the garage stands in the farm's yard, against the house, under the open sky (`outdoors.ts`): gravel, a concrete apron before the door, the house's gable, a tree line and ridges at the horizon
  const yard = createYard({
    name: 'garage',
    key: [8, 12, -6],
    target: [0, 2, 2.5],
    shadowHalf: 9,
    exposure: 1.0,
    slab: [-5.2, -9, 5.2, -GARAGE.wall - 0.005],
    groundY: -0.21,
    yardRadius: 18,
  });
  const scene = yard.scene;
  const registry = new WorldRegistry(new Set(), opts.selected ?? (() => null));
  const followers = new Followers();

  const building = buildGarageBuilding({ roof: false, volume: GARAGE.smallM3 });
  scene.add(building.shell, building.above);
  // the house this garage is built against: the farm's own farmhouse, its gable flush with the garage's wall on the side away from the camera's home (the farm has it on the other side: the picture is the same from the front)
  const house = buildFarmhouse({ against: -1 });
  house.group.userData.partId = undefined;
  house.group.rotation.y = Math.PI;
  scene.add(house.group);

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
    // the house at the garage's side wall, its front in line with the garage's front wall; the apron before the door follows the room's width
    house.group.position.set(-(w / 2 + GARAGE.wall) - FARM.house.w / 2 - 0.14, 0, -GARAGE.wall + FARM.house.d / 2);
    yard.fitSlab(-w / 2 - 1, -9, w / 2 + 1, -GARAGE.wall - 0.005);
  };
  placeProps();

  // ---- the plume: out of the fan's open eye (the primary-air intake of the model) and out of the lid
  const eye = v3(1.38, UNIT_AT.y + 0.18, -1.16 - 0.068);
  // the lid's rim: a hand under the unit's reported top, where the yoke stands over it (the top is measured from the ground already: adding the console's height put the gas half a metre above the lid)
  const lid = v3(UNIT_AT.x, UNIT.top - 0.09, UNIT_AT.z);
  const toRoom = (p: THREE.Vector3): THREE.Vector3 => park.localToWorld(p.clone());
  park.updateMatrixWorld(true);
  const plumeEye = makePlume({
    origin: toRoom(eye),
    color: 0xf4f0e0,
    rise: 1.7,
    spread: 1.0,
    n: 300,
    size: 1.25,
    speed: 0.1,
    seed: 5,
    fade: [1.0, 3.0],
  });
  // the lid lifts on its spring and the gas leaves round its rim: a thin ring that rises and spreads, the lid itself left to be seen in the middle of it
  const plumeLid = makePlume({
    origin: toRoom(lid),
    color: 0xefe7c4,
    rise: 0.6,
    spread: 0.45,
    n: 110,
    size: 0.42,
    speed: 0.08,
    seed: 6,
    ring: UNIT.lid.R * 0.97,
    fade: [0.8, 2.2],
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
    'old-rescue-set': [0.8, 0, 0],
  };
  // what the camera frames for the plume: the cloud at the intake and, with a lid that does not seal, the cloud at the lid too (the lid is no part of this world: it is framed through the plume that leaves it). The dots of a plume sit at the origin of their
  // geometry, so the part's own box would stretch from the room's corner to the cloud
  const eyeAt = toRoom(eye);
  const lidAt = toRoom(lid);
  const eyeBox = new THREE.Box3(eyeAt.clone().add(v3(-1.0, -0.2, -1.0)), eyeAt.clone().add(v3(1.0, 1.9, 1.0)));
  // with the lid's leak the frame is the lid and the ring of gas about it and nothing else: the camera stands outside the open side a little above, at the height from which the ray to the lid still passes under the slab
  const lidTight = new THREE.Box3(lidAt.clone().add(v3(-0.55, -0.5, -0.55)), lidAt.clone().add(v3(0.55, 0.6, 0.55)));
  // the two fittings on the wall are small: the camera frames their middle, not the board's and the cable's whole box
  scene.updateMatrixWorld(true);
  const centre = (o: THREE.Object3D | THREE.Object3D[], k: number): THREE.Box3 => {
    const b = new THREE.Box3();
    for (const x of Array.isArray(o) ? o : [o]) b.union(new THREE.Box3().setFromObject(x, true));
    const c = b.getCenter(new THREE.Vector3());
    const h = b.getSize(new THREE.Vector3()).multiplyScalar(k / 2);
    return new THREE.Box3(c.clone().sub(h), c.clone().add(h));
  };
  const FRAME: Record<GarageId, PartFraming> = {
    // the building whole (the garage and the room over it), a little tighter than its box so that it fills the picture and not a third of it
    'closed-garage': { viewDir: viewFrom(22, 60), frame: centre([building.shell, building.above], 0.8) },
    // from the yard, in front and a little to the side away from the house: the boards, the straps, their bolts and the hinges, and the room through the door when it stands open
    'garage-door': { viewDir: viewFrom(8, 160) },
    // the bedroom from the front and a little to the open side, not so high that its floor is all that is seen: the bed, the window, the wardrobe
    'room-above': { viewDir: viewFrom(20, 30), frame: centre(building.above, 0.45) },
    'post-gas-plume': { viewDir: EYE_VIEW.clone(), frame: eyeBox },
    'exhaust-plume': { viewDir: viewFrom(14, 60) },
    'co-indicator': { viewDir: viewFrom(0, 180), frame: centre(indicator.group, 0.62) },
    // from the front of the open side and a little above: from level the tractor stands between the eye and its board (70 cm from the wall)
    'old-rescue-set': { viewDir: viewFrom(26, 70), frame: centre(rescue, 0.62) },
  };
  const anchorAt: Record<GarageId, [number, number, number]> = {
    'closed-garage': [GARAGE.small.w / 2 + GARAGE.wall, GARAGE.small.h + 0.15, GARAGE.small.d / 2],
    'garage-door': [0, 3.1, 0],
    'room-above': [GARAGE.small.w / 2, GARAGE.small.h + 1.3, GARAGE.small.d * 0.7],
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
    // the walls between the eye and the room step aside: a wall is not drawn when the camera is beyond its inner face or within a wall's own thickness of it (`wallHidden`), but the front wall, which holds the door
    camera.getWorldPosition(camPos);
    const { w, d, h } = building.dims;
    for (const wall of building.walls) {
      const id = wall.id.replace('above-', '');
      wall.mesh.visible = !wallHidden(id, camPos, w, d, h);
      void rn;
    }
    // the house stands on that side: the camera that has gone round to it would look through its walls
    house.group.visible = !(camPos.x < -w / 2 - 0.3);
  };
  const setDoor = (open: number): void => building.door.set(open);
  let lidShown = -1;
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
    far: 5000,
    declutter: true,
    homePadding: 0.9,
    update(state: GasState, dt: number, view: ViewOpts) {
      // the room follows the model's volume (never a printed one): the free air plus what the tractor displaces
      if (state.garageVolume !== volume) {
        volume = state.garageVolume;
        building.setVolume(volume);
        placeProps();
        scene.updateMatrixWorld(true);
        registry.get('co-indicator')?.frame?.copy(centre(indicator.group, 0.62));
        registry.get('old-rescue-set')?.frame?.copy(centre(rescue, 0.62));
        registry.get('closed-garage')?.frame?.copy(centre([building.shell, building.above], 0.8));
        registry.get('room-above')?.frame?.copy(centre(building.above, 0.45));
        co.fit(building.inside);
        // the labels of the shell and of the bedroom stay on the walls of the room as it grows
        const ins = building.inside;
        anchors['closed-garage']!.position.set(ins.max.x + GARAGE.wall, ins.max.y + 0.15, (ins.min.z + ins.max.z) / 2);
        anchors['room-above']!.position.set(ins.max.x, ins.max.y + 1.3, ins.min.z + (ins.max.z - ins.min.z) * 0.7);
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
      const pf = registry.get('post-gas-plume');
      if (pf?.frame) pf.frame.copy(p?.lidLeak ? lidTight : eyeBox);
      const share = state.pressureSign === 'pressure' ? clamp(state.plumeShare, 0, 1) : 0;
      const op = state.plumeVisible ? 0.7 : 0.12;
      // with a lid that leaks the hot column draws the gas up and out of the lid, and less leaves at the intake
      plumeEye.set({ share: p?.lidLeak ? share * 0.45 : share, opacity: op, time: view.time * view.slowMo });
      // and it stays low (under the lid), so that the lid is seen above it and not through it
      (plumeEye.points.material as THREE.ShaderMaterial).uniforms.uRise!.value = p?.lidLeak ? 0.75 : 1.7;
      // the lid's gas follows the model's flow, which rises over some minutes when the lid starts to leak mid-run: eased over five model minutes, and set at once when the world meets a run already under way
      const lidTarget = p?.lidLeak ? clamp(0.3 + 0.7 * state.plumeShare, 0, 1) : share * 0.3;
      if (lidShown < 0) lidShown = lidTarget;
      else lidShown += (lidTarget - lidShown) * (1 - Math.exp(-(dt * view.slowMo * (p?.timeScale ?? 60)) / 300));
      plumeLid.set({ share: lidShown, opacity: op * 0.8, time: view.time * view.slowMo });
      // the camera looks down on the lid when it leaks, so that its disc is seen inside the ring of gas
      const pv = registry.get('post-gas-plume');
      if (pv?.viewDir) pv.viewDir.copy(p?.lidLeak ? LID_VIEW : EYE_VIEW);
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
      // the set on the left wall is 70 cm from the tractor's side: the camera that frames it stands inside the tractor, so the tractor is read through while the set is the one selected
      followers.force(park, (opts.selected?.() ?? null) === 'old-rescue-set');
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
