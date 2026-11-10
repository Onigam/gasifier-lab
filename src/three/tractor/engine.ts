import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { TAU, boxAt, cylZ, joined, softBox, stick, tubeGeometry, v3 } from '../common';
import { BODY, ENGINE, MIXER } from '../dims';
import { dynamic, mergeStatic } from '../merge';
import {
  blackPaint,
  bright,
  brassMat,
  castIron,
  darkSteel,
  engineBlock,
  greyPaint,
  hose,
  rubber,
  steel,
  zincMat,
} from '../materials';
import { port, type Port } from '../train/pipes';

// What is under the bonnet, and the exhaust that leaves through it. The engine is a Perkins six-cylinder diesel (K2). The injection pump, its heat shield and the extra governor are the changes the Institute made to it (K7). Frame T.

const part = (id: string): THREE.Group => {
  const g = group(id);
  g.userData.partId = id;
  return g;
};

export interface EnginePiece {
  engine: THREE.Group;
  /** The fan, the pulleys and belts: turn fast, each with a blur disc. */
  fan: THREE.Group;
  fanBlur: THREE.Mesh;
  pulleys: THREE.Group[];
  /** The point where the mixer's flange sits on the intake: in T. */
  intakeAt: THREE.Vector3;
}

export function buildEngine(): EnginePiece {
  const engine = part('diesel-engine');
  const b = ENGINE.block;
  const B = engineBlock();
  // block, head, rocker cover with its bolts, sump with its ribs
  engine.add(mesh(softBox((b.x0 + b.x1) / 2, (b.y0 + 1.14) / 2, 0, b.x1 - b.x0, 1.14 - b.y0, 2 * b.halfW, 0.02), B));
  engine.add(mesh(softBox((b.x0 + b.x1) / 2, 1.22, 0, b.x1 - b.x0 - 0.04, 0.16, 2 * b.halfW - 0.02, 0.015), B));
  engine.add(mesh(softBox((b.x0 + b.x1) / 2, 1.34, 0, b.x1 - b.x0 - 0.1, 0.08, 0.34, 0.02), greyPaint()));
  const cb: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 8; k++) {
    const x = b.x0 + 0.08 + (k * (b.x1 - b.x0 - 0.16)) / 7;
    for (const s of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.01, 0.01, 0.008, 6);
      g.translate(x, 1.384, s * 0.14);
      cb.push(g);
    }
  }
  engine.add(mesh(joined(cb), steel()));
  engine.add(
    mesh(
      softBox(
        (b.x0 + b.x1) / 2 + 0.03,
        (ENGINE.sump.y0 + ENGINE.sump.y1) / 2,
        0,
        b.x1 - b.x0 - 0.2,
        ENGINE.sump.y1 - ENGINE.sump.y0,
        0.42,
        0.03,
      ),
      castIron(),
    ),
  );
  const ribs: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 7; k++) {
    const x = b.x0 + 0.15 + k * 0.1;
    ribs.push(boxAt(x - 0.006, ENGINE.sump.y0 + 0.02, -0.215, x + 0.006, ENGINE.sump.y1 - 0.02, 0.215));
  }
  engine.add(mesh(joined(ribs), castIron()));
  // the manifolds: intake on the left, exhaust on the right, cast and rusty
  engine.add(mesh(softBox((b.x0 + b.x1) / 2, 1.1, -b.halfW - 0.045, 0.72, 0.1, 0.09, 0.03), castIron()));
  engine.add(
    mesh(
      softBox((b.x0 + b.x1) / 2, 1.16, b.halfW + 0.05, 0.8, 0.09, 0.1, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x5a3f31, roughness: 0.9, metalness: 0.4 }),
    ),
  );
  // the riser from the left manifold up to the mixer, through the bonnet's top
  const at = v3(MIXER.at.x, MIXER.at.y, MIXER.at.z);
  const riser = tubeGeometry(
    [
      v3(at.x, 1.1, -b.halfW - 0.045),
      v3(at.x, 1.3, -b.halfW - 0.045),
      v3(at.x, 1.44, at.z - 0.02),
      v3(at.x, at.y - 0.02, at.z),
    ],
    0.045,
    24,
    14,
  );
  engine.add(mesh(riser, castIron()));
  // oil filter and starter on the right and left, alternator on the front left
  const filt = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 22);
  engine.add(mesh(filt, greyPaint(), [2.45, 0.95, b.halfW + 0.07]));
  const starter = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 22);
  starter.rotateX(Math.PI / 2);
  engine.add(mesh(starter, blackPaint(), [2.03, 0.78, -0.3]));
  const alt = new THREE.CylinderGeometry(0.065, 0.065, 0.14, 22);
  alt.rotateX(Math.PI / 2);
  engine.add(mesh(alt, darkSteel(), [2.94, 0.92, -0.27]));
  // the radiator core, ahead of the fan
  engine.add(mesh(softBox(3.095, 1.12, 0, 0.07, 0.62, 0.62, 0.01), blackPaint()));
  engine.add(mesh(softBox(3.11, 1.12, 0, 0.012, 0.64, 0.64, 0.006), darkSteel()));
  engine.add(mesh(softBox(3.09, 1.44, 0, 0.1, 0.1, 0.5, 0.02), castIron()));
  // engine mounts, dipstick, a few lines
  for (const s of [-1, 1]) engine.add(mesh(softBox(2.2, 0.66, s * 0.26, 0.12, 0.06, 0.06, 0.01), darkSteel()));
  engine.add(mesh(stick(v3(2.7, 1.2, 0.2), v3(2.72, 1.5, 0.22), 0.004, 6), steel()));

  // fan and pulleys at the front of the block: they turn with the engine, fast
  const fan = dynamic(group('fan'));
  fan.position.set(ENGINE.fan.x, ENGINE.fan.y, 0);
  const blades: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    const bl = new THREE.BoxGeometry(0.01, ENGINE.fan.R - 0.04, 0.09);
    bl.translate(0, (ENGINE.fan.R - 0.04) / 2 + 0.04, 0);
    bl.rotateX(0.35);
    bl.rotateZ(0);
    // blade in the YZ plane turned about X (the axis is X, the fan faces forward)
    bl.rotateX(a);
    blades.push(bl);
  }
  const hub = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 20);
  hub.rotateZ(Math.PI / 2);
  fan.add(mesh(joined(blades), blackPaint()));
  fan.add(mesh(hub, darkSteel()));
  engine.add(fan);
  const fanBlur = dynamic(
    new THREE.Mesh(
      new THREE.CircleGeometry(ENGINE.fan.R, 36),
      new THREE.MeshBasicMaterial({
        color: 0x9aa0a4,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    ),
  );
  fanBlur.rotation.y = Math.PI / 2;
  fanBlur.position.set(ENGINE.fan.x + 0.04, ENGINE.fan.y, 0);
  fanBlur.castShadow = false;
  fanBlur.userData.noShadow = true;
  engine.add(fanBlur);
  // the crank pulley below the fan, the alternator's, and the belts: V-belts on pulleys, flat loops
  const pulleys: THREE.Group[] = [];
  const mkPulley = (x: number, y: number, z: number, r: number): THREE.Group => {
    const p = dynamic(group('pulley'));
    p.position.set(x, y, z);
    const disc = new THREE.CylinderGeometry(r, r, 0.03, 24);
    disc.rotateZ(Math.PI / 2);
    p.add(mesh(disc, darkSteel()));
    const groove = new THREE.TorusGeometry(r, 0.004, 6, 24);
    groove.rotateY(Math.PI / 2);
    p.add(mesh(groove, steel()));
    const key = new THREE.BoxGeometry(0.032, r * 0.9, 0.012);
    key.translate(0, r * 0.45, 0);
    p.add(mesh(key, steel()));
    engine.add(p);
    pulleys.push(p);
    return p;
  };
  const px = ENGINE.fan.x - 0.02;
  mkPulley(px, 0.8, 0, 0.09);
  mkPulley(px, 0.92, -0.27, 0.04);
  mkPulley(px, ENGINE.fan.y + 0.0, 0.0, 0.05);
  const belt = (a: THREE.Vector3, ra: number, c: THREE.Vector3, rc: number): void => {
    const d = c.clone().sub(a);
    const l = d.length();
    const ang = Math.atan2(d.z, d.y);
    const shape = new THREE.Shape();
    shape.moveTo(-l / 2, -ra);
    shape.lineTo(l / 2, -rc);
    shape.lineTo(l / 2, rc);
    shape.lineTo(-l / 2, ra);
    shape.closePath();
    void ang;
    const g = new THREE.BoxGeometry(0.016, 0.012, l);
    const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 0, 1), d.clone().normalize());
    g.applyQuaternion(q);
    const m = a.clone().add(c).multiplyScalar(0.5);
    g.translate(m.x, m.y, m.z);
    engine.add(mesh(g, rubber()));
  };
  belt(v3(px, 0.8 + 0.09, 0), 0.09, v3(px, 0.92 + 0.04, -0.27), 0.04);
  belt(v3(px, 0.8 - 0.09, 0), 0.09, v3(px, 0.92 - 0.04, -0.27), 0.04);
  belt(v3(px, 0.8 + 0.09, 0), 0.09, v3(px, ENGINE.fan.y + 0.05, 0), 0.05);
  belt(v3(px, 0.8 - 0.09, 0), 0.09, v3(px, ENGINE.fan.y - 0.05, 0), 0.05);
  void BODY;
  mergeStatic(engine, { name: engine.name });
  return { engine, fan, fanBlur, pulleys, intakeAt: at };
}

