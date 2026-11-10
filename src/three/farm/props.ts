import * as THREE from 'three';
import { group, mesh, rng } from '@onigam/lab-kit/three';
import { FARM } from '../dims';
import { TAU, boxAt, cylZ, joined, latheCrisp, softBox, stick, tubeGeometry, uvMetric, v3 } from '../common';
import { dynamic, mergeStatic } from '../merge';
import { endGrainMap, concreteMap, masonryMap, strawMap, tiled, woodMap, rustSteelMap, boardsMap } from '../textures';
import { ashMat, blackWater, darkSteel, hotCasing, rubber, steel, tarFilm } from '../materials';
import { terrainHeight } from './terrain';

// The props of the yard, each from its own function and none a stand-in: the drum chipper on its trailer, the chip sieve, the 4 m clod crusher, the ash bin, the barrel of black water, the woodpile, the fences and the walls, and the small things that
// make a yard a yard. Every one stands on the land: `place` puts a prop on its ground to the millimetre.

const std = (p: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial(p);
const green = (): THREE.MeshStandardMaterial =>
  std({ color: 0x3f5a3c, map: tiled(rustSteelMap(), 2, 2), roughness: 0.7, metalness: 0.3 });
const orange = (): THREE.MeshStandardMaterial =>
  std({ color: 0xb3541f, map: tiled(rustSteelMap(), 2, 2), roughness: 0.65, metalness: 0.3 });
const wood = (c = 0x8a6740): THREE.MeshStandardMaterial =>
  std({ color: c, map: tiled(woodMap(), 1, 1), roughness: 0.9 });
const iron = (): THREE.MeshStandardMaterial =>
  std({ color: 0x4d4944, map: tiled(rustSteelMap(), 2, 2), roughness: 0.8, metalness: 0.5 });
const rustIron = (): THREE.MeshStandardMaterial =>
  std({ color: 0x7a4a2e, map: tiled(rustSteelMap(), 3, 3), roughness: 0.9, metalness: 0.4 });

/** Put a prop on the land at (x, z): its origin on the ground, optionally levelled to the average of the ground under its footprint. */
export function place<T extends THREE.Object3D>(o: T, x: number, z: number, yaw = 0, foot = 0.5): T {
  const hs = [
    terrainHeight(x, z),
    terrainHeight(x + foot, z),
    terrainHeight(x - foot, z),
    terrainHeight(x, z + foot),
    terrainHeight(x, z - foot),
  ];
  o.position.set(x, Math.min(...hs), z);
  o.rotation.y = yaw;
  return o;
}

// ============================================================================================= the drum chipper

export interface Chipper {
  group: THREE.Group;
  /** The drum, which turns while a chip is made. */
  drum: THREE.Group;
}

/** A trailer chipper of the 1960s, local frame: origin on the ground at the middle between the wheels, the infeed towards −x, the chute towards +x. A drum with knives behind two feed rollers, a trough to feed it, a chute that throws; a two-wheel chassis, a PTO shaft. */
export function buildChipper(): Chipper {
  const g = group('drum-chipper');
  g.userData.partId = 'drum-chipper';
  const gr = green();
  // chassis: a frame, an axle, two wheels, a towbar with its eye, a jack
  const frame = joined([
    boxAt(-1.4, 0.55, -0.55, 1.2, 0.68, -0.45),
    boxAt(-1.4, 0.55, 0.45, 1.2, 0.68, 0.55),
    boxAt(-1.4, 0.55, -0.55, -1.3, 0.68, 0.55),
    boxAt(1.1, 0.55, -0.55, 1.2, 0.68, 0.55),
  ]);
  g.add(mesh(frame, iron()));
  g.add(mesh(cylZ(-0.95, 0.95, 0.045, 14), steel(), [0.15, 0.4, 0]));
  for (const s of [-1, 1]) {
    const tyre = new THREE.TorusGeometry(0.3, 0.1, 12, 26);
    tyre.translate(0, 0, 0);
    const t = mesh(tyre, rubber(), [0.15, 0.4, s * 0.95]);
    g.add(t);
    const rim = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 20);
    rim.rotateX(Math.PI / 2);
    g.add(mesh(rim, steel(), [0.15, 0.4, s * 0.95]));
    const fender = new THREE.CylinderGeometry(0.46, 0.46, 0.3, 24, 1, true, Math.PI - 1.1, 2.2);
    fender.rotateX(Math.PI / 2);
    g.add(mesh(fender, std({ color: 0x3f5a3c, roughness: 0.7, side: THREE.DoubleSide }), [0.15, 0.4, s * 0.95]));
  }
  g.add(mesh(stick(v3(-1.4, 0.62, 0), v3(-2.35, 0.7, 0), 0.04, 8), iron()));
  g.add(mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 16).rotateY(Math.PI / 2), steel(), [-2.4, 0.7, 0]));
  g.add(mesh(stick(v3(-1.8, 0.64, 0), v3(-1.8, 0.1, 0), 0.025, 8), steel()));
  g.add(mesh(boxAt(-1.9, 0.0, -0.1, -1.7, 0.03, 0.1), iron()));
  // the housing: a shell round the drum, with the feed mouth towards −x and the chute rising on the top
  g.add(mesh(softBox(0.25, 1.35, 0, 1.35, 1.05, 0.95, 0.07), gr));
  g.add(mesh(softBox(0.25, 1.9, 0, 1.2, 0.04, 0.9, 0.02), orange()));
  // the drum seen through the access panel: a cylinder across, with knives
  const drum = dynamic(group('chipper-drum'));
  drum.position.set(0.1, 1.25, 0);
  const body = new THREE.CylinderGeometry(0.42, 0.42, 0.75, 28);
  body.rotateX(Math.PI / 2);
  drum.add(mesh(body, iron()));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU;
    const kn = new THREE.BoxGeometry(0.06, 0.12, 0.7);
    kn.translate(0.0, 0.46, 0);
    kn.rotateZ(a);
    drum.add(mesh(kn, steel()));
  }
  g.add(drum);
  // the access panel on the −z side is open a hand: a dark slot with the drum behind, the panel hinged
  g.add(mesh(boxAt(-0.25, 0.95, -0.49, 0.75, 1.65, -0.47), std({ color: 0x15130f, roughness: 1 })));
  // feed trough: a trough of steel sloping up to the drum, side plates, two feed rollers with spikes at the mouth
  const trough = joined([
    boxAt(-1.55, 0.88, -0.35, -0.35, 0.92, 0.35),
    boxAt(-1.55, 0.88, -0.38, -0.35, 1.2, -0.35),
    boxAt(-1.55, 0.88, 0.35, -0.35, 1.2, 0.38),
  ]);
  const tm = mesh(trough, gr);
  tm.position.y = 0.0;
  g.add(tm);
  for (const x of [-0.4, -0.64]) {
    const roll = new THREE.CylinderGeometry(0.09, 0.09, 0.68, 14);
    roll.rotateX(Math.PI / 2);
    g.add(mesh(roll, steel(), [x, 1.1, 0]));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      g.add(
        mesh(new THREE.CylinderGeometry(0.008, 0.016, 0.07, 5).rotateX(0), steel(), [
          x + Math.cos(a) * 0.12,
          1.1 + Math.sin(a) * 0.12,
          0.0,
        ]),
      );
    }
  }
  g.add(mesh(softBox(-0.52, 1.28, 0, 0.4, 0.04, 0.7, 0.01), gr));
  // the chute: a collar on the top, a curved spout to +x, a hood that throws it down
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.25, 22), orange(), [0.25, 2.04, 0]));
  const spout = tubeGeometry(
    [v3(0.25, 2.1, 0), v3(0.25, 2.45, 0), v3(0.7, 2.7, 0), v3(1.35, 2.55, 0), v3(1.75, 2.1, 0)],
    0.17,
    40,
    18,
  );
  g.add(mesh(spout, orange()));
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.08, 18).rotateZ(Math.PI / 4).translate(1.74, 2.07, 0), iron()));
  // the PTO shaft from the towbar's gearbox to the left, with its guard, and the belt guard
  g.add(mesh(softBox(-1.15, 0.9, 0.0, 0.34, 0.3, 0.3, 0.03), iron()));
  g.add(
    mesh(
      stick(v3(-1.1, 0.9, 0.12), v3(-2.2, 0.82, 0.5), 0.035, 10),
      std({ color: 0xd0b23a, roughness: 0.5, metalness: 0.3 }),
    ),
  );
  g.add(mesh(stick(v3(-1.1, 0.9, 0.12), v3(-0.4, 1.2, 0.1), 0.03, 8), iron()));
  // a few logs lying by the trough and one half way in
  const lm = std({ color: 0xcfc2a4, map: tiled(woodMap(), 1, 1), roughness: 0.9 });
  const r = rng(5);
  for (let k = 0; k < 4; k++) {
    const log = new THREE.CylinderGeometry(0.08 + 0.02 * r(), 0.08 + 0.02 * r(), 1.6, 10);
    log.rotateZ(Math.PI / 2);
    const m = mesh(log, lm, [-2.5 - 0.4 * (k % 2), 0.09 + 0.15 * Math.floor(k / 2), -0.9 + 0.17 * k]);
    m.rotation.y = (r() - 0.5) * 0.3;
    g.add(m);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.5, 10).rotateZ(Math.PI / 2 - 0.12), lm, [-1.1, 1.01, 0.08]));
  mergeStatic(g, { name: 'drum-chipper' });
  return { group: g, drum };
}

