import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { COOLER, FILTER, FILTER_AT, MIXER, UNIT_AT } from '../dims';
import { Followers } from '../followers';
import { dynamic } from '../merge';
import {
  buildAirValve,
  buildCooler,
  buildCyclone,
  buildFanStack,
  buildFilter,
  buildGauge,
  buildHotPipe,
  buildManifold,
  buildMixer,
  buildStartingFan,
  buildStopValve,
} from '../train/components';
import { buildCylinder, CYL } from '../train/cylinder';
import { LivePipe, type Port } from '../train/pipes';
import { frame, plinth, post } from '../train/stands';
import { buildExhaust, buildGovernor } from '../tractor/engine';
import { buildUnit } from '../unit/unit';
import { buildSankey } from './sankey';
import { makeFlow, unitSections } from '../flowpaths';
import { lineSections } from '../train/flow';
import { setField } from '../unit/field';
import { blurOf, visualTurns, worldPort } from '../tractor/tractor';
import { TAU, v3 } from '../common';
import {
  PAPER,
  WorldRegistry,
  anchor,
  hotspots,
  partsNow,
  viewFrom,
  type HotspotDef,
  type PartFraming,
  viewAspect,
} from '../world';
import { PIPE } from '../dims';
import { createYard } from '../outdoors';
import { hose as hoseMat } from '../materials';
import type { GasParams, GasState } from '../../sim/types';

// `gas-train`: where the energy goes, laid out flat in the order the gas flows (Fig. 3.8): the unit's outlet, the hot pipe with its stop valve and the starting fan's stack, the filter, the cooler and its vessel, the mixer and its throttles, the manifold,
// one cylinder cut open with the pilot's thread of diesel, the exhaust. The same pieces, from the same functions as the tractor's (`train/components.ts`), standing on frames and posts instead of the tractor, and the pipes between them follow
// their ports: nothing hangs from a part that went away. The cyclone, on the programme's own system (Fig. 3.5b) and not on this tractor's schematic, stands to one side, joined to nothing.

/** Where the cyclone stands (on the programme's system, not on this tractor's: joined to nothing), and how far before the line the ribbons lie. */
export const CYCLONE_AT = { x: -0.95, z: -1.05 } as const;
export const SANKEY_Z = -2.35;
/** What the gas line's overview holds: the line from the fan at the unit's foot to the exhaust behind the cylinder (at `cylX`), the top of the fan's stack, and the ribbons of the Sankey on the slab before it. */
export const HOME_BOX = (cylX: number): THREE.Box3 =>
  new THREE.Box3(new THREE.Vector3(CYCLONE_AT.x - 0.2, 0, SANKEY_Z - 0.15), new THREE.Vector3(cylX + 0.8, 2.62, 1.1));
/**
 * Where a wide view looks at it from, and at what: from the front and a little from the unit's end, 22 degrees up, aimed low and forward of the line. The kit frames the sphere of a box about its middle, and the middle of this box is not the middle of what it shows on the
 * screen (the ribbons lie on the ground in front of the line, the stack stands over it): aimed at the box's middle, the camera stood a fifth further and the line took less than half the picture's width. So a wide view's overview is the box stretched forward until its middle
 * is `at`, and the padding is what puts the eye at `eye`; a view taller than wide has the box itself, which the kit fits by its real extents.
 */
export const HOME_WIDE = { eye: new THREE.Vector3(0.83, 3.43, -7.14), at: new THREE.Vector3(1.5, 1.5, -2.4) };
export function homeWide(cylX: number): { box: THREE.Box3; padding: number } {
  const hold = HOME_BOX(cylX);
  const box = hold.clone();
  // stretched on each axis so that `at` is its middle
  for (const k of ['x', 'y', 'z'] as const) {
    const reach = Math.max(HOME_WIDE.at[k] - hold.min[k], hold.max[k] - HOME_WIDE.at[k]);
    box.min[k] = HOME_WIDE.at[k] - reach;
    box.max[k] = HOME_WIDE.at[k] + reach;
  }
  const r = box.getSize(new THREE.Vector3()).length() / 2;
  return { box, padding: (HOME_WIDE.eye.distanceTo(HOME_WIDE.at) * Math.sin((17.5 * Math.PI) / 180)) / r };
}

