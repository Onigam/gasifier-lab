import * as THREE from 'three';
import { COOLER, FILTER, HOTPIPE, PIPE } from '../dims';
import { v3 } from '../common';
import type { Section } from '../flowpaths';
import type { LivePipe } from './pipes';

// The sections of the gas's way for « Flux »: from the unit's outlet through the hot pipe and the stop valve, into the filter, through the cloth, out, to the cooler, up one half and down the other, to the mixer, on to the engine; and the primary air from the fan's eye
// through its pipe and the valve into the unit. Each section is a function that returns its points now, from where the pieces stand: the explode moves a piece and its dots follow. The pieces' own frames hold the paths inside them.

const pipeArea = Math.PI * PIPE.R * PIPE.R;
const airPipe = Math.PI * 0.0275 * 0.0275;

export interface LineFrames {
  hot: THREE.Object3D;
  valve: THREE.Object3D;
  filter: THREE.Object3D;
  cooler: THREE.Object3D;
  mixer: THREE.Object3D;
  fan: THREE.Object3D;
  air: THREE.Object3D;
  filterToCooler: LivePipe;
  coolerToMixer: LivePipe;
  fanToValve: LivePipe;
  /** Only in the gas-train world: the manifold from the mixer to the cylinder, the cylinder's intake, and the exhaust. */
  manifold?: () => THREE.Vector3[];
  exhaust?: () => THREE.Vector3[];
}

const at = (o: THREE.Object3D, pts: [number, number, number][]): THREE.Vector3[] => {
  o.updateMatrix();
  return pts.map((p) => v3(...p).applyMatrix4(o.matrix));
};

export function lineSections(f: LineFrames): Section[] {
  const L = FILTER.length;
  const H = FILTER.height;
  const out: Section[] = [];
  // the hot pipe, from the unit's outlet flange up the riser to the tee, then along the run and through the stop valve to the filter's inlet
  out.push({
    id: 'hot',
    area: pipeArea,
    temp: (s) => s.outletT,
    points: () => [
      ...at(f.hot, [
        [-0.02, 0, 0],
        [0.03, 0, 0],
        [HOTPIPE.run, 0.03, 0],
        [HOTPIPE.run, HOTPIPE.riser, 0],
        [HOTPIPE.run + HOTPIPE.teeRun + 0.01, HOTPIPE.riser, 0],
      ]),
      ...at(f.valve, [
        [-0.048, 0, 0],
        [0.048, 0, 0],
      ]),
      ...at(f.filter, [
        [-0.06, FILTER.inlet.y, FILTER.inlet.z],
        [0.0, FILTER.inlet.y, FILTER.inlet.z],
      ]),
    ],
  });
  // in the filter, the dirty side: along the box, then up between two bags
  out.push({
    id: 'filter-dirty',
    area: 0.28,
    temp: (s) => s.filterInT,
    points: () =>
      at(f.filter, [
        [0.0, FILTER.inlet.y, FILTER.inlet.z],
        [0.25, FILTER.inlet.y, FILTER.inlet.z],
        [0.35, 0.5, -0.09],
        [0.447, 0.5, -0.08],
      ]),
  });
  // through the cloth and up inside the bag, to the lid chamber and out: the dust stays behind
  out.push({
    id: 'filter-clean',
    area: FILTER.areaDrawn,
    temp: (s) => s.filterT,
    points: () =>
      at(f.filter, [
        [0.447, 0.5, -0.08],
        [0.46, 0.5, -0.07],
        [0.46, 0.74, -0.05],
        [0.46, H - FILTER.chamberH + 0.05, 0.0],
        [L - 0.12, H - FILTER.chamberH + 0.05, 0.0],
        [L - 0.12, H + 0.05, 0],
      ]),
  });
  // out of the filter and over to the cooler's inlet
  out.push({
    id: 'filter-to-cooler',
    area: pipeArea,
    temp: (s) => s.filterT,
    points: () => f.filterToCooler.points.slice(),
  });
  // the cooler: in at the foot of the lower box, up the near half, across the header, down the far half, out at the side
  const depth = COOLER.rows * COOLER.pitch + 0.04;
  const width = COOLER.cols * COOLER.pitch + 0.04;
  const top = COOLER.boxH + COOLER.tubeL;
  out.push({
    id: 'cooler',
    area: 0.017,
    temp: (s) => (s.filterT + s.coolerOutT) / 2,
    points: () =>
      at(f.cooler, [
        [depth + 0.04, COOLER.boxH / 2, -0.15],
        [depth / 2, COOLER.boxH / 2, -0.15],
        [depth / 2, top - 0.02, -0.15],
        [depth / 2, top + COOLER.headerH / 2, -0.15],
        [depth / 2, top + COOLER.headerH / 2, 0.15],
        [depth / 2, top - 0.02, 0.15],
        [depth / 2, COOLER.boxH / 2, 0.15],
        [depth / 2, COOLER.boxH / 2, width / 2 + 0.04],
      ]),
  });
  out.push({
    id: 'cooler-to-mixer',
    area: pipeArea,
    temp: (s) => s.coolerOutT,
    points: () => f.coolerToMixer.points.slice(),
  });
  // the mixer: the gas in through the throttle, the air down from above, both to the manifold
  out.push({
    id: 'mixer',
    area: 0.011,
    temp: (s) => s.mixT,
    points: () =>
      at(f.mixer, [
        [-0.25, 0.12, 0],
        [-0.06, 0.12, 0],
        [0.0, 0.12, 0],
        [0.0, 0.01, 0],
        [0.0, -0.05, 0],
      ]),
  });
  out.push({
    id: 'mixer-air',
    area: 0.007,
    temp: () => 20,
    air: true,
    points: () =>
      at(f.mixer, [
        [0.2, 0.3, 0],
        [0.04, 0.44, 0],
        [0.0, 0.32, 0],
        [0.0, 0.14, 0],
      ]),
  });
  if (f.manifold) out.push({ id: 'manifold', area: 0.004, temp: (s) => s.mixT, points: f.manifold });
  if (f.exhaust) out.push({ id: 'exhaust', area: 0.004, temp: (s) => Math.max(150, s.outletT), points: f.exhaust });
  // the primary air: from the fan's eye, through the fan and its pipe, the valve, into the unit
  out.push({
    id: 'primary-air',
    area: airPipe,
    temp: () => 20,
    air: true,
    points: () => [
      ...at(f.fan, [
        [0.0, 0.18, -0.12],
        [0.0, 0.18, -0.05],
        [0.13, 0.35, 0.0],
        [0.13, 0.41, 0],
      ]),
      ...f.fanToValve.points,
      ...at(f.air, [
        [-0.033, 0, 0],
        [0.033, 0, 0],
      ]),
    ],
  });
  return out;
}
