import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { TAU, joined, latheCrisp } from '../common';
import { TRACTOR } from '../dims';
import { dynamic } from '../merge';
import { bright, castIron, greyPaint, rubber, steel } from '../materials';

// The wheels of the tractor: the big rears (18.4-38) with their chevron lugs, the small fronts (7.50-18) with three ribs. A tyre is a lathe of its section, turned to lie on Z; a rim is its dish and hub. The group that turns is `dynamic`
// (docs/3d.md): it turns at the speed that rolls it on the ground, which at 2 m/s is a third of a turn a second for the rear and nearly one for the front, so no blur disc is wanted (the cap is at three turns a second).

const lay = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
  // the lathe's axis is Y: the wheel's is Z
  g.rotateX(Math.PI / 2);
  return g;
};

/** A tyre's tread lugs: chevrons, two bars to a pair, set round the crown. */
function lugs(
  crown: number,
  height: number,
  halfWidth: number,
  count: number,
  barLen: number,
  barW: number,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU;
    for (const sz of [-1, 1]) {
      const g = new THREE.BoxGeometry(height, barW, barLen);
      // each bar lies slanted across the crown, the two meeting on the middle line: a chevron
      g.rotateX(sz * 0.62);
      g.translate(crown + height / 2 - 0.004, 0, sz * halfWidth * 0.5);
      g.rotateZ(a + (sz > 0 ? 0 : 0.0));
      parts.push(g);
    }
  }
  const out = joined(parts);
  return out;
}

export interface Wheel {
  /** The group the tractor's motion turns: tyre, rim, hub. Its origin is the wheel's centre, its axis Z. */
  spin: THREE.Group;
  /** The whole wheel at its place. */
  root: THREE.Group;
  radius: number;
}

function rearTyre(): THREE.BufferGeometry {
  const w = TRACTOR.rear.width / 2;
  const crown = TRACTOR.rear.R - 0.048;
  const profile: [number, number][] = [
    [0.49, -0.17],
    [0.55, -0.215],
    [0.66, -w],
    [0.75, -0.222],
    [0.8, -0.2],
    [crown - 0.002, -0.178],
    [crown, -0.16],
    [crown, 0.16],
    [crown - 0.002, 0.178],
    [0.8, 0.2],
    [0.75, 0.222],
    [0.66, w],
    [0.55, 0.215],
    [0.49, 0.17],
  ];
  return lay(latheCrisp(profile, 72));
}

function frontTyre(): THREE.BufferGeometry {
  const r = TRACTOR.front.R;
  const w = TRACTOR.front.width / 2;
  const profile: [number, number][] = [
    [0.235, -0.06],
    [0.27, -w],
    [0.33, -0.095],
    [0.375, -0.083],
    [r - 0.012, -0.072],
    [r, -0.066],
    [r, -0.034],
    [r - 0.012, -0.03],
    [r - 0.012, -0.016],
    [r, -0.012],
    [r, 0.012],
    [r - 0.012, 0.016],
    [r - 0.012, 0.03],
    [r, 0.034],
    [r, 0.066],
    [r - 0.012, 0.072],
    [0.375, 0.083],
    [0.33, 0.095],
    [0.27, w],
    [0.235, 0.06],
  ];
  return lay(latheCrisp(profile, 56));
}

/** A rim: the barrel, the dish on the outer side, the hub, six lightening holes, eight wheel nuts. `side` −1 for the left, whose outside is −z. */
function rim(
  barrelR: number,
  barrelHalf: number,
  dishR: number,
  dishAt: number,
  hubR: number,
  side: number,
): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const s = side;
  // barrel
  out.push(
    lay(
      latheCrisp(
        [
          [barrelR - 0.03, -barrelHalf],
          [barrelR + 0.004, -barrelHalf - 0.004],
          [barrelR + 0.004, barrelHalf + 0.004],
          [barrelR - 0.03, barrelHalf],
        ],
        64,
      ),
    ),
  );
  // dish: a shallow cone from the barrel to the hub, on the outer side
  out.push(
    lay(
      latheCrisp(
        [
          [hubR, s * (dishAt + 0.03)],
          [dishR * 0.62, s * (dishAt + 0.004)],
          [dishR, s * (dishAt - 0.04)],
          [dishR, s * (dishAt - 0.05)],
          [dishR * 0.62, s * (dishAt - 0.006)],
          [hubR, s * (dishAt + 0.02)],
        ],
        64,
      ),
    ),
  );
  // hub
  const hub = new THREE.CylinderGeometry(hubR, hubR * 1.05, 0.12, 24);
  hub.rotateX(Math.PI / 2);
  hub.translate(0, 0, s * (dishAt + 0.04));
  out.push(hub);
  const cap = new THREE.CylinderGeometry(hubR * 0.55, hubR * 0.6, 0.04, 24);
  cap.rotateX(Math.PI / 2);
  cap.translate(0, 0, s * (dishAt + 0.12));
  out.push(cap);
  return out;
}

function nuts(r: number, z: number, count: number, size: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU;
    const g = new THREE.CylinderGeometry(size, size, size * 1.1, 6);
    g.rotateX(Math.PI / 2);
    g.translate(Math.cos(a) * r, Math.sin(a) * r, z);
    parts.push(g);
  }
  return joined(parts);
}

/** One rear wheel, `side` −1 left (z < 0), +1 right. Its centre is at its axle. */
export function rearWheel(side: -1 | 1): Wheel {
  const R = TRACTOR.rear.R;
  const root = group(`rear-wheel-${side < 0 ? 'left' : 'right'}`);
  root.position.set(TRACTOR.rear.x, R, (side * TRACTOR.rear.tread) / 2);
  const spin = dynamic(group('spin'));
  root.add(spin);
  spin.add(mesh(rearTyre(), rubber()));
  spin.add(mesh(lugs(R - 0.048, 0.048, 0.19, 26, 0.17, 0.034), rubber()));
  const parts = rim(0.483, 0.16, 0.45, 0.09, 0.12, side);
  spin.add(mesh(parts[0]!, greyPaint()));
  spin.add(mesh(parts[1]!, greyPaint()));
  spin.add(mesh(parts[2]!, castIron()));
  spin.add(mesh(parts[3]!, steel()));
  spin.add(mesh(nuts(0.085, side * 0.145, 8, 0.0095), bright()));
  return { spin, root, radius: R };
}

/** One front wheel. */
export function frontWheel(side: -1 | 1): Wheel {
  const R = TRACTOR.front.R;
  const root = group(`front-wheel-${side < 0 ? 'left' : 'right'}`);
  root.position.set(TRACTOR.front.x, R, (side * TRACTOR.front.tread) / 2);
  const spin = dynamic(group('spin'));
  root.add(spin);
  spin.add(mesh(frontTyre(), rubber()));
  const parts = rim(0.228, 0.055, 0.2, 0.035, 0.05, side);
  spin.add(mesh(parts[0]!, greyPaint()));
  spin.add(mesh(parts[1]!, greyPaint()));
  spin.add(mesh(parts[2]!, castIron()));
  spin.add(mesh(parts[3]!, steel()));
  spin.add(mesh(nuts(0.036, side * 0.06, 5, 0.006), bright()));
  return { spin, root, radius: R };
}