// ============================================================================================= the sieve

export interface Sieve {
  group: THREE.Group;
  drum: THREE.Group;
}

const wireAlpha = (): THREE.DataTexture => {
  const N = 64;
  const d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const k = (j * N + i) * 4;
      const wire = i % 16 < 2 || j % 16 < 2 ? 255 : 0;
      d[k] = d[k + 1] = d[k + 2] = wire;
      d[k + 3] = 255;
    }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
};

/** A drum sieve, local frame: origin on the ground at its middle, the long axis along x, the high end at −x. A trommel of wire mesh on rollers, an infeed hopper, a hopper below with a spout and a sack, a motor and belt, a chute for what stays in. */
export function buildSieve(): Sieve {
  const g = group('chip-sieve');
  g.userData.partId = 'chip-sieve';
  const tilt = 0.12;
  // a frame of angle-iron legs and rails
  const frame: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      frame.push(
        boxAt(
          sx * 1.0 - 0.035,
          0,
          sz * 0.52 - 0.035,
          sx * 1.0 + 0.035,
          1.05 - sx * 0.12 + 0.12 * (sx > 0 ? 0 : 0),
          sz * 0.52 + 0.035,
        ),
      );
  frame.push(boxAt(-1.0, 0.95, -0.55, 1.0, 1.0, -0.49));
  frame.push(boxAt(-1.0, 0.95, 0.49, 1.0, 1.0, 0.55));
  frame.push(boxAt(-1.0, 0.3, -0.55, 1.0, 0.34, -0.49));
  frame.push(boxAt(-1.0, 0.3, 0.49, 1.0, 0.34, 0.55));
  g.add(mesh(joined(frame), green()));
  // the drum: a cage of wire mesh, rings and two rollers
  const drum = dynamic(group('sieve-drum'));
  drum.position.set(0, 1.45, 0);
  drum.rotation.z = -tilt;
  const mesh_ = new THREE.CylinderGeometry(0.42, 0.42, 2.3, 28, 1, true);
  mesh_.rotateZ(Math.PI / 2);
  const wm = std({
    color: 0x8e8f90,
    alphaMap: tiled(wireAlpha(), 14, 5),
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.5,
    metalness: 0.8,
  });
  drum.add(mesh(mesh_, wm));
  for (const x of [-1.15, -0.4, 0.4, 1.15]) {
    const ring = new THREE.TorusGeometry(0.42, 0.012, 8, 36);
    ring.rotateY(Math.PI / 2);
    drum.add(mesh(ring, steel(), [x, 0, 0]));
  }
  g.add(drum);
  for (const x of [-0.6, 0.6])
    for (const sz of [-1, 1]) {
      const roller = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12);
      roller.rotateX(Math.PI / 2);
      g.add(mesh(roller, iron(), [x, 1.0, sz * 0.42]));
    }
  // the infeed hopper at the high end and a trough under the drum with its hopper and spout
  g.add(
    mesh(
      joined([
        boxAt(-1.7, 1.55, -0.45, -1.05, 1.58, 0.45),
        boxAt(-1.7, 1.55, -0.45, -1.67, 2.0, 0.45),
        boxAt(-1.7, 1.55, 0.42, -1.05, 2.0, 0.45),
        boxAt(-1.7, 1.55, -0.45, -1.05, 2.0, -0.42),
      ]),
      green(),
    ),
  );
  const hop = new THREE.CylinderGeometry(0.7, 0.18, 0.75, 4, 1, true);
  hop.rotateY(Math.PI / 4);
  g.add(mesh(hop, std({ color: 0x3f5a3c, roughness: 0.7, metalness: 0.3, side: THREE.DoubleSide }), [0.1, 0.55, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 12), iron(), [0.1, 0.3, 0]));
  // a sack under the spout, of fine chips
  g.add(mesh(softBox(0.1, 0.2, 0, 0.5, 0.4, 0.4, 0.12, 3), std({ color: 0xa9906a, roughness: 1 })));
  // the chute for the coarse at the low end, on a wheelbarrow-high stand
  g.add(
    mesh(
      joined([
        boxAt(1.15, 0.7, -0.35, 1.9, 0.74, 0.35),
        boxAt(1.15, 0.7, -0.35, 1.9, 0.95, -0.32),
        boxAt(1.15, 0.7, 0.32, 1.9, 0.95, 0.35),
      ]),
      green(),
    ),
  );
  // motor and belt: a motor on the frame, a V-belt to a pulley on the drum's end
  const motor = new THREE.CylinderGeometry(0.1, 0.1, 0.36, 18);
  motor.rotateX(Math.PI / 2);
  g.add(mesh(motor, std({ color: 0x2f3a4a, roughness: 0.5, metalness: 0.6 }), [0.5, 0.45, 0.8]));
  g.add(mesh(boxAt(0.3, 0.34, 0.6, 0.7, 0.39, 1.0), iron()));
  const pulley = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 20);
  pulley.rotateX(Math.PI / 2);
  g.add(mesh(pulley, steel(), [0.5, 1.2, 0.58]));
  g.add(mesh(tubeGeometry([v3(0.5, 0.45, 0.8), v3(0.5, 0.8, 0.7), v3(0.5, 1.04, 0.58)], 0.012, 12, 5), rubber()));
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12).rotateX(Math.PI / 2), steel(), [0.5, 0.45, 0.8 - 0.2]));
  mergeStatic(g, { name: 'chip-sieve' });
  return { group: g, drum };
}

