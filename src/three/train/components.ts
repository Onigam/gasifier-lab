import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { TAU, boxAt, joined, latheCrisp, softBox, solidLathe, stick, tubeGeometry, v3 } from '../common';
import { COOLER, CYCLONE, FAN, FILTER, GAUGE, HOTPIPE, MIXER, PIPE, STOPVALVE } from '../dims';
import { dynamic, mergeStatic } from '../merge';
import {
  blackPaint,
  blackWater,
  bright,
  brassMat,
  castIron,
  cloth,
  darkSteel,
  dustMat,
  engineBlock,
  greyPaint,
  hose,
  jarGlass,
  lagging,
  redPaint,
  rubber,
  steel,
  zincMat,
} from '../materials';
import { port, type Port } from './pipes';

// The parts of the gas train, one function each, in their own frame, so that the tractor and the gas-train world draw the same piece from the same numbers (docs/3d.md: one machine, one function). A piece has the group that is the part, and
// its ports: where a pipe meets it, in its own frame. A world places the group by translation alone, so that the piece's box is the same in every world.

export interface Piece {
  group: THREE.Group;
  ports: Record<string, Port>;
}

const part = (id: string): THREE.Group => {
  const g = group(id);
  g.userData.partId = id;
  return g;
};

const flange = (
  x: number,
  y: number,
  z: number,
  axis: 'x' | 'y' | 'z',
  r = PIPE.R,
  thick = PIPE.flangeT,
): THREE.BufferGeometry => {
  const g = new THREE.CylinderGeometry(r + 0.022, r + 0.022, thick, 28);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
};

/** A pipe stub with its flange, leaving the point `o` along the unit vector `d`, of length `len` to the flange's inner face. */
function stub(o: THREE.Vector3, d: THREE.Vector3, len: number, r: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), d);
  const tube = new THREE.CylinderGeometry(r, r, len, 20);
  tube.translate(0, len / 2, 0);
  tube.applyQuaternion(q);
  tube.translate(o.x, o.y, o.z);
  out.push(tube);
  const fl = new THREE.CylinderGeometry(r + 0.022, r + 0.022, PIPE.flangeT, 28);
  fl.translate(0, len + PIPE.flangeT / 2, 0);
  fl.applyQuaternion(q);
  fl.translate(o.x, o.y, o.z);
  out.push(fl);
  return out;
}

// ============================================================================================= the fabric filter

export interface FilterPiece extends Piece {
  box: THREE.Group;
  bags: THREE.Group;
  /** The cloth's material, to be coloured by dust and wet. */
  clothMat: THREE.MeshStandardMaterial;
  /** The ash tray's heap, scaled by the dust it holds. */
  trayDust: THREE.Mesh;
}

