import * as THREE from 'three';
import { group, mesh, roundedPath } from '@onigam/lab-kit/three';
import { joined, TAU } from '../common';
import { PIPE } from '../dims';
import { darkSteel, steel } from '../materials';

// The pipes of the gas train: a tube between two ports, routed with right angles and rounded bends, with a flange at each end. A port is where a component's flange face is (its centre) and the way a pipe leaves it. A pipe is built from the
// ports as they stand in the world, and again whenever one has moved (the explode), so that a pipe is never left hanging from a part that went away: it stretches, as a hose would.

export interface Port {
  p: THREE.Vector3;
  /** The unit vector pointing out of the component, along the pipe. */
  dir: THREE.Vector3;
  /** Pipe radius at this port, m. */
  r?: number;
}

export const port = (x: number, y: number, z: number, dx: number, dy: number, dz: number, r?: number): Port => ({
  p: new THREE.Vector3(x, y, z),
  dir: new THREE.Vector3(dx, dy, dz).normalize(),
  r,
});

/** A flange disc of the pipe's own, facing along `dir`, with its four bolt heads. */
export function flangeGeometry(r: number, dir: THREE.Vector3): THREE.BufferGeometry {
  const fr = r + 0.022;
  const parts: THREE.BufferGeometry[] = [];
  const disc = new THREE.CylinderGeometry(fr, fr, PIPE.flangeT, 28);
  disc.translate(0, PIPE.flangeT / 2, 0);
  parts.push(disc);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + Math.PI / 4;
    const b = new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 6);
    b.translate(Math.cos(a) * (r + 0.012), PIPE.flangeT + 0.003, Math.sin(a) * (r + 0.012));
    parts.push(b);
  }
  const g = joined(parts);
  // the cylinder's axis is Y: turn it to `dir` (the flange's outer face looks along dir)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  return g;
}

/** The points of a pipe from port `a` to port `b`: out of `a` by `lead`, level with `b`'s lead point by right-angled legs, then into `b`. */
export function route(a: Port, b: Port, lead = 0.08, order?: readonly ('x' | 'y' | 'z')[]): THREE.Vector3[] {
  const A = a.p.clone();
  const B = b.p.clone();
  const a1 = A.clone().addScaledVector(a.dir, lead);
  const b1 = B.clone().addScaledVector(b.dir, lead);
  const pts: THREE.Vector3[] = [A, a1];
  // legs along the axes, starting with the axis `a` points along, finishing with `b`'s
  const axes = ['x', 'y', 'z'] as const;
  const mainA = axes.reduce((m, k) => (Math.abs(a.dir[k]) > Math.abs(a.dir[m]) ? k : m), 'x' as 'x' | 'y' | 'z');
  const mainB = axes.reduce((m, k) => (Math.abs(b.dir[k]) > Math.abs(b.dir[m]) ? k : m), 'x' as 'x' | 'y' | 'z');
  const cur = a1.clone();
  const legs = order ?? [mainA, ...axes.filter((k) => k !== mainA && k !== mainB), mainB];
  for (const k of legs) {
    if (Math.abs(cur[k] - b1[k]) > 1e-4) {
      cur[k] = b1[k];
      pts.push(cur.clone());
    }
  }
  pts.push(B.clone().addScaledVector(b.dir, 0));
  // drop repeats
  const out: THREE.Vector3[] = [];
  for (const p of pts) if (!out.length || out[out.length - 1]!.distanceTo(p) > 1e-4) out.push(p);
  return out;
}

/** A tube through the points with rounded bends. */
export function tubeThrough(
  points: THREE.Vector3[],
  r: number,
  bend: number = PIPE.bend,
  segments = 6,
): THREE.BufferGeometry {
  if (points.length < 2) return new THREE.BufferGeometry();
  if (points.length === 2) {
    const a = points[0]!;
    const b = points[1]!;
    const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), 20, 1, true);
    g.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()),
    );
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    return g;
  }
  // a bend radius no larger than the shortest leg
  let shortest = Infinity;
  for (let i = 0; i < points.length - 1; i++) shortest = Math.min(shortest, points[i]!.distanceTo(points[i + 1]!));
  const path = roundedPath(points, Math.min(bend, shortest * 0.45));
  void segments;
  return new THREE.TubeGeometry(path, Math.max(24, points.length * 12), r, 20, false);
}

/** A pipe that follows its two ports: its tube is built again when either has moved. */
export class LivePipe {
  readonly root = group('pipe');
  private tube: THREE.Mesh;
  private fa: THREE.Mesh;
  private fb: THREE.Mesh;
  private last = '';
  points: THREE.Vector3[] = [];

  constructor(
    readonly r: number = PIPE.R,
    readonly lead: number = 0.08,
    readonly bend: number = PIPE.bend,
    material: THREE.Material = darkSteel(),
    flangeMaterial: THREE.Material = steel(),
    /** The order of the right-angled legs, when the default would go through something. */
    readonly order?: readonly ('x' | 'y' | 'z')[],
    /** A hose has no flanges. */
    readonly flanges = true,
  ) {
    this.tube = mesh(new THREE.BufferGeometry(), material);
    this.fa = mesh(new THREE.BufferGeometry(), flangeMaterial);
    this.fb = mesh(new THREE.BufferGeometry(), flangeMaterial);
    this.root.add(this.tube, this.fa, this.fb);
  }

  /** Rebuild from the ports' positions; does nothing when neither moved by a millimetre. Ports are in the frame of `root`'s parent. */
  set(a: Port, b: Port): boolean {
    const key = [a.p, b.p, a.dir, b.dir].map((v) => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`).join('|');
    if (key === this.last) return false;
    this.last = key;
    this.points = route(a, b, this.lead, this.order);
    this.tube.geometry.dispose();
    this.tube.geometry = tubeThrough(this.points, this.r, this.bend);
    for (const [m, p] of [
      [this.fa, a],
      [this.fb, b],
    ] as const) {
      m.visible = this.flanges;
      if (!this.flanges) continue;
      m.geometry.dispose();
      m.geometry = flangeGeometry(this.r, p.dir.clone());
      m.position.copy(p.p);
    }
    return true;
  }
}

/** A pipe built once, in the frame of its parent. */
export function pipeBetween(
  a: Port,
  b: Port,
  r: number = PIPE.R,
  lead = 0.08,
  bend: number = PIPE.bend,
): { root: THREE.Group; points: THREE.Vector3[] } {
  const p = new LivePipe(r, lead, bend);
  p.set(a, b);
  return { root: p.root, points: p.points };
}