// ============================================================================================= the clod crusher (4 m)

export interface Crusher {
  group: THREE.Group;
  /** The ring gangs, which roll. */
  gangs: THREE.Group[];
  /** The point of the hitch at the front of the pole, in the crusher's frame. */
  hitch: THREE.Vector3;
}

/** The clod crusher: two gangs of rings on an axle across a frame, the pole to the drawbar; 4 m wide (K38), local frame: origin on the ground at the middle of the axle, forward +x. The rings roll as the ground says. */
export function buildCrusher(): Crusher {
  const g = group('clod-crusher');
  g.userData.partId = 'clod-crusher';
  const { width, rings, pole } = FARM.crusher;
  const per = rings / 2;
  const half = width / 2;
  const axleY = 0.31;
  // one ring: a double bevel like the Cambridge ring's; the bore in the middle. Instanced along the axle
  const profile: [number, number][] = [
    [0.06, -0.034],
    [0.25, -0.034],
    [0.31, -0.004],
    [0.25, 0.034],
    [0.06, 0.034],
  ];
  const ringG = latheCrisp([...profile, [0.06, -0.034]], 36);
  ringG.rotateX(Math.PI / 2);
  const gangs: THREE.Group[] = [];
  const pitch = (half - 0.12) / per;
  for (const s of [-1, 1]) {
    const gang = dynamic(group('gang'));
    gang.position.set(0, axleY, s * (half / 2 + 0.03));
    const im = new THREE.InstancedMesh(ringG, iron(), per);
    const m = new THREE.Matrix4();
    for (let i = 0; i < per; i++) {
      m.makeTranslation(0, 0, (i - (per - 1) / 2) * pitch * 0.99);
      im.setMatrixAt(i, m);
    }
    im.castShadow = true;
    im.receiveShadow = true;
    gang.add(im);
    // the axle through the rings
    gang.add(mesh(cylZ(-half / 2 - 0.02, half / 2 + 0.02, 0.05, 12), steel()));
    // spokes of the ring seen: a few bolts along the gang
    gang.add(mesh(cylZ(-half / 2 - 0.04, half / 2 + 0.04, 0.012, 6), rustIron(), [0, 0.22, 0]));
    g.add(gang);
    gangs.push(gang);
  }
  // the frame: two side beams with bearings, a rear scraper bar, a cross member, the A-frame and its pole
  const fr: THREE.BufferGeometry[] = [];
  for (const sz of [-1, 1]) {
    fr.push(boxAt(-0.2, 0.52, sz * (half - 0.04) - 0.05, 0.7, 0.62, sz * (half - 0.04) + 0.05));
    fr.push(boxAt(-0.04, axleY - 0.08, sz * (half - 0.04) - 0.05, 0.04, axleY + 0.2, sz * (half - 0.04) + 0.05));
  }
  fr.push(boxAt(0.55, 0.52, -half + 0.1, 0.65, 0.62, half - 0.1));
  fr.push(boxAt(-0.2, 0.52, -half + 0.1, -0.1, 0.62, half - 0.1));
  fr.push(boxAt(0.0, 0.52, -0.05, 0.1, 0.62, 0.05));
  for (const z of [-half / 2, 0, half / 2]) fr.push(stick(v3(-0.1, 0.5, z), v3(-0.1, 0.12, z), 0.01, 6));
  g.add(mesh(joined(fr), rustIron()));
  // the scraper: a blade behind the rings, to clear them
  g.add(mesh(boxAt(-0.32, 0.12, -half + 0.1, -0.3, 0.42, half - 0.1), iron()));
  // the A-frame: two bars from the cross member to the hitch at the front of the pole
  const hitch = v3(pole + 0.8, 0.7, 0);
  for (const sz of [-1, 1]) g.add(mesh(stick(v3(0.6, 0.57, sz * 0.9), hitch, 0.035, 8), rustIron()));
  g.add(mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 16).rotateY(Math.PI / 2), steel(), [hitch.x + 0.05, hitch.y, 0]));
  mergeStatic(g, { name: 'clod-crusher' });
  return { group: g, gangs, hitch };
}

