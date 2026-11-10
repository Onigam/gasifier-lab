import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Helpers of the four worlds: revolved geometry, tubes between points, boxes with their UVs in metres, a path with its length. Geometry and materials only (no canvas, no GL context), so
// everything here also runs in Node under vitest. From the sand lab (docs/kit-requests.md asks for them in the kit).

export const TAU = Math.PI * 2;

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const v3 = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** A closed ring around Y between two radii and two heights: four faces, so the edges read crisp. `r1` differs from `r0` on a cone. */
export function ringY(rIn: number, rOut: number, y0: number, y1: number, segments = 64): THREE.BufferGeometry {
  const part = (pts: [number, number][]) =>
    new THREE.LatheGeometry(
      pts.map(([r, y]) => new THREE.Vector2(r, y)),
      segments,
    );
  // a lathe faces outward when its points rise: outer wall up, then the top inward, the bore down, the bottom outward
  const parts = [
    part([
      [rOut, y0],
      [rOut, y1],
    ]),
    part([
      [rOut, y1],
      [rIn, y1],
    ]),
    part([
      [rIn, y1],
      [rIn, y0],
    ]),
    part([
      [rIn, y0],
      [rOut, y0],
    ]),
  ];
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A solid disc around Y (a cylinder with caps), its foot at y0. */
export function discY(r: number, y0: number, y1: number, segments = 64): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, segments, 1);
  g.translate(0, (y0 + y1) / 2, 0);
  return g;
}

const UP = new THREE.Vector3(0, 1, 0);

/** A cylinder from a to b, radius r (a stick, a leg, a straight pipe). */
export function stick(a: THREE.Vector3, b: THREE.Vector3, r: number, segments = 10, caps = true): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), segments, 1, !caps);
  const m = new THREE.Matrix4().compose(
    a.clone().add(b).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()),
    new THREE.Vector3(1, 1, 1),
  );
  g.applyMatrix4(m);
  return g;
}

/** A box given by its centre and its size. */
export function box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(cx, cy, cz);
  return g;
}

/** Merge geometries into one (they must share their attributes: `plain` drops what differs). */
export function joined(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const clean = parts.map((p) => {
    const g = p.index ? p.toNonIndexed() : p;
    for (const name of Object.keys(g.attributes))
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    return g;
  });
  const out = mergeGeometries(clean, false);
  parts.forEach((p) => p.dispose());
  return out;
}

/** Flag a whole subtree as never casting shadows (dots, overlays): the registry respects `userData.noShadow`. */
export function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false;
    c.userData.noShadow = true;
  });
  return o;
}

/** A tube through points (Catmull-Rom through them), for cables and wires. */
export function tubeGeometry(
  points: THREE.Vector3[],
  radius: number,
  segments = 24,
  radial = 6,
  closed = false,
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.TubeGeometry(curve, segments, radius, radial, closed);
}

// ------------------------------------------------------------------------------------------------ flow dots

