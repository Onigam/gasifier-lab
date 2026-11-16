import * as THREE from 'three';
import { patchMaterial, rng } from '@onigam/lab-kit/three';
import { smoothstep } from '../common';
import { birchBarkMap, spruceBarkMap, barkMap, tiled } from '../textures';
import { terrainHeight } from './terrain';

// The trees of the farm, all instanced: each species is one unit geometry (height 1, its foot at the origin) with its colours in the vertices. A tree has a trunk, limbs that fork and the mass of its species: a birch is slender and airy with white bark and small
// light leaves, an oak broad and dense, an apple tree short and round, a spruce a tall cone of drooping boughs, a pine a bare trunk under a flat crown. The crowns are sprays of leaf cards on the limbs (never a ball), turned to the camera by nothing: crossed
// cards, so that a tree reads from every side. The placement is seeded: the same farm at every load.

export class Mesher {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];
  get n(): number {
    return this.pos.length / 3;
  }
  vert(x: number, y: number, z: number, c: THREE.Color, u = 0, v = 0): number {
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    this.uv.push(u, v);
    return this.n - 1;
  }
  tri(a: number, b: number, c: number): void {
    this.idx.push(a, b, c);
  }
  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

const C = (hex: number): THREE.Color => new THREE.Color(hex);

/** A tapered tube along a polyline: a trunk or a limb. */
export function tube(
  m: Mesher,
  pts: [number, number, number][],
  radii: number[],
  sides: number,
  ca: THREE.Color,
  cb: THREE.Color,
  uvk = 6,
): void {
  const rings: number[][] = [];
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const tmp = new THREE.Color();
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = new THREE.Vector3(...pts[Math.max(0, i - 1)]!);
    const c = new THREE.Vector3(...pts[Math.min(pts.length - 1, i + 1)]!);
    t.subVectors(c, a).normalize();
    const ref = Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    n.crossVectors(t, ref).normalize();
    b.crossVectors(t, n).normalize();
    if (i > 0) len += new THREE.Vector3(...pts[i]!).distanceTo(new THREE.Vector3(...pts[i - 1]!));
    tmp.copy(ca).lerp(cb, i / Math.max(1, pts.length - 1));
    const ring: number[] = [];
    for (let s = 0; s <= sides; s++) {
      const ang = (s / sides) * Math.PI * 2;
      const cx = Math.cos(ang);
      const cz = Math.sin(ang);
      const r = radii[i]!;
      ring.push(
        m.vert(
          pts[i]![0] + (n.x * cx + b.x * cz) * r,
          pts[i]![1] + (n.y * cx + b.y * cz) * r,
          pts[i]![2] + (n.z * cx + b.z * cz) * r,
          tmp,
          s / sides,
          len * uvk,
        ),
      );
    }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++)
    for (let s = 0; s < sides; s++) {
      const a = rings[i]![s]!;
      const b2 = rings[i]![s + 1]!;
      const c = rings[i + 1]![s]!;
      const d = rings[i + 1]![s + 1]!;
      m.tri(a, b2, c);
      m.tri(b2, d, c);
    }
}

/** A spruce: whorls of drooping boughs, shorter towards the top, a tall narrow cone. */
export function spruceGeometry(tiers: number, boughs: number, seed: number): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(seed);
  const tipC = C(0x4f6e47);
  const midC = C(0x2c4a30);
  const inC = C(0x121d15);
  const tmp = new THREE.Color();
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const y = 0.09 + 0.87 * f ** 0.92;
    const reach = (0.205 * (1 - f) ** 0.85 + 0.018) * (0.9 + 0.2 * r());
    for (let b = 0; b < boughs; b++) {
      const a = (b / boughs) * Math.PI * 2 + t * 1.1 + r() * 0.5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const rr = reach * (0.82 + 0.34 * r());
      const droop = 0.022 + 0.045 * (1 - f);
      const halfW = rr * 0.5 * (0.85 + 0.3 * r());
      const hx = -sa;
      const hz = ca;
      const base = m.vert(ca * 0.004, y + droop * 0.5, sa * 0.004, inC);
      const sx = ca * rr * 0.55;
      const sz = sa * rr * 0.55;
      const sy = y - droop * 0.9;
      tmp.copy(midC).multiplyScalar(0.85 + 0.3 * r());
      const left = m.vert(sx + hx * halfW, sy, sz + hz * halfW, tmp);
      const right = m.vert(sx - hx * halfW, sy, sz - hz * halfW, tmp);
      tmp.copy(tipC).multiplyScalar(0.8 + 0.4 * r());
      const tip = m.vert(ca * rr, y - droop * (1.1 + 0.3 * r()), sa * rr, tmp);
      m.tri(base, left, tip);
      m.tri(base, tip, right);
      const keel = m.vert(ca * rr * 0.4, y - droop * 2.2, sa * rr * 0.4, inC);
      m.tri(base, keel, left);
      m.tri(base, right, keel);
      m.tri(left, keel, tip);
      m.tri(tip, keel, right);
    }
  }
  const top = m.vert(0, 1, 0, tipC);
  const ring: number[] = [];
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    ring.push(m.vert(Math.cos(a) * 0.012, 0.93, Math.sin(a) * 0.012, midC));
  }
  for (let s = 0; s < 5; s++) m.tri(top, ring[(s + 1) % 5]!, ring[s]!);
  return m.build();
}