/** The filter, local frame: x from the rear face (the dirty-gas inlet side), y from the foot, z across; so x ∈ [0, L], y ∈ [0, H], z ∈ ±W/2. */
export function buildFilter(): FilterPiece {
  const { length: L, width: W, height: H, trayH: tray, chamberH: ch, bags, bagW, bagH, bagT, pitch } = FILTER;
  const box = part('filter-box');
  const bagsG = part('filter-bags');
  const body = lagging();
  const bodyTop = H - ch;
  // the casing: the bag compartment, the ash tray under it, the lid chamber over it
  box.add(mesh(softBox(L / 2, (tray + bodyTop) / 2, 0, L, bodyTop - tray, W, 0.012), body));
  box.add(mesh(softBox(L / 2, (bodyTop + H) / 2, 0, L - 0.05, ch, W - 0.04, 0.012), body));
  // stiffening ribs on the long sides and the lid's flange
  const ribs: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    for (const y of [tray + 0.18, tray + 0.42, tray + 0.62])
      ribs.push(boxAt(0.02, y - 0.008, s * (W / 2 + 0.003) - 0.004, L - 0.02, y + 0.008, s * (W / 2 + 0.003) + 0.004));
    ribs.push(boxAt(0.0, bodyTop - 0.01, s * (W / 2) - 0.012, L, bodyTop + 0.012, s * (W / 2) + 0.014));
  }
  ribs.push(boxAt(-0.003, tray + 0.02, -W / 2 - 0.01, 0.0, bodyTop - 0.02, W / 2 + 0.01));
  ribs.push(boxAt(L, tray + 0.02, -W / 2 - 0.01, L + 0.003, bodyTop - 0.02, W / 2 + 0.01));
  box.add(mesh(joined(ribs), steel()));
  // the bolts that hold the lid's flange and the two end flanges: a hex head every 11 cm, standing out of the flange's face
  const flangeBolts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    for (let x = 0.07; x < L - 0.05; x += 0.11) {
      const b = new THREE.CylinderGeometry(0.0065, 0.0065, 0.007, 6);
      b.rotateX(Math.PI / 2);
      b.translate(x, bodyTop + 0.001, s * (W / 2 + 0.017 + 0.0035));
      flangeBolts.push(b);
    }
    for (const x of [-0.003, L + 0.003])
      for (const y of [tray + 0.08, (tray + bodyTop) / 2, bodyTop - 0.1]) {
        const b = new THREE.CylinderGeometry(0.0065, 0.0065, 0.007, 6);
        b.rotateZ(Math.PI / 2);
        b.translate(x + (x < 0 ? -0.0035 : 0.0035), y, s * (W / 2 - 0.05));
        flangeBolts.push(b);
      }
  }
  box.add(mesh(joined(flangeBolts), darkSteel()));
  // four toggle clamps at the lid's joint
  const clamps: THREE.BufferGeometry[] = [];
  for (const x of [0.16, L - 0.16]) {
    for (const s of [-1, 1]) {
      clamps.push(
        boxAt(
          x - 0.02,
          bodyTop - 0.05,
          s * (W / 2 + 0.014) - 0.006,
          x + 0.02,
          bodyTop + 0.02,
          s * (W / 2 + 0.014) + 0.006,
        ),
      );
      clamps.push(
        boxAt(
          x - 0.012,
          bodyTop - 0.012,
          s * (W / 2 + 0.024) - 0.004,
          x + 0.012,
          bodyTop + 0.05,
          s * (W / 2 + 0.024) + 0.004,
        ),
      );
    }
  }
  box.add(mesh(joined(clamps), darkSteel()));
  // the ash tray: a drawer at the foot of the casing, a handle on its front
  box.add(mesh(softBox(L / 2, tray / 2, 0, L - 0.06, tray, W - 0.04, 0.008), darkSteel()));
  box.add(mesh(softBox(L / 2, tray / 2, -W / 2 + 0.002, L - 0.04, tray - 0.01, 0.016, 0.006), steel()));
  const handle = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 10);
  handle.rotateZ(Math.PI / 2);
  box.add(mesh(handle, bright(), [L / 2, tray / 2, -W / 2 - 0.028]));
  for (const x of [L / 2 - 0.09, L / 2 + 0.09])
    box.add(mesh(stick(v3(x, tray / 2, -W / 2 - 0.0), v3(x, tray / 2, -W / 2 - 0.028), 0.006, 6), bright()));
  // the dirty-gas inlet on the rear face, the clean-gas outlet on the lid
  const inlet = v3(0, FILTER.inlet.y, FILTER.inlet.z);
  const outletO = v3(L - 0.12, H, 0);
  const pieces = [...stub(inlet, v3(-1, 0, 0), 0.05, PIPE.R), ...stub(outletO, v3(0, 1, 0), 0.05, PIPE.R)];
  box.add(mesh(joined(pieces), darkSteel()));
  // a lifting eye on the lid
  const eye = new THREE.TorusGeometry(0.025, 0.006, 8, 16);
  eye.rotateY(Math.PI / 2);
  box.add(mesh(eye, steel(), [0.3, H + 0.02, 0]));

  // the bags: flat pockets on frames, hung from a plate under the lid chamber, 13 of them across the box's length
  const frames: THREE.BufferGeometry[] = [];
  const faces: THREE.BufferGeometry[] = [];
  const x0 = (L - (bags - 1) * pitch) / 2;
  const top = bodyTop - 0.02;
  for (let i = 0; i < bags; i++) {
    const x = x0 + i * pitch;
    // frame: a top bar and two uprights, a foot bar
    frames.push(boxAt(x - bagT / 2, top - 0.012, -bagW / 2, x + bagT / 2, top, bagW / 2));
    frames.push(boxAt(x - bagT / 2, top - bagH, -bagW / 2, x + bagT / 2, top - bagH + 0.01, bagW / 2));
    for (const s of [-1, 1])
      frames.push(
        boxAt(
          x - bagT / 2,
          top - bagH,
          s * (bagW / 2 - 0.006) - 0.006,
          x + bagT / 2,
          top,
          s * (bagW / 2 - 0.006) + 0.006,
        ),
      );
    // the two faces of cloth, slightly puffed
    for (const s of [-1, 1]) {
      const g = new THREE.PlaneGeometry(bagW - 0.012, bagH - 0.02, 1, 1);
      g.rotateY((s * Math.PI) / 2);
      g.translate(x + s * (bagT / 2 + 0.0008), top - bagH / 2, 0);
      faces.push(g);
    }
  }
  bagsG.add(mesh(joined(frames), steel()));
  const clothMat = cloth().clone();
  clothMat.userData.noShare = true;
  const clothMesh = mesh(joined(faces), clothMat);
  clothMesh.castShadow = false;
  bagsG.add(clothMesh);
  // the tube sheet they hang from, with its slots
  const sheet = softBox(L / 2, bodyTop - 0.006, 0, L - 0.03, 0.012, W - 0.03, 0.004);
  bagsG.add(mesh(sheet, darkSteel()));
  // dust that has fallen to the tray
  const trayDust = mesh(new THREE.BoxGeometry(L - 0.12, 1, W - 0.1), dustMat());
  trayDust.position.set(L / 2, 0.012, 0);
  trayDust.scale.y = 0.001;
  trayDust.castShadow = false;
  bagsG.add(trayDust);

  for (const g of [box, bagsG]) mergeStatic(g, { name: g.name });
  const root = group('filter');
  root.add(box, bagsG);
  return {
    group: root,
    box,
    bags: bagsG,
    clothMat,
    trayDust,
    ports: {
      in: port(-0.05 - PIPE.flangeT, FILTER.inlet.y, FILTER.inlet.z, -1, 0, 0),
      out: port(L - 0.12, H + 0.05 + PIPE.flangeT, 0, 0, 1, 0),
    },
  };
}

// ============================================================================================= the gas cooler and its vessel

export interface CoolerPiece extends Piece {
  cooler: THREE.Group;
  vessel: THREE.Group;
  vesselWater: THREE.Mesh;
}

