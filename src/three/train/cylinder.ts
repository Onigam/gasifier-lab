import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { HALF, TAU, boxAt, capPolygon, cylX, joined, latheCrisp, solidLathe, stick, tubeGeometry, v3 } from '../common';
import { ENGINE, PIPE } from '../dims';
import { dynamic, mergeStatic } from '../merge';
import {
  blackPaint,
  bright,
  brassMat,
  castIron,
  cutMetal,
  darkSteel,
  engineBlock,
  greyPaint,
  steel,
} from '../materials';
import { port, type Port } from './pipes';

// One cylinder of the engine, cut along the plane that holds the crank, the rod and both valves, the far half kept (as the unit's section is): `cylinder-cutaway`, with the pilot injector (`pilot-injector`) on its head. The crank turns, the piston and the
// valves follow it, and the charge changes colour through the four strokes: pale gas going in, squeezed, lit by the thread of diesel from the injector, burnt gas going out. It turns at a few per cent of the true speed (never above 1.4 turns a second): at 31
// turns a second the eye would see nothing. The bore and the stroke are the engine's (`ENGINE`), the rest estimates. Nothing printed: no timing, no ratio, no quantity of the pilot (R4).

const B = ENGINE.bore;
const rc = ENGINE.stroke / 2;
/** Connecting rod, centre to centre, and the piston's compression height: estimates. */
const ROD = 0.255;
const PIN_TO_CROWN = 0.062;
/** The gap between the crown at its top and the head's face: estimate. */
const CLEARANCE = 0.0085;
const Y_CROWN_TDC = rc + ROD + PIN_TO_CROWN;
const Y_HEAD = Y_CROWN_TDC + CLEARANCE;
const BLOCK_HALF = ENGINE.pitch / 2;

/** The height of the piston's pin when the crank is `phi` past the top, radians. */
export const pinHeight = (phi: number): number => rc * Math.cos(phi) + Math.sqrt(ROD * ROD - (rc * Math.sin(phi)) ** 2);

export interface CylinderPiece {
  /** Both parts in one group, for placing. */
  group: THREE.Group;
  /** The cylinder cut open: the part `cylinder-cutaway`. */
  cylinder: THREE.Group;
  /** The pilot injector on its head: the part `pilot-injector`. */
  injector: THREE.Group;
  ports: { intake: Port; exhaust: Port; fuelLine: Port };
  /** Set the cycle angle, 0..720 degrees from the top of the exhaust stroke; `lit` 0..1 how hard the gas burns; `on` whether the engine runs. */
  setCycle(theta: number, lit: number, on: boolean): void;
  /** The cycle angle at which the pilot's spray starts and ends, for the tests. */
  spray: [number, number];
  /** The pilot's tip, in the piece's own frame. */
  tip: THREE.Vector3;
}