/** The distance from the eye, metres, beyond which a spruce is drawn with its coarse model. */
export const SPRUCE_COARSE_FROM = 28;
/** Beyond this many metres from the eye a birch is drawn with its main limbs and a crown of fewer, larger sprays of the same leaves (`leafyTree(…, true)`). */
export const BIRCH_COARSE_FROM = 30;

/** A spruce seen from afar: a stack of drooping skirts with a star-shaped hem (the boughs' tips), a thin dark lip under each. Same height and reach as the detailed one, a few hundred triangles of broad faces instead of seven hundred thin ones. */
export function spruceCoarse(tiers = 10, points = 7): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(33);
  const tipC = C(0x4a6c42);
  const midC = C(0x2c4a30);
  const inC = C(0x16241a);
  const tmp = new THREE.Color();
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const y = 0.09 + 0.87 * f ** 0.92;
    const reach = 0.205 * (1 - f) ** 0.85 + 0.03;
    const droop = 0.026 + 0.045 * (1 - f);
    const apex = m.vert(0, y + 0.06 * (1 - f) + 0.045, 0, midC);
    const seg = points * 2;
    const hem: number[] = [];
    const under: number[] = [];
    const turn = r() * 6.28;
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2 + turn;
      const tip = k % 2 === 0;
      const rad = reach * (tip ? 0.95 + 0.1 * r() : 0.66 + 0.1 * r());
      tmp.copy(tipC).multiplyScalar(tip ? 0.9 + 0.2 * r() : 0.7);
      hem.push(m.vert(Math.cos(a) * rad, y - droop * (tip ? 1.25 : 0.7), Math.sin(a) * rad, tmp));
      under.push(m.vert(Math.cos(a) * reach * 0.5, y - droop * 1.7, Math.sin(a) * reach * 0.5, inC));
    }
    for (let k = 0; k < seg; k++) {
      const k2 = (k + 1) % seg;
      m.tri(apex, hem[k2]!, hem[k]!);
      m.tri(hem[k]!, hem[k2]!, under[k]!);
      m.tri(hem[k2]!, under[k2]!, under[k]!);
    }
  }
  const top = m.vert(0, 1, 0, tipC);
  const ring: number[] = [];
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    ring.push(m.vert(Math.cos(a) * 0.012, 0.93, Math.sin(a) * 0.012, midC));
  }
  for (let s = 0; s < 5; s++) m.tri(top, ring[(s + 1) % 5]!, ring[s]!);
  return m.build();
}

export function spruceTrunk(): THREE.BufferGeometry {
  const m = new Mesher();
  tube(
    m,
    [
      [0, 0, 0],
      [0, 0.05, 0],
      [0.002, 0.5, 0.001],
      [0, 0.95, 0],
    ],
    [0.018, 0.014, 0.008, 0.002],
    7,
    C(0x4a3a2c),
    C(0x5d4a38),
    2,
  );
  return m.build();
}