/** The cooler, local frame: x from the face against the radiator, y from the foot of the lower box, z across. The vessel hangs below (y < 0). */
export function buildCooler(): CoolerPiece {
  const cooler = part('gas-cooler');
  const vessel = part('cooler-condensate-vessel');
  const { tubes, tubeD, tubeL, rows, cols, pitch, boxH, headerH } = COOLER;
  const depth = rows * pitch + 0.04;
  const width = cols * pitch + 0.04;
  const y0 = boxH;
  const y1 = boxH + tubeL;
  const R = redPaint();
  void R;
  // the lower box and the header, with the plates the tubes end in
  cooler.add(mesh(softBox(depth / 2, boxH / 2, 0, depth, boxH, width, 0.012), castIron()));
  cooler.add(mesh(softBox(depth / 2, y1 + headerH / 2, 0, depth, headerH, width, 0.012), castIron()));
  // the header's cover and its bolts, the box's inspection plate
  cooler.add(mesh(softBox(depth / 2, y1 + headerH + 0.006, 0, depth + 0.02, 0.012, width + 0.02, 0.004), darkSteel()));
  const bolts: THREE.BufferGeometry[] = [];
  for (const x of [0.03, depth - 0.03])
    for (let k = 0; k < 7; k++) {
      const z = -width / 2 + 0.04 + (k * (width - 0.08)) / 6;
      const b = new THREE.CylinderGeometry(0.009, 0.009, 0.008, 6);
      b.translate(x, y1 + headerH + 0.016, z);
      bolts.push(b);
    }
  cooler.add(mesh(joined(bolts), steel()));
  // the tube bank: 6 rows deep, 18 across, plain tubes
  const t: THREE.BufferGeometry[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const g = new THREE.CylinderGeometry(tubeD / 2, tubeD / 2, tubeL, 10, 1, true);
      g.translate(0.02 + pitch / 2 + i * pitch, y0 + tubeL / 2, -width / 2 + 0.02 + pitch / 2 + j * pitch);
      t.push(g);
    }
  }
  cooler.add(mesh(joined(t), zincMat()));
  // two spacer bars across the bank
  for (const f of [0.33, 0.66]) {
    const y = y0 + tubeL * f;
    cooler.add(mesh(boxAt(0.0, y - 0.004, -width / 2, depth, y + 0.004, width / 2), darkSteel()));
  }
  // the frame: two posts and their ties, and the arms that bolt to the tractor's front, with the foot brackets
  const frame: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    frame.push(
      boxAt(
        depth / 2 - 0.02,
        -0.04,
        s * (width / 2 + 0.03) - 0.02,
        depth / 2 + 0.02,
        y1 + headerH + 0.02,
        s * (width / 2 + 0.03) + 0.02,
      ),
    );
    frame.push(boxAt(-0.45, 0.0, s * (width / 2 + 0.03) - 0.02, depth / 2, 0.04, s * (width / 2 + 0.03) + 0.02));
    frame.push(stick(v3(-0.2, 0.03, s * (width / 2 + 0.03)), v3(depth / 2, 0.45, s * (width / 2 + 0.03)), 0.01, 6));
  }
  frame.push(
    boxAt(depth / 2 - 0.02, y1 + headerH, -width / 2 - 0.05, depth / 2 + 0.02, y1 + headerH + 0.04, width / 2 + 0.05),
  );
  frame.push(boxAt(depth / 2 - 0.02, -0.04, -width / 2 - 0.05, depth / 2 + 0.02, 0.0, width / 2 + 0.05));
  frame.push(boxAt(-0.45 - 0.01, 0.0, -width / 2 - 0.05, -0.43, 0.04, width / 2 + 0.05));
  cooler.add(mesh(joined(frame), greyPaint()));
  // the inlet on the front of the lower box, the outlet on its right side
  const inletO = v3(depth, boxH / 2, -0.15);
  const outletO = v3(depth / 2, boxH / 2, width / 2);
  const pieces = [...stub(inletO, v3(1, 0, 0), 0.05, PIPE.R), ...stub(outletO, v3(0, 0, 1), 0.05, PIPE.R)];
  cooler.add(mesh(joined(pieces), darkSteel()));
  void tubes;

  // the vessel: a clear jar on a neck from the lower box, a drain cock under it
  vessel.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12), darkSteel(), [depth / 2, -0.03, 0]));
  const jarR = COOLER.vessel.R;
  const jarH = COOLER.vessel.h;
  const jar = new THREE.CylinderGeometry(jarR, jarR, jarH, 28, 1, true);
  jar.translate(depth / 2, -0.06 - jarH / 2, 0);
  vessel.add(mesh(jar, jarGlass()));
  vessel.add(mesh(new THREE.CylinderGeometry(jarR, jarR, 0.006, 28), jarGlass(), [depth / 2, -0.06 - jarH, 0]));
  vessel.add(
    mesh(new THREE.CylinderGeometry(jarR + 0.004, jarR + 0.004, 0.02, 28), blackPaint(), [depth / 2, -0.06, 0]),
  );
  // the drain cock
  vessel.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 10), brassMat(), [depth / 2, -0.06 - jarH - 0.028, 0]));
  const lever = new THREE.BoxGeometry(0.05, 0.008, 0.008);
  vessel.add(mesh(lever, brassMat(), [depth / 2 + 0.02, -0.06 - jarH - 0.045, 0]));
  // a hanger from the frame to the jar: a band round the jar, an ear on each side of it, and a rod from each ear up to the cross bar of the frame (the bar under the lower box, y from -0.04 to 0), with a nut under the ear
  {
    const yBand = -0.06 - jarH * 0.7;
    const bandH = 0.018;
    const hanger: THREE.BufferGeometry[] = [];
    hanger.push(
      solidLathe(
        [
          [jarR + 0.001, yBand - bandH / 2],
          [jarR + 0.007, yBand - bandH / 2],
          [jarR + 0.007, yBand + bandH / 2],
          [jarR + 0.001, yBand + bandH / 2],
        ],
        28,
      ).translate(depth / 2, 0, 0),
    );
    for (const s of [-1, 1]) {
      const zr = s * (jarR + 0.014);
      hanger.push(boxAt(depth / 2 - 0.011, yBand - 0.009, zr - 0.009, depth / 2 + 0.011, yBand + 0.009, zr + 0.009));
      hanger.push(stick(v3(depth / 2, yBand + 0.009, zr), v3(depth / 2, -0.028, zr), 0.0045, 8));
      const nut = new THREE.CylinderGeometry(0.0085, 0.0085, 0.008, 6);
      nut.translate(depth / 2, yBand - 0.013, zr);
      hanger.push(nut);
    }
    vessel.add(mesh(joined(hanger), darkSteel()));
  }
  const water = new THREE.CylinderGeometry(jarR - 0.002, jarR - 0.002, 1, 28);
  water.translate(0, 0.5, 0);
  const vesselWater = mesh(water, blackWater());
  vesselWater.position.set(depth / 2, -0.06 - jarH + 0.003, 0);
  vesselWater.scale.y = 0.01;
  vesselWater.castShadow = false;
  vessel.add(vesselWater);

  for (const g of [cooler, vessel]) mergeStatic(g, { name: g.name });
  const root = group('cooler');
  root.add(cooler, vessel);
  return {
    group: root,
    cooler,
    vessel,
    vesselWater,
    ports: {
      in: port(depth + 0.05 + PIPE.flangeT, boxH / 2, -0.15, 1, 0, 0),
      out: port(depth / 2, boxH / 2, width / 2 + 0.05 + PIPE.flangeT, 0, 0, 1),
    },
  };
}

