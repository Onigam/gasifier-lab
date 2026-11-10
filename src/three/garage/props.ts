import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { TAU, boxAt, joined, softBox, stick, tubeGeometry, v3 } from '../common';
import { dynamic, mergeStatic } from '../merge';
import { blackPaint, bright, brassMat, darkSteel, glassClear, rubber, steel } from '../materials';
import { tiled, woodMap } from '../textures';

// The small things of the garage: a catalytic CO indicator of the period on the wall (a needle on a dial with ticks and no figure, and a lamp), the rescue set of the 1940s on its hooks, the bench and its tools. None of them is a person: nobody is in the
// picture (R5).

const bakelite = (): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color: 0x2a211b, roughness: 0.35, metalness: 0.15 });
const leather = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: 0x6a4630, roughness: 0.7 });
const canvas = (): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color: 0x7c7a55, roughness: 1 });
const woods = new Map<number, THREE.MeshStandardMaterial>();
const wood = (c = 0x8a6740): THREE.MeshStandardMaterial => {
  let m = woods.get(c);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: c, map: tiled(woodMap(), 1, 1), roughness: 0.85 });
    woods.set(c, m);
  }
  return m;
};

export interface Indicator {
  group: THREE.Group;
  needle: THREE.Group;
  lamp: THREE.Mesh;
  /** The dial's sweep, radians from the left stop to the right. */
  sweep: number;
}

/** The CO indicator, local frame: origin on the wall behind it at its middle, facing +z. A Bakelite case with a round window, a dial with ticks on a log-like scale (no figure: the figures are the strip's), a needle, a lamp; its sensing head below. */
export function buildIndicator(): Indicator {
  const g = group('co-indicator');
  g.userData.partId = 'co-indicator';
  g.add(mesh(softBox(0, 0, 0.04, 0.2, 0.28, 0.08, 0.012), bakelite()));
  // the dial: a pale face with a ring of ticks and a darker arc where the scale is, under glass
  const face = new THREE.CylinderGeometry(0.075, 0.075, 0.004, 40);
  face.rotateX(Math.PI / 2);
  g.add(mesh(face, new THREE.MeshStandardMaterial({ color: 0xe9e1cb, roughness: 0.8 }), [0, 0.035, 0.082]));
  const ticks: THREE.BufferGeometry[] = [];
  const sweep = Math.PI * 1.25;
  for (let k = 0; k <= 20; k++) {
    const a = -sweep / 2 + (k / 20) * sweep;
    const long = k % 5 === 0;
    const t = new THREE.BoxGeometry(0.002, long ? 0.016 : 0.009, 0.001);
    t.translate(0, 0.06 - (long ? 0.008 : 0.0045), 0);
    t.rotateZ(-a);
    t.translate(0, 0.035, 0.0845);
    ticks.push(t);
  }
  g.add(mesh(joined(ticks), blackPaint()));
  // the needle on its pivot
  const needle = dynamic(group('needle'));
  needle.position.set(0, 0.035, 0.087);
  const nb = new THREE.BoxGeometry(0.003, 0.062, 0.0015);
  nb.translate(0, 0.026, 0);
  needle.add(mesh(nb, new THREE.MeshStandardMaterial({ color: 0xa2302a, roughness: 0.5 })));
  needle.add(mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 14).rotateX(Math.PI / 2), brassMat(), [0, 0, 0.002]));
  g.add(needle);
  g.add(
    mesh(new THREE.CylinderGeometry(0.079, 0.079, 0.002, 40).rotateX(Math.PI / 2), glassClear(), [0, 0.035, 0.092]),
  );
  g.add(mesh(new THREE.TorusGeometry(0.08, 0.004, 8, 40), brassMat(), [0, 0.035, 0.09]));
  // the lamp under the dial: a ruby lens on a ring, lit by the latched alarm
  const lampM = new THREE.MeshStandardMaterial({
    color: 0x5a1410,
    emissive: 0xff2a14,
    emissiveIntensity: 0,
    roughness: 0.2,
  });
  const lamp = mesh(new THREE.SphereGeometry(0.018, 14, 10), lampM, [0, -0.07, 0.085]);
  g.add(lamp);
  g.add(mesh(new THREE.TorusGeometry(0.02, 0.003, 8, 20), brassMat(), [0, -0.07, 0.081]));
  // the sensing head: a perforated brass can on the underside, a stalk and two terminals
  g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 14), brassMat(), [0, -0.17, 0.04]));
  g.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.03, 10), darkSteel(), [0, -0.15, 0.04]));
  for (const x of [-0.07, 0.07])
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8).rotateX(Math.PI / 2), brassMat(), [x, -0.115, 0.085]));
  // the mounting lugs and screws on the wall
  for (const [x, y] of [
    [-0.1, 0.12],
    [0.1, 0.12],
    [-0.1, -0.12],
    [0.1, -0.12],
  ] as const)
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 8).rotateX(Math.PI / 2), steel(), [x, y, 0.001]));
  // a cable to the wall
  g.add(mesh(tubeGeometry([v3(0.0, 0.14, 0.02), v3(0.0, 0.3, 0.02), v3(0.15, 0.4, 0.02)], 0.004, 14, 5), rubber()));
  mergeStatic(g, { name: 'co-indicator' });
  return { group: g, needle, lamp, sweep };
}

