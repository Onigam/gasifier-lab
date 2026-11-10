import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { boxAt, joined, stick, v3 } from '../common';
import { mergeStatic } from '../merge';
import { castIron, darkSteel, greyPaint, steel } from '../materials';

// What the pieces of the gas train stand on in the `gas-train` world, where nothing is on a tractor: low frames of steel section, a post, a plinth. They are scenery: no part, nothing to select; they stay on the floor when the line comes apart.

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
  mergeStatic(g, { name: name });
  return g;
}

/** A round post from the floor to `h` with a plate on top. */
export function post(h: number, r = 0.035, plate = 0.12, name = 'post'): THREE.Group {
  const g = group(name);
  g.add(mesh(new THREE.CylinderGeometry(r, r, h, 16), castIron(), [0, h / 2, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), darkSteel(), [0, 0.006, 0]));
  g.add(mesh(boxAt(-plate / 2, h - 0.01, -plate / 2, plate / 2, h + 0.008, plate / 2), steel()));
  mergeStatic(g, { name });
  return g;
}

/** A plinth: a block of concrete, its top at `h`. */
export function plinth(w: number, d: number, h: number, name = 'plinth'): THREE.Group {
  const g = group(name);
  g.add(
    mesh(
      boxAt(-w / 2, 0, -d / 2, w / 2, h, d / 2),
      new THREE.MeshStandardMaterial({ color: 0xa8a49a, roughness: 0.95 }),
    ),
  );
  mergeStatic(g, { name });
  return g;
}