/** The cooler's width and depth, for the layouts. */
export const coolerBox = {
  depth: COOLER.rows * COOLER.pitch + 0.04,
  width: COOLER.cols * COOLER.pitch + 0.04,
  height: COOLER.boxH + COOLER.tubeL + COOLER.headerH,
};

// ============================================================================================= the valves, the stack, the hot pipe

/** The hot-gas pipe, local frame: origin at the face of the unit's outlet flange, x out, y up. Out of the flange a short run, an elbow, a riser, and the tee where the fan's stack leaves; the run on to the stop valve. */
export function buildHotPipe(): Piece {
  const g = part('hot-gas-pipe');
  const r = PIPE.R;
  const ft = HOTPIPE.flange;
  const A = v3(0, 0, 0);
  const x = HOTPIPE.run;
  const yT = HOTPIPE.riser;
  // flange on the unit's flange, then the pipe along the run and up the riser, bent where it turns
  const path = new THREE.CurvePath<THREE.Vector3>();
  const pts = [v3(ft, 0, 0), v3(x - 0.1, 0, 0)];
  const rise = [v3(x, 0.1, 0), v3(x, yT + HOTPIPE.teeStub, 0)];
  const bend = new THREE.QuadraticBezierCurve3(v3(x - 0.1, 0, 0), v3(x, 0, 0), v3(x, 0.1, 0));
  path.add(new THREE.LineCurve3(pts[0]!, pts[1]!));
  path.add(bend);
  path.add(new THREE.LineCurve3(rise[0]!, rise[1]!));
  g.add(mesh(new THREE.TubeGeometry(path, 48, r, 20, false), darkSteel()));
  // the flanges: on the unit's, on the tee's run and branch
  const parts: THREE.BufferGeometry[] = [];
  parts.push(flange(ft / 2 + 0.0, 0, 0, 'x', r, ft));
  const run = [v3(x, yT, 0), v3(x + HOTPIPE.teeRun, yT, 0)];
  parts.push(...stub(run[0]!, v3(1, 0, 0), HOTPIPE.teeRun, r));
  // the branch for the fan's stack is a smaller pipe
  const rb = 0.03;
  parts.push(...stub(v3(x, yT + HOTPIPE.teeStub, 0), v3(0, 1, 0), 0.0001, rb).slice(1));
  // a collar at the tee
  parts.push(new THREE.CylinderGeometry(r + 0.012, r + 0.012, 0.05, 20).translate(x, yT, 0));
  g.add(mesh(joined(parts), darkSteel()));
  // bolts on the first flange
  const b: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + Math.PI / 4;
    const h = new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 6);
    h.rotateZ(Math.PI / 2);
    h.translate(ft + 0.003, Math.cos(a) * (r + 0.012), Math.sin(a) * (r + 0.012));
    b.push(h);
  }
  g.add(mesh(joined(b), steel()));
  mergeStatic(g, { name: g.name });
  void A;
  return {
    group: g,
    ports: {
      unit: port(0, 0, 0, -1, 0, 0),
      run: port(x + HOTPIPE.teeRun + ft + PIPE.flangeT - ft, yT, 0, 1, 0, 0),
      stack: port(x, yT + HOTPIPE.teeStub + ft, 0, 0, 1, 0, rb),
    },
  };
}

