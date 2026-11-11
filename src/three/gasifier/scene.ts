import * as THREE from 'three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { COLUMN, HEARTH, UNIT, UNIT_AT } from '../dims';
import { frame } from '../train/stands';
import { RAMP } from '../unit/field';
import { cursorY, buildUnit, UNIT_PARTS, type Unit, type UnitPartId } from '../unit/unit';
import { setField, FIELD, fieldT } from '../unit/field';
import { makeFlow, unitSections } from '../flowpaths';
import { heatRgb, heatStops } from '@onigam/lab-kit/sim/thermal';
import { group, mesh } from '@onigam/lab-kit/three';
import { joined } from '../common';
import { darkSteel } from '../materials';
import {
  PAPER,
  WorldRegistry,
  anchor,
  hotspots,
  paperFloor,
  partsNow,
  viewFrom,
  workshopScene,
  type HotspotDef,
  type PartFraming,
} from '../world';
import { mergeStatic } from '../merge';
import type { GasParams, GasState } from '../../sim/types';

// `gasifier`: the unit in section, the roadmap's « aha ». The same function that draws the unit on the tractor and in the farm (`buildUnit`), cut along its axis, standing on the console that carries it on the tractor. « The journey of a chip »: a
// cursor carries one chip down the axis through drying, pyrolysis, oxidation and reduction, and the cut face of the bed is in the model's false colours, 20 to 1,400 °C. Always cut: there is no tool to press.

export interface GasifierOptions {
  /** The simulation's parameters (the journey's cursor is one of them). */
  params?: () => GasParams;
  /** The part selected, for what the sheet may not print (R2). */
  selected?: () => string | null;
}

/**
 * The parts whose box would give a size the lab does not print (R2): the hearth, the zones around it, the lower casing (its height and its diameter are listed beside the hot parts' sizes, research §3, « print: no »), and the parts whose box, printed
 * as « Encombrement », comes out at a length the lab withholds to the figure that is printed or within 3 mm of it (`encombrement.test.ts` finds them in every world; here six: the half-cut bed is as wide as the casing it sits in, and prints 2 mm off). The camera still frames them.
 */
export const GASIFIER_REFUSED: ReadonlySet<string> = new Set([
  'throat-ring',
  'air-nozzles',
  'fire-box',
  'reduction-zone',
  'oxidation-zone',
  'pyrolysis-zone',
  'grate',
  'outer-casing',
  'air-intake',
  'grate-linkage',
  'ash-pit',
  'chip-column',
  'condensate-drain',
  'gas-outlet',
]);

/** Where a part is looked at from. The unit stands with its open side towards −z. The hot parts are looked at from a little higher, so that the grate's bars and the ring's cone read and not an edge, and the intake from its own side. */
const FRAMING: Record<UnitPartId, PartFraming> = {
  ...(Object.fromEntries(UNIT_PARTS.map((id) => [id, { viewDir: viewFrom(14, 205) }])) as Record<
    UnitPartId,
    PartFraming
  >),
  'throat-ring': { viewDir: viewFrom(22, 200) },
  'air-nozzles': { viewDir: viewFrom(26, 215) },
  'fire-box': { viewDir: viewFrom(20, 205) },
  grate: { viewDir: viewFrom(36, 200) },
  'air-intake': { viewDir: viewFrom(20, 235) },
};