/** A far spruce: two stacked cones, dark at the foot. */
export function farSpruce(): THREE.BufferGeometry {
  const m = new Mesher();
  const lo = C(0x263b29);
  const hi = C(0x46624a);
  for (const [y0, y1, rad] of [
    [0.05, 0.64, 0.19],
    [0.42, 1.0, 0.125],
  ] as const) {
    const apex = m.vert(0, y1, 0, hi);
    const ring: number[] = [];
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2 + y0;
      ring.push(m.vert(Math.cos(a) * rad, y0, Math.sin(a) * rad, lo));
    }
    for (let s = 0; s < 6; s++) m.tri(apex, ring[(s + 1) % 6]!, ring[s]!);
  }
  return m.build();
}

// ------------------------------------------------------------------------------------------------ leaf cards

/** A card of small leaves on a transparent ground: `leaves` leaves of a shape (narrow for a birch's, broad for an oak's) in two greens. */
export function leafCard(
  seed: number,
  light: number,
  dark: number,
  leaves = 70,
  N = 128,
  narrow = 0.6,
  size = 0.1,
): THREE.DataTexture {
  const r = rng(seed);
  const d = new Uint8Array(N * N * 4);
  const lc = C(light);
  const dc = C(dark);
  const col = new THREE.Color();
  for (let l = 0; l < leaves; l++) {
    const a = r() * Math.PI * 2;
    const cx = 0.12 + r() * 0.76;
    const cy = 0.12 + r() * 0.76;
    const len = size * (0.8 + 0.6 * r());
    const wid = len * narrow;
    col.copy(dc).lerp(lc, r());
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x0 = Math.floor((cx - len) * N);
    const x1 = Math.ceil((cx + len) * N);
    const y0 = Math.floor((cy - len) * N);
    const y1 = Math.ceil((cy + len) * N);
    for (let j = Math.max(0, y0); j < Math.min(N, y1); j++)
      for (let i = Math.max(0, x0); i < Math.min(N, x1); i++) {
        const dx = i / N - cx;
        const dy = j / N - cy;
        const u = (dx * ca + dy * sa) / len;
        const v = (-dx * sa + dy * ca) / wid;
        if (u * u + v * v > 1) continue;
        const k = (j * N + i) * 4;
        const rib = Math.abs(v) < 0.1 ? 1.12 : 1;
        d[k] = Math.min(255, Math.round(col.r * 255 * rib));
        d[k + 1] = Math.min(255, Math.round(col.g * 255 * rib));
        d[k + 2] = Math.min(255, Math.round(col.b * 255 * rib));
        d[k + 3] = 255;
      }
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** The foliage material: alpha-tested leaf cards seen from both sides, lit by the crown's normal (never the card's), vertex colours tinting each spray. */
export function leafMaterial(map: THREE.Texture, name: string): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    map,
    alphaTest: 0.45,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    roughness: 0.78,
    metalness: 0,
    vertexColors: true,
    name,
  });
  m.userData.noShare = true;
  patchMaterial(m, 'keep-normal', (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n  normal = normalize( vNormal );',
    );
  });
  return m;
}

interface CrownSpec {
  seed: number;
  /** Centre and radii (x, y, z) of the crown's ellipsoid, in tree heights. */
  c: [number, number, number];
  rad: [number, number, number];
  sprays: number;
  size: number;
  tint: [number, number];
  /** 0 airy, 1 solid: fraction of the sprays near the surface, not inside. */
  shell: number;
  droop: number;
}