/** The stop valve, local frame: origin at its middle, flange to flange along x. A gate valve with a hand wheel. */
export function buildStopValve(): Piece {
  const g = part('stop-valve');
  const L = STOPVALVE.len;
  const r = PIPE.R;
  const body = new THREE.CylinderGeometry(0.052, 0.052, L, 24);
  body.rotateZ(Math.PI / 2);
  g.add(mesh(body, castIron()));
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) parts.push(flange(s * (L / 2 + 0.004), 0, 0, 'x', r, PIPE.flangeT));
  g.add(mesh(joined(parts), darkSteel()));
  // the bonnet, the stem and the wheel
  const bonnet = new THREE.CylinderGeometry(0.035, 0.04, 0.06, 20);
  bonnet.translate(0, 0.075, 0);
  g.add(mesh(bonnet, castIron()));
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8), bright(), [0, 0.15, 0]));
  const wheel = new THREE.TorusGeometry(0.045, 0.006, 8, 24);
  wheel.rotateX(Math.PI / 2);
  g.add(mesh(wheel, blackPaint(), [0, 0.19, 0]));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    g.add(
      mesh(
        stick(
          v3(Math.cos(a) * 0.045, 0.19, Math.sin(a) * 0.045),
          v3(-Math.cos(a) * 0.045, 0.19, -Math.sin(a) * 0.045),
          0.004,
          6,
        ),
        blackPaint(),
      ),
    );
  }
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.014, 6), bright(), [0, 0.197, 0]));
  // bolts on the flanges
  const bl: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1])
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4;
      const h = new THREE.CylinderGeometry(0.0055, 0.0055, 0.007, 6);
      h.rotateZ(Math.PI / 2);
      h.translate(s * (L / 2 + 0.004 + 0.0), Math.cos(a) * (r + 0.012), Math.sin(a) * (r + 0.012));
      bl.push(h);
    }
  g.add(mesh(joined(bl), steel()));
  mergeStatic(g, { name: g.name });
  const e = L / 2 + 0.008;
  return { group: g, ports: { in: port(-e, 0, 0, -1, 0, 0), out: port(e, 0, 0, 1, 0, 0) } };
}

/** The fan's stack, local frame: origin at the foot (the tee's branch), straight up. A small valve at the foot, a rain cap on legs at the top. */
export function buildFanStack(): Piece {
  const g = part('fan-stack');
  const r = FAN.stackR;
  const H = STOPVALVE.stackH;
  g.add(mesh(new THREE.CylinderGeometry(r, r, H, 16, 1, true), darkSteel(), [0, H / 2, 0]));
  // the flange at its foot and the small gate valve above it
  g.add(mesh(flange(0, (-PIPE.flangeT / 2) * 0 + PIPE.flangeT / 2, 0, 'y', r, PIPE.flangeT), darkSteel()));
  const v = new THREE.CylinderGeometry(0.042, 0.042, 0.07, 16);
  v.rotateZ(Math.PI / 2);
  g.add(mesh(v, castIron(), [0, 0.16, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.05, 14), castIron(), [0, 0.215, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8), bright(), [0, 0.28, 0]));
  const lever = new THREE.BoxGeometry(0.1, 0.01, 0.014);
  g.add(mesh(lever, redPaint(), [0.04, 0.32, 0]));
  // the rain cap: a cone over the mouth on three legs
  const cap = new THREE.ConeGeometry(0.06, 0.05, 20);
  g.add(mesh(cap, darkSteel(), [0, H + 0.055, 0]));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU;
    g.add(
      mesh(
        stick(
          v3(Math.cos(a) * r * 0.9, H - 0.01, Math.sin(a) * r * 0.9),
          v3(Math.cos(a) * 0.05, H + 0.045, Math.sin(a) * 0.05),
          0.004,
          6,
        ),
        steel(),
      ),
    );
  }
  // two clamps with a stay to the filter box
  for (const y of [0.7, 1.0])
    g.add(mesh(new THREE.CylinderGeometry(r + 0.006, r + 0.006, 0.03, 16), steel(), [0, y, 0]));
  mergeStatic(g, { name: g.name });
  return { group: g, ports: { foot: port(0, 0, 0, 0, -1, 0, r) } };
}

/** The primary-air valve, local frame: origin at its middle, along x; a butterfly valve in a short wafer with a lever and a quadrant. The air pipe is the unit's intake's size. */
export function buildAirValve(): Piece {
  const g = part('primary-air-valve');
  const r = 0.0275;
  const L = 0.05;
  const body = new THREE.CylinderGeometry(0.04, 0.04, L, 22);
  body.rotateZ(Math.PI / 2);
  g.add(mesh(body, castIron()));
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) parts.push(flange(s * (L / 2 + 0.004), 0, 0, 'x', r, PIPE.flangeT));
  g.add(mesh(joined(parts), darkSteel()));
  g.add(mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.1, 8), bright(), [0, 0.05, 0]));
  const lever = new THREE.BoxGeometry(0.14, 0.008, 0.016);
  const lv = mesh(lever, redPaint(), [0.06, 0.1, 0]);
  lv.rotation.y = 0.0;
  g.add(lv);
  const grip = new THREE.CylinderGeometry(0.009, 0.009, 0.04, 8);
  g.add(mesh(grip, rubber(), [0.13, 0.1, 0]));
  // the quadrant plate the lever is held on
  const quad = new THREE.CylinderGeometry(0.075, 0.075, 0.004, 24, 1, false, 0, Math.PI / 2);
  g.add(mesh(quad, darkSteel(), [0, 0.065, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 6), bright(), [0, 0.108, 0]));
  mergeStatic(g, { name: g.name });
  const e = L / 2 + 0.008;
  return { group: g, ports: { in: port(-e, 0, 0, -1, 0, 0, r), out: port(e, 0, 0, 1, 0, 0, r) } };
}

// ============================================================================================= the starting fan

