import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import type { GasState } from '../../sim/types';

// Where the energy goes, on the paper in front of the line: a Sankey of the model's own kilowatts, flat, in four columns. The wood's energy goes in; the gasifier keeps its losses and passes the gas on; the diesel joins the gas at the engine; the engine
// gives the shaft its work and keeps its losses. 1 cm of width is 2 kW. Ribbons only: no figure, no text (the strip and the sheets carry the numbers). It rebuilds a ribbon when its width has moved by more than a quarter of a kilowatt.

const SCALE = 0.005;
const COLOUR = { wood: 0x8c6a3f, gas: 0x5f8f8a, loss: 0x9b9791, diesel: 0xc9803a, shaft: 0x4e8a4a };

interface Link {
  mesh: THREE.Mesh;
  last: number;
}

export interface Sankey {
  group: THREE.Group;
  update(s: Pick<GasState, 'woodKw' | 'dieselKw' | 'gasKw' | 'gasifierLossKw' | 'shaftKw' | 'engineLossKw'>): void;
}

/** A ribbon from (x0, z0..z0+w0) to (x1, z1..z1+w1), edges easing from one to the other. In the plane, y up by `y`. */
function ribbon(x0: number, z0: number, w0: number, x1: number, z1: number, w1: number): THREE.BufferGeometry {
  const n = 24;
  const top: [number, number][] = [];
  const bottom: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = t * t * (3 - 2 * t);
    const x = x0 + (x1 - x0) * t;
    top.push([x, z0 + (z1 - z0) * e]);
    bottom.push([x, z0 + w0 + (z1 + w1 - z0 - w0) * e]);
  }
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    pos.push(top[i]![0], 0, top[i]![1], bottom[i]![0], 0, bottom[i]![1]);
    if (i < n) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // lie facing up whatever the winding
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  if (nrm.getY(0) < 0) {
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1]!;
      idx[i + 1] = idx[i + 2]!;
      idx[i + 2] = t;
    }
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  return g;
}

export function buildSankey(): Sankey {
  const g = group('sankey');
  const mat = (c: number): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.85,
      metalness: 0,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  const make = (c: number): Link => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), mat(c));
    m.position.y = 0.012;
    m.castShadow = false;
    m.receiveShadow = true;
    m.renderOrder = 2;
    g.add(m);
    return { mesh: m, last: -1 };
  };
  const wood = make(COLOUR.wood);
  const gas1 = make(COLOUR.gas);
  const loss1 = make(COLOUR.loss);
  const gas2 = make(COLOUR.gas);
  const diesel = make(COLOUR.diesel);
  const engine = make(COLOUR.gas);
  const shaft = make(COLOUR.shaft);
  const loss2 = make(COLOUR.loss);
  const redo = (l: Link, key: number, build: () => THREE.BufferGeometry): void => {
    if (Math.abs(key - l.last) < 0.25 * SCALE * 100) return;
    l.last = key;
    l.mesh.geometry.dispose();
    l.mesh.geometry = build();
  };
  // columns along x (m), the line running along z from the front of the paper
  const X = [0.0, 0.9, 1.9, 2.8, 3.6, 4.5];
  return {
    group: g,
    update(s) {
      const W = s.woodKw * SCALE;
      const G = s.gasKw * SCALE;
      const L1 = s.gasifierLossKw * SCALE;
      const D = s.dieselKw * SCALE;
      const S = s.shaftKw * SCALE;
      const L2 = s.engineLossKw * SCALE;
      const k = (v: number) => v / SCALE;
      // wood in, split into the gas and the gasifier's losses
      redo(wood, k(W), () => ribbon(X[0]!, 0, W, X[1]!, 0, W));
      redo(gas1, k(G) + 0.001, () => ribbon(X[1]!, 0, G, X[2]!, 0, G));
      redo(loss1, k(L1) + 0.002, () => ribbon(X[1]!, G, L1, X[2]!, G + 0.35, L1));
      // the gas goes on to the engine, the diesel joins it
      redo(gas2, k(G) + 0.003, () => ribbon(X[2]!, 0, G, X[3]!, 0, G));
      redo(diesel, k(D) + 0.004, () => ribbon(X[2]! + 0.2, G + L1 + 0.35 + 0.15, D, X[3]!, G, D));
      redo(engine, k(G + D) + 0.005, () => ribbon(X[3]!, 0, G + D, X[4]!, 0, G + D));
      redo(shaft, k(S) + 0.006, () => ribbon(X[4]!, 0, S, X[5]!, 0, S));
      redo(loss2, k(L2) + 0.007, () => ribbon(X[4]!, S, L2, X[5]!, S + 0.35, L2));
    },
  };
}