export interface GasTrainOptions {
  params?: () => GasParams;
  selected?: () => string | null;
}

export const TRAIN_IDS = [
  'hot-gas-pipe',
  'stop-valve',
  'starting-fan',
  'fan-stack',
  'primary-air-valve',
  'cyclone',
  'filter-box',
  'filter-bags',
  'gas-cooler',
  'cooler-condensate-vessel',
  'gas-air-mixer',
  'gas-throttle',
  'secondary-air-throttle',
  'pilot-injector',
  'cylinder-cutaway',
  'exhaust-pipe',
  'water-gauge',
] as const;
export type TrainId = (typeof TRAIN_IDS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'hot-gas-pipe', fr: 'Conduite de gaz chaud', en: 'Hot gas pipe', minor: true },
  { id: 'stop-valve', fr: 'Vanne d’arrêt', en: 'Stop valve', minor: true },
  { id: 'starting-fan', fr: 'Ventilateur de démarrage', en: 'Starting fan', minor: true },
  { id: 'fan-stack', fr: 'Cheminée du ventilateur', en: 'Fan stack', minor: true },
  { id: 'primary-air-valve', fr: 'Vanne d’air primaire', en: 'Primary-air valve', minor: true },
  { id: 'cyclone', fr: 'Cyclone', en: 'Cyclone', minor: true },
  { id: 'filter-box', fr: 'Caisson de filtre', en: 'Filter box' },
  { id: 'filter-bags', fr: 'Manches', en: 'Filter bags', minor: true },
  { id: 'gas-cooler', fr: 'Refroidisseur', en: 'Gas cooler' },
  { id: 'cooler-condensate-vessel', fr: 'Bac de condensats', en: 'Condensate vessel', minor: true },
  { id: 'gas-air-mixer', fr: 'Mélangeur', en: 'Gas-air mixer' },
  { id: 'gas-throttle', fr: 'Papillon de gaz', en: 'Gas throttle', minor: true },
  { id: 'secondary-air-throttle', fr: 'Papillon d’air', en: 'Secondary-air throttle', minor: true },
  { id: 'pilot-injector', fr: 'Injecteur pilote', en: 'Pilot injector', minor: true },
  { id: 'cylinder-cutaway', fr: 'Cylindre en coupe', en: 'Cylinder cutaway' },
  { id: 'exhaust-pipe', fr: 'Échappement', en: 'Exhaust pipe' },
  { id: 'hot-gas-pipe#energy', fr: 'Où va l’énergie', en: 'Where the energy goes' },
  { id: 'water-gauge', fr: 'Manomètre à eau', en: 'Water gauge', minor: true },
];

/** The parts whose box, printed as « Encombrement », comes out at a length the lab withholds, to the figure that is printed or within 3 mm of it (`encombrement.test.ts` finds them): their sheet does not print it, the camera still frames them. */
export const TRAIN_REFUSED: ReadonlySet<string> = new Set([
  'fan-stack',
  'filter-bags',
  'exhaust-pipe',
  'water-gauge',
  'cooler-condensate-vessel',
  'cyclone',
  'gas-throttle',
  'hot-gas-pipe',
  'pilot-injector',
  'secondary-air-throttle',
  'stop-valve',
]);

export interface GasTrainScene extends SceneModule<GasState> {
  pieces: Record<string, THREE.Object3D>;
}

const base0 = { woodKw: 195, dieselKw: 26, gasKw: 139, gasifierLossKw: 56, shaftKw: 40, engineLossKw: 125 };