export interface FanPiece extends Piece {
  impeller: THREE.Group;
  blur: THREE.Mesh;
}

/** The starting fan, local frame: origin at the middle of its foot plate, axis along z. A blower on a plate with its motor behind. */
export function buildStartingFan(): FanPiece {
  const g = part('starting-fan');
  const R = FAN.scrollR;
  const cy = 0.02 + R + 0.01;
  g.add(mesh(softBox(0, 0.01, 0, 0.36, 0.02, 0.24, 0.006), darkSteel()));
  // the volute: a drum and a duct leaving it tangentially, upwards
  const drum = new THREE.CylinderGeometry(R, R, FAN.depth, 40, 1, true);
  drum.rotateX(Math.PI / 2);
  g.add(mesh(drum, greyPaint(), [0, cy, 0]));
  for (const s of [-1, 1]) {
    const face = new THREE.CircleGeometry(R, 40);
    if (s < 0) face.rotateY(Math.PI);
    g.add(mesh(face, greyPaint(), [0, cy, (s * FAN.depth) / 2]));
  }
  const duct = softBox(R - 0.02, cy + R * 0.5 + 0.02, 0, FAN.outletW, R + 0.04, FAN.depth, 0.006);
  g.add(mesh(duct, greyPaint()));
  // the outlet pipe up from the duct
  const outY = cy + R + 0.06;
  const oStub = stub(v3(R - 0.02, outY - 0.04, 0), v3(0, 1, 0), 0.05, 0.0275);
  g.add(mesh(joined(oStub), darkSteel()));
  // the eye on the front, a bell mouth
  const bell = new THREE.CylinderGeometry(0.06, 0.04, 0.035, 24, 1, true);
  bell.rotateX(Math.PI / 2);
  g.add(mesh(bell, darkSteel(), [0, cy, -FAN.depth / 2 - 0.018]));
  // the motor behind, ribbed
  const motor = new THREE.CylinderGeometry(0.075, 0.075, 0.15, 24);
  motor.rotateX(Math.PI / 2);
  g.add(mesh(motor, blackPaint(), [0, cy, FAN.depth / 2 + 0.075]));
  for (let k = 0; k < 7; k++) {
    const ring = new THREE.TorusGeometry(0.077, 0.004, 6, 28);
    g.add(mesh(ring, steel(), [0, cy, FAN.depth / 2 + 0.02 + k * 0.02]));
  }
  g.add(mesh(softBox(0, cy - 0.08, FAN.depth / 2 + 0.075, 0.1, 0.03, 0.14, 0.006), darkSteel()));
  // a terminal box and its cable
  g.add(mesh(softBox(0, cy + 0.085, FAN.depth / 2 + 0.075, 0.07, 0.03, 0.07, 0.006), darkSteel()));
  // mounting bolts
  const bolts: THREE.BufferGeometry[] = [];
  for (const x of [-0.15, 0.15])
    for (const z of [-0.1, 0.1]) {
      const b = new THREE.CylinderGeometry(0.008, 0.008, 0.008, 6);
      b.translate(x, 0.024, z);
      bolts.push(b);
    }
  g.add(mesh(joined(bolts), steel()));
  // the impeller, inside the drum (seen in x-ray) and a blur disc over it
  const impeller = dynamic(group('impeller'));
  impeller.position.set(0, cy, 0);
  const blades: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU;
    const b = new THREE.BoxGeometry(0.006, 0.05, FAN.depth - 0.03);
    b.translate(0, 0.095, 0);
    b.rotateZ(a);
    blades.push(b);
  }
  impeller.add(mesh(joined(blades), steel()));
  g.add(impeller);
  const blur = dynamic(
    new THREE.Mesh(
      new THREE.CircleGeometry(R - 0.01, 40),
      new THREE.MeshBasicMaterial({
        color: 0xdfe6ea,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    ),
  );
  blur.position.set(0, cy, -FAN.depth / 2 - 0.0005);
  blur.castShadow = false;
  blur.userData.noShadow = true;
  g.add(blur);
  mergeStatic(g, { name: g.name });
  return {
    group: g,
    impeller,
    blur,
    ports: { out: port(R - 0.02, outY - 0.04 + 0.05 + PIPE.flangeT, 0, 0, 1, 0, 0.0275) },
  };
}

// ============================================================================================= the cyclone (the programme's, not this tractor's)

/** The cyclone, local frame: origin on its axis at the tip of the cone; y up. Tangential inlet on the barrel, outlet on the top, a dust pot under. */
export function buildCyclone(): Piece {
  const g = part('cyclone');
  const { R, bodyH, coneH } = CYCLONE;
  const profile: [number, number][] = [
    [0.02, 0],
    [R, coneH],
    [R, coneH + bodyH],
  ];
  g.add(mesh(latheCrisp(profile, 36), castIron()));
  g.add(mesh(new THREE.CylinderGeometry(R, R, 0.01, 36), darkSteel(), [0, coneH + bodyH, 0]));
  // the dust pot under the tip
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 20), darkSteel(), [0, -0.06, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.012, 20), steel(), [0, 0.0, 0]));
  // the outlet pipe up through the lid, the inlet tangent on the barrel
  const out = stub(v3(0, coneH + bodyH, 0), v3(0, 1, 0), 0.05, PIPE.R);
  const inl = stub(v3(-R, coneH + bodyH - 0.07, -R * 0.0), v3(-1, 0, 0), 0.04, PIPE.R);
  g.add(mesh(joined([...out, ...inl]), darkSteel()));
  // a bracket and a band
  g.add(mesh(boxAt(-R - 0.01, coneH + 0.04, -0.012, R + 0.01, coneH + 0.055, 0.012), steel()));
  mergeStatic(g, { name: g.name });
  return {
    group: g,
    ports: {
      in: port(-R - 0.04 - PIPE.flangeT, coneH + bodyH - 0.07, 0, -1, 0, 0),
      out: port(0, coneH + bodyH + 0.05 + PIPE.flangeT, 0, 0, 1, 0),
    },
  };
}

