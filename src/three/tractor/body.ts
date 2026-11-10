import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { TAU, boxAt, cylX, cylZ, joined, latheCrisp, softBox, stick, tubeGeometry, v3 } from '../common';
import { BODY, ENGINE, TRACTOR, UNIT_AT } from '../dims';
import { mergeStatic } from '../merge';
import {
  blackPaint,
  bright,
  cabGlass,
  castIron,
  darkSteel,
  greyPaint,
  lampGlass,
  redPaint,
  redSheet,
  rubber,
  steel,
  zincMat,
  paint,
  hose,
} from '../materials';
import { frontWheel, rearWheel, type Wheel } from './wheels';

// The tractor's body: the castings that are its frame, the platform, the fenders, the bonnet, the front end, the cab and its rack. A 1968 Massey Ferguson 1100 in red and grey, nothing of its maker's name on it (research §7). Dimensions from
// `dims.ts` (TRACTOR, BODY: the base tractor's are third party, S10; the rest are estimates from the photograph of Fig. 3.9). Frame T: ground under the rear axle, x forward, y up, z right.

export interface Body {
  chassis: THREE.Group;
  /** The bonnet and the grille: a shell over the engine. Not a part of its own: it follows `diesel-engine`, and goes to the ghost in X-ray and when things come apart. */
  bonnet: THREE.Group;
  cab: THREE.Group;
  rack: THREE.Group;
  headlights: THREE.Group;
  rear: THREE.Group;
  front: THREE.Group;
  wheels: { rear: Wheel[]; front: Wheel[] };
}

const T = TRACTOR;

/** A slab with rounded edges from its two corners. */
const slab = (
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  r = 0.012,
): THREE.BufferGeometry =>
  softBox((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), r);

/** A hex bolt head on its side or end. */
const bolt = (x: number, y: number, z: number, r = 0.01, axis: 'x' | 'y' | 'z' = 'y'): THREE.BufferGeometry => {
  const g = new THREE.CylinderGeometry(r, r, r * 0.8, 6);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
};