// ============================================================================================= the ash bin, the barrel

/** An ash bin: a steel container on a slab, its lid a little ajar. Origin on the ground at the middle of its foot. Nothing of its handling is drawn. */
export function buildAshBin(): { group: THREE.Group; ash: THREE.Mesh } {
  const g = group('ash-bin');
  g.userData.partId = 'ash-bin';
  g.add(
    mesh(
      boxAt(-0.6, 0, -0.45, 0.6, 0.08, 0.45),
      std({ color: 0x9a9890, map: tiled(concreteMap(), 1, 1), roughness: 0.95 }),
    ),
  );
  const body = std({ color: 0x4b4f52, map: tiled(rustSteelMap(), 1.5, 1.5), roughness: 0.75, metalness: 0.5 });
  // a box of sheet steel with a rolled rim, two handles, feet
  g.add(
    mesh(
      joined([
        boxAt(-0.45, 0.1, -0.3, 0.45, 0.78, -0.27),
        boxAt(-0.45, 0.1, 0.27, 0.45, 0.78, 0.3),
        boxAt(-0.45, 0.1, -0.3, -0.42, 0.78, 0.3),
        boxAt(0.42, 0.1, -0.3, 0.45, 0.78, 0.3),
        boxAt(-0.45, 0.1, -0.3, 0.45, 0.13, 0.3),
      ]),
      body,
    ),
  );
  g.add(mesh(joined([boxAt(-0.47, 0.76, -0.32, 0.47, 0.8, 0.32)]), darkSteel()));
  // its lid on one hinge, lifted a hand on the other side
  const lid = group('lid');
  lid.add(mesh(boxAt(-0.47, 0.0, 0.0, 0.47, 0.025, 0.66), body));
  lid.position.set(0, 0.8, -0.33);
  lid.rotation.x = -0.12;
  g.add(lid);
  for (const s of [-1, 1])
    g.add(mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14, Math.PI).rotateX(0), steel(), [s * 0.47, 0.64, 0]));
  // the ash in it: a grey surface that rises with the model's ash, hidden by the lid but for a rim
  const ash = mesh(new THREE.BoxGeometry(0.86, 1, 0.54), ashMat(), [0, 0.12, 0]);
  ash.scale.y = 0.02;
  ash.position.y = 0.14;
  g.add(dynamic(ash));
  // a little grey ash on the slab beside it
  g.add(mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.012, 16), ashMat(), [0.62, 0.012, 0.28]));
  mergeStatic(g, { name: 'ash-bin' });
  return { group: g, ash };
}