// ============================================================================================= the mixer, the throttles, the manifold

export interface MixerPiece extends Piece {
  mixer: THREE.Group;
  gasThrottle: THREE.Group;
  airThrottle: THREE.Group;
  /** The two butterfly levers, which turn with the load. */
  gasLever: THREE.Object3D;
  airLever: THREE.Object3D;
}

/** The mixer, local frame: origin on the intake manifold's flange, y up. A venturi body, the gas coming in through the gas throttle on −x, air through the secondary-air throttle on top, from an oil-bath cleaner. */
export function buildMixer(): MixerPiece {
  const mixer = part('gas-air-mixer');
  const gasT = part('gas-throttle');
  const airT = part('secondary-air-throttle');
  const R = MIXER.bodyR;
  // flange and body: a venturi
  mixer.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.012, 28), darkSteel(), [0, 0.006, 0]));
  const bolts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + Math.PI / 4;
    const b = new THREE.CylinderGeometry(0.008, 0.008, 0.008, 6);
    b.translate(Math.cos(a) * 0.07, 0.016, Math.sin(a) * 0.07);
    bolts.push(b);
  }
  mixer.add(mesh(joined(bolts), steel()));
  const profile: [number, number][] = [
    [R, 0.012],
    [R, 0.06],
    [R * 0.72, 0.105],
    [R * 0.6, 0.13],
    [R * 0.72, 0.16],
    [R, 0.2],
    [R, 0.225],
  ];
  mixer.add(mesh(latheCrisp(profile, 32), castIron()));
  mixer.add(mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.014, 28), darkSteel(), [0, 0.225, 0]));
  // gas inlet pipe on −x, with its flange at the end
  const gy = 0.12;
  const gl = 0.2;
  const gasPipe = new THREE.CylinderGeometry(PIPE.R, PIPE.R, gl - 0.14, 20);
  gasPipe.rotateZ(Math.PI / 2);
  mixer.add(mesh(gasPipe, darkSteel(), [-(gl - 0.14) / 2 - R * 0.8, gy, 0]));
  // the gas throttle: a butterfly in a body on the inlet, a lever and a link ear
  const gb = new THREE.CylinderGeometry(0.05, 0.05, 0.06, 22);
  gb.rotateZ(Math.PI / 2);
  gasT.add(mesh(gb, castIron(), [-0.115, gy, 0]));
  for (const s of [-1, 1]) gasT.add(mesh(flange(-0.115 + s * 0.034, gy, 0, 'x', PIPE.R, PIPE.flangeT), darkSteel()));
  gasT.add(mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.1, 8), bright(), [-0.115, gy + 0.05, 0]));
  const gLever = group('gas-lever');
  gLever.position.set(-0.115, gy + 0.09, 0);
  gLever.add(mesh(new THREE.BoxGeometry(0.014, 0.01, 0.17), redPaint(), [0, 0, 0.07]));
  gLever.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.016, 8), bright(), [0, 0.006, 0.145]));
  gasT.add(dynamic(gLever));
  // the flange at the end of the gas pipe
  const endX = -(gl - 0.14) - R * 0.8;
  mixer.add(mesh(flange(endX - PIPE.flangeT / 2, gy, 0, 'x', PIPE.R, PIPE.flangeT), darkSteel()));
  // the tap for the water gauge, a brass boss on the body
  mixer.add(
    mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.034, 10).rotateX(Math.PI / 2), brassMat(), [0, 0.05, R + 0.015]),
  );
  // the secondary air: a neck on the top, the throttle, a hose to the cleaner
  const ay = 0.225;
  const neck = new THREE.CylinderGeometry(0.036, 0.036, 0.06, 20);
  airT.add(mesh(neck, darkSteel(), [0, ay + 0.03 + 0.007, 0]));
  const ab = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 22);
  ab.rotateX(Math.PI / 2);
  airT.add(mesh(ab, castIron(), [0, ay + 0.1, 0]));
  airT.add(mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.09, 8), bright(), [0, ay + 0.1, 0.05]));
  const aLever = group('air-lever');
  aLever.position.set(0, ay + 0.1, 0.09);
  aLever.add(mesh(new THREE.BoxGeometry(0.17, 0.01, 0.014), redPaint(), [0.07, 0, 0]));
  aLever.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.016, 8), bright(), [0.145, 0.006, 0]));
  airT.add(dynamic(aLever));
  airT.add(mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 20), darkSteel(), [0, ay + 0.17, 0]));
  // the oil-bath cleaner, beside it on the +x side, and its hose
  const cx = 0.24;
  const cy = 0.12;
  airT.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 28), greyPaint(), [cx, cy + 0.1, 0]));
  airT.add(mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.03, 28), darkSteel(), [cx, cy + 0.215, 0]));
  airT.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 24), blackPaint(), [cx, cy + 0.015, 0]));
  airT.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 10), steel(), [cx, cy + 0.26, 0]));
  const hosePts = [
    v3(0, ay + 0.2, 0),
    v3(0.04, ay + 0.28, 0),
    v3(cx - 0.04, ay + 0.26, 0),
    v3(cx - 0.075, cy + 0.14, 0),
  ];
  airT.add(mesh(tubeGeometry(hosePts, 0.022, 28, 12), hose()));
  airT.add(mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16), steel(), [0, ay + 0.2, 0]));
  // a clamp holding the cleaner
  airT.add(mesh(stick(v3(0.0, ay - 0.1, 0.0), v3(cx - 0.07, cy + 0.05, 0), 0.01, 6), steel()));
  for (const g of [mixer, gasT, airT]) mergeStatic(g, { name: g.name });
  const root = group('mixer');
  root.add(mixer, gasT, airT);
  void rubber;
  void engineBlock;
  return {
    group: root,
    mixer,
    gasThrottle: gasT,
    airThrottle: airT,
    gasLever: gLever,
    airLever: aLever,
    ports: { gas: port(endX - PIPE.flangeT, gy, 0, -1, 0, 0), tap: port(0, 0.05, R + 0.032, 0, 0, 1, 0.005) },
  };
}