// ============================================================================================= the injection pump and its filter

/** The injection pump, local frame: origin at the middle of its body, axis along x. A pump of the day on the engine's left side, a feed pump, a governor housing at the front, six delivery lines up to the injectors. */
export function buildPump(): { group: THREE.Group } {
  const g = part('injection-pump');
  const body = new THREE.CylinderGeometry(0.055, 0.055, 0.3, 24);
  body.rotateZ(Math.PI / 2);
  g.add(mesh(body, engineBlock()));
  g.add(mesh(softBox(0.19, 0, 0, 0.1, 0.13, 0.12, 0.02), castIron()));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16), brassMat(), [-0.08, 0.075, 0]));
  // the feed pump on the side, with its lever and a primer
  const feed = new THREE.CylinderGeometry(0.035, 0.035, 0.07, 18);
  feed.rotateX(Math.PI / 2);
  g.add(mesh(feed, castIron(), [-0.05, -0.02, -0.08]));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 10), bright(), [-0.05, 0.02, -0.1]));
  // six delivery valves on the top and their lines
  const lines: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) {
    const x = -0.13 + k * 0.05;
    g.add(mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.03, 8), brassMat(), [x, 0.065, 0]));
    const pts = [
      v3(x, 0.08, 0),
      v3(x, 0.14, 0.04 + k * 0.004),
      v3(x * 0.4 + 0.2 - 0.12, 0.2, 0.1 + k * 0.005),
      v3(x - 0.1 + 0.38 * (k - 2.5) * 0.15, 0.26, 0.17),
    ];
    lines.push(tubeGeometry(pts, 0.0035, 18, 6));
  }
  g.add(mesh(joined(lines), steel()));
  // the fuel filter beside it
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 22), greyPaint(), [0.4, 0.0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 22), darkSteel(), [0.4, 0.11, 0]));
  g.add(mesh(stick(v3(0.15, 0.04, 0), v3(0.4, 0.1, 0), 0.006, 6), hose()));
  g.add(mesh(softBox(0.2, -0.085, 0, 0.5, 0.03, 0.12, 0.006), darkSteel()));
  mergeStatic(g, { name: g.name });
  return { group: g };
}

