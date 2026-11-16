import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { boxAt, joined, stick, v3 } from '../common';
import { mergeStatic } from '../merge';
import { castIron, darkSteel, greyPaint, steel, weldBead } from '../materials';
import { concreteMap, tiled } from '../textures';

// What the pieces of the gas train stand on in the `gas-train` world, where nothing is on a tractor: low frames of steel section, a post, a plinth. They are scenery: no part, nothing to select; they stay on the floor when the line comes apart.

/** A hex nut on a stud standing up from a plate: `h` high, its centre at (x, y, z). */
const nut = (x: number, y: number, z: number, r = 0.0085, h = 0.009): THREE.BufferGeometry =>
  new THREE.CylinderGeometry(r, r, h, 6).translate(x, y + h / 2, z);

/** A weld bead along a joint: a thin bar, a few millimetres proud, as a fillet weld's ripples read from a metre. */
const bead = (a: THREE.Vector3, b: THREE.Vector3): THREE.BufferGeometry => stick(a, b, 0.0035, 5, false);

/** A frame of four legs and two rails under a box `w` (x) by `d` (z), its top at `h`. Centred on x = z = 0. */
export function frame(w: number, d: number, h: number, name = 'stand'): THREE.Group {
  const g = group(name);
  const parts: THREE.BufferGeometry[] = [];
  const s = 0.03;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      parts.push(
        boxAt(
          sx * (w / 2 - s) - s / 2,
          0,
          sz * (d / 2 - s) - s / 2,
          sx * (w / 2 - s) + s / 2,
          h - 0.04,
          sz * (d / 2 - s) + s / 2,
        ),
      );
  for (const sz of [-1, 1])
    parts.push(boxAt(-w / 2, h - 0.05, sz * (d / 2 - s) - s / 2, w / 2, h, sz * (d / 2 - s) + s / 2));
  for (const sx of [-1, 1])
    parts.push(boxAt(sx * (w / 2 - s) - s / 2, h - 0.05, -d / 2, sx * (w / 2 - s) + s / 2, h, d / 2));
  // a cross brace low down, so that it reads as welded
  parts.push(stick(v3(-w / 2 + s, 0.18, 0), v3(w / 2 - s, 0.18, 0), 0.012, 6));
  g.add(mesh(joined(parts), greyPaint()));
  // feet
  const feet: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      feet.push(
        boxAt(
          sx * (w / 2 - s) - 0.05,
          0,
          sz * (d / 2 - s) - 0.05,
          sx * (w / 2 - s) + 0.05,
          0.008,
          sz * (d / 2 - s) + 0.05,
        ),
      );
  g.add(mesh(joined(feet), darkSteel()));
  // the feet are bolted down: four nuts on the studs of each plate; the corners are welded, with a gusset under each rail
  const hardware: THREE.BufferGeometry[] = [];
  const welds: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const cx = sx * (w / 2 - s);
      const cz = sz * (d / 2 - s);
      for (const [dx, dz] of [
        [-0.035, -0.035],
        [0.035, -0.035],
        [-0.035, 0.035],
        [0.035, 0.035],
      ] as const)
        hardware.push(nut(cx + dx, 0.008, cz + dz));
      // the bead round the foot of the leg, on its four faces, and at the top where the rail meets it
      const hs = s / 2 + 0.002;
      const foot = (x: number, z: number) => v3(x, 0.012, z);
      welds.push(
        bead(foot(cx - hs, cz - hs), foot(cx + hs, cz - hs)),
        bead(foot(cx - hs, cz + hs), foot(cx + hs, cz + hs)),
      );
      welds.push(
        bead(foot(cx - hs, cz - hs), foot(cx - hs, cz + hs)),
        bead(foot(cx + hs, cz - hs), foot(cx + hs, cz + hs)),
      );
      welds.push(bead(v3(cx - hs, h - 0.052, cz - hs), v3(cx + hs, h - 0.052, cz - hs)));
      welds.push(bead(v3(cx - hs, h - 0.052, cz + hs), v3(cx + hs, h - 0.052, cz + hs)));
      // gusset: a small right-angled plate in the corner, along the rail
      welds.push(boxAt(cx - sx * 0.1 - 0.004, h - 0.15, cz - 0.002, cx - sx * 0.0, h - 0.05, cz + 0.002));
    }
  g.add(mesh(joined(hardware), steel()));
  g.add(mesh(joined(welds), weldBead()));
  mergeStatic(g, { name: name });
  return g;
}

/** A round post from the floor to `h` with a plate on top. */
export function post(h: number, r = 0.035, plate = 0.12, name = 'post'): THREE.Group {
  const g = group(name);
  g.add(mesh(new THREE.CylinderGeometry(r, r, h, 16), castIron(), [0, h / 2, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), darkSteel(), [0, 0.006, 0]));
  g.add(mesh(boxAt(-plate / 2, h - 0.01, -plate / 2, plate / 2, h + 0.008, plate / 2), steel()));
  // four anchor nuts on the base plate, four gussets from the plate up the post, a bead round its foot, and the top plate's bolts
  const hw: THREE.BufferGeometry[] = [];
  const gussets: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    hw.push(nut(Math.cos(a) * 0.075, 0.012, Math.sin(a) * 0.075, 0.009, 0.01));
    const ga = (k / 4) * Math.PI * 2;
    const gx = Math.cos(ga);
    const gz = Math.sin(ga);
    gussets.push(
      boxAt(
        Math.min(gx * (r + 0.001), gx * (r + 0.05)),
        0.012,
        Math.min(gz * (r + 0.001), gz * (r + 0.05)) - 0.002,
        Math.max(gx * (r + 0.001), gx * (r + 0.05)),
        0.07,
        Math.max(gz * (r + 0.001), gz * (r + 0.05)) + 0.002,
      ),
    );
    hw.push(nut(Math.cos(a) * (plate / 2 - 0.012), h + 0.008, Math.sin(a) * (plate / 2 - 0.012), 0.006, 0.006));
  }
  g.add(mesh(joined(hw), steel()));
  g.add(mesh(joined(gussets), darkSteel()));
  g.add(
    mesh(new THREE.TorusGeometry(r + 0.002, 0.0035, 5, 20).rotateX(Math.PI / 2).translate(0, 0.014, 0), weldBead()),
  );
  mergeStatic(g, { name });
  return g;
}

/** A plinth: a block of concrete, its top at `h`. */
export function plinth(w: number, d: number, h: number, name = 'plinth'): THREE.Group {
  const g = group(name);
  g.add(
    mesh(
      boxAt(-w / 2, 0, -d / 2, w / 2, h, d / 2),
      new THREE.MeshStandardMaterial({ color: 0xb4b0a5, map: tiled(concreteMap(), 1.6, 1.6), roughness: 0.95 }),
    ),
  );
  // a steel base plate on the block, held by four anchor bolts with their nuts
  const pw = Math.min(w, d) * 0.7;
  g.add(mesh(boxAt(-pw / 2, h, -pw / 2, pw / 2, h + 0.01, pw / 2), darkSteel()));
  const nuts: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) nuts.push(nut(sx * (pw / 2 - 0.02), h + 0.01, sz * (pw / 2 - 0.02), 0.0085, 0.012));
  g.add(mesh(joined(nuts), steel()));
  mergeStatic(g, { name });
  return g;
}