/** A barrel of black water: oak staves bulging, three iron hoops, the bung, black streaks down from it, on two battens. Origin on the ground at the middle of its foot. */
export function buildBarrel(): { group: THREE.Group; level: THREE.Mesh } {
  const g = group('condensate-barrel');
  g.userData.partId = 'condensate-barrel';
  g.add(mesh(joined([boxAt(-0.4, 0, -0.34, 0.4, 0.07, -0.24), boxAt(-0.4, 0, 0.24, 0.4, 0.07, 0.34)]), wood(0x6b5238)));
  const prof: [number, number][] = [
    [0.0, 0.07],
    [0.22, 0.07],
    [0.27, 0.2],
    [0.3, 0.45],
    [0.315, 0.62],
    [0.3, 0.79],
    [0.27, 1.04],
    [0.22, 1.17],
    [0.0, 1.17],
  ];
  const staves = latheCrisp(prof, 40);
  // staves by a vertical texture: a boards map round the lathe
  const sm = std({ color: 0xc8a574, map: tiled(boardsMap(), 6, 1.2), roughness: 0.9 });
  g.add(mesh(staves, sm));
  for (const [y, r] of [
    [0.14, 0.236],
    [0.35, 0.292],
    [0.62, 0.318],
    [0.9, 0.292],
    [1.1, 0.236],
  ] as const)
    g.add(mesh(new THREE.TorusGeometry(r + 0.004, 0.011, 6, 40).rotateX(Math.PI / 2), iron(), [0, y, 0]));
  // the lid, a bung hole and its wooden bung, the black that has run from it
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 28), wood(0x8a6a44), [0, 1.18, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.04, 12), wood(0x5a4630), [0.1, 1.2, 0.0]));
  const streak = latheCrisp(
    [
      [0.318, 0.55],
      [0.318, 1.14],
    ],
    40,
    0.2,
    1.2,
  );
  g.add(mesh(streak, tarFilm()));
  // the level: a black disc that is not seen, the surface of the water, riding the model's litres through the bung's glass
  const level = mesh(new THREE.CylinderGeometry(0.021, 0.021, 1, 10), blackWater(), [0.1, 1.17, 0.0]);
  level.visible = false;
  g.add(level);
  mergeStatic(g, { name: 'condensate-barrel' });
  return { group: g, level };
}