// ============================================================================================= the heat shield

/** The heat shield, local frame: origin at the middle of its plate, which faces ±z. A sheet with its edges turned and four standoffs to the bonnet. 0.8 wide, 0.55 high: estimates. */
export function buildShield(): { group: THREE.Group; w: number; h: number } {
  const g = part('heat-shield');
  const w = 0.8;
  const h = 0.55;
  g.add(mesh(softBox(0, 0, 0, w, h, 0.003, 0.002), zincMat()));
  // the turned edges and two ribs
  const e: THREE.BufferGeometry[] = [];
  e.push(boxAt(-w / 2, h / 2 - 0.012, 0, w / 2, h / 2, 0.016));
  e.push(boxAt(-w / 2, -h / 2, 0, w / 2, -h / 2 + 0.012, 0.016));
  e.push(boxAt(-w / 2, -h / 2, 0, -w / 2 + 0.012, h / 2, 0.016));
  e.push(boxAt(w / 2 - 0.012, -h / 2, 0, w / 2, h / 2, 0.016));
  for (const x of [-0.15, 0.15]) e.push(boxAt(x - 0.008, -h / 2 + 0.02, 0, x + 0.008, h / 2 - 0.02, 0.006));
  g.add(mesh(joined(e), zincMat()));
  // standoffs towards +z (the bonnet's side): four posts with a nut
  const posts: THREE.BufferGeometry[] = [];
  for (const x of [-0.3, 0.3])
    for (const y of [-0.2, 0.2]) {
      posts.push(cylZ(0.0, 0.03, 0.007, 10));
      posts[posts.length - 1]!.translate(x, y, 0);
      const nut = new THREE.CylinderGeometry(0.011, 0.011, 0.008, 6);
      nut.rotateX(Math.PI / 2);
      nut.translate(x, y, -0.006);
      posts.push(nut);
    }
  g.add(mesh(joined(posts), steel()));
  mergeStatic(g, { name: g.name });
  return { group: g, w, h };
}