export function buildCylinder(): CylinderPiece {
  const g = group('cylinder-cutaway');
  g.userData.partId = 'cylinder-cutaway';
  const inj = group('pilot-injector');
  inj.userData.partId = 'pilot-injector';
  const cutM = cutMetal();
  const blockM = engineBlock();
  const D = 0.1;

  // ---- the block around the bore: a half-slab with the bore as a notch, extruded up to the head face; and the crankcase below
  {
    const s = new THREE.Shape();
    s.moveTo(-BLOCK_HALF, 0);
    s.lineTo(-B / 2, 0);
    s.absarc(0, 0, B / 2, Math.PI, 0, true);
    s.lineTo(BLOCK_HALF, 0);
    s.lineTo(BLOCK_HALF, D);
    s.lineTo(-BLOCK_HALF, D);
    s.closePath();
    const y0 = 0.12;
    const slab = new THREE.ExtrudeGeometry(s, { depth: Y_HEAD - y0, bevelEnabled: false, curveSegments: 24 });
    // the shape lies in (x, z) of the half z ≥ 0: turn it so that its y becomes z and its depth runs down from the head's face
    slab.rotateX(Math.PI / 2);
    slab.translate(0, Y_HEAD, 0);
    slab.computeVertexNormals();
    g.add(mesh(slab, blockM));
    // the cut faces of the two walls (the slab's own faces at z = 0 are cut metal)
    for (const sx of [-1, 1]) {
      const wall = new THREE.PlaneGeometry(BLOCK_HALF - B / 2, Y_HEAD - y0);
      wall.rotateY(Math.PI);
      wall.translate(sx * ((BLOCK_HALF + B / 2) / 2), (Y_HEAD + y0) / 2, -0.0005);
      g.add(mesh(wall, cutM));
    }
    // the crankcase: two side walls and a back wall, an oil sump under it
    const cx = 0.115;
    g.add(mesh(boxAt(-cx - 0.012, -0.12, 0, -cx, y0, D + 0.012), blockM));
    g.add(mesh(boxAt(cx, -0.12, 0, cx + 0.012, y0, D + 0.012), blockM));
    g.add(mesh(boxAt(-cx, -0.12, D, cx, y0, D + 0.012), blockM));
    for (const sx of [-1, 1]) {
      const c = new THREE.PlaneGeometry(0.012, y0 + 0.12);
      c.rotateY(Math.PI);
      c.translate(sx * (cx + 0.006), (y0 - 0.12) / 2, -0.0005);
      g.add(mesh(c, cutM));
    }
    const sump = new THREE.Shape();
    sump.moveTo(-cx - 0.012, 0);
    sump.lineTo(-cx - 0.012, -0.04);
    sump.lineTo(-cx + 0.03, -0.075);
    sump.lineTo(cx - 0.03, -0.075);
    sump.lineTo(cx + 0.012, -0.04);
    sump.lineTo(cx + 0.012, 0);
    sump.closePath();
    const sg = new THREE.ExtrudeGeometry(sump, { depth: D + 0.012, bevelEnabled: false });
    sg.translate(0, -0.12, 0);
    g.add(mesh(sg, castIron()));
    // the oil: a pool in the sump, seen at the cut
    const oil = new THREE.PlaneGeometry(2 * cx - 0.05, 0.02);
    oil.rotateY(Math.PI);
    oil.translate(0, -0.14, -0.0004);
    g.add(
      mesh(oil, new THREE.MeshStandardMaterial({ color: 0xb88a2a, roughness: 0.2, transparent: true, opacity: 0.75 })),
    );
    // main bearing caps
    g.add(mesh(boxAt(-0.07, -0.085, D - 0.02, 0.07, -0.04, D + 0.012), darkSteel()));
  }

  // ---- the head: a half-slab over the bore, ports on each side, the rocker cover
  {
    const hh = 0.075;
    g.add(mesh(boxAt(-BLOCK_HALF, Y_HEAD, 0, BLOCK_HALF, Y_HEAD + hh, D), blockM));
    const hc = new THREE.PlaneGeometry(2 * BLOCK_HALF, hh);
    hc.rotateY(Math.PI);
    hc.translate(0, Y_HEAD + hh / 2, -0.0005);
    g.add(mesh(hc, cutM));
    // rocker cover and its bolts
    g.add(
      mesh(boxAt(-BLOCK_HALF + 0.01, Y_HEAD + hh, 0, BLOCK_HALF - 0.01, Y_HEAD + hh + 0.04, D - 0.01), greyPaint()),
    );
    const rc2 = new THREE.PlaneGeometry(2 * BLOCK_HALF - 0.02, 0.04);
    rc2.rotateY(Math.PI);
    rc2.translate(0, Y_HEAD + hh + 0.02, -0.0005);
    g.add(mesh(rc2, new THREE.MeshStandardMaterial({ color: 0x17171a, roughness: 0.9, side: THREE.DoubleSide })));
    // the intake port (−x) and exhaust port (+x): short pipes out of the head with flanges
    const py = Y_HEAD + 0.035;
    const inP = cylX(-BLOCK_HALF - 0.1, -BLOCK_HALF + 0.01, 0.025, true, 20, true);
    inP.translate(0, py, 0);
    g.add(mesh(inP, castIron()));
    const exP = cylX(BLOCK_HALF - 0.01, BLOCK_HALF + 0.1, 0.028, true, 20, true);
    exP.translate(0, py, 0);
    g.add(mesh(exP, castIron()));
    for (const [x0, x1, r] of [
      [-BLOCK_HALF - 0.1, -BLOCK_HALF - 0.09, 0.05],
      [BLOCK_HALF + 0.09, BLOCK_HALF + 0.1, 0.055],
    ] as const) {
      const f = cylX(x0, x1, r, true, 24);
      f.translate(0, py, 0);
      g.add(mesh(f, castIron()));
    }
    for (const sx of [-1, 1])
      for (const s of [-1, 1]) {
        const t = new THREE.PlaneGeometry(0.0008, 0.0008);
        void t;
        void s;
        void sx;
      }
    // the cut of the ports: strips at the pipe's walls
    for (const [x0, x1, r] of [
      [-BLOCK_HALF - 0.1, -BLOCK_HALF + 0.01, 0.025],
      [BLOCK_HALF - 0.01, BLOCK_HALF + 0.1, 0.028],
    ] as const) {
      for (const s of [-1, 1]) {
        const c = new THREE.PlaneGeometry(x1 - x0, 0.004);
        c.rotateY(Math.PI);
        c.translate((x0 + x1) / 2, py + s * r, -0.0005);
        g.add(mesh(c, cutM));
      }
    }
  }

  // ---- the liner shows its inner face; the gas, the valves, the piston, the crank are the moving parts
  const gas = dynamic(group('charge'));
  g.add(gas);
  const gasMat = new THREE.MeshBasicMaterial({
    color: 0x9fb4c2,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  {
    // the charge: a half cylinder from the crown to the head, unit height, scaled each frame; and its flat face at the cut
    const shell = new THREE.CylinderGeometry(B / 2 - 0.0008, B / 2 - 0.0008, 1, 28, 1, true, 0, Math.PI);
    shell.rotateY(-Math.PI / 2);
    shell.translate(0, 0.5, 0);
    const face = new THREE.PlaneGeometry(B - 0.0016, 1);
    face.rotateY(Math.PI);
    face.translate(0, 0.5, -0.0006);
    const m1 = new THREE.Mesh(shell, gasMat);
    const m2 = new THREE.Mesh(face, gasMat);
    for (const m of [m1, m2]) {
      m.castShadow = false;
      m.renderOrder = 7;
      gas.add(m);
    }
  }

  // valves: stems along y, heads at the face; intake on −x, exhaust on +x; half stems with their cuts
  const valves: { grp: THREE.Group; x: number }[] = [];
  const valveProfile: [number, number][] = [
    [0.0, 0.0],
    [0.019, 0.0],
    [0.019, 0.0035],
    [0.0065, 0.012],
    [0.0045, 0.02],
    [0.0045, 0.09],
    [0.0, 0.09],
  ];
  for (const sx of [-1, 1]) {
    const v = dynamic(group(sx < 0 ? 'intake-valve' : 'exhaust-valve'));
    const body = solidLathe(
      valveProfile.map(([r, y]) => [r, y] as [number, number]),
      18,
      HALF.phiStart,
      HALF.phiLength,
    );
    v.add(mesh(body, bright()));
    const capG = capPolygon(valveProfile);
    v.add(mesh(capG, cutM));
    // a spring round the stem, held by a collar and a retainer
    const coilPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * TAU * 7;
      const t = i / 60;
      // the coil is cut with the rest: only its far half, the wire's two cut ends meeting at the plane
      coilPts.push(v3(Math.cos(a) * 0.016, 0.03 + t * 0.045, Math.abs(Math.sin(a)) * 0.016 + 0.0035));
    }
    const coil = tubeGeometry(coilPts, 0.0018, 120, 6);
    const halfCoil = coil;
    v.add(mesh(halfCoil, steel()));
    v.add(
      mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.006, 12, 1, false, -Math.PI / 2, Math.PI),
        darkSteel(),
        [0, 0.085, 0],
      ),
    );
    v.position.set(sx * 0.027, Y_HEAD, 0);
    g.add(v);
    valves.push({ grp: v, x: sx });
  }
  // rockers: each presses its valve's stem down; the shaft they pivot on
  const rockers: THREE.Group[] = [];
  const shaftY = Y_HEAD + 0.11;
  g.add(mesh(cylX(-0.05, 0.05, 0.007, true, 14), bright(), [0, shaftY, 0.012]));
  for (const sx of [-1, 1]) {
    const r = dynamic(group('rocker'));
    r.position.set(sx * 0.0, shaftY, 0.012);
    const arm = new THREE.BoxGeometry(0.056, 0.014, 0.016);
    arm.translate(sx * 0.0135, 0, 0);
    r.add(mesh(arm, darkSteel()));
    r.add(mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.02, 10), steel(), [sx * 0.039, -0.012, 0]));
    g.add(r);
    rockers.push(r);
  }

  // piston, pin, rod, crank: dynamic
  const piston = dynamic(group('piston'));
  {
    // outer profile with the crown at the top, three ring grooves, a hollow skirt: a half solid, cut along the axis
    const top = PIN_TO_CROWN;
    const outer: [number, number][] = [
      [0.0, top],
      [B / 2 - 0.0015, top],
      [B / 2 - 0.0015, top - 0.012],
      [B / 2 - 0.0045, top - 0.0135],
      [B / 2 - 0.0045, top - 0.019],
      [B / 2 - 0.0015, top - 0.0205],
      [B / 2 - 0.0015, top - 0.024],
      [B / 2 - 0.0045, top - 0.0255],
      [B / 2 - 0.0045, top - 0.031],
      [B / 2 - 0.0015, top - 0.0325],
      [B / 2 - 0.0015, top - 0.036],
      [B / 2 - 0.0045, top - 0.0375],
      [B / 2 - 0.0045, top - 0.0435],
      [B / 2 - 0.0015, top - 0.045],
      [B / 2 - 0.0015, -0.04],
      [B / 2 - 0.009, -0.04],
      [B / 2 - 0.009, top - 0.075],
      [0.03, top - 0.062],
      [0.02, top - 0.02],
      [0.0, top - 0.02],
    ];
    piston.add(mesh(solidLathe(outer, 36, HALF.phiStart, HALF.phiLength), darkSteel()));
    piston.add(mesh(capPolygon(outer), cutM));
    // the pin, cut across, and the small end of the rod
    const pin = new THREE.CylinderGeometry(0.0155, 0.0155, 0.045, 18);
    pin.rotateX(Math.PI / 2);
    pin.translate(0, 0, 0.0225);
    piston.add(mesh(pin, bright()));
    const pinCap = new THREE.CircleGeometry(0.0155, 18);
    pinCap.rotateY(Math.PI);
    pinCap.translate(0, 0, -0.0005);
    piston.add(mesh(pinCap, cutM));
  }
  g.add(piston);
  const rod = dynamic(group('rod'));
  {
    // an I-section rod seen as a plate with a small end and a big end, half its thickness kept
    const shape = new THREE.Shape();
    const wTop = 0.017;
    const wBot = 0.026;
    shape.moveTo(-wTop, 0);
    shape.lineTo(-wBot, -ROD);
    shape.lineTo(wBot, -ROD);
    shape.lineTo(wTop, 0);
    shape.closePath();
    const eg = new THREE.ExtrudeGeometry(shape, { depth: 0.011, bevelEnabled: false });
    rod.add(mesh(eg, steel()));
    const small = new THREE.CylinderGeometry(0.0245, 0.0245, 0.011, 24);
    small.rotateX(Math.PI / 2);
    small.translate(0, 0, 0.0055);
    rod.add(mesh(small, steel()));
    const big = new THREE.CylinderGeometry(0.034, 0.034, 0.022, 28);
    big.rotateX(Math.PI / 2);
    big.translate(0, -ROD, 0.011);
    rod.add(mesh(big, steel()));
    // the faces at the cut: a flat plate in cut metal over the half rod's face
    const face = new THREE.ShapeGeometry(shape);
    face.translate(0, 0, -0.0007);
    rod.add(mesh(face, cutM));
    const sf = new THREE.CircleGeometry(0.0245, 24);
    sf.rotateY(Math.PI);
    sf.translate(0, 0, -0.0007);
    rod.add(mesh(sf, cutM));
    const bf = new THREE.CircleGeometry(0.034, 28);
    bf.rotateY(Math.PI);
    bf.translate(0, -ROD, -0.0007);
    rod.add(mesh(bf, cutM));
  }
  g.add(rod);
  const crank = dynamic(group('crank'));
  {
    // the crank pin (a circle at the cut), a web and a counterweight behind the cut plane, the main journal
    const pinG = new THREE.CylinderGeometry(0.03, 0.03, 0.062, 24);
    pinG.rotateX(Math.PI / 2);
    pinG.translate(0, rc, 0.031);
    crank.add(mesh(pinG, bright()));
    const pf = new THREE.CircleGeometry(0.03, 24);
    pf.rotateY(Math.PI);
    pf.translate(0, rc, -0.0005);
    crank.add(mesh(pf, cutM));
    // the web: a slab from the pin to the shaft and round to a counterweight opposite
    const web = new THREE.Shape();
    web.absarc(0, 0, 0.046, 0, TAU);
    const wg = new THREE.ExtrudeGeometry(web, { depth: 0.014, bevelEnabled: false, curveSegments: 20 });
    wg.translate(0, 0, 0.056);
    crank.add(mesh(wg, castIron()));
    // the counterweight: a half-disc on the side opposite the pin
    const cw = new THREE.Shape();
    cw.absarc(0, 0, 0.098, Math.PI / 2 + 0.5, Math.PI * 1.5 - 0.5, false);
    cw.lineTo(0, 0);
    cw.closePath();
    const cg = new THREE.ExtrudeGeometry(cw, { depth: 0.014, bevelEnabled: false, curveSegments: 20 });
    cg.translate(0, 0, 0.056);
    // the weight lies opposite the pin: the pin is at +y, so the weight is at −y
    cg.rotateZ(0.0);
    crank.add(mesh(cg, castIron()));
    const jour = new THREE.CylinderGeometry(0.042, 0.042, 0.04, 24);
    jour.rotateX(Math.PI / 2);
    jour.translate(0, 0, 0.09);
    crank.add(mesh(jour, bright()));
    // the oil way: a hint
  }
  g.add(crank);

  // ---- the pilot injector, a long holder through the head, its tip in the chamber
  const tip = v3(0, Y_HEAD - 0.001, 0);
  {
    const holderTop = Y_HEAD + 0.075 + 0.04 + 0.055;
    const profile: [number, number][] = [
      [0.0, Y_HEAD - 0.002],
      [0.0035, Y_HEAD - 0.002],
      [0.0035, Y_HEAD + 0.01],
      [0.009, Y_HEAD + 0.012],
      [0.009, Y_HEAD + 0.075],
      [0.014, Y_HEAD + 0.078],
      [0.014, holderTop - 0.02],
      [0.011, holderTop - 0.018],
      [0.011, holderTop],
      [0.0, holderTop],
    ];
    inj.add(mesh(solidLathe(profile, 20, HALF.phiStart, HALF.phiLength), brassMat()));
    inj.add(mesh(capPolygon(profile), cutM));
    // the delivery pipe bent off the top, the leak-off tube, a clamp
    const line = tubeGeometry(
      [
        v3(0.011, holderTop - 0.03, 0.01),
        v3(0.05, holderTop - 0.03, 0.02),
        v3(0.1, holderTop - 0.01, 0.03),
        v3(0.16, holderTop - 0.1, 0.04),
      ],
      0.0035,
      30,
      8,
    );
    inj.add(mesh(line, steel()));
    inj.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 10), brassMat(), [0.011, holderTop - 0.03, 0.01]));
    inj.add(
      mesh(
        tubeGeometry(
          [v3(-0.011, holderTop - 0.012, 0.0), v3(-0.04, holderTop + 0.005, 0.01), v3(-0.06, holderTop - 0.03, 0.02)],
          0.0022,
          20,
          6,
        ),
        blackPaint(),
      ),
    );
  }
  g.add(inj);

  // the pilot's spray and its flash
  const sprayM = new THREE.MeshBasicMaterial({
    color: 0xd6ecff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const spray = dynamic(group('spray'));
  for (const a of [-0.55, -0.2, 0.2, 0.55]) {
    const c = new THREE.ConeGeometry(0.0045, 0.045, 8, 1, true);
    c.translate(0, -0.0225, 0);
    c.rotateZ(a);
    const m = new THREE.Mesh(c, sprayM);
    m.position.copy(tip);
    m.castShadow = false;
    m.renderOrder = 8;
    spray.add(m);
  }
  g.add(spray);
  const flameM = new THREE.MeshBasicMaterial({
    color: 0xffb040,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const flash = dynamic(new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8, 0, TAU, 0, Math.PI), flameM));
  flash.position.copy(tip);
  flash.castShadow = false;
  g.add(flash);

  // a base plate under the sump so that the cylinder stands, and two lugs
  g.add(mesh(boxAt(-0.16, -0.2, 0.0, 0.16, -0.19, 0.16), darkSteel()));
  for (const sx of [-1, 1])
    g.add(mesh(boxAt(sx * 0.14 - 0.02, -0.19, -0.0, sx * 0.14 + 0.02, -0.075 - 0.0, 0.12), castIron()));
  mergeStatic(g, { name: g.name });
  mergeStatic(inj, { name: inj.name });
  const root = group('cylinder');
  root.add(g, inj);
  void latheCrisp;
  void stick;
  void joined;
  void PIPE;

  const tmpV = new THREE.Vector3();
  const SPRAY: [number, number] = [346, 366];
  const setCycle = (theta: number, lit: number, on: boolean): void => {
    const th = ((theta % 720) + 720) % 720;
    const phi = (th * Math.PI) / 180;
    // the crank: the pin up at the top of the stroke
    crank.rotation.z = -phi;
    const py = pinHeight(phi);
    piston.position.set(0, py, 0);
    // the rod: from the pin to the crank pin
    const cpx = rc * Math.sin(phi);
    const cpy = rc * Math.cos(phi);
    rod.position.set(0, py, 0);
    tmpV.set(cpx, cpy - py, 0);
    rod.rotation.z = Math.atan2(tmpV.x, -tmpV.y);
    // valves: the intake opens a little after the top of the exhaust stroke, shuts after the bottom; the exhaust is its mirror at the end of the cycle
    const open = (a: number, b: number): number => (th > a && th < b ? Math.sin((Math.PI * (th - a)) / (b - a)) : 0);
    const lift = 0.0095;
    const liIn = open(5, 205);
    const liEx = open(515, 715);
    valves[0]!.grp.position.y = Y_HEAD - lift * liIn;
    valves[1]!.grp.position.y = Y_HEAD - lift * liEx;
    rockers[0]!.rotation.z = liIn * 0.16;
    rockers[1]!.rotation.z = -liEx * 0.16;
    // the charge fills from the crown to the head; its colour follows the stroke
    const crown = py + PIN_TO_CROWN;
    gas.position.y = crown;
    gas.scale.y = Math.max(0.0005, Y_HEAD - crown);
    const k = on ? 1 : 0.35;
    const col = new THREE.Color();
    if (th < 180) col.set(0xa9c3d3);
    else if (th < 360) col.set(0xb6c0c6);
    else if (th < 540) col.set(0xff9a40).lerp(new THREE.Color(0xa88a74), Math.min(1, (th - 360) / 180));
    else col.set(0x8a7a6e);
    gasMat.color.copy(col);
    gasMat.opacity = th >= 360 && th < 540 ? 0.2 + 0.5 * lit * Math.max(0, 1 - (th - 360) / 120) * k : 0.3 * k;
    // the pilot's spray and the flash
    const sp = th > SPRAY[0] && th < SPRAY[1] ? 1 : 0;
    sprayM.opacity = sp * 0.85 * (on ? 1 : 0);
    const fl = th >= 360 && th < 420 ? 1 - (th - 360) / 60 : 0;
    flameM.opacity = fl * 0.9 * lit * (on ? 1 : 0);
    flash.scale.setScalar(1 + 3 * (1 - fl));
  };
  setCycle(0, 0, false);

  return {
    group: root,
    cylinder: g,
    injector: inj,
    spray: SPRAY,
    tip,
    setCycle,
    ports: {
      intake: port(-BLOCK_HALF - 0.1 - 0.0, Y_HEAD + 0.035, 0, -1, 0, 0, 0.025),
      exhaust: port(BLOCK_HALF + 0.1, Y_HEAD + 0.035, 0, 1, 0, 0, 0.028),
      fuelLine: port(0.16, Y_HEAD + 0.075 + 0.04 + 0.055 - 0.1, 0.04, 1, 0, 0, 0.0035),
    },
  };
}

/** Top of the head and of the cover, for the tests and the layout. */
export const CYL = {
  yHead: Y_HEAD,
  yCrownTdc: Y_CROWN_TDC,
  rod: ROD,
  rc,
  half: BLOCK_HALF,
  bore: B,
  clearance: CLEARANCE,
};