// ============================================================================================= woodpile, walls, fences, small things

/** Stacks of split birch, a metre long, in a rack of posts: instanced. Origin on the ground at the middle of the front of the stacks. */
export function buildWoodpile(): THREE.Group {
  const g = group('woodpile');
  const r = rng(31);
  const side = std({ color: 0xcdbfa2, map: tiled(woodMap(), 1, 1), roughness: 0.9 });
  const end = std({ color: 0xffffff, map: tiled(endGrainMap(), 1, 1), roughness: 0.9 });
  const geom = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 9);
  geom.rotateX(Math.PI / 2);
  const logs: { x: number; y: number }[] = [];
  const stacks = [
    [-3.2, 3.0, 1.6],
    [0.1, 2.6, 1.5],
    [3.0, 2.2, 1.3],
  ] as const;
  for (const [x0, w, h] of stacks) {
    for (let j = 0; j < Math.floor(h / 0.125); j++)
      for (let i = 0; i < Math.floor(w / 0.15) - (j % 2); i++)
        logs.push({ x: x0 + i * 0.15 + (j % 2) * 0.075, y: 0.1 + j * 0.125 });
  }
  const im = new THREE.InstancedMesh(geom, [side, end, end], logs.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  logs.forEach((l, i) => {
    e.set(0, (r() - 0.5) * 0.06, (r() - 0.5) * 0.04);
    q.setFromEuler(e);
    const s = 0.85 + 0.3 * r();
    m.compose(v3(l.x - 3.2 + 3.2, l.y, (r() - 0.5) * 0.05), q, v3(s, s, 1));
    im.setMatrixAt(i, m);
    const t = 0.82 + 0.35 * r();
    col.setRGB(t, t * (0.95 + 0.1 * r()), t * (0.9 + 0.1 * r()));
    im.setColorAt(i, col);
  });
  im.castShadow = true;
  im.receiveShadow = true;
  g.add(im);
  // posts and a roof of boards over the lot, on the ends
  const posts: THREE.BufferGeometry[] = [];
  for (const x of [-4.4, -1.4, 1.5, 4.4])
    for (const z of [-0.52, 0.52]) posts.push(boxAt(x - 0.05, 0, z - 0.05, x + 0.05, 1.9, z + 0.05));
  g.add(mesh(joined(posts), wood(0x5a4630)));
  g.add(mesh(boxAt(-4.6, 1.9, -0.75, 4.6, 1.98, 0.75), wood(0x4a3a2a)));
  g.add(mesh(boxAt(-4.6, 1.98, -0.75, 4.6, 2.05, -0.7), wood(0x3a2c20)));
  mergeStatic(g, { name: 'woodpile' });
  return g;
}