// ============================================================================================= the extra governor

export interface GovernorPiece {
  group: THREE.Group;
  /** The belt's pulley on the governor, and its blur disc. */
  spin: THREE.Group;
  blur: THREE.Mesh;
  /** The rod's two ends: at the governor's lever and at the end that goes to the gas throttle's lever. */
  lever: THREE.Vector3;
}

/** The extra governor, local frame: origin at its shaft on the front face, axis along x (its pulley faces forward). A flyweight governor on a V-belt from the fan shaft, a lever and a rod to the gas throttle. */
export function buildGovernor(): GovernorPiece {
  const g = part('extra-governor');
  const body = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 22);
  body.rotateZ(Math.PI / 2);
  g.add(mesh(body, greyPaint(), [-0.06, 0, 0]));
  g.add(mesh(softBox(-0.12, 0, 0, 0.08, 0.1, 0.1, 0.01), castIron()));
  const spin = dynamic(group('governor-pulley'));
  spin.position.set(0.02, 0, 0);
  const disc = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 22);
  disc.rotateZ(Math.PI / 2);
  spin.add(mesh(disc, darkSteel()));
  const groove = new THREE.TorusGeometry(0.04, 0.0035, 6, 22);
  groove.rotateY(Math.PI / 2);
  spin.add(mesh(groove, steel()));
  const key = new THREE.BoxGeometry(0.032, 0.036, 0.01);
  key.translate(0, 0.018, 0);
  spin.add(mesh(key, steel()));
  g.add(spin);
  const blur = dynamic(
    new THREE.Mesh(
      new THREE.CircleGeometry(0.043, 24),
      new THREE.MeshBasicMaterial({
        color: 0x9aa0a4,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    ),
  );
  blur.rotation.y = Math.PI / 2;
  blur.position.set(0.037, 0, 0);
  blur.castShadow = false;
  blur.userData.noShadow = true;
  g.add(blur);
  // the lever on the top and the clevis of the rod
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), bright(), [-0.06, 0.07, 0]));
  g.add(mesh(softBox(-0.06, 0.105, 0.04, 0.012, 0.012, 0.09, 0.002), redLever()));
  g.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.018, 8), brassMat(), [-0.06, 0.105, 0.085]));
  mergeStatic(g, { name: g.name });
  return { group: g, spin, blur, lever: v3(-0.06, 0.105, 0.085) };
}

function redLever(): THREE.Material {
  return new THREE.MeshStandardMaterial({ color: 0xa2302a, roughness: 0.55 });
}

// ============================================================================================= the exhaust

export interface ExhaustPiece {
  group: THREE.Group;
  /** The flap on the top that the exhaust lifts. */
  flap: THREE.Group;
  /** The top of the pipe, where the plume starts, in the piece's frame. */
  mouth: THREE.Vector3;
  ports: { manifold: Port };
}

/** The exhaust pipe, local frame: origin at the manifold flange's face, straight up. A tapered pipe with a hinged rain flap, a clamp and a stay. */
export function buildExhaust(height = 1.1): ExhaustPiece {
  const g = part('exhaust-pipe');
  const r = 0.0375;
  g.add(mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.012, 24), castIron(), [0, 0.006, 0]));
  const pts = [v3(0, 0.012, 0), v3(0, height, 0)];
  void pts;
  g.add(
    mesh(
      new THREE.CylinderGeometry(r, r, height, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x4d4440, roughness: 0.85, metalness: 0.5, side: THREE.DoubleSide }),
      [0, height / 2 + 0.006, 0],
    ),
  );
  // rust bands and a clamp
  g.add(mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.04, 20), darkSteel(), [0, 0.35, 0]));
  g.add(mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.04, 20), darkSteel(), [0, 0.75, 0]));
  // the mouth: a collar, a hinge, and the flap
  g.add(mesh(new THREE.CylinderGeometry(r + 0.006, r + 0.006, 0.02, 20), darkSteel(), [0, height + 0.006, 0]));
  const flap = dynamic(group('flap'));
  flap.position.set(-r, height + 0.018, 0);
  const lid = new THREE.CylinderGeometry(r + 0.008, r + 0.008, 0.005, 20);
  lid.translate(r, 0.0, 0);
  flap.add(mesh(lid, darkSteel()));
  flap.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 8).rotateX(Math.PI / 2), bright(), [0, 0, 0]));
  g.add(flap);
  mergeStatic(g, { name: g.name });
  return { group: g, flap, mouth: v3(0, height + 0.02, 0), ports: { manifold: port(0, 0, 0, 0, -1, 0, r) } };
}