/** Soft round sprite (white, alpha falling to the edge) for dots; a DataTexture, so no canvas is needed. */
export function softDotTexture(size = 32): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot((i + 0.5) / size - 0.5, (j + 0.5) / size - 0.5) * 2;
      const a = Math.max(0, 1 - d);
      const k = (j * size + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * Math.min(1, a * 1.8) * (a > 0 ? 1 : 0));
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** A polyline with its cumulative length, to place a dot at a distance along it. */
export class DotPath {
  readonly cum: number[] = [0];
  constructor(readonly points: THREE.Vector3[]) {
    for (let i = 1; i < points.length; i++) this.cum.push(this.cum[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  get length(): number {
    return this.cum[this.cum.length - 1];
  }
  at(u: number, out: THREE.Vector3): THREE.Vector3 {
    const L = this.length;
    if (L <= 0) return out.copy(this.points[0]);
    let d = u % L;
    if (d < 0) d += L;
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid;
    }
    const segLen = this.cum[hi] - this.cum[lo];
    const t = segLen > 0 ? (d - this.cum[lo]) / segLen : 0;
    return out.lerpVectors(this.points[lo], this.points[hi], t);
  }
}

// ------------------------------------------------------------------------------------------------ UVs in metres, shapes

/**
 * UVs in metres on any geometry, the way a box is mapped: each vertex takes the two coordinates across its normal's main axis. So a material with `repeat` of 1 / tile keeps its size whatever the
 * shape, and a wall, a bench and a brick read at their true scale.
 */
export function uvMetric(g: THREE.BufferGeometry, offset = 0): THREE.BufferGeometry {
  const p = g.attributes.position as THREE.BufferAttribute;
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.normal as THREE.BufferAttribute;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    let u = p.getX(i);
    let v = p.getZ(i);
    if (ax >= ay && ax >= az) {
      u = p.getZ(i);
      v = p.getY(i);
    } else if (az >= ay && az >= ax) {
      u = p.getX(i);
      v = p.getY(i);
    }
    uv[i * 2] = u + offset;
    uv[i * 2 + 1] = v + offset;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** A box given by its two corners, UVs in metres. */
export function boxAt(
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  offset = 0,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return uvMetric(g, offset);
}

/** A box with rounded edges, given by its centre and size. */
export function softBox(
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  r = 0.01,
  segments = 2,
): THREE.BufferGeometry {
  const g = new RoundedBoxGeometry(sx, sy, sz, segments, Math.min(r, Math.min(sx, sy, sz) / 2 - 1e-4));
  g.translate(cx, cy, cz);
  return uvMetric(g);
}

/** A ring or a tube around Y from a profile of [r, y] pairs: `phi` is the part of the turn it covers, around Y from +Z towards +X. */
export function lathe(
  profile: readonly (readonly [number, number])[],
  segments = 48,
  phiStart = 0,
  phiLength = TAU,
): THREE.BufferGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
    phiStart,
    phiLength,
  );
}

/** A plate cut from a shape in plan: `shape` holds (x, z) as its (x, y), the plate spans y0 to y1. UVs in metres. */
export function plate(shape: THREE.Shape, y0: number, y1: number, curveSegments = 24): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments });
  // shape (x, y) to the plan (x, z): y becomes z, the extrusion goes up
  g.rotateX(Math.PI / 2);
  g.translate(0, y1, 0);
  return uvMetric(g);
}

/** A rectangle with rounded corners as a Shape. */
export function roundedRect(x0: number, y0: number, x1: number, y1: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** A closed polygon of [x, y] pairs as a Shape, with optional holes (polygons too). */
export function polyShape(
  points: readonly (readonly [number, number])[],
  holes: (readonly (readonly [number, number])[])[] = [],
): THREE.Shape {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  return s;
}

// ------------------------------------------------------------------------------------------------ revolved shapes and their cuts

/** The half of a turn kept when a unit is cut along its axis: the far half (z ≥ 0), seen from the front of the tractor (z < 0). */
export const HALF = { phiStart: -Math.PI / 2, phiLength: Math.PI } as const;

/** `phi` of a revolved shape: the whole turn, or the kept half. */
export const turnOf = (cut: boolean): { phiStart: number; phiLength: number } =>
  cut ? HALF : { phiStart: 0, phiLength: TAU };

/**
 * A revolved profile with crisp edges: each stretch its own strip, so a corner is a corner and not a shading ramp. The profile runs with the outside on its right (up the outside of a vase): that is the way a lathe faces
 * outward.
 */
export function latheCrisp(
  profile: readonly (readonly [number, number])[],
  segments = 48,
  phiStart = 0,
  phiLength = TAU,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i]!;
    const b = profile[i + 1]!;
    if (Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9) continue;
    const g = new THREE.LatheGeometry(
      [new THREE.Vector2(a[0], a[1]), new THREE.Vector2(b[0], b[1])],
      segments,
      phiStart,
      phiLength,
    );
    parts.push(g);
  }
  const out = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return out;
}

/** The signed area of a polygon of [r, y] points, positive when counter-clockwise. */
export const polyArea = (pts: readonly (readonly [number, number])[]): number => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};

/** The polygon turned to go clockwise (r to the right, y up): the way `latheCrisp` faces outward. */
export const clockwise = (pts: readonly (readonly [number, number])[]): [number, number][] => {
  const p = pts.map(([r, y]) => [r, y] as [number, number]);
  return polyArea(p) > 0 ? p.reverse() : p;
};