/** Sprays of crossed cards in a crown: each spray's normal points out of the crown, so that a crown lights as a mass. */
function crown(spec: CrownSpec, limbEnds: [number, number, number][]): THREE.BufferGeometry {
  const r = rng(spec.seed);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const out = new THREE.Vector3();
  const centre = new THREE.Vector3(...spec.c);
  const tint = new THREE.Color();
  const place = (p: THREE.Vector3): void => {
    out
      .copy(p)
      .sub(centre)
      .divide(new THREE.Vector3(...spec.rad))
      .normalize();
    if (out.lengthSq() < 0.1) out.set(0, 1, 0);
    // a mass lights from above: lean the normal up
    out.y += 0.25;
    out.normalize();
    const shade = spec.tint[0] + (spec.tint[1] - spec.tint[0]) * (0.5 + 0.5 * out.y) * (0.8 + 0.4 * r());
    tint.setRGB(shade, shade, shade);
    for (let c = 0; c < 2; c++) {
      tmp.set(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      a.crossVectors(out, tmp).normalize();
      b.crossVectors(out, a).normalize();
      if (c === 1) b.lerp(out, 0.6).normalize();
      const first = pos.length / 3;
      const s = spec.size * (0.75 + 0.5 * r());
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        const x = (u! - 0.5) * s;
        const y = (v! - 0.5) * s;
        pos.push(p.x + a.x * x + b.x * y, p.y + a.y * x + b.y * y, p.z + a.z * x + b.z * y);
        nor.push(out.x, out.y, out.z);
        uv.push(u!, v!);
        col.push(tint.r, tint.g, tint.b);
      }
      idx.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  };
  // sprays on the limbs' ends first, then through the ellipsoid
  for (const e of limbEnds) place(new THREE.Vector3(...e));
  const p = new THREE.Vector3();
  for (let i = 0; i < spec.sprays; i++) {
    for (let t = 0; t < 40; t++) {
      p.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
      const d = p.length();
      if (d > 1) continue;
      if (spec.shell > 0 && d < spec.shell * (0.3 + 0.7 * r())) continue;
      break;
    }
    p.multiply(new THREE.Vector3(...spec.rad)).add(centre);
    p.y -= spec.droop * Math.abs(p.x - centre.x);
    place(p);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

export interface Species {
  trunk: THREE.BufferGeometry;
  crown: THREE.BufferGeometry;
  /** Height of the real tree for a scale of 1, metres. */
  height: number;
}

/** A broad-leaved tree: a trunk, forking limbs, a crown of sprays. `kind` sets the proportions. */
export function leafyTree(kind: 'birch' | 'oak' | 'apple' | 'linden', seed: number, coarse = false): Species {
  const r = rng(seed);
  const m = new Mesher();
  const white = kind === 'birch';
  const foot = C(white ? 0x4a443c : 0x4c4137);
  const bark = C(white ? 0xf4f1e8 : kind === 'oak' ? 0x6b5d4f : 0x6a5a4a);
  const twig = C(white ? 0x4b3a30 : 0x4a3b30);
  const spec = {
    birch: {
      trunkR: [0.02, 0.016, 0.012, 0.008, 0.003],
      limbs: 11,
      crownC: [0, 0.68, 0] as [number, number, number],
      rad: [0.2, 0.33, 0.2] as [number, number, number],
      sprays: 150,
      size: 0.17,
      h: 14,
      forkFrom: 0.38,
      lean: 0.015,
    },
    oak: {
      trunkR: [0.05, 0.042, 0.034, 0.024, 0.01],
      limbs: 9,
      crownC: [0, 0.66, 0] as [number, number, number],
      rad: [0.44, 0.34, 0.44] as [number, number, number],
      sprays: 280,
      size: 0.2,
      h: 18,
      forkFrom: 0.3,
      lean: 0.012,
    },
    apple: {
      trunkR: [0.06, 0.05, 0.038, 0.025, 0.01],
      limbs: 8,
      crownC: [0, 0.68, 0] as [number, number, number],
      rad: [0.46, 0.3, 0.46] as [number, number, number],
      sprays: 160,
      size: 0.22,
      h: 5,
      forkFrom: 0.4,
      lean: 0.03,
    },
    linden: {
      trunkR: [0.04, 0.034, 0.028, 0.02, 0.008],
      limbs: 10,
      crownC: [0, 0.64, 0] as [number, number, number],
      rad: [0.34, 0.36, 0.34] as [number, number, number],
      sprays: 230,
      size: 0.18,
      h: 16,
      forkFrom: 0.34,
      lean: 0.01,
    },
  }[kind];
  const lean = spec.lean;
  const trunkPts: [number, number, number][] = [
    [0, 0, 0],
    [lean * 0.3, 0.05, 0],
    [lean * 0.7, 0.2, lean * 0.4],
    [lean, spec.forkFrom * 0.7, lean * 0.6],
    [lean * 1.2, spec.forkFrom + 0.2, lean * 0.5],
    [lean * 1.1, spec.forkFrom + 0.4, lean * 0.3],
  ];
  tube(
    m,
    trunkPts,
    spec.trunkR.length === 5
      ? [spec.trunkR[0]!, spec.trunkR[1]!, spec.trunkR[2]!, spec.trunkR[3]!, spec.trunkR[4]!, spec.trunkR[4]! * 0.6]
      : spec.trunkR,
    9,
    foot,
    bark,
    4,
  );
  // root flare
  const ends: [number, number, number][] = [];
  for (let i = 0; i < spec.limbs; i++) {
    // seen from afar a tree keeps its main limbs and loses the thin ones: a hairline of white bark against a dark ground is what crawls (docs/qa.md D16)
    if (coarse && i % 2 === 1) continue;
    const f = i / (spec.limbs - 1);
    const y0 = spec.forkFrom + 0.05 + 0.4 * f;
    const a = i * 2.399 + r() * 0.4;
    const L = (0.34 - 0.1 * f) * (0.8 + 0.4 * r()) * (kind === 'birch' ? 0.62 : kind === 'oak' ? 1.2 : 1);
    const up = kind === 'birch' ? 0.5 + 0.7 * f : kind === 'oak' ? 0.18 + 0.45 * f : 0.25 + 0.5 * f;
    const base: [number, number, number] = [lean * 1.1, y0, lean * 0.4];
    const pts: [number, number, number][] = [base];
    let px = base[0];
    let py = base[1];
    let pz = base[2];
    const seg = 4;
    for (let s = 1; s <= seg; s++) {
      px += (Math.cos(a) * L) / seg + (r() - 0.5) * 0.02;
      pz += (Math.sin(a) * L) / seg + (r() - 0.5) * 0.02;
      py += (L * up) / seg - (kind === 'birch' ? -0.01 : 0) * s;
      pts.push([px, py, pz]);
    }
    const r0 = Math.max(0.006, spec.trunkR[2]! * 0.6 * (1 - 0.4 * f)) * (coarse ? 1.6 : 1);
    tube(m, pts, [r0, r0 * 0.8, r0 * 0.6, r0 * 0.4, r0 * (coarse ? 0.4 : 0.15)], coarse ? 6 : 5, bark, twig, 5);
    ends.push([px, py, pz]);
    if (coarse) continue;
    // a fork near the end
    const a2 = a + 0.8 * (r() > 0.5 ? 1 : -1);
    const fork: [number, number, number][] = [
      pts[2]!,
      [pts[2]![0] + Math.cos(a2) * L * 0.4, pts[2]![1] + L * 0.2, pts[2]![2] + Math.sin(a2) * L * 0.4],
      [pts[2]![0] + Math.cos(a2) * L * 0.75, pts[2]![1] + L * 0.3, pts[2]![2] + Math.sin(a2) * L * 0.75],
    ];
    tube(m, fork, [r0 * 0.5, r0 * 0.35, r0 * 0.12], 4, twig, twig, 5);
    ends.push(fork[2]!);
  }
  const lightG = kind === 'birch' ? 0.95 : kind === 'oak' ? 0.82 : 0.9;
  const cr = crown(
    {
      seed: seed + 1,
      c: spec.crownC,
      rad: spec.rad,
      // seen from afar the same leaves in fewer, larger sprays: less edge against the sky for the eye to crawl along (docs/qa.md D16)
      sprays: coarse ? Math.round(spec.sprays * 0.42) : spec.sprays,
      size: coarse ? spec.size * 1.55 : spec.size,
      tint: [0.45 * lightG, 1.0 * lightG],
      shell: kind === 'oak' ? 0.4 : 0.15,
      droop: kind === 'birch' ? 0.35 : 0.15,
    },
    ends,
  );
  return { trunk: m.build(), crown: cr, height: spec.h };
}

/** A Scots pine: a long bare trunk with orange scaly bark above, a flat irregular crown at the top. */
export function pineTree(seed: number): Species {
  const r = rng(seed);
  const m = new Mesher();
  const foot = C(0x4a3a2e);
  const bark = C(0x8a5a3c);
  tube(
    m,
    [
      [0, 0, 0],
      [0.01, 0.1, 0],
      [0.008, 0.4, 0.01],
      [0.015, 0.68, 0.01],
      [0.012, 0.9, 0],
    ],
    [0.026, 0.02, 0.016, 0.011, 0.005],
    8,
    foot,
    bark,
    3,
  );
  const ends: [number, number, number][] = [];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399 + r();
    const y0 = 0.62 + 0.3 * (i / 6);
    const L = 0.17 * (0.7 + 0.6 * r());
    const pts: [number, number, number][] = [
      [0.012, y0, 0],
      [0.012 + Math.cos(a) * L * 0.5, y0 + 0.03, Math.sin(a) * L * 0.5],
      [0.012 + Math.cos(a) * L, y0 + 0.07, Math.sin(a) * L],
    ];
    tube(m, pts, [0.007, 0.005, 0.002], 4, bark, bark, 4);
    ends.push(pts[2]!);
  }
  const cr = crown(
    {
      seed: seed + 3,
      c: [0.01, 0.86, 0],
      rad: [0.22, 0.11, 0.22],
      sprays: 90,
      size: 0.15,
      tint: [0.35, 0.8],
      shell: 0.2,
      droop: 0.2,
    },
    ends,
  );
  return { trunk: m.build(), crown: cr, height: 20 };
}

// ------------------------------------------------------------------------------------------------ planting

export interface TreeSet {
  group: THREE.Group;
  /** All the trees' foot points, for the test that each stands on the land. */
  feet: THREE.Vector3[];
  /** Crown materials, which the world can darken at dusk. */
  leaf: THREE.MeshStandardMaterial[];
}

interface Planting {
  x: number;
  z: number;
  s: number;
  rot: number;
}

/** Instanced trees of one species at places, scaled to a real height by `s` (a share of the species' height). */
function instance(
  parent: THREE.Group,
  sp: Species,
  name: string,
  plantings: Planting[],
  trunkMat: THREE.Material,
  leafMat: THREE.Material,
  feet: THREE.Vector3[],
  tintJitter = 0.12,
  coarse?: { crown: THREE.BufferGeometry; from: number; trunk?: THREE.BufferGeometry; material?: THREE.Material },
): void {
  plantings = plantings.filter((p) => !avoidAt(p.x, p.z));
  if (plantings.length === 0) return;
  const hasTrunk = !!sp.trunk.attributes.position;
  const mt = new THREE.InstancedMesh(hasTrunk ? sp.trunk : sp.crown, trunkMat, hasTrunk ? plantings.length : 1);
  const ml = new THREE.InstancedMesh(sp.crown, leafMat, plantings.length);
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  const r = rng(plantings.length * 13 + name.length);
  plantings.forEach((p, i) => {
    const h = sp.height * p.s;
    const y = terrainHeight(p.x, p.z);
    e.set(0, p.rot, 0);
    q.setFromEuler(e);
    mtx.compose(new THREE.Vector3(p.x, y - 0.05, p.z), q, new THREE.Vector3(h, h, h));
    if (hasTrunk) mt.setMatrixAt(i, mtx);
    ml.setMatrixAt(i, mtx);
    const t = 1 - tintJitter + 2 * tintJitter * r();
    col.setRGB(t, t * (0.96 + 0.08 * r()), t * (0.94 + 0.08 * r()));
    ml.setColorAt(i, col);
    feet.push(new THREE.Vector3(p.x, y, p.z));
  });
  for (const m of hasTrunk ? [mt, ml] : [ml]) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = `${name}-${m === mt ? 'trunks' : 'crowns'}`;
    m.frustumCulled = false;
    parent.add(m);
  }
  if (coarse) {
    const at = feet.slice(feet.length - plantings.length);
    crownsByDistance(parent, ml, coarse.crown, coarse.from, at, coarse.material);
    if (coarse.trunk && hasTrunk) crownsByDistance(parent, mt, coarse.trunk, coarse.from, at);
  }
}

/**
 * The crowns of a species seen from far away are drawn with a coarser model: the same trees, two instanced meshes, each tree in one of them by its distance to the eye (with a margin, so that none flips back and forth). A tree's silhouette
 * at 40 m made of a hundred and five thin boughs is what the picture shimmers with when the camera moves (docs/qa.md D16); a stack of skirts of the same reach and colour does not.
 */
function crownsByDistance(
  parent: THREE.Group,
  fine: THREE.InstancedMesh,
  coarseGeo: THREE.BufferGeometry,
  from: number,
  at: THREE.Vector3[],
  material?: THREE.Material,
): void {
  const n = fine.count;
  const far = new THREE.InstancedMesh(coarseGeo, material ?? fine.material, n);
  far.castShadow = true;
  far.receiveShadow = true;
  far.name = `${fine.name}-coarse`;
  far.frustumCulled = false;
  // a mesh with no per-tree colour (the trunks) has none to hand on
  const coloured = !!fine.instanceColor;
  if (coloured) far.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  parent.add(far);
  const mats: THREE.Matrix4[] = [];
  const cols: THREE.Color[] = [];
  for (let i = 0; i < n; i++) {
    const mm = new THREE.Matrix4();
    fine.getMatrixAt(i, mm);
    mats.push(mm);
    const c = new THREE.Color();
    if (coloured) fine.getColorAt(i, c);
    cols.push(c);
  }
  const isFar = new Uint8Array(n).fill(2);
  far.count = 0;
  fine.onBeforeRender = (_r, _s, camera) => {
    // the eye's, not a light's (the shadow pass draws with an orthographic camera)
    if (!(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    let changed = false;
    for (let i = 0; i < n; i++) {
      const d = camera.position.distanceTo(at[i]!);
      const want = d > from * (isFar[i] === 1 ? 0.88 : 1.12) ? 1 : 0;
      if (isFar[i] !== want) {
        isFar[i] = want;
        changed = true;
      }
    }
    if (!changed) return;
    let a = 0;
    let b = 0;
    for (let i = 0; i < n; i++) {
      if (isFar[i] === 1) {
        far.setMatrixAt(b, mats[i]!);
        if (coloured) far.setColorAt(b, cols[i]!);
        b++;
      } else {
        fine.setMatrixAt(a, mats[i]!);
        if (coloured) fine.setColorAt(a, cols[i]!);
        a++;
      }
    }
    fine.count = a;
    far.count = b;
    fine.instanceMatrix.needsUpdate = true;
    far.instanceMatrix.needsUpdate = true;
    if (fine.instanceColor) fine.instanceColor.needsUpdate = true;
    if (far.instanceColor) far.instanceColor.needsUpdate = true;
  };
}

/** Where no tree may stand (the world keeps the lines from which its parts are looked at free of crowns). Set by `buildTrees`. */
let avoidAt: (x: number, z: number) => boolean = () => false;

export function buildTrees(avoid: (x: number, z: number) => boolean = () => false): TreeSet {
  avoidAt = avoid;
  const group = new THREE.Group();
  group.name = 'trees';
  const feet: THREE.Vector3[] = [];
  const r = rng(404);
  const leafMats: THREE.MeshStandardMaterial[] = [];
  const birchLeaf = leafMaterial(leafCard(11, 0xa9c85a, 0x5f8a2c, 90, 128, 0.62, 0.075), 'birch-leaf');
  const oakLeaf = leafMaterial(leafCard(12, 0x6fa13d, 0x35601f, 80, 128, 0.7, 0.085), 'oak-leaf');
  const appleLeaf = leafMaterial(leafCard(13, 0x8cb749, 0x477a28, 80, 128, 0.62, 0.08), 'apple-leaf');
  const lindenLeaf = leafMaterial(leafCard(14, 0x86b845, 0x3f7a26, 80, 128, 0.85, 0.09), 'linden-leaf');
  const pineLeaf = leafMaterial(leafCard(15, 0x6a8a48, 0x2f4d2b, 100, 128, 0.18, 0.1), 'pine-leaf');
  leafMats.push(birchLeaf, oakLeaf, appleLeaf, lindenLeaf, pineLeaf);
  const barkBirch = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    map: tiled(birchBarkMap(), 1, 3),
    roughness: 0.85,
  });
  const barkOak = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    map: tiled(barkMap(), 1, 4),
    roughness: 0.95,
  });
  const barkSpruce = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    map: tiled(spruceBarkMap(), 1, 4),
    roughness: 0.95,
  });
  const spruceMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.9,
    side: THREE.DoubleSide,
    flatShading: false,
  });
  const farMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1 });

  // the garden: birches and a linden near the house, an oak by the lane, apple trees in a row behind
  const pl = (x: number, z: number, s: number): Planting => ({ x, z, s: s * (0.9 + 0.2 * r()), rot: r() * 6.28 });
  const birchCoarse = leafyTree('birch', 1, true);
  instance(
    group,
    leafyTree('birch', 1),
    'birch',
    [
      pl(-26, -3, 0.95),
      pl(-27.5, -11, 1),
      pl(-30, -6, 0.8),
      pl(-3, -16, 0.9),
      pl(-22, 3.2, 0.7),
      pl(34, 4, 0.85),
      pl(38, 0, 1),
      pl(44, -3.5, 0.9),
      pl(52, -5, 0.95),
      pl(-45, 5, 1),
      pl(-52, 2, 0.85),
      pl(60, -18, 1),
    ],
    barkBirch,
    birchLeaf,
    feet,
    0.12,
    {
      crown: birchCoarse.crown,
      trunk: birchCoarse.trunk,
      from: BIRCH_COARSE_FROM,
    },
  );
  instance(
    group,
    leafyTree('oak', 3),
    'oak',
    [pl(-12, 7.2, 1.0), pl(28, 5.5, 0.95), pl(-33, -15, 1.05), pl(70, -8, 1)],
    barkOak,
    oakLeaf,
    feet,
  );
  instance(
    group,
    leafyTree('linden', 5),
    'linden',
    [pl(-19.5, -1.8, 0.9), pl(2.2, -20, 0.95)],
    barkOak,
    lindenLeaf,
    feet,
  );
  instance(
    group,
    leafyTree('apple', 7),
    'apple',
    [pl(-28, -20, 1), pl(-24, -22, 0.9), pl(-20, -24, 1.05), pl(-16, -23, 0.9), pl(-12, -25, 1)],
    barkOak,
    appleLeaf,
    feet,
  );
  instance(
    group,
    pineTree(9),
    'pine',
    [pl(48, -24, 1.0), pl(55, -28, 1.1), pl(40, -30, 0.95), pl(-40, -26, 1.1), pl(-48, -22, 1), pl(-56, -30, 1.15)],
    barkOak,
    pineLeaf,
    feet,
  );

  // the shelterbelt: a double row of spruce along the north and west, spruces by the lane's end
  const spruces: Planting[] = [];
  for (let i = 0; i < 28; i++)
    spruces.push({
      x: -75 + i * 5.6 + (r() - 0.5) * 2.5,
      z: -46 - r() * 6 - (i % 2) * 4,
      s: 0.95 + 0.35 * r(),
      rot: r() * 6.28,
    });
  for (let i = 0; i < 12; i++)
    spruces.push({ x: -78 - r() * 3, z: -40 + i * 5.5 + r() * 2, s: 0.9 + 0.35 * r(), rot: r() * 6.28 });
  for (let i = 0; i < 10; i++)
    spruces.push({ x: 82 + r() * 8 + (i % 2) * 5, z: -35 + i * 6 + r() * 3, s: 0.9 + 0.3 * r(), rot: r() * 6.28 });
  const sp = new THREE.Mesh();
  void sp;
  const spruceHeight = 24;
  const spruce: Species = { trunk: spruceTrunk(), crown: spruceGeometry(15, 7, 21), height: spruceHeight };
  // beyond SPRUCE_COARSE_FROM metres a spruce is drawn as a stack of skirts (`spruceCoarse`), nearer as its hundred and five boughs
  instance(group, spruce, 'spruce', spruces, barkSpruce, spruceMat, feet, 0.1, {
    crown: spruceCoarse(),
    from: SPRUCE_COARSE_FROM,
  });

  // far forest: a ring of crude spruces in dark groves, kept from the yard and the field
  const far: Planting[] = [];
  for (let i = 0; i < 520; i++) {
    const a = r() * Math.PI * 2;
    const d = 130 + Math.pow(r(), 0.6) * 520;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d * 0.9 + 20;
    if (z > 20 && Math.abs(x) < 110) continue;
    const grove = 0.4 + 0.6 * smoothstep(0.3, 0.7, Math.sin(x * 0.011 + 1.3) * Math.sin(z * 0.013 + 0.7) * 0.5 + 0.5);
    if (r() > grove) continue;
    far.push({ x, z, s: 0.7 + 0.8 * r(), rot: r() * 6.28 });
  }
  instance(
    group,
    { trunk: new THREE.BufferGeometry(), crown: farSpruce(), height: 22 },
    'far-spruce',
    far,
    farMat,
    farMat,
    feet,
    0.15,
  );
  // the empty trunks have no vertices: nothing to draw
  return { group, feet, leaf: leafMats };
}