export function createGasTrainScene(opts: GasTrainOptions = {}): GasTrainScene {
  // the line stands on a concrete slab in the open yard (`outdoors.ts`); the slab is laid out round the line once it is placed
  const yard = createYard({
    name: 'gas-train',
    key: [-3, 9, -8],
    target: [2.4, 0.5, 0.2],
    shadowHalf: 9,
    exposure: 1.0,
    slab: [-3, -6, 12, 4],
    yardRadius: 22,
  });
  const scene = yard.scene;
  const registry = new WorldRegistry(TRAIN_REFUSED, opts.selected ?? (() => null));
  const followers = new Followers();
  const scenery = group('scenery');
  scene.add(scenery);

  // the unit, in the frame of the tractor less its own place: the early part of the line is where it is on the tractor, so that the same pieces stand in the same places relative to each other
  const base = v3(-UNIT_AT.x, 0, -UNIT_AT.z);
  const unit = buildUnit({ cut: false });
  unit.root.position.set(0, UNIT_AT.y, 0);
  scenery.add(unit.root);
  const unitStand = frame(0.8, 0.8, UNIT_AT.y, 'unit-stand');
  scenery.add(unitStand);

  const hot = buildHotPipe();
  const stop = buildStopValve();
  const stack = buildFanStack();
  const fan = buildStartingFan();
  const air = buildAirValve();
  const filter = buildFilter();
  const cooler = buildCooler();
  const mixer = buildMixer();
  const gauge = buildGauge();
  const cyclone = buildCyclone();
  const cyl = buildCylinder();
  const exhaust = buildExhaust(1.1);
  const manifold = buildManifold();
  void buildGovernor;

  const outlet = unit.ports.outlet.clone().add(v3(0, UNIT_AT.y, 0));
  hot.group.position.copy(outlet);
  const hotRun = worldPort(hot.group, hot.ports.run!);
  stop.group.position.copy(hotRun.p).add(v3(0.048, 0, 0));
  stack.group.position.copy(worldPort(hot.group, hot.ports.stack!).p);
  const intake = unit.ports.intake.clone().add(v3(0, UNIT_AT.y, 0));
  air.group.position.copy(intake).add(v3(-0.033, 0, 0));
  fan.group.position.set(1.38 + base.x, UNIT_AT.y, -1.16 - UNIT_AT.z);
  const fanStand = frame(0.44, 0.32, UNIT_AT.y, 'fan-stand');
  fanStand.position.set(fan.group.position.x, 0, fan.group.position.z);
  scenery.add(fanStand);
  const put = (objs: THREE.Object3D[], x: number, y: number, z: number): void =>
    objs.forEach((o) => o.position.set(x, y, z));
  const filterAt = v3(FILTER_AT.x + base.x, FILTER_AT.y, FILTER_AT.z + base.z);
  put([filter.box, filter.bags], filterAt.x, filterAt.y, filterAt.z);
  const filterStand = frame(FILTER.length - 0.1, FILTER.width - 0.06, FILTER_AT.y, 'filter-stand');
  filterStand.position.set(filterAt.x + FILTER.length / 2, 0, filterAt.z);
  scenery.add(filterStand);

  // the cooler, then the mixer, the cylinder and the exhaust, in a row along x
  const cx = filterAt.x + FILTER.length + 0.75;
  const cz = filterAt.z;
  put([cooler.cooler, cooler.vessel], cx, 0.62, cz);
  const coolerWidth = COOLER.cols * COOLER.pitch + 0.04;
  for (const s of [-1, 1]) {
    const p = post(0.62, 0.03, 0.1, 'cooler-post');
    p.position.set(cx - 0.4, 0, cz + s * (coolerWidth / 2 + 0.03));
    scenery.add(p);
  }
  const cyl0 = v3(0, 0.25, 0);
  const mixerX = cx + 1.0;
  const mixerZ = cz + 0.45;
  const intakeY = cyl0.y + CYL.yHead + 0.035;
  put([mixer.mixer, mixer.gasThrottle, mixer.airThrottle, manifold], mixerX, intakeY + 0.05, mixerZ);
  const cylX = mixerX + 0.5 + CYL.half + 0.1;
  put([cyl.cylinder, cyl.injector], cylX, cyl0.y, mixerZ);
  const mpost = post(intakeY, 0.03, 0.1, 'manifold-post');
  mpost.position.set(mixerX + 0.3, 0, mixerZ);
  scenery.add(mpost);
  exhaust.group.position.set(cylX + CYL.half + 0.1 + 0.35, intakeY + 0.3, mixerZ);
  const epost = post(intakeY + 0.2, 0.035, 0.12, 'exhaust-post');
  epost.position.set(exhaust.group.position.x, 0, mixerZ);
  scenery.add(epost);
  const gpl = plinth(0.26, 0.2, 0.3, 'gauge-plinth');
  gpl.position.set(mixerX - 0.35, 0, mixerZ + 0.4);
  scenery.add(gpl);
  gauge.group.position.set(gpl.position.x, 0.31, gpl.position.z);
  // its face (the tubes and the scale stand out of the board on its +x side) turns to the open end of the line, where the camera that frames it stands
  gauge.group.rotation.y = 0;
  const cyclonePl = frame(0.34, 0.34, 0.69, 'cyclone-stand');
  // (in front of the unit's end of the line, clear of the ribbons: between the ribbons and the line it kept them 1.6 m out, and the camera with them; docs/qa.md, film round 3, m4)
  cyclone.group.position.set(CYCLONE_AT.x, 0.69, CYCLONE_AT.z);
  cyclonePl.position.set(cyclone.group.position.x, 0, cyclone.group.position.z);
  scenery.add(cyclonePl);
  // a ring drawn on the paper round the cyclone: it is on the programme's system (Fig. 3.5b), not on this tractor's schematic (conflict 22)
  const mark = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.65, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xb8742f, transparent: true, opacity: 0.8, depthWrite: false }),
  );
  mark.position.set(cyclone.group.position.x, 0.004, cyclone.group.position.z);
  mark.castShadow = false;
  scenery.add(mark);
  followers.add('cyclone', mark, { shell: false, explode: 0 });

  scene.add(
    hot.group,
    stop.group,
    stack.group,
    fan.group,
    air.group,
    filter.box,
    filter.bags,
    cooler.cooler,
    cooler.vessel,
    mixer.mixer,
    mixer.gasThrottle,
    mixer.airThrottle,
    cyclone.group,
    cyl.cylinder,
    cyl.injector,
    exhaust.group,
    gauge.group,
  );
  scenery.add(manifold);

  // ---- the pipes, between the ports as they stand
  const pFanValve = new LivePipe(0.0275, 0.08, 0.07, undefined, undefined, ['y', 'x', 'z']);
  const pFilterCooler = new LivePipe(PIPE.R, 0.08, PIPE.bend, undefined, undefined, ['x', 'z', 'y']);
  const pCoolerMixer = new LivePipe(PIPE.R, 0.08, PIPE.bend, undefined, undefined, ['z', 'y', 'x']);
  const pExhaust = new LivePipe(0.0375, 0.08, 0.08, undefined, undefined, ['x', 'z', 'y']);
  const pGauge = new LivePipe(0.0045, 0.05, 0.03, hoseMat(), hoseMat(), ['y', 'x', 'z'], false);
  scenery.add(pFanValve.root, pFilterCooler.root, pCoolerMixer.root, pExhaust.root, pGauge.root);
  // the manifold's end touches the cylinder's intake; a short rigid tube between them closes it
  const pIntake = new LivePipe(0.0375, 0.03, 0.05, undefined, undefined, undefined, true);
  scenery.add(pIntake.root);

  const pieces: Record<string, THREE.Object3D> = {
    'hot-gas-pipe': hot.group,
    'stop-valve': stop.group,
    'starting-fan': fan.group,
    'fan-stack': stack.group,
    'primary-air-valve': air.group,
    cyclone: cyclone.group,
    'filter-box': filter.box,
    'filter-bags': filter.bags,
    'gas-cooler': cooler.cooler,
    'cooler-condensate-vessel': cooler.vessel,
    'gas-air-mixer': mixer.mixer,
    'gas-throttle': mixer.gasThrottle,
    'secondary-air-throttle': mixer.airThrottle,
    'pilot-injector': cyl.injector,
    'cylinder-cutaway': cyl.cylinder,
    'exhaust-pipe': exhaust.group,
    'water-gauge': gauge.group,
  };

  // explode: the line spreads along x about its middle, nested parts leave upward or outward
  const mid = cx;
  const ex = (id: string, dy: number, dz = 0, spread = 0.38): THREE.Vector3 => {
    const p = pieces[id]!.position.x;
    return new THREE.Vector3((p - mid) * spread, dy, dz);
  };
  const EX: Record<TrainId, THREE.Vector3> = {
    'hot-gas-pipe': ex('hot-gas-pipe', 0.55),
    'stop-valve': ex('stop-valve', 0.9),
    'starting-fan': ex('starting-fan', 0.3, -0.7),
    'fan-stack': ex('fan-stack', 1.0),
    'primary-air-valve': ex('primary-air-valve', 0.6, -0.5),
    cyclone: ex('cyclone', 0.5, 0.5),
    'filter-box': ex('filter-box', 0.0),
    'filter-bags': ex('filter-bags', 1.4),
    'gas-cooler': ex('gas-cooler', 0.0),
    'cooler-condensate-vessel': ex('cooler-condensate-vessel', 0.0, -0.9),
    'gas-air-mixer': ex('gas-air-mixer', 0.45),
    'gas-throttle': ex('gas-throttle', 1.0, -0.2, 0.7),
    'secondary-air-throttle': ex('secondary-air-throttle', 1.35, 0.2, 0.7),
    'pilot-injector': ex('pilot-injector', 1.0, 0, 0.5),
    'cylinder-cutaway': ex('cylinder-cutaway', 0.0),
    'exhaust-pipe': ex('exhaust-pipe', 0.5),
    'water-gauge': ex('water-gauge', 0.6, 0.5),
  };
  const VIEW: Partial<Record<TrainId, PartFraming>> = {
    'cylinder-cutaway': { viewDir: viewFrom(6, 180) },
    'pilot-injector': { viewDir: viewFrom(8, 180) },
    'filter-bags': { viewDir: viewFrom(35, 190) },
    'cooler-condensate-vessel': { viewDir: viewFrom(10, 150) },
    // the board's two faces look along the line (its tubes and ticks stand out of it in x): from that side, above the line's own height of eye, so that the two columns and the scale are read and not the board's edge
    // (and from well above the cylinder that stands beside it: the straight flight from the cylinder's own view to this one went through the cylinder's cut metal, docs/qa.md, film round 2, M3)
    'water-gauge': { viewDir: viewFrom(30, 95) },
  };
  const anchorAt: Record<TrainId, [number, number, number]> = {
    'hot-gas-pipe': [0.05, 0.34, 0],
    'stop-valve': [0, 0.22, 0],
    'starting-fan': [0, 0.42, 0],
    'fan-stack': [0, 1.2, 0],
    'primary-air-valve': [0, 0.14, 0],
    cyclone: [0.0, 0.62, 0],
    'filter-box': [0.67, 1.47, 0.21],
    'filter-bags': [FILTER.length * 0.5, 0.5, -FILTER.width / 2],
    'gas-cooler': [0.12, 1.2, 0.01],
    'cooler-condensate-vessel': [0.115, -0.3, 0],
    'gas-air-mixer': [0.01, 0.19, -0.02],
    'gas-throttle': [-0.115, 0.2, 0],
    'secondary-air-throttle': [0, 0.5, 0],
    'pilot-injector': [0, 0.6, 0],
    'cylinder-cutaway': [0.01, -0.15, -0.04],
    'exhaust-pipe': [0, 1.42, 0.04],
    'water-gauge': [0, 0.45, 0],
  };
  const anchors: Record<string, THREE.Object3D> = {};
  for (const id of TRAIN_IDS) {
    const g = pieces[id]!;
    registry.add(id, g, EX[id], undefined, VIEW[id] ?? { viewDir: viewFrom(18, 195) });
    const a = anchorAt[id];
    anchors[id] = anchor(g, a[0], a[1], a[2], `anchor-${id}`);
  }
  // scenery follows the part it stands with
  followers.add('hot-gas-pipe', unit.root, { shell: false, explode: 1 });
  followers.add('hot-gas-pipe', unitStand, { shell: false, explode: 0 });
  followers.add('starting-fan', fanStand, { shell: false, explode: 0 });
  followers.add('filter-box', filterStand, { shell: false, explode: 0 });
  followers.add('gas-air-mixer', manifold, { shell: false, explode: 1 });
  followers.add('gas-air-mixer', mpost, { shell: false, explode: 0 });
  followers.add('exhaust-pipe', epost, { shell: false, explode: 0 });
  followers.add('water-gauge', gpl, { shell: false, explode: 0 });
  followers.add('cyclone', cyclonePl, { shell: false, explode: 0 });
  for (const p of [pFanValve, pFilterCooler, pCoolerMixer, pExhaust, pGauge, pIntake])
    followers.add(
      p === pFanValve
        ? 'primary-air-valve'
        : p === pFilterCooler
          ? 'gas-cooler'
          : p === pCoolerMixer
            ? 'gas-air-mixer'
            : p === pExhaust
              ? 'exhaust-pipe'
              : p === pGauge
                ? 'water-gauge'
                : 'cylinder-cutaway',
      p.root,
      { shell: true, explode: 0 },
    );
  // (the Sankey on the floor in front of the line is in the picture too)
  // (close about them: the line from the unit to the exhaust and the ribbons before it fill the width of the picture; the slab round them is not the subject)
  let aspect = 16 / 9;
  const wide = homeWide(cylX);
  // the shape of the view is read when the framing is asked for (the first one comes before any render)
  registry.overview(() => [viewAspect(aspect) < 1 ? HOME_BOX(cylX) : wide.box]);
  scene.onBeforeRender = (_r, _s, camera) => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) aspect = (camera as THREE.PerspectiveCamera).aspect;
  };
  yard.fitSlab(-2.2, -6.6, cylX + 2.2, 3.0);

  const portOf = (id: string, p: Port): Port => worldPort(pieces[id]!, p);
  const syncPipes = (): void => {
    pFanValve.set(portOf('starting-fan', fan.ports.out!), portOf('primary-air-valve', air.ports.in!));
    pFilterCooler.set(worldPort(filter.box, filter.ports.out!), worldPort(cooler.cooler, cooler.ports.in!));
    pCoolerMixer.set(worldPort(cooler.cooler, cooler.ports.out!), worldPort(mixer.mixer, mixer.ports.gas!));
    pExhaust.set(worldPort(cyl.cylinder, cyl.ports.exhaust), worldPort(exhaust.group, exhaust.ports.manifold));
    pGauge.set(worldPort(gauge.group, gauge.ports.tap!), worldPort(mixer.mixer, mixer.ports.tap!));
    pIntake.set(
      worldPort(cyl.cylinder, cyl.ports.intake),
      worldPort(manifold, { p: v3(0.5, -0.05, 0), dir: v3(1, 0, 0), r: 0.0375 }),
    );
  };
  syncPipes();
  // where the energy goes, flat on the paper in front of the line: the model's kilowatts as ribbons
  const sankey = buildSankey();
  // (as near the line as the cyclone's stand lets them: every decimetre between the ribbons and the line is a decimetre the camera stands further back at home)
  sankey.group.position.set(-0.2, 0, SANKEY_Z);
  scene.add(sankey.group);
  followers.add('hot-gas-pipe', sankey.group, { shell: false, explode: 0 });
  sankey.update(base0);
  // its name, so that the ribbons on the floor are not a mystery: a label of the line, which it follows
  anchors['hot-gas-pipe#energy'] = anchor(sankey.group, 2.25, 0.02, 0.3, 'anchor-energy');
  const lineFlow = makeFlow(
    lineSections({
      hot: hot.group,
      valve: stop.group,
      filter: filter.box,
      cooler: cooler.cooler,
      mixer: mixer.mixer,
      fan: fan.group,
      air: air.group,
      filterToCooler: pFilterCooler,
      coolerToMixer: pCoolerMixer,
      fanToValve: pFanValve,
      manifold: () => {
        manifold.updateMatrix();
        return [
          v3(0, -0.05, 0).applyMatrix4(manifold.matrix),
          v3(0.5, -0.05, 0).applyMatrix4(manifold.matrix),
          ...pIntake.points,
        ];
      },
      exhaust: () => {
        exhaust.group.updateMatrix();
        return [
          ...pExhaust.points,
          v3(0, 0.0, 0).applyMatrix4(exhaust.group.matrix),
          v3(0, 1.1, 0).applyMatrix4(exhaust.group.matrix),
        ];
      },
    }),
    1700,
    0.05,
  );
  scene.add(lineFlow.dots.object);
  const unitFlow = makeFlow(unitSections(unit.nozzles, false), 400, 0.03);
  unit.root.add(unitFlow.dots.object);
  const hs: Hotspot[] = hotspots(HOTSPOTS, anchors);
  let cycle = 0;
  void dynamic;
  void mesh;
  void TAU;
  void PAPER;
  void MIXER;
  void setField;

  return {
    id: 'gas-train',
    scene,
    registry,
    hotspots: hs,
    pieces,
    // (`HOME_WIDE`: the direction is the kit's to keep, the distance the kit's to set from the overview's box)
    home: { position: HOME_WIDE.eye.clone(), target: HOME_WIDE.at.clone() },
    minDistance: 0.4,
    maxDistance: 36,
    near: 0.05,
    far: 5000,
    declutter: true,
    get homePadding() {
      return viewAspect(aspect) < 1 ? 0.62 : wide.padding;
    },
    update(state: GasState, dt: number, view: ViewOpts) {
      setField(state);
      const now = partsNow(registry);
      const p = opts.params?.();
      unit.update({
        bunkerShare: state.bunkerShare,
        engineOn: state.engineOn,
        gasFlowShare: state.gasFlowShare,
        grateMoving: state.grateMoving,
        lidPush: 0,
        ashShare: Math.min(1, state.ashKg / 4),
        jarShare: Math.min(1, state.condensateL * 0.08),
        time: view.time,
        slowMo: view.slowMo,
        dt,
      });
      // the cylinder: the crank turns at a few per cent of the true speed, never above the cap; the cycle takes two turns
      const rps = (state.engineOn ? state.engineRpm : 0) / 60;
      const vis = visualTurns(rps * 0.06);
      cycle = (cycle + vis * 360 * dt * view.slowMo) % 720;
      cyl.setCycle(cycle, state.burnShare, state.engineOn);
      // the starting fan, only as the model's source
      const on = p?.fanSource === true;
      fan.impeller.rotation.z += on ? visualTurns(48) * TAU * dt * view.slowMo : 0;
      (fan.blur.material as THREE.MeshBasicMaterial).opacity = on ? 0.5 : 0;
      void blurOf;
      syncPipes();
      sankey.update(state);
      // the same pieces' dynamics as on the tractor
      const dust = Math.min(1, state.filterHours / 60 + (state.filterDropMmWg - 150) / 700);
      const c = new THREE.Color(0xd6d2c4).lerp(new THREE.Color(0x6b665e), Math.max(0, dust));
      if (state.filterWet) c.lerp(new THREE.Color(0x3c4448), 0.55);
      filter.clothMat.color.copy(c);
      filter.trayDust.scale.y = 0.001 + 0.05 * Math.max(0, Math.min(1, dust));
      cooler.vesselWater.scale.y = 0.01 + (COOLER.vessel.h - 0.012) * Math.min(1, state.coolerVesselShare);
      const half = state.filterDropMmWg / 1000 / 2;
      gauge.left.scale.y = Math.max(0.002, gauge.mid - 0.02 - half);
      gauge.right.scale.y = Math.max(0.002, gauge.mid - 0.02 + half);
      const load = Math.min(1, Math.max(0, state.powerKw / 51));
      mixer.gasLever.rotation.y = -0.1 - load * 0.7;
      mixer.airLever.rotation.y = 0.1 + load * 0.35;
      exhaust.flap.rotation.z = state.engineOn ? 0.9 : 0;
      // the line's dots, after the pipes have followed their ports
      // (apart, the dots would hang in the air where the parts were)
      lineFlow.update(state, dt, { slowMo: view.slowMo, visible: view.schematic && !now.exploded });
      unitFlow.update(state, dt, { slowMo: view.slowMo, visible: view.schematic && !now.exploded });
      followers.force(unit.root, false);
      for (const f of followers.list) if (f.shell) followers.force(f.root, now.xray);
      followers.update(registry);
    },
  };
}