/** The explode: every part leaves along a vertical line or straight out of its place, so nothing goes through the casing. In metres of U. */
export const EXPLODE: Record<UnitPartId, [number, number, number]> = {
  'spring-lid': [0, 1.15, 0],
  'fuel-casing': [0, 0.78, 0],
  'eccentric-lock': [0, 0.45, 0],
  'fuel-baffle': [0, 0.6, 0],
  'condensate-sleeve': [0, 0.4, 0],
  'chip-column': [0, 1.35, 0],
  'drying-zone': [0, 0.95, 0],
  'pyrolysis-zone': [0, 0.55, 0],
  'oxidation-zone': [0, 0.28, 0],
  'reduction-zone': [0, 0.08, 0],
  'condensate-drain': [0.35, 0.3, 0],
  'outer-casing': [0, 0, 0],
  'air-intake': [-0.5, 0, 0],
  'air-nozzles': [-0.25, 0.2, 0],
  'fire-box': [0, 0, 0],
  'throat-ring': [0, 0.12, 0],
  grate: [0, 0, -0.9],
  'grate-linkage': [0.5, 0, 0],
  'ash-pit': [0, 0, -0.7],
  'gas-outlet': [0.5, 0, 0],
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'spring-lid', fr: 'Couvercle à ressort', en: 'Spring lid' },
  { id: 'fuel-casing', fr: 'Corps à combustible', en: 'Fuel casing', minor: true },
  { id: 'chip-column', fr: 'Colonne de plaquettes', en: 'Chip column' },
  { id: 'drying-zone', fr: 'Séchage', en: 'Drying' },
  { id: 'pyrolysis-zone', fr: 'Pyrolyse', en: 'Pyrolysis' },
  { id: 'oxidation-zone', fr: 'Oxydation', en: 'Oxidation' },
  { id: 'reduction-zone', fr: 'Réduction', en: 'Reduction' },
  { id: 'fuel-baffle', fr: 'Déflecteur', en: 'Fuel baffle', minor: true },
  { id: 'condensate-sleeve', fr: 'Manchon', en: 'Condensate sleeve', minor: true },
  { id: 'condensate-drain', fr: 'Purge', en: 'Condensate drain', minor: true },
  { id: 'eccentric-lock', fr: 'Verrou à came', en: 'Eccentric lock', minor: true },
  { id: 'outer-casing', fr: 'Enveloppe', en: 'Outer casing', minor: true },
  { id: 'air-intake', fr: 'Prise d’air', en: 'Air intake', minor: true },
  { id: 'air-nozzles', fr: 'Tuyères', en: 'Air nozzles', minor: true },
  { id: 'fire-box', fr: 'Foyer', en: 'Fire box', minor: true },
  { id: 'throat-ring', fr: 'Anneau de gorge', en: 'Throat ring', minor: true },
  { id: 'grate', fr: 'Grille', en: 'Grate', minor: true },
  { id: 'grate-linkage', fr: 'Commande de grille', en: 'Grate linkage', minor: true },
  { id: 'ash-pit', fr: 'Cendrier', en: 'Ash pit' },
  { id: 'gas-outlet', fr: 'Sortie de gaz', en: 'Gas outlet', minor: true },
];