/** The intake manifold under the mixer: a short pipe with the flange on top. In the tractor it is the engine's; in the gas-train world it carries the mixer. Local frame as the mixer's. */
export function buildManifold(): THREE.Group {
  const g = group('manifold');
  const m = MIXER.manifold;
  g.add(mesh(new THREE.CylinderGeometry(m.r, m.r, m.len, 20), castIron(), [m.len / 2 - 0.1, -0.05, 0]));
  g.children[0]!.rotation.z = Math.PI / 2;
  g.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 28), castIron(), [0, -0.02, 0]));
  return g;
}

// ============================================================================================= the water gauge

export interface GaugePiece extends Piece {
  left: THREE.Mesh;
  right: THREE.Mesh;
  /** Height of the middle of the scale, m. */
  mid: number;
}

/** The water gauge, local frame: origin at the foot of its board, centre, facing +x (the board's face). A U-tube on a board with a scale: ticks only, no figure. */
export function buildGauge(): GaugePiece {
  const g = part('water-gauge');
  const H = GAUGE.h;
  const board = softBox(-0.012, H / 2 + 0.02, 0, 0.018, H + 0.07, 0.12, 0.006);
  g.add(mesh(board, new THREE.MeshStandardMaterial({ color: 0xe2d8c0, roughness: 0.8 })));
  // the two legs of the U-tube and the bend under them, in clear glass
  const legX = 0.0;
  const zs = [-0.03, 0.03];
  const glass = jarGlass();
  for (const z of zs) {
    const t = new THREE.CylinderGeometry(GAUGE.tubeR, GAUGE.tubeR, H, 14, 1, true);
    g.add(mesh(t, glass, [legX, 0.02 + H / 2, z]));
  }
  const bend = new THREE.TorusGeometry(0.03, GAUGE.tubeR, 8, 16, Math.PI);
  bend.rotateZ(Math.PI);
  g.add(mesh(bend, glass, [legX, 0.02, 0]));
  // the scale: a tick every 50 mm, a longer one every 100 (the model's range is a few hundred millimetres of water)
  const ticks: THREE.BufferGeometry[] = [];
  const range = H;
  for (let k = 0; k <= Math.round(range / 0.025); k++) {
    const y = 0.02 + k * 0.025;
    if (y > 0.02 + H) break;
    const long = k % 4 === 0;
    ticks.push(boxAt(0.0, y - 0.0007, -0.0 + (long ? 0.04 : 0.043), 0.001, y + 0.0007, 0.054));
    ticks.push(boxAt(0.0, y - 0.0007, -0.054, 0.001, y + 0.0007, -(long ? 0.04 : 0.043)));
  }
  g.add(mesh(joined(ticks), blackPaint()));
  // the clips on the board and the hose at the top of one leg, each clip held by two screws; the board stands in a steel foot, screwed to the plinth
  for (const y of [0.1, H - 0.05]) {
    g.add(mesh(softBox(0.0, y, 0, 0.012, 0.014, 0.1, 0.003), steel()));
    for (const z of [-0.04, 0.04])
      g.add(
        mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 6).rotateZ(Math.PI / 2), darkSteel(), [0.008, y, z]),
      );
  }
  g.add(mesh(softBox(-0.012, 0.014, 0, 0.05, 0.026, 0.16, 0.004), darkSteel()));
  for (const z of [-0.065, 0.065])
    g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 6), steel(), [-0.012, 0.029, z]));
  g.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.03, 10), brassMat(), [legX, 0.02 + H + 0.012, zs[1]!]));
  // the water, one column to each leg, scaled each frame
  const wm = blackWater().clone();
  wm.color.set(0x3f7fb8);
  wm.opacity = 0.9;
  wm.userData.noShare = true;
  const wl = new THREE.Mesh(
    new THREE.CylinderGeometry(GAUGE.tubeR * 0.82, GAUGE.tubeR * 0.82, 1, 12).translate(0, 0.5, 0),
    wm,
  );
  const wr = new THREE.Mesh(wl.geometry, wm);
  wl.position.set(legX, 0.02, zs[0]!);
  wr.position.set(legX, 0.02, zs[1]!);
  for (const w of [wl, wr]) {
    w.castShadow = false;
    dynamic(w);
    g.add(w);
  }
  mergeStatic(g, { name: g.name });
  return {
    group: g,
    left: wl,
    right: wr,
    mid: 0.02 + H * 0.45,
    ports: { tap: port(legX, 0.02 + H + 0.027, zs[1]!, 0, 1, 0, 0.004) },
  };
}
