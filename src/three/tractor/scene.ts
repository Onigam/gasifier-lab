import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { ENGINE, TRACTOR, UNIT_AT } from '../dims';
import { Followers } from '../followers';
import {
  PAPER,
  WorldRegistry,
  anchor,
  hotspots,
  partsNow,
  paperFloor,
  viewFrom,
  workshopScene,
  type HotspotDef,
  type PartFraming,
} from '../world';
import type { GasParams, GasState } from '../../sim/types';
import { buildMachine, type Machine } from './tractor';

// `tractor`: the machine. The tractor with its whole system bolted on: the unit on its console at the left, the filter box and the cooler, the starting fan and its stack, the rack on the cab. Always rolling on the spot: the paper's grid
// runs under the wheels at the ground speed of the model, so that the wheels roll the way the ground says (never a faster turn than a third of a turn a second at the rear). In X-ray the unit's core shows through, lit from inside.

export interface TractorSceneOptions {
  params?: () => GasParams;
  selected?: () => string | null;
}

export const TRACTOR_IDS = [
  'tractor-chassis',
  'cab',
  'roof-rack',
  'roof-headlights',
  'rear-wheels',
  'front-wheels',
  'diesel-engine',
  'injection-pump',
  'heat-shield',
  'extra-governor',
  'left-consoles',
  'gasifier-unit',
  'gas-line-run',
] as const;
export type TractorId = (typeof TRACTOR_IDS)[number];

/** The sizes of the hot parts are never printed; this world holds none of them in a part's box: the unit's box is its envelope (reported heights). */
export const TRACTOR_REFUSED: ReadonlySet<string> = new Set();

/** How far each part leaves along its line when the tractor comes apart. T frame, metres. The wheels go out along their axles. */
export const EXPLODE: Record<TractorId, [number, number, number]> = {
  'tractor-chassis': [0, 0, 0],
  cab: [0, 1.5, 0],
  'roof-rack': [0, 2.6, 0],
  'roof-headlights': [0.9, 2.5, 0],
  'rear-wheels': [0, 0, 0],
  'front-wheels': [0, 0, 0],
  'diesel-engine': [0, 0.95, 0],
  'injection-pump': [0, 0.95, -1.0],
  'heat-shield': [0, 0.95, -1.5],
  'extra-governor': [0.9, 0.95, -0.9],
  'left-consoles': [0, 0, -0.8],
  'gasifier-unit': [0, 0.9, -1.9],
  'gas-line-run': [0, 1.35, 0],
};

const FRAMING: Record<TractorId, PartFraming> = {
  'tractor-chassis': { viewDir: viewFrom(16, 150) },
  cab: { viewDir: viewFrom(14, 215) },
  'roof-rack': { viewDir: viewFrom(30, 215) },
  'roof-headlights': { viewDir: viewFrom(12, 110) },
  'rear-wheels': { viewDir: viewFrom(10, 200) },
  'front-wheels': { viewDir: viewFrom(10, 150) },
  'diesel-engine': { viewDir: viewFrom(30, 60) },
  'injection-pump': { viewDir: viewFrom(18, 190) },
  'heat-shield': { viewDir: viewFrom(10, 195) },
  'extra-governor': { viewDir: viewFrom(18, 120) },
  'left-consoles': { viewDir: viewFrom(18, 215) },
  'gasifier-unit': { viewDir: viewFrom(12, 190) },
  'gas-line-run': { viewDir: viewFrom(18, 140) },
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'tractor-chassis', fr: 'Châssis', en: 'Chassis', minor: true },
  { id: 'cab', fr: 'Cabine', en: 'Cab' },
  { id: 'roof-rack', fr: 'Galerie', en: 'Roof rack' },
  { id: 'roof-headlights', fr: 'Phares de toit', en: 'Roof headlights', minor: true },
  { id: 'rear-wheels', fr: 'Roues arrière', en: 'Rear wheels', minor: true },
  { id: 'front-wheels', fr: 'Roues avant', en: 'Front wheels', minor: true },
  { id: 'diesel-engine', fr: 'Moteur diesel', en: 'Diesel engine' },
  { id: 'injection-pump', fr: 'Pompe d’injection', en: 'Injection pump', minor: true },
  { id: 'heat-shield', fr: 'Écran thermique', en: 'Heat shield', minor: true },
  { id: 'extra-governor', fr: 'Régulateur ajouté', en: 'Extra governor', minor: true },
  { id: 'left-consoles', fr: 'Consoles', en: 'Left consoles', minor: true },
  { id: 'gasifier-unit', fr: 'Gazogène', en: 'Gasifier unit', goto: 'gasifier' },
  { id: 'gas-line-run', fr: 'Ligne de gaz', en: 'Gas line run', goto: 'gas-train' },
];