/** A length of drystone wall along x: a hundred and some stones in courses, lichen-grey. Origin on the ground at its middle. */
export function buildStoneWall(length: number, seed = 3): THREE.Group {
  const g = group('stone-wall');
  const r = rng(seed);
  const stone = std({ color: 0xffffff, map: tiled(masonryMap(), 0.9, 0.9), roughness: 1 });
  const geoms: THREE.BufferGeometry[] = [];
  const courses = 5;
  for (let j = 0; j < courses; j++) {
    let x = -length / 2;
    while (x < length / 2) {
      const w = 0.22 + 0.34 * r();
      const h = 0.15 + 0.08 * r();
      const b = new THREE.BoxGeometry(w, h, 0.46 - 0.03 * j);
      b.rotateY((r() - 0.5) * 0.25);
      b.translate(x + w / 2, 0.1 + j * 0.17 + (h / 2) * 0.6, (r() - 0.5) * 0.06);
      uvMetric(b);
      geoms.push(b);
      x += w * 0.97;
    }
  }
  g.add(mesh(joined(geoms), stone));
  mergeStatic(g, { name: 'stone-wall' });
  return g;
}

/** A post-and-rail fence of split timber along x: posts every 3 m, three rails. Origin on the ground at its middle. */
export function buildFence(length: number): THREE.Group {
  const g = group('fence');
  const w = wood(0x7e6a4e);
  const parts: THREE.BufferGeometry[] = [];
  const n = Math.round(length / 3);
  for (let i = 0; i <= n; i++)
    parts.push(
      boxAt(-length / 2 + (i * length) / n - 0.06, 0, -0.06, -length / 2 + (i * length) / n + 0.06, 1.2, 0.06),
    );
  for (const y of [0.4, 0.75, 1.1]) parts.push(boxAt(-length / 2, y - 0.04, 0.06, length / 2, y + 0.04, 0.1));
  g.add(mesh(joined(parts), w));
  mergeStatic(g, { name: 'fence' });
  return g;
}