/** The 1940s rescue set, local frame: origin on the wall behind it at the top hook, facing +z: a canvas bag on a strap, a steel cylinder in a leather harness, a rubber hose and a face piece on a hook. History: the label of its sheet says so. */
export function buildRescueSet(): THREE.Group {
  const g = group('old-rescue-set');
  g.userData.partId = 'old-rescue-set';
  // a board with hooks
  g.add(mesh(boxAt(-0.35, -0.9, 0.0, 0.35, 0.1, 0.03), wood(0x6d4b2c)));
  for (const x of [-0.22, 0.0, 0.22]) {
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8).rotateX(Math.PI / 2), steel(), [x, 0.0, 0.065]));
    g.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), steel(), [x, 0.0, 0.1]));
  }
  // the bag
  g.add(mesh(softBox(-0.22, -0.28, 0.12, 0.26, 0.44, 0.12, 0.04), canvas()));
  g.add(mesh(softBox(-0.22, -0.12, 0.185, 0.2, 0.1, 0.02, 0.01), leather()));
  g.add(mesh(tubeGeometry([v3(-0.22, 0.0, 0.1), v3(-0.3, -0.05, 0.14), v3(-0.3, -0.2, 0.18)], 0.01, 16, 5), leather()));
  // the cylinder of oxygen in its leather harness
  const cyl = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 18);
  cyl.translate(0.0, -0.3, 0.12);
  g.add(mesh(cyl, new THREE.MeshStandardMaterial({ color: 0x2f4a3b, roughness: 0.4, metalness: 0.7 })));
  g.add(
    mesh(
      new THREE.SphereGeometry(0.05, 16, 8, 0, TAU, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x2f4a3b, roughness: 0.4, metalness: 0.7 }),
      [0, -0.05, 0.12],
    ),
  );
  for (const y of [-0.15, -0.45])
    g.add(mesh(new THREE.TorusGeometry(0.052, 0.012, 6, 20).rotateX(Math.PI / 2), leather(), [0, y, 0.12]));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 10), brassMat(), [0, 0.0, 0.12]));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), brassMat(), [0, 0.04, 0.12]));
  // the hose to the face piece
  g.add(
    mesh(
      tubeGeometry([v3(0, 0.05, 0.12), v3(0.1, 0.1, 0.14), v3(0.2, -0.05, 0.14), v3(0.22, -0.2, 0.12)], 0.011, 30, 6),
      rubber(),
    ),
  );
  // the face piece on the third hook: a rubber mask with two round eyepieces and a strap
  const mask = new THREE.SphereGeometry(0.08, 18, 12, 0, TAU, 0, Math.PI * 0.62);
  mask.rotateX(Math.PI / 2);
  g.add(mesh(mask, rubber(), [0.22, -0.28, 0.14]));
  for (const x of [-0.03, 0.03])
    g.add(
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 14).rotateX(Math.PI / 2), glassClear(), [
        0.22 + x,
        -0.27,
        0.215,
      ]),
    );
  g.add(
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12).rotateX(Math.PI / 2), darkSteel(), [0.22, -0.34, 0.225]),
  );
  g.add(mesh(new THREE.TorusGeometry(0.08, 0.005, 6, 24, Math.PI * 1.4), leather(), [0.22, -0.28, 0.12]));
  mergeStatic(g, { name: 'old-rescue-set' });
  return g;
}

