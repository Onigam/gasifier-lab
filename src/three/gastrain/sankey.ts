import * as THREE from 'three';
import { group, patchMaterial } from '@onigam/lab-kit/three';
import type { GasState } from '../../sim/types';

// Where the energy goes, on the paper in front of the line: a Sankey of the model's own kilowatts, flat, in four columns. The wood's energy goes in; the gasifier keeps its losses and passes the gas on; the diesel joins the gas at the engine; the engine
// gives the shaft its work and keeps its losses. 1 cm of width is 2 kW. Ribbons only: no figure, no text (the strip and the sheets carry the numbers). It rebuilds a ribbon when its width has moved by more than a quarter of a kilowatt.

const SCALE = 0.005;
// (deeper than the slab they lie on: a ribbon paler than concrete in the sun is lost on it)
const COLOUR = { wood: 0x7d5526, gas: 0x2f7f7a, loss: 0x6f6b66, diesel: 0xc66a1c, shaft: 0x2f7d33 };

interface Link {
  mesh: THREE.Mesh;
  last: number;
}

export interface Sankey {
  group: THREE.Group;
  update(s: Pick<GasState, 'woodKw' | 'dieselKw' | 'gasKw' | 'gasifierLossKw' | 'shaftKw' | 'engineLossKw'>): void;
}

/** A ribbon from (x0, z0..z0+w0) to (x1, z1..z1+w1), edges easing from one to the other. In the plane, y up by `y`. */
function ribbon(
  x0: number,
  z0: number,
  w0: number,
  x1: number,
  z1: number,
  w1: number,
  head = false,
  tail = false,
): THREE.BufferGeometry {
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
  const uv: number[] = [];
  const edge: number[] = [];
  for (let i = 0; i <= n; i++) {
    pos.push(top[i]![0], 0, top[i]![1], bottom[i]![0], 0, bottom[i]![1]);
    // along the flow in metres, and across the ribbon in metres; and how far across as a share, for the rim
    const wide = bottom[i]![1] - top[i]![1];
    uv.push(top[i]![0], 0, bottom[i]![0], wide);
    edge.push(0, 1);
    if (i < n) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  if (tail) {
    // a ribbon that comes in from outside the picture's sum (the diesel) starts in a swallow's tail cut into its end, not square in the air: it reads as fed from somewhere (docs/qa.md, film round 3, m4)
    const k = pos.length / 3;
    const len = 0.6 * arrowHead(w0);
    pos.push(x0 - len, 0, z0, x0 - len, 0, z0 + w0, x0 - len * 0.1, 0, z0 + w0 / 2);
    uv.push(x0 - len, 0, x0 - len, w0, x0, w0 / 2);
    edge.push(0, 1, 0.5);
    // the two barbs and the strip between the notch and the start, wound as the ribbon is (facing up)
    idx.push(k, k + 2, 0, 0, k + 2, 1, k + 2, k + 1, 1);
  }
  if (head) {
    // where a ribbon ends (the shaft's work, a loss) it ends in an arrow's head, wider than the ribbon: which way the energy goes is read from across the yard, where the chevrons along it are too fine
    const k = pos.length / 3;
    const len = arrowHead(w1);
    const over = 0.22 * w1 + 0.03;
    pos.push(x1, 0, z1 - over, x1, 0, z1 + w1 + over, x1 + len, 0, z1 + w1 / 2);
    uv.push(x1, 0, x1, w1, x1 + len, w1 / 2);
    edge.push(0.3, 0.7, 0.5);
    idx.push(k, k + 1, k + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
  g.setIndex(idx);
  g.userData.head = head;
  g.userData.tail = tail;
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

/** The length of the arrow's head that ends a ribbon `w` wide, metres. */
export const arrowHead = (w: number): number => Math.min(0.42, Math.max(0.16, 0.7 * w));

export function buildSankey(): Sankey {
  const g = group('sankey');
  // a ribbon is a band of the stuff that flows, not a sheet of paint: a rim a little darker and a core a little paler, fine streaks along the flow (a stream's), and a slow grain; the streaks go with the distance, where they would crawl
  const mat = (c: number): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.78,
      metalness: 0,
      transparent: true,
      opacity: 0.93,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    patchMaterial(m, 'sankey-ribbon', (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute float aEdge;\nvarying float vEdge;\nvarying vec2 vRib;',
        )
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEdge = aEdge;\nvRib = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying float vEdge;
          varying vec2 vRib;
          float rH( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
          float rN( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( rH( i ), rH( i + vec2( 1.0, 0.0 ) ), u.x ), mix( rH( i + vec2( 0.0, 1.0 ) ), rH( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          {
            float rim = smoothstep( 0.0, 0.2, vEdge ) * smoothstep( 1.0, 0.8, vEdge );
            float across = abs( vEdge - 0.5 ) * 2.0;
            float streakAt = vRib.y / 0.03 + 2.0 * rN( vec2( vRib.x * 3.0, vRib.y * 20.0 ) );
            float fwS = fwidth( streakAt );
            float streak = ( 0.5 + 0.5 * sin( streakAt * 6.2831853 ) ) * ( 1.0 - smoothstep( 0.1, 0.25, fwS ) );
            float grain = rN( vec2( vRib.x * 5.0, vRib.y * 60.0 ) );
            // chevrons that point the way it flows (+x), a band every 60 cm, gone where the pixel is wider than a few centimetres
            float chevAt = vRib.x / 0.6 + across * 0.4;
            float chev = smoothstep( 0.0, 0.14, fract( chevAt ) ) * ( 1.0 - smoothstep( 0.1, 0.34, fract( chevAt ) ) ) * ( 1.0 - smoothstep( 0.08, 0.2, fwidth( chevAt ) ) );
            diffuseColor.rgb *= ( 0.66 + 0.38 * rim ) * ( 0.92 + 0.12 * streak ) * ( 0.94 + 0.12 * grain );
            // (a pale chevron with a dark one behind it: the pair reads from further than a pale one alone)
            float chevBack = smoothstep( 0.0, 0.12, fract( chevAt + 0.3 ) ) * ( 1.0 - smoothstep( 0.1, 0.3, fract( chevAt + 0.3 ) ) ) * ( 1.0 - smoothstep( 0.08, 0.2, fwidth( chevAt ) ) );
            diffuseColor.rgb *= 1.0 - 0.2 * chevBack * rim;
            diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 1.0 ), 0.36 * chev * rim );
          }`,
        );
    });
    return m;
  };
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
      redo(loss1, k(L1) + 0.002, () => ribbon(X[1]!, G, L1, X[2]!, G + 0.35, L1, true));
      // the gas goes on to the engine, the diesel joins it
      redo(gas2, k(G) + 0.003, () => ribbon(X[2]!, 0, G, X[3]!, 0, G));
      // the diesel comes in from outside the sum (a swallow's tail) and goes into the engine's ribbon (an arrow's head over its edge)
      redo(diesel, k(D) + 0.004, () => ribbon(X[2]! + 0.2, G + L1 + 0.35 + 0.15, D, X[3]!, G, D, true, true));
      redo(engine, k(G + D) + 0.005, () => ribbon(X[3]!, 0, G + D, X[4]!, 0, G + D));
      redo(shaft, k(S) + 0.006, () => ribbon(X[4]!, 0, S, X[5]!, 0, S, true));
      redo(loss2, k(L2) + 0.007, () => ribbon(X[4]!, S, L2, X[5]!, S + 0.35, L2, true));
    },
  };
}