export function createGasifierScene(opts: GasifierOptions = {}): SceneModule<GasState> & { unit: Unit } {
  const scene = workshopScene({
    name: 'gasifier',
    key: [2.4, 4.2, -3.2],
    target: [0, 0.8, 0],
    shadowHalf: 3,
    shadowFar: 14,
    exposure: 1.0,
  });
  scene.add(paperFloor(14, 8, -0.0));
  const registry = new WorldRegistry(GASIFIER_REFUSED, opts.selected ?? (() => null));

  const unit = buildUnit({ cut: true });
  unit.root.position.set(0, UNIT_AT.y, 0);
  scene.add(unit.root);
  const flow = makeFlow(unitSections(unit.nozzles, true), 500, 0.028);
  // the paths are in the unit's own frame, and the unit stands on its frame
  flow.dots.object.position.set(0, UNIT_AT.y, 0);
  scene.add(flow.dots.object);

  // what it stands on: a frame the height of the console that carries it on the tractor, with the shelf of the fan's side left out
  const stand = frame(0.8, 0.8, UNIT_AT.y, 'unit-stand');
  scene.add(stand);

  // the scale of the false colours: a bar on a foot, 20 °C at the bottom to 1,400 °C at the top, the ramp of the lab; two labels
  const barH = 0.9;
  const bar = group('ramp-bar');
  {
    const stops = heatStops(RAMP.min, RAMP.max);
    const N = 128;
    const px = new Uint8Array(N * 4);
    const rgb: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      heatRgb(stops, RAMP.min + ((RAMP.max - RAMP.min) * i) / (N - 1), rgb);
      for (let c = 0; c < 3; c++) {
        const x = rgb[c]!;
        px[i * 4 + c] = Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
      }
      px[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(px, 1, N, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    bar.add(
      mesh(new THREE.BoxGeometry(0.06, barH, 0.012), new THREE.MeshBasicMaterial({ map: tex }), [
        0,
        barH / 2 + 0.05,
        0,
      ]),
    );
    bar.add(mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1), darkSteel(), [0, 0.025, 0]));
    bar.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8), darkSteel(), [0, 0.07, 0]));
    // ticks every 200 °C: marks only
    const marks: THREE.BufferGeometry[] = [];
    for (let T = 200; T < RAMP.max; T += 200) {
      const y = 0.05 + (barH * (T - RAMP.min)) / (RAMP.max - RAMP.min);
      marks.push(new THREE.BoxGeometry(0.02, 0.003, 0.014).translate(0.04, y, 0));
    }
    bar.add(mesh(joined(marks), darkSteel()));
  }
  bar.position.set(0.95, 0, -0.35);
  scene.add(bar);

  const anchors: Record<string, THREE.Object3D> = {};
  for (const id of UNIT_PARTS) {
    const g = unit.parts.get(id)!;
    const a = unit.anchors[id];
    anchors[id] = anchor(g, a.x, a.y, a.z, `anchor-${id}`);
    registry.add(id, g, new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  }
  registry.overview(() => [
    new THREE.Box3(new THREE.Vector3(-0.6, 0, -0.5), new THREE.Vector3(0.6, UNIT_AT.y + UNIT.height + 0.1, 0.5)),
  ]);
  void mergeStatic;

  anchors['drying-zone#cold'] = anchor(bar, 0.05, 0.08, 0, 'ramp-cold');
  anchors['oxidation-zone#hot'] = anchor(bar, 0.05, 0.05 + barH, 0, 'ramp-hot');
  const hs: Hotspot[] = hotspots(
    [
      ...HOTSPOTS,
      { id: 'drying-zone#cold', fr: '20 °C', en: '20 °C', minor: true },
      { id: 'oxidation-zone#hot', fr: '1 400 °C', en: '1,400 °C', minor: true },
    ],
    anchors,
  );
  void heatRgb;
  void heatStops;
  void FIELD;
  void fieldT;
  void HEARTH;
  void COLUMN;
  void PAPER;

  return {
    id: 'gasifier',
    scene,
    registry,
    hotspots: hs,
    unit,
    home: { position: new THREE.Vector3(1.9, 1.6, -3.5), target: new THREE.Vector3(0, 0.85, 0) },
    minDistance: 0.2,
    maxDistance: 9,
    near: 0.05,
    far: 80,
    declutter: true,
    homePadding: 1.0,
    update(state: GasState, dt: number, view: ViewOpts) {
      setField(state);
      const p = opts.params?.();
      unit.update({
        bunkerShare: state.bunkerShare,
        engineOn: state.engineOn,
        gasFlowShare: state.gasFlowShare,
        grateMoving: state.grateMoving,
        lidPush: state.pressureSign === 'pressure' ? Math.min(1, state.plumeShare) : 0,
        ashShare: Math.min(1, state.ashKg / 4),
        jarShare: Math.min(1, state.condensateL * 0.08),
        time: view.time,
        slowMo: view.slowMo,
        dt,
      });
      flow.update(state, dt, { slowMo: view.slowMo, visible: view.schematic && !partsNow(registry).exploded });
      const j = p?.journey ?? 0.62;
      unit.cursor.visible = true;
      unit.cursor.position.y = cursorY(j);
    },
  };
}