/** A workbench against a wall with a few tools: a vice, a hammer, an oil can, a spanner. Local frame: origin on the floor at the middle of the wall side, facing +z. */
export function buildBench(): THREE.Group {
  const g = group('bench');
  const top = boxAt(-0.9, 0.86, 0.0, 0.9, 0.9, 0.6);
  g.add(mesh(top, wood(0x9a7a50)));
  const legs: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1])
    for (const sz of [0.05, 0.55]) legs.push(boxAt(sx * 0.85 - 0.03, 0, sz - 0.03, sx * 0.85 + 0.03, 0.86, sz + 0.03));
  legs.push(boxAt(-0.85, 0.2, 0.02, 0.85, 0.24, 0.08));
  g.add(mesh(joined(legs), wood(0x6d4b2c)));
  // a vice
  g.add(mesh(boxAt(0.6, 0.9, 0.05, 0.72, 1.0, 0.2), darkSteel()));
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8).rotateX(Math.PI / 2), steel(), [0.66, 0.97, 0.28]));
  // an oil can, a can with a spout
  const can = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 16);
  g.add(
    mesh(can, new THREE.MeshStandardMaterial({ color: 0x9b3b2a, roughness: 0.4, metalness: 0.5 }), [-0.5, 0.97, 0.3]),
  );
  g.add(mesh(stick(v3(-0.5, 1.02, 0.3), v3(-0.38, 1.1, 0.3), 0.008, 6), brassMat()));
  // a hammer and a spanner
  g.add(mesh(stick(v3(-0.1, 0.915, 0.3), v3(0.1, 0.915, 0.42), 0.011, 8), wood(0x6d4b2c)));
  g.add(mesh(boxAt(0.1, 0.9, 0.38, 0.18, 0.95, 0.46), steel()));
  g.add(mesh(softBox(0.3, 0.907, 0.3, 0.24, 0.012, 0.03, 0.004), steel()));
  // shelf above with jars, a pegboard with a few tools hanging
  g.add(mesh(boxAt(-0.85, 1.55, 0.0, 0.85, 1.575, 0.25), wood(0x6d4b2c)));
  for (const x of [-0.6, -0.3, 0.1, 0.4])
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 14), glassClear(), [x, 1.65, 0.12]));
  g.add(mesh(boxAt(-0.85, 1.0, -0.02, 0.85, 1.5, 0.0), wood(0x7a5a38)));
  for (const [x, y, l] of [
    [-0.5, 1.2, 0.3],
    [-0.2, 1.25, 0.25],
    [0.2, 1.2, 0.35],
  ] as const)
    g.add(mesh(stick(v3(x, y, 0.0), v3(x, y - l, 0.0), 0.007, 6), steel()));
  mergeStatic(g, { name: 'bench' });
  return g;
}

/** A jerry can, a tyre on a rack and a bucket for the floor's clutter. */
export function buildClutter(): THREE.Group {
  const g = group('clutter');
  const can = new THREE.MeshStandardMaterial({ color: 0x4e5a3c, roughness: 0.6, metalness: 0.4 });
  for (const [x, z] of [
    [0, 0],
    [0.34, 0.05],
  ] as const) {
    g.add(mesh(softBox(x, 0.2, z, 0.34, 0.4, 0.14, 0.02), can));
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 10), darkSteel(), [x - 0.1, 0.42, z]));
  }
  const bucket = new THREE.CylinderGeometry(0.13, 0.1, 0.26, 20, 1, true);
  g.add(
    mesh(
      bucket,
      new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.5, metalness: 0.8, side: THREE.DoubleSide }),
      [0.9, 0.13, 0.05],
    ),
  );
  g.add(mesh(new THREE.TorusGeometry(0.14, 0.006, 6, 24).rotateX(Math.PI / 2), steel(), [0.9, 0.26, 0.05]));
  mergeStatic(g, { name: 'clutter' });
  return g;
}

void bright;