/** Where each label stands, in T. */
const ANCHORS: Record<TractorId, [number, number, number]> = {
  'tractor-chassis': [0.7, 1.5, 0.45],
  cab: [0.45, 2.55, -0.76],
  'roof-rack': [0.55, 3.2, 0],
  'roof-headlights': [1.45, 3.05, -0.5],
  'rear-wheels': [0, 1.55, -1.35],
  'front-wheels': [2.59, 0.62, -1.05],
  'diesel-engine': [2.35, 1.62, 0.25],
  'injection-pump': [2.15, 1.1, -0.4],
  'heat-shield': [1.8, 1.45, -0.44],
  'extra-governor': [3.0, 1.2, -0.3],
  'left-consoles': [1.6, 0.42, -1.06],
  'gasifier-unit': [UNIT_AT.x, 2.0, UNIT_AT.z - 0.3],
  'gas-line-run': [3.3, 1.95, -0.7],
};

export interface TractorScene extends SceneModule<GasState> {
  machine: Machine;
}

export function createTractorScene(opts: TractorSceneOptions = {}): TractorScene {
  const scene = workshopScene({
    name: 'tractor',
    key: [-4, 9, -7],
    target: [1.5, 0.8, -0.2],
    shadowHalf: 8,
    shadowFar: 40,
    exposure: 1.0,
  });
  const floor = paperFloor(30, 8, 0);
  scene.add(floor);
  const floorMap = (floor.material as THREE.MeshStandardMaterial).map!;

  const machine = buildMachine();
  scene.add(machine.root);
  const registry = new WorldRegistry(TRACTOR_REFUSED, opts.selected ?? (() => null));
  const followers = new Followers();

  // the unit's core (the chips and the fire) is drawn with the unit and stays solid in X-ray
  const core = group('unit-core');
  core.position.copy(machine.unit.root.position);
  for (const id of ['chip-column', 'drying-zone', 'pyrolysis-zone', 'oxidation-zone', 'reduction-zone'] as const)
    core.add(machine.unit.parts.get(id)!);
  const unitRoot = machine.unit.root;
  for (const c of unitRoot.children.slice()) if (c.name === 'nozzle-flames' || c.name === 'journey-cursor') core.add(c);
  scene.add(core);

  const groups: Record<TractorId, THREE.Object3D> = {
    'tractor-chassis': machine.body.chassis,
    cab: machine.body.cab,
    'roof-rack': machine.body.rack,
    'roof-headlights': machine.body.headlights,
    'rear-wheels': machine.body.rear,
    'front-wheels': machine.body.front,
    'diesel-engine': machine.engine.engine,
    'injection-pump': machine.pump.group,
    'heat-shield': machine.shield.group,
    'extra-governor': machine.governor.group,
    'left-consoles': machine.consoles.group,
    'gasifier-unit': machine.unit.root,
    'gas-line-run': machine.line,
  };
  // the exhaust belongs to the engine
  machine.engine.engine.add(machine.exhaust.group);

  const anchors: Record<string, THREE.Object3D> = {};
  const wheelBase = new Map<THREE.Object3D, number>();
  for (const id of TRACTOR_IDS) {
    const g = groups[id];
    const a = ANCHORS[id];
    // the anchor is placed in T: its offset from the part's origin
    const p = g.position;
    anchors[id] = anchor(g, a[0] - p.x, a[1] - p.y, a[2] - p.z, `anchor-${id}`);
    const custom =
      id === 'rear-wheels' || id === 'front-wheels'
        ? (f: number): void => {
            for (const w of machine.body.wheels[id === 'rear-wheels' ? 'rear' : 'front']) {
              if (!wheelBase.has(w.root)) wheelBase.set(w.root, w.root.position.z);
              const z0 = wheelBase.get(w.root)!;
              w.root.position.z = z0 + Math.sign(z0) * 1.2 * f;
            }
          }
        : undefined;
    registry.add(id, g, new THREE.Vector3(...EXPLODE[id]), custom, FRAMING[id]);
  }
  followers.add('diesel-engine', machine.body.bonnet, { shell: false, explode: 1 });
  followers.add('gasifier-unit', core, { shell: false, explode: 1 });
  registry.overview(() => [new THREE.Box3(new THREE.Vector3(-1.0, 0, -1.5), new THREE.Vector3(3.9, 3.3, 1.5))]);

  const hs: Hotspot[] = hotspots(HOTSPOTS, anchors);
  let roll = 0;

  return {
    id: 'tractor',
    scene,
    registry,
    hotspots: hs,
    machine,
    home: { position: new THREE.Vector3(8.4, 3.3, -8.2), target: new THREE.Vector3(1.4, 1.2, -0.1) },
    minDistance: 0.6,
    maxDistance: 40,
    near: 0.05,
    far: 300,
    declutter: true,
    homePadding: 0.95,
    update(state: GasState, dt: number, view: ViewOpts) {
      const p = opts.params?.();
      machine.update(state, dt, { slowMo: view.slowMo, time: view.time, params: p, schematic: view.schematic });
      // the bonnet opens to the ghost while things are apart or seen through; the unit's core stays as the model has it
      const now = partsNow(registry);
      followers.force(machine.body.bonnet, now.xray || now.exploded);
      followers.update(registry);
      // the floor's grid runs under the wheels
      const v = state.engineOn ? state.groundSpeedMs : 0;
      roll += v * dt * view.slowMo;
      floorMap.offset.x = (roll / 8) % 1;
      void TRACTOR;
      void ENGINE;
      void PAPER;
    },
  };
}