/** A solid of revolution from a closed polygon of [r, y] points, closed again by the strip from the last point to the first. */
export function solidLathe(
  pts: readonly (readonly [number, number])[],
  segments = 48,
  phiStart = 0,
  phiLength = TAU,
): THREE.BufferGeometry {
  const p = clockwise(pts);
  p.push(p[0]!);
  return latheCrisp(p, segments, phiStart, phiLength);
}

/**
 * The flat face where a revolved solid is cut along its axis: the polygon of [r, y] points at the plane z = 0, on both sides of the axis, facing the front (−z). `u` is a colour attribute-free set of UVs in metres.
 */
export function capPolygon(
  pts: readonly (readonly [number, number])[],
  extra?: (x: number, y: number) => number,
): THREE.BufferGeometry {
  const contour = pts.map(([r, y]) => new THREE.Vector2(r, y));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const cap: number[] = [];
  const idx: number[] = [];
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (const c of contour) {
      pos.push(side * c.x, c.y, 0);
      nor.push(0, 0, -1);
      uv.push(side * c.x, c.y);
      cap.push(extra ? extra(side * c.x, c.y) : 1);
    }
    for (const t of tris) {
      // seen from the front (−z) the polygon must run counter-clockwise: mirrored, it already does; on the other side flip it
      if (side === 1) idx.push(base + t[0]!, base + t[2]!, base + t[1]!);
      else idx.push(base + t[0]!, base + t[1]!, base + t[2]!);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aCap', new THREE.Float32BufferAttribute(cap, 1));
  g.setIndex(idx);
  return g;
}

/** The cut through a thin wall: a strip of the given thickness along a profile of [r, y] points, on both sides of the axis, at z = 0, facing the front. */
export function wallCap(profile: readonly (readonly [number, number])[], thickness: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const t = thickness / 2;
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i < profile.length; i++) {
      const a = profile[Math.max(0, i - 1)]!;
      const b = profile[Math.min(profile.length - 1, i + 1)]!;
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      // the offset runs across the wall: (dy, −dx) is the right of the way along
      const p = profile[i]!;
      pos.push(side * (p[0] + dy * t), p[1] - dx * t, 0, side * (p[0] - dy * t), p[1] + dx * t, 0);
      nor.push(0, 0, -1, 0, 0, -1);
    }
    for (let i = 0; i < profile.length - 1; i++) {
      const k = base + i * 2;
      if (side === 1) idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      else idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/** A thin revolved shell (one surface, seen from both sides) along a profile, whole or cut, with the cap of its wall when cut. `meshes` are geometries to be given a shell and a cap material. */
export function shellOf(
  profile: readonly (readonly [number, number])[],
  thickness: number,
  cut: boolean,
  segments = 48,
): { shell: THREE.BufferGeometry; cap: THREE.BufferGeometry | null } {
  const { phiStart, phiLength } = turnOf(cut);
  const shell = latheCrisp(profile, segments, phiStart, phiLength);
  return { shell, cap: cut ? wallCap(profile, thickness) : null };
}

/** A cylinder along X from x0 to x1, radius r, whole or the far half (z ≥ 0); `open` leaves the ends bare (a tube's surface). A cut one needs its own cap where it is cut (`capPolygon` after the same turn). */
export function cylX(
  x0: number,
  x1: number,
  r: number,
  cut: boolean,
  segments = 24,
  open = false,
): THREE.BufferGeometry {
  const { phiStart, phiLength } = turnOf(cut);
  const profile: [number, number][] = open
    ? [
        [r, x0],
        [r, x1],
      ]
    : [
        [0, x0],
        [r, x0],
        [r, x1],
        [0, x1],
      ];
  const g = latheCrisp(profile, segments, phiStart, phiLength);
  // Y becomes X: (x, y) → (y, −x); z stays
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** A cylinder along Z. */
export function cylZ(z0: number, z1: number, r: number, segments = 24, open = false): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), segments, 1, open);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, (z0 + z1) / 2);
  return g;
}