export function buildBody(): Body {
  // ============================================================================================= chassis
  const bonnet = group('bonnet');
  const chassis = group('tractor-chassis');
  chassis.userData.partId = 'tractor-chassis';
  {
    const R = redPaint();
    const G = greyPaint();
    const C = castIron();

    // the castings: final drive, gearbox, clutch housing, front bolster (a unit-construction tractor: no frame)
    const rh = BODY.rearHousing;
    chassis.add(mesh(slab(rh.x0, rh.y0, -rh.halfW, rh.x1, rh.y1, rh.halfW, 0.07), C));
    const gb = BODY.gearbox;
    chassis.add(mesh(slab(gb.x0, gb.y0, -gb.halfW, gb.x1, gb.y1, gb.halfW, 0.05), C));
    const ch = ENGINE.clutchHousing;
    chassis.add(mesh(slab(ch.x0, ch.y0, -0.24, ch.x1, ch.y1, 0.24, 0.05), C));
    const bo = BODY.bolster;
    chassis.add(mesh(slab(bo.x0, bo.y0, -bo.halfW, bo.x1, bo.y1, bo.halfW, 0.04), C));
    // axle tubes to the hubs
    const hubZ = T.rear.tread / 2 - 0.1;
    for (const s of [-1, 1]) {
      const g = cylZ(s * 0.58, s * hubZ, 0.08, 24);
      g.translate(0, T.rear.R, 0);
      chassis.add(mesh(g, C));
      const cap = cylZ(s * (hubZ - 0.02), s * (hubZ + 0.05), 0.095, 24);
      cap.translate(0, T.rear.R, 0);
      chassis.add(mesh(cap, C));
    }
    // front axle: the beam, the king-pin housings and the stub axles
    const beam = slab(T.front.x - 0.07, 0.44, -T.front.tread / 2, T.front.x + 0.07, 0.56, T.front.tread / 2, 0.03);
    chassis.add(mesh(beam, C));
    for (const s of [-1, 1]) {
      const kp = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 18);
      kp.translate(T.front.x, T.front.R, s * (T.front.tread / 2 - 0.1));
      chassis.add(mesh(kp, C));
      const arm = stick(
        v3(T.front.x, 0.46, s * (T.front.tread / 2 - 0.1)),
        v3(T.front.x - 0.28, 0.5, s * 0.45),
        0.014,
        8,
      );
      chassis.add(mesh(arm, steel()));
    }

    // the platform and its two steps; the deck is wider than the cab where the fenders stand
    chassis.add(mesh(slab(-0.3, 1.238, -0.82, 1.2, 1.25, 0.82, 0.004), G));
    for (const s of [-1, 1]) {
      chassis.add(mesh(slab(0.98, 0.92, s * 0.76, 1.3, 0.932, s * 1.02, 0.004), G));
      chassis.add(mesh(slab(1.03, 0.82, s * 0.3, 1.09, 0.93, s * 0.78, 0.01), C));
      chassis.add(mesh(slab(1.19, 0.82, s * 0.3, 1.25, 0.93, s * 0.78, 0.01), C));
    }

    // fenders: an arc over each rear wheel, a lip on its edge
    for (const s of [-1, 1]) {
      const rr = T.rear.R + 0.06;
      const arc = new THREE.CylinderGeometry(rr, rr, 0.6, 56, 1, true, Math.PI - 1.9, 3.8);
      arc.rotateX(Math.PI / 2);
      arc.translate(0, T.rear.R, s * T.rear.tread * 0.5);
      chassis.add(mesh(arc, redSheet()));
      for (const e of [-1, 1]) {
        const lip = new THREE.TorusGeometry(rr, 0.008, 8, 56, 3.8);
        lip.rotateZ(Math.PI / 2 - 1.9 + 0.0);
        lip.translate(0, T.rear.R, s * T.rear.tread * 0.5 + e * 0.3);
        chassis.add(mesh(lip, R));
      }
      // the stay from the fender to the axle housing
      chassis.add(mesh(stick(v3(0.1, 1.78, s * 0.84), v3(0.1, 1.3, s * 0.6), 0.016, 8), steel()));
    }

    // bonnet: a rounded box, with its top a little domed, and the grille and radiator at its front
    const bn = BODY.bonnet;
    bonnet.add(mesh(slab(bn.x0, bn.y0, -bn.halfW, bn.x1 - 0.06, bn.top, bn.halfW, 0.08), R));
    bonnet.add(
      mesh(slab(bn.x0 + 0.1, bn.top - 0.015, -bn.halfW + 0.07, bn.x1 - 0.15, bn.top + 0.012, bn.halfW - 0.07, 0.03), R),
    );
    // the cowl between the bonnet and the cab, with the instrument panel
    chassis.add(mesh(slab(1.12, 1.25, -0.36, 1.26, 1.62, 0.36, 0.03), R));
    chassis.add(mesh(slab(1.06, 1.48, -0.22, 1.14, 1.62, 0.22, 0.01), blackPaint()));
    // grille: a frame and its slats
    const gx = BODY.grilleX;
    bonnet.add(mesh(slab(gx - 0.1, 0.96, -0.36, gx + 0.05, 1.5, 0.36, 0.03), G));
    const slats: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 15; k++) {
      const z = -0.3 + (k * 0.6) / 14;
      slats.push(boxAt(gx + 0.045, 1.0, z - 0.008, gx + 0.065, 1.46, z + 0.008));
    }
    bonnet.add(mesh(joined(slats), blackPaint()));
    bonnet.add(mesh(slab(gx + 0.04, 0.96, -0.36, gx + 0.07, 1.5, -0.33, 0.005), G));
    bonnet.add(mesh(slab(gx + 0.04, 0.96, 0.33, gx + 0.07, 1.5, 0.36, 0.005), G));
    // the plates where the head lamps were: moved to the roof (K7)
    for (const s of [-1, 1]) {
      const cover = new THREE.CylinderGeometry(0.075, 0.075, 0.012, 22);
      cover.rotateZ(Math.PI / 2);
      cover.translate(gx - 0.08, 1.38, s * 0.22);
      cover.rotateY(0);
      bonnet.add(mesh(cover, G));
    }
    // a skid plate, a towing eye at the front
    chassis.add(mesh(slab(gx - 0.16, 0.58, -0.3, gx + 0.04, 0.9, 0.3, 0.02), C));
    // the cab's floor pan and the front toe board
    chassis.add(mesh(slab(1.19, 1.0, -0.4, 1.23, 1.28, 0.4, 0.01), G));

    // steering column, wheel, seat, a few levers
    const col = stick(v3(1.1, 1.52, 0), v3(BODY.steeringWheel.x + 0.02, BODY.steeringWheel.y - 0.04, 0), 0.022, 12);
    chassis.add(mesh(col, blackPaint()));
    const wheelRim = new THREE.TorusGeometry(BODY.steeringWheel.R, 0.014, 10, 36);
    wheelRim.rotateY(Math.PI / 2);
    wheelRim.rotateZ(-0.42);
    wheelRim.translate(BODY.steeringWheel.x, BODY.steeringWheel.y, 0);
    chassis.add(mesh(wheelRim, blackPaint()));
    const spokes: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU + Math.PI / 2;
      const sp = new THREE.BoxGeometry(0.012, BODY.steeringWheel.R, 0.014);
      sp.translate(0, BODY.steeringWheel.R / 2, 0);
      sp.rotateX(a);
      sp.rotateZ(-0.42);
      sp.translate(BODY.steeringWheel.x, BODY.steeringWheel.y, 0);
      spokes.push(sp);
    }
    chassis.add(mesh(joined(spokes), blackPaint()));
    // the seat: pan, back, a spring post
    const s0 = BODY.seat;
    chassis.add(mesh(slab(s0.x - 0.22, s0.y, -0.22, s0.x + 0.22, s0.y + 0.07, 0.22, 0.03), blackPaint()));
    const back = slab(-0.05, 0, -0.21, 0.02, 0.5, 0.21, 0.03);
    back.rotateZ(0.16);
    back.translate(s0.x - 0.22, s0.y + 0.07, 0);
    chassis.add(mesh(back, blackPaint()));
    chassis.add(mesh(cylZ(-0.1, 0.1, 0.01, 8), steel(), [s0.x, s0.y - 0.15, 0]));
    chassis.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 10), steel(), [s0.x - 0.04, s0.y - 0.1, 0]));
    chassis.add(mesh(slab(s0.x - 0.18, 1.25, -0.2, s0.x + 0.2, s0.y - 0.06, 0.2, 0.01), G));
    // levers on the gearbox cover, and the pedals
    for (const [x, z, a] of [
      [0.88, 0.22, 0.2],
      [0.8, 0.3, -0.25],
      [0.95, -0.28, 0.15],
    ] as const) {
      const lv = new THREE.CylinderGeometry(0.008, 0.01, 0.36, 8);
      lv.translate(0, 0.18, 0);
      lv.rotateZ(a);
      lv.translate(x, 1.25, z);
      chassis.add(mesh(lv, steel()));
      const kn = new THREE.SphereGeometry(0.022, 12, 8);
      kn.translate(x - Math.sin(a) * 0.36, 1.25 + Math.cos(a) * 0.36, z);
      chassis.add(mesh(kn, blackPaint()));
    }
    for (const z of [-0.17, -0.1, 0.12]) {
      const p = slab(1.02, 1.27, z - 0.03, 1.14, 1.3, z + 0.03, 0.006);
      p.rotateZ(0.0);
      chassis.add(mesh(p, blackPaint()));
      chassis.add(mesh(stick(v3(1.2, 1.4, z), v3(1.08, 1.28, z), 0.007, 6), steel()));
    }

    // the hitch: a drawbar and its pin at the back, the lower links and the top link of the three-point linkage
    chassis.add(mesh(slab(-0.9, 0.48, -0.06, -0.3, 0.54, 0.06, 0.008), C));
    chassis.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 10), bright(), [-0.84, 0.54, 0]));
    for (const s of [-1, 1]) {
      chassis.add(mesh(stick(v3(-0.32, 0.62, s * 0.42), v3(-0.84, 0.52, s * 0.62), 0.024, 10), C));
      const ball = new THREE.SphereGeometry(0.036, 12, 8);
      ball.translate(-0.84, 0.52, s * 0.62);
      chassis.add(mesh(ball, bright()));
      chassis.add(mesh(stick(v3(-0.08, 1.46, s * 0.5), v3(-0.12, 0.78, s * 0.56), 0.012, 6), steel()));
      chassis.add(mesh(stick(v3(0.05, 1.32, s * 0.42), v3(0.05, 1.46, s * 0.5), 0.02, 8), C));
    }
    chassis.add(mesh(stick(v3(-0.32, 1.3, 0), v3(-0.72, 1.18, 0), 0.018, 8), C));
    chassis.add(mesh(slab(-0.4, 1.3, -0.1, -0.28, 1.42, 0.1, 0.01), C));

    // bolts on the castings' joints
    const bolts: THREE.BufferGeometry[] = [];
    for (const z of [-0.2, 0.2]) for (const y of [0.7, 1.1]) bolts.push(bolt(1.625, y, z, 0.012, 'x'));
    for (const z of [-0.2, 0.2]) for (const y of [0.7, 1.1]) bolts.push(bolt(0.552, y, z * 1.4, 0.012, 'x'));
    chassis.add(mesh(joined(bolts), darkSteel()));
  }

  // ============================================================================================= cab
  const cab = group('cab');
  cab.userData.partId = 'cab';
  {
    const R = redPaint();
    const G = greyPaint();
    const c = BODY.cab;
    const y0 = BODY.floorY;
    // corner and door posts
    const posts: THREE.BufferGeometry[] = [];
    for (const x of [c.x0 + 0.04, c.x1 - 0.04, 0.45]) {
      for (const s of [-1, 1])
        posts.push(
          boxAt(x - 0.035, y0, s * (c.halfW - 0.035) - 0.035, x + 0.035, c.top - 0.05, s * (c.halfW - 0.035) + 0.035),
        );
    }
    cab.add(mesh(joined(posts), R));
    // roof, with its overhang, and the lip at the front
    cab.add(mesh(slab(c.x0 - 0.08, c.top - 0.06, -c.halfW - 0.07, c.x1 + 0.1, c.top, c.halfW + 0.07, 0.025), G));
    // lower panels and the waist rail
    const waist = 1.62;
    for (const s of [-1, 1])
      cab.add(mesh(slab(c.x0, y0, s * c.halfW - 0.006, c.x1, waist, s * c.halfW + 0.006, 0.004), R));
    cab.add(mesh(slab(c.x1 - 0.006, y0, -c.halfW, c.x1 + 0.006, waist, c.halfW, 0.004), R));
    cab.add(mesh(slab(c.x0 - 0.006, y0, -c.halfW, c.x0 + 0.006, waist, c.halfW, 0.004), R));
    const rails: THREE.BufferGeometry[] = [];
    for (const s of [-1, 1]) {
      rails.push(boxAt(c.x0, waist - 0.02, s * c.halfW - 0.02, c.x1, waist + 0.02, s * c.halfW + 0.02));
      rails.push(boxAt(c.x0, c.top - 0.1, s * c.halfW - 0.02, c.x1, c.top - 0.06, s * c.halfW + 0.02));
    }
    rails.push(boxAt(c.x1 - 0.02, waist - 0.02, -c.halfW, c.x1 + 0.02, waist + 0.02, c.halfW));
    rails.push(boxAt(c.x1 - 0.02, c.top - 0.1, -c.halfW, c.x1 + 0.02, c.top - 0.06, c.halfW));
    rails.push(boxAt(c.x0 - 0.02, waist - 0.02, -c.halfW, c.x0 + 0.02, waist + 0.02, c.halfW));
    rails.push(boxAt(c.x0 - 0.02, c.top - 0.1, -c.halfW, c.x0 + 0.02, c.top - 0.06, c.halfW));
    cab.add(mesh(joined(rails), R));
    // glass: front, sides in two panes either side of the door post, rear
    const gl = cabGlass();
    const gy0 = waist + 0.02;
    const gy1 = c.top - 0.1;
    cab.add(mesh(boxAt(c.x1 - 0.004, gy0, -c.halfW + 0.06, c.x1 + 0.004, gy1, c.halfW - 0.06), gl));
    cab.add(mesh(boxAt(c.x0 - 0.004, gy0, -c.halfW + 0.06, c.x0 + 0.004, gy1, c.halfW - 0.06), gl));
    for (const s of [-1, 1]) {
      cab.add(mesh(boxAt(c.x0 + 0.08, gy0, s * c.halfW - 0.004, 0.41, gy1, s * c.halfW + 0.004), gl));
      cab.add(mesh(boxAt(0.49, gy0, s * c.halfW - 0.004, c.x1 - 0.08, gy1, s * c.halfW + 0.004), gl));
      // door: the shut line, the handle, two hinges
      const dline: THREE.BufferGeometry[] = [];
      dline.push(boxAt(0.455, y0 + 0.02, s * c.halfW - 0.012, 0.465, c.top - 0.12, s * c.halfW + 0.012));
      dline.push(boxAt(c.x1 - 0.12, y0 + 0.02, s * c.halfW - 0.012, c.x1 - 0.11, c.top - 0.12, s * c.halfW + 0.012));
      dline.push(boxAt(0.45, y0 + 0.02, s * c.halfW - 0.012, c.x1 - 0.11, y0 + 0.03, s * c.halfW + 0.012));
      cab.add(mesh(joined(dline), blackPaint()));
      cab.add(mesh(slab(0.52, 1.5, s * c.halfW + s * 0.004, 0.62, 1.53, s * c.halfW + s * 0.03, 0.006), bright()));
      for (const y of [1.45, 2.4])
        cab.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), blackPaint(), [c.x1 - 0.1, y, s * c.halfW]));
      // a mirror on its arm
      const arm = stick(v3(c.x1 - 0.2, 2.2, s * c.halfW), v3(c.x1 - 0.2, 2.2, s * (c.halfW + 0.2)), 0.008, 6);
      cab.add(mesh(arm, steel()));
      cab.add(
        mesh(
          slab(c.x1 - 0.22, 2.05, s * (c.halfW + 0.2) - 0.01, c.x1 - 0.18, 2.35, s * (c.halfW + 0.2) + 0.01, 0.01),
          blackPaint(),
        ),
      );
      cab.add(
        mesh(
          boxAt(
            c.x1 - 0.219,
            2.06,
            s * (c.halfW + 0.211) + (s > 0 ? 0 : -0.002),
            c.x1 - 0.181,
            2.34,
            s * (c.halfW + 0.211) + (s > 0 ? 0.002 : 0),
          ),
          bright(),
        ),
      );
    }
    // a wiper and its arm on the screen
    cab.add(mesh(stick(v3(c.x1 + 0.01, 1.68, -0.1), v3(c.x1 + 0.01, 2.2, -0.45), 0.006, 6), blackPaint()));
    // the roof's rain gutter
    for (const s of [-1, 1])
      cab.add(
        mesh(
          boxAt(
            c.x0 - 0.08,
            c.top - 0.07,
            s * (c.halfW + 0.07) - 0.01,
            c.x1 + 0.1,
            c.top - 0.04,
            s * (c.halfW + 0.07) + 0.01,
          ),
          G,
        ),
      );
  }

  // ============================================================================================= roof rack, with the shift's chips in sacks
  const rack = group('roof-rack');
  rack.userData.partId = 'roof-rack';
  {
    const c = BODY.cab;
    const top = c.top + 0.17;
    const x0 = c.x0 - 0.04;
    const x1 = c.x1 + 0.04;
    const z = c.halfW + 0.04;
    const tube = 0.013;
    const G = darkSteel();
    const parts: THREE.BufferGeometry[] = [];
    const rect = (y: number): void => {
      parts.push(stick(v3(x0, y, -z), v3(x1, y, -z), tube, 8));
      parts.push(stick(v3(x0, y, z), v3(x1, y, z), tube, 8));
      parts.push(stick(v3(x0, y, -z), v3(x0, y, z), tube, 8));
      parts.push(stick(v3(x1, y, -z), v3(x1, y, z), tube, 8));
    };
    rect(top);
    rect(top - 0.09);
    for (const x of [x0, (x0 + x1) / 2, x1])
      for (const s of [-1, 1]) parts.push(stick(v3(x, c.top, s * z), v3(x, top, s * z), tube, 8));
    for (const x of [-0.05, 0.3, 0.65, 1.0]) parts.push(stick(v3(x, top, -z), v3(x, top, z), tube * 0.8, 8));
    for (const s of [-0.38, 0, 0.38]) parts.push(stick(v3(x0, top, s * z), v3(x1, top, s * z), tube * 0.8, 8));
    // feet on the roof
    for (const x of [x0, (x0 + x1) / 2, x1])
      for (const s of [-1, 1]) parts.push(boxAt(x - 0.04, c.top, s * z - 0.04, x + 0.04, c.top + 0.012, s * z + 0.04));
    rack.add(mesh(joined(parts), G));
    // sacks of chips, bellied, tied with cord: three on the rack
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xa9906a, roughness: 1, metalness: 0 });
    const cord = new THREE.MeshStandardMaterial({ color: 0x4b3b2a, roughness: 1 });
    for (const [x, zz, w] of [
      [0.12, -0.38, 0.62],
      [0.12, 0.38, 0.62],
      [0.82, 0, 0.66],
    ] as const) {
      const sack = softBox(x, top + 0.085, zz, w, 0.15, 0.64, 0.07, 3);
      rack.add(mesh(sack, sackMat));
      const tie = stick(v3(x - w * 0.5, top + 0.15, zz - 0.2), v3(x + w * 0.5, top + 0.15, zz + 0.2), 0.004, 5);
      rack.add(mesh(tie, cord));
    }
    // two straps across the load
    for (const x of [0.0, 0.62])
      rack.add(
        mesh(tubeGeometry([v3(x, top + 0.17, -z), v3(x, top + 0.17, 0), v3(x, top + 0.17, z)], 0.006, 12, 5), cord),
      );
  }

  // ============================================================================================= roof headlights, and their cable
  const headlights = group('roof-headlights');
  headlights.userData.partId = 'roof-headlights';
  {
    const c = BODY.cab;
    const y = c.top + 0.08;
    const x = c.x1 + 0.12;
    for (const s of [-1, 1]) {
      const z = s * 0.5;
      const can = new THREE.CylinderGeometry(0.085, 0.07, 0.12, 24);
      can.rotateZ(-Math.PI / 2);
      headlights.add(mesh(can, blackPaint(), [x, y, z]));
      const lens = new THREE.CylinderGeometry(0.078, 0.078, 0.01, 24);
      lens.rotateZ(-Math.PI / 2);
      headlights.add(mesh(lens, lampGlass(), [x + 0.065, y, z]));
      const rim = new THREE.TorusGeometry(0.081, 0.006, 8, 24);
      rim.rotateY(Math.PI / 2);
      headlights.add(mesh(rim, bright(), [x + 0.062, y, z]));
      // bracket down to the roof, the cable down the cab's front pillar
      headlights.add(mesh(slab(x - 0.07, c.top - 0.04, z - 0.02, x - 0.02, y - 0.06, z + 0.02, 0.004), darkSteel()));
      const pts = [
        v3(x - 0.05, y - 0.05, z),
        v3(x - 0.04, c.top - 0.02, z * 0.9),
        v3(c.x1 + 0.03, c.top - 0.1, s * (c.halfW - 0.05)),
        v3(c.x1 + 0.03, 1.7, s * (c.halfW - 0.05)),
        v3(c.x1 - 0.05, 1.3, s * 0.3),
      ];
      headlights.add(mesh(tubeGeometry(pts, 0.005, 40, 5), hose()));
    }
  }

  // ============================================================================================= wheels
  const rearW = [rearWheel(-1), rearWheel(1)];
  const frontW = [frontWheel(-1), frontWheel(1)];
  const rear = group('rear-wheels');
  rear.userData.partId = 'rear-wheels';
  const front = group('front-wheels');
  front.userData.partId = 'front-wheels';
  for (const w of rearW) rear.add(w.root);
  for (const w of frontW) front.add(w.root);

  for (const g of [chassis, bonnet, cab, rack, headlights]) mergeStatic(g, { name: g.name });
  void zincMat;
  void rubber;
  void paint;
  void cylX;
  void latheCrisp;
  void UNIT_AT;
  return { chassis, bonnet, cab, rack, headlights, rear, front, wheels: { rear: rearW, front: frontW } };
}