/** A wheelbarrow, a ladder, two bales and a stack of pallets: the yard's small things. Each its own group so that they stand on the ground by themselves. */
export function buildWheelbarrow(): THREE.Group {
  const g = group('wheelbarrow');
  const tray = softBox(0.0, 0.5, 0, 0.8, 0.28, 0.5, 0.06);
  g.add(mesh(tray, std({ color: 0x3e6a8a, roughness: 0.6, metalness: 0.4 })));
  g.add(mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 18).rotateY(Math.PI / 2), rubber(), [0.55, 0.23, 0]));
  g.add(
    mesh(
      joined([
        stick(v3(-0.2, 0.52, -0.2), v3(-0.9, 0.62, -0.22), 0.018, 6),
        stick(v3(-0.2, 0.52, 0.2), v3(-0.9, 0.62, 0.22), 0.018, 6),
        stick(v3(-0.3, 0.4, -0.2), v3(-0.35, 0.0, -0.25), 0.015, 6),
        stick(v3(-0.3, 0.4, 0.2), v3(-0.35, 0.0, 0.25), 0.015, 6),
      ]),
      wood(0x6b5238),
    ),
  );
  mergeStatic(g, { name: 'wheelbarrow' });
  return g;
}

export function buildLadder(h = 4): THREE.Group {
  const g = group('ladder');
  const w = wood(0x8f7650);
  const parts: THREE.BufferGeometry[] = [];
  for (const z of [-0.22, 0.22]) parts.push(boxAt(-0.025, 0, z - 0.025, 0.025, h, z + 0.025));
  for (let k = 0; k < Math.floor(h / 0.3); k++)
    parts.push(boxAt(-0.02, 0.2 + k * 0.3, -0.22, 0.02, 0.23 + k * 0.3, 0.22));
  g.add(mesh(joined(parts), w));
  mergeStatic(g, { name: 'ladder' });
  return g;
}

export function buildBales(count = 5): THREE.Group {
  const g = group('bales');
  const r = rng(61);
  const m = std({ color: 0xd7bd78, map: tiled(strawMap(), 1, 1), roughness: 1 });
  const cord = std({ color: 0x6a4a2a, roughness: 1 });
  const stack = [
    [0, 0, 0],
    [0.5, 0, 0.1],
    [1.0, 0, 0],
    [0.25, 0.37, 0.05],
    [0.75, 0.37, 0.05],
  ] as const;
  for (let i = 0; i < count; i++) {
    const [x, y, z] = stack[i]!;
    g.add(mesh(softBox(x, y + 0.18 + 0.002, z, 0.48, 0.36, 0.9, 0.03), m));
    for (const dz of [-0.2, 0.2])
      g.add(mesh(boxAt(x - 0.245, y + 0.0, z + dz - 0.01, x + 0.245, y + 0.37, z + dz + 0.01), cord));
    void r;
  }
  mergeStatic(g, { name: 'bales' });
  return g;
}

export function buildPallets(): THREE.Group {
  const g = group('pallets');
  const w = wood(0x9c8058);
  for (let k = 0; k < 4; k++) {
    const parts: THREE.BufferGeometry[] = [];
    for (const z of [-0.5, 0, 0.5]) parts.push(boxAt(-0.6, 0.0 + k * 0.14, z - 0.05, 0.6, 0.04 + k * 0.14, z + 0.05));
    for (let i = 0; i < 5; i++)
      parts.push(boxAt(-0.6 + i * 0.3, 0.04 + k * 0.14, -0.55, -0.6 + i * 0.3 + 0.06, 0.08 + k * 0.14, 0.55));
    g.add(mesh(joined(parts), w));
  }
  mergeStatic(g, { name: 'pallets' });
  return g;
}

/** A tractor tyre, flat on the ground, a few more by a wall: lived-in. */
export function buildTyres(): THREE.Group {
  const g = group('tyres');
  for (let k = 0; k < 3; k++)
    g.add(mesh(new THREE.TorusGeometry(0.4, 0.14, 10, 24).rotateX(Math.PI / 2), rubber(), [0, 0.14 + k * 0.28, 0]));
  mergeStatic(g, { name: 'tyres' });
  return g;
}

void hotCasing;
