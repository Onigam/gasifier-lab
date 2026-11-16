import * as THREE from 'three';
import { group, mesh, rng } from '@onigam/lab-kit/three';
import { COLUMN, DEG, FITTINGS, HEARTH, UNIT, ZONES } from '../dims';
import {
  TAU,
  boxAt,
  capPolygon,
  clockwise,
  cylX,
  joined,
  latheCrisp,
  shellOf,
  solidLathe,
  stick,
  tubeGeometry,
  turnOf,
  uvMetric,
  v3,
  wallCap,
} from '../common';
import {
  ashMat,
  blackPaint,
  bright,
  brassMat,
  charMat,
  cutMetal,
  darkSteel,
  hotCasing,
  hose as hoseMat,
  jarGlass,
  blackWater,
  perforated,
  rubber,
  steel,
  tarFilm,
  upperCasing,
  weldBead,
  zincMat,
} from '../materials';
import { dynamic, mergeStatic } from '../merge';
import { bedMaterial, chipMaterial, hotMetal } from './field';

// The F-5 gasifier unit, built once for every world: whole on the tractor and in the farm, in section in `gasifier`, and in the garage. Its own frame U: origin on the axis at the foot of the lower casing, the tractor's axes (+x where the gas
// leaves, −x where the air comes in, −z the ash port and the left of the tractor). The section is geometry cut once when it is built, along the plane z = 0, the far half kept (z ≥ 0), each solid closed with a real face (docs/3d.md): nothing
// to clip, nothing to z-fight, and a click goes where the eye goes. What the picture is (Fig. 3.2a, 3.3, S1 §3.1.2): a straight fuel casing under a spring-loaded lid, a perforated sleeve in it that keeps the chips off the wall where the
// tars condense, a gutter at its foot and a drain; the lower casing with the fire box in it, a ring of seven air nozzles at the top of the box, a loose throat ring, a moving grate over the ash pit, and the gas leaving at about the throat's level.
//
// The sizes of the hot parts come from `NOT_PRINTED`, to scale, and nothing here prints them (R2).

export const UNIT_PARTS = [
  'spring-lid',
  'fuel-casing',
  'chip-column',
  'drying-zone',
  'pyrolysis-zone',
  'oxidation-zone',
  'reduction-zone',
  'fuel-baffle',
  'condensate-sleeve',
  'condensate-drain',
  'eccentric-lock',
  'outer-casing',
  'air-intake',
  'air-nozzles',
  'fire-box',
  'throat-ring',
  'grate',
  'grate-linkage',
  'ash-pit',
  'gas-outlet',
] as const;
export type UnitPartId = (typeof UNIT_PARTS)[number];

export interface UnitOptions {
  /** The unit cut along its axis, the far half kept. */
  cut: boolean;
}

/** What the unit needs of the state each frame. */
export interface UnitInput {
  /** 0..1 of the bunker's volume. */
  bunkerShare: number;
  engineOn: boolean;
  gasFlowShare: number;
  grateMoving: boolean;
  /** Lid lift: the gas pushing at a lid held down by its spring, 0..1. */
  lidPush: number;
  ashShare: number;
  /** The condensate in the drain's jar, 0..1. */
  jarShare: number;
  time: number;
  slowMo: number;
  dt: number;
}

export interface Unit {
  root: THREE.Group;
  cut: boolean;
  parts: Map<UnitPartId, THREE.Group>;
  /** Positions of the labels, in U, for the world to turn into anchors of the part. */
  anchors: Record<UnitPartId, THREE.Vector3>;
  /** The places where the gas train and the air attach, in U: centre of the flange face and the way out. */
  ports: { outlet: THREE.Vector3; intake: THREE.Vector3; drainEnd: THREE.Vector3 };
  /** The ring of nozzle tips (centre of each tip) and the root of each, in U. */
  nozzles: { tip: THREE.Vector3; root: THREE.Vector3 }[];
  /** The cursor of the journey: a chip of its own, at a height of U. */
  cursor: THREE.Group;
  update(i: UnitInput): void;
  /** The height of the top of the chips, in U. */
  level(): number;
}

const R = UNIT.lowerR;
const RB = UNIT.bunkerR;
const T = UNIT.wall;
const JY = UNIT.jointY;
const RIM = UNIT.rimTop;
const BOX_IN = HEARTH.boxR - HEARTH.boxWall;

/** The radius of the bed of chips and char at a height of U: the flare under the throat, the cone of the ring, the firebox, the hood, the sleeve, the casing. Drawn to scale; never printed. */
export function bedRadius(y: number): number {
  const ty = HEARTH.throatY;
  const g = HEARTH.grateY;
  const fbTop = HEARTH.nozzleY + HEARTH.boxTopAboveNozzle;
  const hoodTop = JY - 0.035;
  const sleeveIn = UNIT.sleeve.R - 0.006;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
  if (y <= g) return BOX_IN;
  if (y < ty) return Math.min(BOX_IN, HEARTH.throatR + (ty - y) * 1.0);
  const ringTop = ty + HEARTH.ring.h;
  if (y < ringTop) return lerp(HEARTH.throatR, HEARTH.ring.rimR, (y - ty) / HEARTH.ring.h);
  if (y < ringTop + 0.006) return lerp(HEARTH.ring.rimR, BOX_IN, (y - ringTop) / 0.006);
  if (y < fbTop) return BOX_IN;
  if (y < hoodTop) return lerp(BOX_IN, RB - 0.015, (y - fbTop) / (hoodTop - fbTop));
  const sleeveBottom = JY + UNIT.sleeve.y0 + 0.02;
  if (y < sleeveBottom) return lerp(RB - 0.015, sleeveIn, (y - hoodTop) / (sleeveBottom - hoodTop));
  const sleeveTop = JY + UNIT.sleeve.y0 + UNIT.sleeve.h;
  if (y < sleeveTop) return sleeveIn;
  if (y < sleeveTop + 0.012) return lerp(sleeveIn, RB - 0.012, (y - sleeveTop) / 0.012);
  return RB - 0.012;
}

/** The profile of a stretch of the bed, [r, y] pairs from y0 to y1, with a point at each corner of `bedRadius`. */
function bedProfile(y0: number, y1: number): [number, number][] {
  const ys = new Set<number>([y0, y1]);
  const ty = HEARTH.throatY;
  const ringTop = ty + HEARTH.ring.h;
  const fbTop = HEARTH.nozzleY + HEARTH.boxTopAboveNozzle;
  const hoodTop = JY - 0.035;
  const sb = JY + UNIT.sleeve.y0 + 0.02;
  const st = JY + UNIT.sleeve.y0 + UNIT.sleeve.h;
  for (const y of [HEARTH.grateY, ty, ringTop, ringTop + 0.006, fbTop, hoodTop, sb, st, st + 0.012])
    if (y > y0 && y < y1) ys.add(y);
  const n = Math.max(2, Math.round((y1 - y0) / 0.03));
  for (let i = 1; i < n; i++) ys.add(y0 + ((y1 - y0) * i) / n);
  return [...ys].sort((a, b) => a - b).map((y) => [bedRadius(y), y]);
}

const radial = (name: string, theta: number, x = 0, y = 0, z = 0): THREE.Group => {
  const g = group(name);
  g.position.set(x, y, z);
  g.rotation.y = -theta;
  return g;
};

/** A hex bolt head, base at y = 0, along +Y. */
const boltGeo = (r = 0.008, h = 0.006): THREE.BufferGeometry => {
  const g = new THREE.CylinderGeometry(r, r, h, 6);
  g.translate(0, h / 2, 0);
  return g;
};

/** A round reinforcing pad on a casing's wall round a port, on the +x or −x side, with its ring of bolts: the plate fabricated vessels take where a pipe goes through. Whole unit only (the section's wall is cut there). `R` the wall's radius. */
function pad(parent: THREE.Object3D, R: number, sx: number, y: number, r: number): void {
  // a lathe faces outward when its profile runs up the outside: x from the smaller to the larger
  const g = cylX(
    Math.min(sx * (R - 0.01), sx * (R + 0.008)),
    Math.max(sx * (R - 0.01), sx * (R + 0.008)),
    r,
    false,
    32,
  );
  g.translate(0, y, 0);
  parent.add(mesh(g, darkSteel()));
  const bolts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + 0.2;
    const b = boltGeo(0.007, 0.006);
    b.rotateZ((-sx * Math.PI) / 2);
    b.translate(sx * (R + 0.008), y + Math.cos(a) * (r - 0.014), Math.sin(a) * (r - 0.014));
    bolts.push(b);
  }
  parent.add(mesh(joined(bolts), steel()));
}

/** A ring of polygon [r0, r1] × [y0, y1] as a closed profile of [r, y]. */
const ringPoly = (r0: number, r1: number, y0: number, y1: number): [number, number][] => [
  [r0, y0],
  [r1, y0],
  [r1, y1],
  [r0, y1],
];

/** A solid ring or disc of revolution: its lathe, and its cut face when the unit is cut. */
function solid(
  poly: [number, number][],
  mat: THREE.Material,
  cut: boolean,
  parent: THREE.Object3D,
  seg = 48,
  cap: THREE.Material = cutMetal(),
): void {
  const { phiStart, phiLength } = turnOf(cut);
  const g = solidLathe(poly, seg, phiStart, phiLength);
  parent.add(mesh(g, mat));
  if (cut) {
    const c = mesh(capPolygon(poly), cap);
    c.castShadow = false;
    parent.add(c);
  }
}

/** A rectangular face at the cut plane (z = 0), facing the front. */
function rectCap(x0: number, x1: number, y0: number, y1: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0));
  g.rotateY(Math.PI);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
  return g;
}

/** UVs of a revolved shape in metres, round and along, for a texture of chips. */
function uvCyl(g: THREE.BufferGeometry, scale = 1): THREE.BufferGeometry {
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    uv[i * 2] = Math.atan2(x, z) * Math.max(0.05, Math.hypot(x, z)) * scale;
    uv[i * 2 + 1] = p.getY(i) * scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** UVs of a flat shape lying in the horizontal plane, in metres. */
function uvPlan(g: THREE.BufferGeometry, scale = 1): THREE.BufferGeometry {
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) * scale;
    uv[i * 2 + 1] = p.getZ(i) * scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** A coil spring along Y, unit height, radius r, `turns`, wire radius w. */
function coil(r: number, w: number, turns: number, seg = 10): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const n = turns * 12;
  for (let i = 0; i <= n; i++) {
    const a = (i / 12) * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * r, i / n, Math.sin(a) * r));
  }
  return tubeGeometry(pts, w, n * 2, seg);
}

export function buildUnit(opts: UnitOptions): Unit {
  const cut = opts.cut;
  const { phiStart, phiLength } = turnOf(cut);
  const root = group(cut ? 'unit-section' : 'unit');
  const parts = new Map<UnitPartId, THREE.Group>();
  const anchors = {} as Record<UnitPartId, THREE.Vector3>;
  const part = (id: UnitPartId, at: [number, number, number]): THREE.Group => {
    const g = group(id);
    g.userData.partId = id;
    root.add(g);
    parts.set(id, g);
    anchors[id] = v3(...at);
    return g;
  };

  // ---- the bed's materials: one for every stretch of the column
  // the cut face of the bed sits a little darker than the pieces that lie on it, so that the gaps between the pieces read as gaps
  const bed = bedMaterial(undefined, cut ? 0.74 : 1);
  const chipMat = chipMaterial(cut ? 0.74 : 1);
  const metal = hotMetal(0x3b3632, { roughness: 0.62, metalness: 0.55 });
  const metalLight = hotMetal(0x5a5650, { roughness: 0.55, metalness: 0.6 });
  const ceramic = hotMetal(0x4f463d, { roughness: 0.9, metalness: 0.05 });
  // the cut face of a hot part: dark steel that takes the fire's glow like the rest of it, so that in the section it stands out from the bed's false colours (the casings' walls keep the pale face of every section)
  const hotCut = hotMetal(0x3b342e, { roughness: 0.8, metalness: 0.15, glow: 0.5 });

  const keep = (z: number): boolean => !cut || z >= -1e-6;
  /** The seam of a rolled plate: a weld bead standing a few millimetres proud of the wall, from y0 to y1, at the angle `theta`. */
  const seam = (parent: THREE.Object3D, theta: number, radius: number, y0: number, y1: number): void => {
    if (!keep(Math.sin(theta) * radius)) return;
    const g = radial('seam', theta);
    g.add(mesh(boxAt(radius - 0.001, y0, -0.006, radius + 0.003, y1, 0.006), weldBead()));
    parent.add(g);
  };

  // ============================================================================================= outer casing, the lower one
  const outer = part('outer-casing', [0.0, 0.62, R]);
  {
    const prof: [number, number][] = [
      [R, 0.006],
      [R, JY],
    ];
    const { shell, cap } = shellOf(prof, T, cut, 56);
    const m = mesh(shell, hotCasing(cut ? 3.5 : 7, 2));
    outer.add(m);
    if (cap) outer.add(mesh(cap, cutMetal()));
    // the bottom plate and the ring the unit stands on
    solid(
      [
        [0, 0],
        [R, 0],
        [R, 0.006],
        [0, 0.006],
      ],
      hotCasing(1, 1),
      cut,
      outer,
      56,
    );
    solid(ringPoly(R - 0.001, UNIT.baseR, 0, 0.012), darkSteel(), cut, outer, 56);
    // the weld beads and the collar of the joint
    for (const y of [0.3, 0.5]) solid(ringPoly(R, R + 0.003, y - 0.004, y + 0.004), darkSteel(), cut, outer, 56);
    solid(ringPoly(R, R + 0.012, JY - 0.03, JY - 0.004), darkSteel(), cut, outer, 56);
    // bolts of the base ring
    const bolts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.13;
      const x = Math.sin(a) * (R + 0.0125);
      const z = Math.cos(a) * (R + 0.0125);
      if (!keep(z)) continue;
      const g = boltGeo(0.0085, 0.007);
      g.translate(x, 0.012, z);
      bolts.push(g);
    }
    if (bolts.length) outer.add(mesh(joined(bolts), steel()));
    // the gas port and the intake are cut through the wall: collars
    const collar = (x: number, y: number): void => {
      const sgn = Math.sign(x);
      const g = cylX(
        Math.min(sgn * (R - 0.004), sgn * (R + 0.012)),
        Math.max(sgn * (R - 0.004), sgn * (R + 0.012)),
        0.047,
        cut,
        24,
      );
      g.translate(0, y, 0);
      outer.add(mesh(g, darkSteel()));
    };
    collar(1, FITTINGS.outletY);
    collar(-1, FITTINGS.intakeY);
    if (!cut) {
      pad(outer, R, 1, FITTINGS.outletY, 0.075);
      pad(outer, R, -1, FITTINGS.intakeY, 0.075);
    }
    // the seam of the rolled plate, a weld bead, up the side
    for (const th of [300, 120]) seam(outer, th * DEG, R, 0.03, JY - 0.036);
  }

  // ============================================================================================= fuel casing
  const fuel = part('fuel-casing', [-RB, 1.2, 0]);
  {
    const prof: [number, number][] = [
      [RB, JY],
      [RB, RIM],
    ];
    const { shell, cap } = shellOf(prof, T, cut, 64);
    fuel.add(mesh(shell, upperCasing(cut ? 3.5 : 7, 2)));
    if (cap) fuel.add(mesh(cap, cutMetal()));
    // the rolled rim, the weld beads at the seam and under the lid's lugs
    solid(ringPoly(RB - 0.004, RB + 0.009, RIM - 0.012, RIM + 0.002), darkSteel(), cut, fuel, 64);
    for (const y of [1.2, 1.42]) solid(ringPoly(RB, RB + 0.003, y - 0.004, y + 0.004), darkSteel(), cut, fuel, 64);
    // the lugs for the lid's hinge (on the air side) and the latch
    const lugs: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      const g = new THREE.BoxGeometry(0.05, 0.05, 0.035);
      g.translate(sx * (RB + 0.022), RIM - 0.026, 0.0);
      lugs.push(g);
    }
    fuel.add(mesh(joined(lugs), darkSteel()));
    for (const th of [300, 120]) seam(fuel, th * DEG, RB, JY + 0.036, RIM - 0.03);
  }

  // ============================================================================================= the eccentric lock and the band
  const lock = part('eccentric-lock', [-(UNIT.band.R + 0.02), JY, 0.08]);
  {
    solid(ringPoly(RB + 0.001, UNIT.band.R, JY - UNIT.band.h / 2, JY + UNIT.band.h / 2), darkSteel(), cut, lock, 64);
    // the clamp at the air side, on the far half: two lugs, a pin, an eccentric cam, a handle and a hook
    const theta = 165 * DEG;
    const g = radial('lock', theta, 0, JY, 0);
    const lugGeo = new THREE.BoxGeometry(0.045, 0.06, 0.012);
    const a = mesh(lugGeo, darkSteel(), [UNIT.band.R + 0.022, 0, -0.022]);
    const b = mesh(lugGeo.clone(), darkSteel(), [UNIT.band.R + 0.022, 0, 0.022]);
    g.add(a, b);
    const pinG = new THREE.CylinderGeometry(0.006, 0.006, 0.07, 10);
    pinG.rotateX(Math.PI / 2);
    g.add(mesh(pinG, bright(), [UNIT.band.R + 0.035, 0.006, 0]));
    const cam = new THREE.CylinderGeometry(0.02, 0.02, 0.026, 18);
    cam.rotateX(Math.PI / 2);
    g.add(mesh(cam, zincMat(), [UNIT.band.R + 0.035, 0.006, 0]));
    // the handle, swung down along the casing
    const handle = new THREE.BoxGeometry(0.014, 0.17, 0.012);
    const h = mesh(handle, blackPaint(), [UNIT.band.R + 0.06, -0.075, 0]);
    h.rotation.z = -0.3;
    g.add(h);
    const grip = new THREE.CylinderGeometry(0.009, 0.009, 0.07, 10);
    grip.translate(0, -0.035, 0);
    const gm = mesh(grip, rubber(), [UNIT.band.R + 0.08, -0.145, 0]);
    gm.rotation.z = -0.3;
    g.add(gm);
    // the hook and the counter-pin on the band's other side of the gap
    const hook = new THREE.BoxGeometry(0.06, 0.012, 0.012);
    g.add(mesh(hook, steel(), [UNIT.band.R + 0.018, -0.02, 0]));
    lock.add(g);
    if (!cut) {
      // a second one, opposite, on the whole unit
      const g2 = g.clone();
      g2.rotation.y = -(165 + 180) * DEG;
      lock.add(g2);
    }
  }

  // ============================================================================================= the perforated sleeve (the fuel baffle)
  const baffle = part('fuel-baffle', [-UNIT.sleeve.R, JY + 0.3, 0]);
  {
    const y0 = JY + UNIT.sleeve.y0;
    const y1 = y0 + UNIT.sleeve.h;
    const mat = perforated().clone();
    mat.userData.noShare = false;
    const alpha = (mat.alphaMap as THREE.Texture).clone();
    alpha.repeat.set(cut ? 18 : 36, 3.6);
    alpha.needsUpdate = true;
    mat.alphaMap = alpha;
    mat.name = cut ? 'perforated-half' : 'perforated';
    const { shell, cap } = shellOf(
      [
        [UNIT.sleeve.R, y0],
        [UNIT.sleeve.R, y1],
      ],
      0.003,
      cut,
      64,
    );
    baffle.add(mesh(shell, mat));
    if (cap) baffle.add(mesh(cap, cutMetal()));
    solid(ringPoly(UNIT.sleeve.R - 0.003, UNIT.sleeve.R + 0.004, y0 - 0.002, y0 + 0.012), darkSteel(), cut, baffle, 64);
    solid(ringPoly(UNIT.sleeve.R - 0.003, UNIT.sleeve.R + 0.006, y1 - 0.01, y1 + 0.002), darkSteel(), cut, baffle, 64);
  }

  // ============================================================================================= the condensate sleeve: the gutter, the film on the cold wall
  const sleeve = part('condensate-sleeve', [RB - 0.02, JY + 0.12, 0]);
  {
    // the gutter at the foot of the gap
    solid(ringPoly(UNIT.sleeve.R + 0.004, RB - 0.004, JY + 0.002, JY + 0.008), darkSteel(), cut, sleeve, 64);
    solid(
      ringPoly(UNIT.sleeve.R + 0.004, UNIT.sleeve.R + 0.008, JY + 0.002, JY + UNIT.gutter.h),
      darkSteel(),
      cut,
      sleeve,
      64,
    );
    // the film: tar and water running down the cold wall
    const film = latheCrisp(
      [
        [RB - 0.0055, JY + 0.008],
        [RB - 0.0055, 1.26],
      ],
      64,
      phiStart,
      phiLength,
    );
    sleeve.add(mesh(film, tarFilm()));
    sleeve.children[sleeve.children.length - 1]!.castShadow = false;
  }

  // ============================================================================================= fire box and hood
  const box = part('fire-box', [-HEARTH.boxR, HEARTH.throatY, 0]);
  {
    const y0 = HEARTH.grateY - 0.012;
    const y1 = HEARTH.nozzleY + HEARTH.boxTopAboveNozzle;
    const wall: [number, number][] = [
      [HEARTH.boxR, y0],
      [HEARTH.boxR, y1],
    ];
    const hoodTop: [number, number][] = [
      [HEARTH.boxR, y1],
      [RB - 0.006, JY - 0.035],
    ];
    for (const prof of [wall, hoodTop]) {
      const g = latheCrisp(prof, 56, phiStart, phiLength);
      box.add(mesh(g, metal));
      if (cut) box.add(mesh(wallCap(prof, HEARTH.boxWall), hotCut));
    }
    // the ring the grate rests on, and the three brackets that carry the throat ring's support
    solid(
      ringPoly(HEARTH.boxR - HEARTH.boxWall - 0.012, HEARTH.boxR - HEARTH.boxWall, y0 + 0.004, y0 + 0.022),
      metalLight,
      cut,
      box,
      56,
      hotCut,
    );
    const br: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU + 0.5;
      const x = Math.cos(a) * (HEARTH.boxR - HEARTH.boxWall - 0.008);
      const z = Math.sin(a) * (HEARTH.boxR - HEARTH.boxWall - 0.008);
      if (!keep(z)) continue;
      const g = new THREE.BoxGeometry(0.02, 0.016, 0.02);
      g.rotateY(-a);
      g.translate(x, HEARTH.throatY - HEARTH.ring.plate - 0.016, z);
      br.push(g);
    }
    if (br.length) box.add(mesh(joined(br), metalLight));
  }

  // ============================================================================================= throat ring
  const ring = part('throat-ring', [-HEARTH.ring.rimR, HEARTH.throatY + 0.02, 0]);
  {
    const ty = HEARTH.throatY;
    const poly: [number, number][] = [
      [HEARTH.throatR, ty - HEARTH.ring.plate],
      [BOX_IN - 0.001, ty - HEARTH.ring.plate],
      [BOX_IN - 0.001, ty + HEARTH.ring.h],
      [HEARTH.ring.rimR, ty + HEARTH.ring.h],
      [HEARTH.throatR, ty],
    ];
    solid(poly, ceramic, cut, ring, 56, hotCut);
  }

  // ============================================================================================= nozzles and their plenum
  const noz = part('air-nozzles', [-0.14, HEARTH.nozzleY + 0.03, 0.06]);
  const nozzles: { tip: THREE.Vector3; root: THREE.Vector3 }[] = [];
  {
    const y = HEARTH.nozzleY;
    const rootR = HEARTH.nozzleTipR + HEARTH.nozzleLength;
    solid(
      ringPoly(HEARTH.plenum.r0 - HEARTH.boxWall - 0.034, BOX_IN - 0.001, y - 0.012, y + HEARTH.plenum.h - 0.012),
      metalLight,
      cut,
      noz,
      56,
      hotCut,
    );
    const tilt = 15 * DEG;
    const tubes: THREE.BufferGeometry[] = [];
    const holes: THREE.BufferGeometry[] = [];
    for (let k = 0; k < HEARTH.nozzleCount; k++) {
      // the first nozzle lies in the plane of the cut, on the air's side (the intake feeds the plenum there), so that the section shows one whole nozzle along its axis, from the plenum to its tip
      const a = (k / HEARTH.nozzleCount) * TAU + Math.PI;
      const dx = Math.cos(a);
      const dz = Math.sin(a);
      const tip = v3(dx * HEARTH.nozzleTipR, y, dz * HEARTH.nozzleTipR);
      const root = v3(dx * rootR, y + Math.tan(tilt) * HEARTH.nozzleLength, dz * rootR);
      nozzles.push({ tip, root });
      if (!keep(tip.z)) continue;
      const dir = tip.clone().sub(root);
      const len = dir.length();
      if (cut && Math.abs(tip.z) < 1e-6) {
        // cut open along its axis: the two walls of the tube in the plane, the bore between them, as far as the tip
        const wallT = 0.0025;
        const ri = Math.min(HEARTH.nozzleBore / 2, 0.0095 - wallT);
        const nz = group('nozzle-cut');
        solid(
          [
            [ri, 0],
            [0.0095, 0],
            [0.0105, len],
            [ri, len],
          ],
          metal,
          true,
          nz,
          20,
          hotCut,
        );
        // the cap stands a hair in front of the bed's, which is drawn at the same plane; so does the bore, dark: there are no chips in a nozzle
        for (const c of nz.children) if ((c as THREE.Mesh).isMesh && c.castShadow === false) c.position.z = -0.0008;
        const bore = mesh(
          capPolygon([
            [0, 0],
            [ri, 0],
            [ri, len],
            [0, len],
          ]),
          blackPaint(),
        );
        bore.castShadow = false;
        bore.position.z = -0.0004;
        nz.add(bore);
        nz.quaternion.setFromUnitVectors(v3(0, 1, 0), dir.clone().negate().normalize());
        nz.position.copy(tip);
        noz.add(nz);
        continue;
      }
      const g = new THREE.CylinderGeometry(0.0105, 0.0095, len, 14);
      const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize());
      g.applyMatrix4(new THREE.Matrix4().compose(root.clone().add(tip).multiplyScalar(0.5), q, v3(1, 1, 1)));
      tubes.push(g);
      // the bore: a dark disc a hair inside the tip
      const h = new THREE.CircleGeometry(HEARTH.nozzleBore / 2, 12);
      const qh = new THREE.Quaternion().setFromUnitVectors(v3(0, 0, 1), dir.clone().normalize());
      h.applyMatrix4(
        new THREE.Matrix4().compose(tip.clone().addScaledVector(dir.clone().normalize(), 0.0006), qh, v3(1, 1, 1)),
      );
      holes.push(h);
    }
    noz.add(mesh(joined(tubes), metal));
    noz.add(mesh(joined(holes), blackPaint()));
  }

  // ============================================================================================= the air intake
  const intake = part('air-intake', [-0.36, FITTINGS.intakeY + 0.05, 0.0]);
  const intakeEnd = v3(-0.4, FITTINGS.intakeY, 0);
  {
    const y = FITTINGS.intakeY;
    const pr = 0.0275;
    const pg = cylX(-0.4, -(HEARTH.plenum.r0 - HEARTH.boxWall - 0.034 + 0.01), pr, cut, 24, true);
    pg.translate(0, y, 0);
    intake.add(mesh(pg, darkSteel()));
    if (cut) {
      intake.add(mesh(rectCap(-0.4, -0.152, y + pr - 0.003, y + pr), cutMetal()));
      intake.add(mesh(rectCap(-0.4, -0.152, y - pr, y - pr + 0.003), cutMetal()));
    }
    // the flange where the primary-air valve bolts on
    const fl = cylX(-0.4, -0.392, 0.05, cut, 28);
    fl.translate(0, y, 0);
    intake.add(mesh(fl, darkSteel()));
    const bolts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + Math.PI / 4;
      if (!keep(Math.sin(a) * 0.04)) continue;
      const g = boltGeo(0.006, 0.006);
      g.rotateZ(Math.PI / 2);
      g.translate(-0.4, y + Math.cos(a) * 0.04, Math.sin(a) * 0.04);
      bolts.push(g);
    }
    if (bolts.length) intake.add(mesh(joined(bolts), steel()));
  }

  // ============================================================================================= the gas outlet
  const outlet = part('gas-outlet', [0.36, FITTINGS.outletY + 0.06, 0]);
  const outletEnd = v3(0.38, FITTINGS.outletY, 0);
  {
    const y = FITTINGS.outletY;
    const pr = FITTINGS.pipeR;
    const pg = cylX(R - 0.02, 0.38, pr, cut, 28, true);
    pg.translate(0, y, 0);
    outlet.add(mesh(pg, darkSteel()));
    if (cut) {
      outlet.add(mesh(rectCap(R - 0.02, 0.38, y + pr - 0.003, y + pr), cutMetal()));
      outlet.add(mesh(rectCap(R - 0.02, 0.38, y - pr, y - pr + 0.003), cutMetal()));
    }
    const fl = cylX(0.372, 0.38, 0.062, cut, 32);
    fl.translate(0, y, 0);
    outlet.add(mesh(fl, darkSteel()));
    const bolts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + 0.26;
      const z = Math.sin(a) * 0.05;
      if (!keep(z)) continue;
      const g = boltGeo(0.0065, 0.007);
      g.rotateZ(-Math.PI / 2);
      g.translate(0.38, y + Math.cos(a) * 0.05, z);
      bolts.push(g);
    }
    if (bolts.length) outlet.add(mesh(joined(bolts), steel()));
  }

  // ============================================================================================= the drain, its hose and its jar
  const drain = part('condensate-drain', [0.33, JY - 0.02, 0.12]);
  const jarAt = v3(0.36, 0, 0.27);
  const drainEnd = v3(0.36 * Math.cos(20 * DEG) + 0.0, JY - 0.07, 0.36 * Math.sin(20 * DEG));
  let jarWater: THREE.Mesh | null = null;
  {
    const th = 20 * DEG;
    const g = radial('nipple', th, 0, JY + 0.01, 0);
    // from the gutter, through the wall, bent down
    const a = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 12);
    a.rotateZ(Math.PI / 2);
    g.add(mesh(a, darkSteel(), [RB + 0.0, 0, 0]));
    const b = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 12);
    b.translate(0, -0.03, 0);
    g.add(mesh(b, darkSteel(), [RB + 0.045, 0, 0]));
    const barb = new THREE.CylinderGeometry(0.0085, 0.011, 0.025, 12);
    barb.translate(0, -0.0125, 0);
    g.add(mesh(barb, brassMat(), [RB + 0.045, -0.06, 0]));
    if (keep(Math.sin(th) * RB)) drain.add(g);
    // the hose, from the barb to the jar's cap
    const start = v3(Math.cos(th) * (RB + 0.045), JY + 0.01 - 0.085, Math.sin(th) * (RB + 0.045));
    const capTop = v3(jarAt.x, 0.215, jarAt.z);
    const pts = [
      start,
      start.clone().add(v3(0.02, -0.07, 0.02)),
      v3(jarAt.x + 0.03, 0.36, jarAt.z - 0.02),
      v3(jarAt.x, 0.28, jarAt.z),
      capTop,
    ];
    drain.add(mesh(tubeGeometry(pts, 0.0085, 40, 8), hoseMat()));
    // the jar: a glass-clear canister with black water in it, a screw cap
    const jar = group('jar');
    const body = new THREE.CylinderGeometry(0.07, 0.07, 0.2, 28, 1, true);
    body.translate(0, 0.1, 0);
    jar.add(mesh(body, jarGlass()));
    const base = new THREE.CylinderGeometry(0.07, 0.07, 0.006, 28);
    base.translate(0, 0.003, 0);
    jar.add(mesh(base, jarGlass()));
    const cap = new THREE.CylinderGeometry(0.052, 0.058, 0.025, 24);
    cap.translate(0, 0.2125, 0);
    jar.add(mesh(cap, blackPaint()));
    const w = new THREE.CylinderGeometry(0.0685, 0.0685, 1, 28);
    w.translate(0, 0.5, 0);
    jarWater = mesh(w, blackWater());
    jarWater.castShadow = false;
    jar.add(jarWater);
    jar.position.set(jarAt.x, jarAt.y, jarAt.z);
    drain.add(jar);
  }

  // ============================================================================================= grate (rocks) and its shaft
  const grate = part('grate', [0.0, HEARTH.grateY, 0.12]);
  const grateRock = dynamic(group('grate-rock'));
  // the grate rocks about its shaft, which is also the pivot of the linkage outside: one axis, so the two never part
  const shaftY = HEARTH.grateY - HEARTH.grate.barH - 0.006;
  grateRock.position.set(0, shaftY, 0);
  grate.add(grateRock);
  {
    const inner = BOX_IN - 0.008;
    const bars: THREE.BufferGeometry[] = [];
    const caps: THREE.BufferGeometry[] = [];
    const n = HEARTH.grate.bars;
    const pitch = (2 * inner * 0.96) / n;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * pitch;
      const half = Math.sqrt(Math.max(0.0004, inner * inner - x * x));
      const z0 = cut ? 0 : -half;
      const g = new THREE.BoxGeometry(HEARTH.grate.barW, HEARTH.grate.barH, half - z0);
      g.translate(x, HEARTH.grate.barH / 2 + 0.006, (half + z0) / 2);
      bars.push(g);
      if (cut) {
        const c = new THREE.PlaneGeometry(HEARTH.grate.barW, HEARTH.grate.barH);
        c.rotateY(Math.PI);
        c.translate(x, HEARTH.grate.barH / 2 + 0.006, 0);
        caps.push(c);
      }
    }
    grateRock.add(mesh(joined(bars), metal));
    if (caps.length) grateRock.add(mesh(joined(caps), hotCut));
    // two rails under the bars, and the shaft along the middle out to the gas side
    const rails: THREE.BufferGeometry[] = [];
    for (const z of [-0.1, 0.1]) {
      if (!keep(z)) continue;
      const g = new THREE.BoxGeometry(2 * inner * 0.9, 0.012, 0.014);
      g.translate(0, 0, z);
      rails.push(g);
    }
    if (rails.length) grateRock.add(mesh(joined(rails), metalLight));
    const shaft = cylX(-inner * 0.95, R + 0.02, HEARTH.grate.shaftR, cut, 16);
    grateRock.add(mesh(shaft, steel()));
    if (cut) grateRock.add(mesh(rectCap(-inner * 0.95, R + 0.02, -HEARTH.grate.shaftR, HEARTH.grate.shaftR), hotCut));
  }

  // ============================================================================================= the linkage outside
  const link = part('grate-linkage', [R + 0.13, HEARTH.grateY - 0.1, 0.0]);
  const linkRock = dynamic(group('link-rock'));
  linkRock.position.set(0, shaftY, 0);
  link.add(linkRock);
  {
    // the gland on the casing, a bearing plate, the shaft end, the crank and its handle
    const gx = R + 0.012;
    const gland = cylX(R, gx + 0.012, 0.03, cut, 24);
    gland.translate(0, shaftY, 0);
    link.add(mesh(gland, darkSteel()));
    const shaft = cylX(R + 0.02, R + 0.2, HEARTH.grate.shaftR, cut, 16);
    linkRock.add(mesh(shaft, steel()));
    if (cut) linkRock.add(mesh(rectCap(R + 0.02, R + 0.2, -HEARTH.grate.shaftR, HEARTH.grate.shaftR), cutMetal()));
    const bearing = cylX(R + 0.1, R + 0.125, 0.022, cut, 20);
    bearing.translate(0, shaftY, 0);
    link.add(mesh(bearing, darkSteel()));
    // the bearing is carried: a plate bolted to the casing under the gland and an arm from it to the bearing's foot
    const z0 = cut ? 0 : -0.05;
    const bk: THREE.BufferGeometry[] = [];
    bk.push(boxAt(R - 0.004, shaftY - 0.07, z0, R + 0.014, shaftY + 0.07, 0.05));
    bk.push(boxAt(R + 0.004, shaftY - 0.034, cut ? 0 : -0.014, R + 0.112, shaftY - 0.02, 0.014));
    for (const dy of [-0.05, 0.05])
      for (const z of [-0.03, 0.03]) {
        if (!keep(z)) continue;
        const b = boltGeo(0.0065, 0.005);
        b.rotateZ(-Math.PI / 2);
        b.translate(R + 0.014, shaftY + dy, z);
        bk.push(b);
      }
    link.add(mesh(joined(bk), darkSteel()));
    const crank = new THREE.BoxGeometry(0.022, 0.2, 0.012);
    crank.translate(R + 0.2, -0.1, 0.0);
    linkRock.add(mesh(crank, darkSteel()));
    const handle = new THREE.CylinderGeometry(0.011, 0.011, 0.1, 12);
    handle.rotateX(Math.PI / 2);
    handle.translate(R + 0.2, -0.2, 0.04);
    linkRock.add(mesh(handle, rubber()));
    const nut = new THREE.CylinderGeometry(0.014, 0.014, 0.012, 6);
    nut.rotateZ(Math.PI / 2);
    nut.translate(R + 0.208, 0, 0);
    linkRock.add(mesh(nut, bright()));
    // a ball on the end of the handle, the grip the hand shakes the grate with
    linkRock.add(mesh(new THREE.SphereGeometry(0.022, 16, 12), rubber(), [R + 0.2, -0.2, 0.1]));
  }

  // ============================================================================================= ash pit: the heap, the door
  const pit = part('ash-pit', [0.0, 0.08, -R]);
  const heap = dynamic(group('ash-heap'));
  pit.add(heap);
  {
    const r = BOX_IN - 0.02;
    // a sphere's sweep starts a quarter turn after a lathe's (x = −r cos φ, z = r sin φ, against r sin φ and r cos φ)
    const g = new THREE.SphereGeometry(1, 28, 14, phiStart + Math.PI / 2, phiLength, 0, Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const rnd = rng(77);
    for (let i = 0; i < p.count; i++) {
      const bump = 1 + 0.12 * (rnd() - 0.5) + 0.1 * Math.sin(p.getX(i) * 30) * Math.cos(p.getZ(i) * 26);
      p.setXYZ(i, p.getX(i) * bump, p.getY(i) * (0.9 + 0.2 * rnd()), p.getZ(i) * bump);
    }
    g.computeVertexNormals();
    const m = mesh(g, ashMat());
    m.scale.set(r, 0.12, r);
    m.position.y = 0.006;
    heap.add(m);
    if (cut) {
      // the heap's section, so that the dome is not a hollow shell seen from the open side
      const prof: [number, number][] = [[0, 0]];
      for (let k = 0; k <= 12; k++) {
        const a = (Math.PI / 2) * (k / 12);
        prof.push([0.985 * Math.cos(a), 0.985 * Math.sin(a)]);
      }
      const c = mesh(capPolygon(prof), ashMat());
      c.scale.set(r, 0.12, r);
      c.position.y = 0.006;
      c.castShadow = false;
      heap.add(c);
    }
    // a few pieces of char on it
    const rr = rng(3);
    const pcs: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 24; i++) {
      const a = rr() * TAU;
      const d = rr() * r * 0.85;
      const z = Math.sin(a) * d;
      if (!keep(z)) continue;
      const c = new THREE.BoxGeometry(0.016 + rr() * 0.02, 0.01 + rr() * 0.012, 0.014 + rr() * 0.016);
      c.rotateY(rr() * TAU);
      c.rotateZ((rr() - 0.5) * 0.7);
      c.translate(Math.cos(a) * d, 0.012 + 0.1 * (1 - (d / r) ** 2) * 0.9, z);
      pcs.push(c);
    }
    if (pcs.length) heap.add(mesh(joined(pcs), charMat()));
    // the door: a curved panel on the left of the tractor, hinged on the gas side, latched on the air side
    if (!cut) {
      const d = FITTINGS.ashDoor;
      const span = 34 * DEG;
      // the door: a steel plate standing proud of the wall on its frame, bolted round its edge, hinged on the gas side, latched on the air side with a bar handle
      const dh = d.y1 - d.y0;
      const dc = (d.y0 + d.y1) / 2;
      const frameG = new THREE.CylinderGeometry(
        R + 0.008,
        R + 0.008,
        dh + 0.03,
        32,
        1,
        true,
        Math.PI - span - 0.07,
        2 * span + 0.14,
      );
      frameG.translate(0, dc, 0);
      pit.add(mesh(frameG, darkSteel()));
      const doorGeo = new THREE.CylinderGeometry(R + 0.015, R + 0.015, dh, 32, 1, false, Math.PI - span, 2 * span);
      doorGeo.translate(0, dc, 0);
      pit.add(mesh(doorGeo, steel()));
      // what stands on the door's face, at an angle `phi` from its middle (towards the hinge, +x) and a height: the point and the way out
      const onDoor = (phi: number, y: number, rho: number): { p: THREE.Vector3; out: THREE.Vector3 } => ({
        p: v3(Math.sin(phi) * rho, y, -Math.cos(phi) * rho),
        out: v3(Math.sin(phi), 0, -Math.cos(phi)),
      });
      const along = (o: THREE.Vector3): THREE.Quaternion => new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), o);
      // bolts round the door's edge
      const edge: THREE.BufferGeometry[] = [];
      for (const phi of [-(span - 0.1), span - 0.1])
        for (const y of [d.y0 + 0.022, dc, d.y1 - 0.022]) {
          const { p, out } = onDoor(phi, y, R + 0.015);
          const g = boltGeo(0.0075, 0.006);
          g.applyQuaternion(along(out));
          g.translate(p.x, p.y, p.z);
          edge.push(g);
        }
      pit.add(mesh(joined(edge), steel()));
      // hinge knuckles (+x) and the latch (−x)
      const hk: THREE.BufferGeometry[] = [];
      for (const y of [d.y0 + 0.02, dc, d.y1 - 0.02]) {
        const k = onDoor(span, y, R + 0.02).p;
        const g = new THREE.CylinderGeometry(0.011, 0.011, 0.036, 10);
        g.translate(k.x, k.y, k.z);
        hk.push(g);
      }
      pit.add(mesh(joined(hk), bright()));
      const lt = onDoor(-span, dc, R + 0.02).p;
      const latch = new THREE.BoxGeometry(0.034, 0.06, 0.014);
      latch.translate(lt.x, lt.y, lt.z);
      pit.add(mesh(latch, steel()));
      // the handle: two posts and a bar across them, standing off the door by a few centimetres, along its free edge
      const hp: THREE.BufferGeometry[] = [];
      const ph = -span * 0.66;
      const lift = 0.03;
      for (const dy of [-0.055, 0.055]) {
        const { p, out } = onDoor(ph, dc + dy, R + 0.015);
        hp.push(stick(p, p.clone().addScaledVector(out, lift), 0.0055, 8));
      }
      const lo = onDoor(ph, dc - 0.07, R + 0.015 + lift);
      const hi = onDoor(ph, dc + 0.07, R + 0.015 + lift);
      hp.push(stick(lo.p, hi.p, 0.0075, 10));
      pit.add(mesh(joined(hp), bright()));
    }
  }

  // ============================================================================================= the spring lid
  const lid = part('spring-lid', [0.0, 1.76, 0.0]);
  const lidLift = dynamic(group('lid-lift'));
  lidLift.position.y = RIM;
  lid.add(lidLift);
  const springMesh = dynamic(mesh(coil(0.022, 0.0045, 5), zincMat()));
  {
    const L = UNIT.lid;
    const dish: [number, number][] = [
      [L.R, 0],
      [L.R - 0.015, 0.003],
      [L.R - 0.07, 0.01],
      [L.R * 0.5, 0.021],
      [0.04, L.dish - 0.002],
      [0, L.dish],
    ];
    const underside = dish.map(([r, y]) => [r, y - L.thick] as [number, number]);
    const lidTurn = latheCrisp(dish, 64, phiStart, phiLength);
    lidLift.add(mesh(lidTurn, darkSteel()));
    lidLift.add(mesh(latheCrisp(underside.slice().reverse(), 64, phiStart, phiLength), darkSteel()));
    if (cut) lidLift.add(mesh(wallCap(dish, L.thick), cutMetal()));
    // the lip and the seal under the rim
    solid(ringPoly(L.R - 0.002, L.R + 0.004, -0.014, 0.002), darkSteel(), cut, lidLift, 64);
    solid(ringPoly(RB - 0.012, RB + 0.003, -0.006, 0.0), rubber(), cut, lidLift, 64, rubber());
    // the guide rod up through the yoke, and its nut
    // its top ends a little inside the yoke's bar when the lid is shut, and under the bar's top when the lid is lifted
    const rodLen = L.yokeUnder - (RIM + L.dish) + 0.005;
    const rod = new THREE.CylinderGeometry(0.0065, 0.0065, rodLen, 12);
    rod.translate(0, L.dish + rodLen / 2, 0);
    lidLift.add(mesh(rod, bright()));
    // the spring between the lid and the yoke: unit height, scaled to the gap
    springMesh.position.set(0, RIM + L.dish, 0);
    springMesh.scale.y = L.yokeUnder - (RIM + L.dish);
    lid.add(springMesh);
    // the yoke: a bridge over the lid, its legs on the lugs of the rim; the latch lever on the gas side
    const bar = new THREE.BoxGeometry(2 * (RB + 0.022), 0.028, 0.03);
    bar.translate(0, UNIT.height - 0.014, 0);
    lid.add(mesh(bar, darkSteel()));
    if (cut) lid.add(mesh(rectCap(-(RB + 0.022), RB + 0.022, UNIT.height - 0.028, UNIT.height), cutMetal()));
    for (const sx of [-1, 1]) {
      const leg = new THREE.BoxGeometry(0.024, UNIT.height - RIM, 0.03);
      leg.translate(sx * (RB + 0.022), (UNIT.height + RIM) / 2, 0);
      lid.add(mesh(leg, darkSteel()));
    }
    // a carrying handle on the lid, off the middle: two posts and a bar, under the yoke's bar
    {
      const hx = 0.15;
      const hy = L.dish * 0.75;
      const hp: THREE.BufferGeometry[] = [];
      for (const z of [-0.05, 0.05]) if (keep(z)) hp.push(stick(v3(hx, hy, z), v3(hx, hy + 0.04, z), 0.005, 8));
      hp.push(stick(v3(hx, hy + 0.04, cut ? 0 : -0.05), v3(hx, hy + 0.04, 0.05), 0.0065, 10));
      lidLift.add(mesh(joined(hp), bright()));
    }
    // the hinge pin (air side) and the latch lever (gas side)
    const pin = new THREE.CylinderGeometry(0.0075, 0.0075, 0.06, 12);
    pin.rotateX(Math.PI / 2);
    lid.add(mesh(pin, bright(), [-(RB + 0.022), RIM - 0.026, 0]));
    const lever = new THREE.BoxGeometry(0.02, 0.2, 0.014);
    const lv = mesh(lever, blackPaint(), [RB + 0.05, RIM - 0.07, 0]);
    lv.rotation.z = 0.35;
    lid.add(lv);
    const grip = new THREE.CylinderGeometry(0.009, 0.009, 0.08, 10);
    grip.rotateZ(0);
    lid.add(mesh(grip, rubber(), [RB + 0.085, RIM - 0.17, 0]));
    // the hook of the latch
    const hook = new THREE.BoxGeometry(0.03, 0.012, 0.014);
    lid.add(mesh(hook, steel(), [RB + 0.032, RIM - 0.024, 0]));
  }

  // ============================================================================================= the chips: column and the four zones
  const level = (share: number): number => {
    const bottom = ZONES.drying.y1;
    const top = RIM - COLUMN.freeboard;
    return bottom + (top - bottom) * Math.min(1, Math.max(0, (share - 0.12) / 0.88));
  };
  const zoneIds = [
    ['reduction-zone', ZONES.reduction],
    ['oxidation-zone', ZONES.oxidation],
    ['pyrolysis-zone', ZONES.pyrolysis],
    ['drying-zone', ZONES.drying],
  ] as const;
  /**
   * The loose pieces of a bed in section: chips lying on its cut face, each a thin flake of the reported size (`COLUMN`), turned about the plane's normal, tilted a little so that an edge catches the light, standing a few millimetres proud of the face; wood in the
   * column and the upper zones, finer and darker charcoal below. Placed once, by rejection on a grid so that they overlap a little and leave gaps (seeded: the same section at every load).
   */
  const chipsOnFace = (y0: number, y1: number, seed: number, scale: number): THREE.InstancedMesh | null => {
    const r = rng(seed);
    const flake = new THREE.BoxGeometry(COLUMN.chipLength, COLUMN.chipWidth, COLUMN.chipThick);
    const cell = COLUMN.chipWidth * scale * 0.62;
    const taken = new Map<string, number>();
    const spots: { x: number; y: number; rot: number; s: number; tx: number; ty: number; z: number; tone: number }[] =
      [];
    let area = 0;
    for (let y = y0; y < y1; y += 0.01) area += 2 * bedRadius(y + 0.005) * 0.01;
    const want = Math.min(2600, Math.round((0.8 * area) / (COLUMN.chipLength * COLUMN.chipWidth * scale * scale)));
    // a piece stays inside its part's own height (within the box the whole unit has for it, to the millimetre: machine.test.ts): its centre a piece's half-length in from each end
    const pad = Math.min(0.012, (y1 - y0) / 3);
    for (let tries = 0; spots.length < want && tries < want * 5; tries++) {
      const y = y0 + pad + r() * (y1 - y0 - 2 * pad);
      const reach = bedRadius(y) - 0.008;
      const x = (2 * r() - 1) * reach;
      const key = `${Math.round(x / cell)}:${Math.round(y / cell)}`;
      if ((taken.get(key) ?? 0) >= 1) continue;
      taken.set(key, 1);
      spots.push({
        x,
        y,
        rot: (r() - 0.5) * 1.8,
        s: scale * (0.8 + 0.35 * r()),
        tx: (r() - 0.5) * 0.7,
        ty: (r() - 0.5) * 0.7,
        z: -0.001 + 0.004 * r(),
        tone: 0.8 + 0.4 * r(),
      });
    }
    if (!spots.length) return null;
    const im = new THREE.InstancedMesh(flake, chipMat, spots.length);
    const mtx = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const col = new THREE.Color();
    spots.forEach((p, i) => {
      e.set(p.tx, p.ty, p.rot);
      q.setFromEuler(e);
      mtx.compose(v3(p.x, p.y, p.z), q, v3(p.s, p.s, 1 + p.s));
      im.setMatrixAt(i, mtx);
      col.setScalar(p.tone);
      im.setColorAt(i, col);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    im.frustumCulled = false;
    im.name = 'bed-chips';
    return im;
  };
  const bedMesh = (y0: number, y1: number, g: THREE.Group, chips?: { seed: number; scale: number }): void => {
    const prof = bedProfile(y0, y1);
    const side = uvCyl(latheCrisp(prof, 56, phiStart, phiLength), 3);
    side.setAttribute('aCap', new THREE.BufferAttribute(new Float32Array(side.attributes.position.count), 1));
    g.add(mesh(side, bed));
    // the faces at the two ends, so that a stretch alone is a closed solid
    for (const [y, up] of [
      [y0, false],
      [y1, true],
    ] as const) {
      const r = bedRadius(y);
      // facing up the disc is turned about x by −90°, which flips its z: its sweep is mirrored so that it stays on the kept (far) half
      const d = new THREE.CircleGeometry(
        r,
        48,
        up ? -(phiStart + Math.PI / 2 + phiLength) : phiStart + Math.PI / 2,
        phiLength,
      );
      d.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
      d.translate(0, y, 0);
      uvPlan(d, 3);
      d.setAttribute('aCap', new THREE.BufferAttribute(new Float32Array(d.attributes.position.count), 1));
      g.add(mesh(d, bed));
    }
    if (cut) {
      const c = capPolygon([[0, y0], ...prof, [0, y1]]);
      g.add(mesh(c, bed));
      g.children[g.children.length - 1]!.castShadow = false;
      if (chips) {
        const im = chipsOnFace(y0, y1, chips.seed, chips.scale);
        if (im) g.add(im);
      }
    }
  };
  const bedGroups = new Map<string, THREE.Group>();
  for (const [id, z] of zoneIds) {
    const g = part(id, [-bedRadius((z.y0 + z.y1) / 2), (z.y0 + z.y1) / 2, 0]);
    // wood where it is dried and breaking down, charcoal and embers where it burns: smaller, and darker by their tone
    bedMesh(z.y0, z.y1, g, { seed: 70 + id.length, scale: id === 'drying-zone' || id === 'pyrolysis-zone' ? 1 : 0.75 });
    bedGroups.set(id, g);
  }
  const column = part('chip-column', [-0.05, 1.45, 0.03]);
  const colTop = ZONES.drying.y1;
  const colMax = RIM - COLUMN.freeboard;
  bedMesh(colTop, colMax, column, { seed: 61, scale: 1 });
  bedGroups.set('chip-column', column);
  // the top of the chips: a mound and loose flakes, riding the level
  const topGroup = dynamic(group('chip-top'));
  const topOffset = { value: 0 };
  const topBed = bedMaterial(topOffset, cut ? 0.74 : 1);
  column.add(topGroup);
  {
    const r0 = RB - 0.012;
    const g = new THREE.SphereGeometry(1, 36, 8, phiStart + Math.PI / 2, phiLength, 0, Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const rnd = rng(5);
    for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (1 + 0.15 * (rnd() - 0.5)));
    g.computeVertexNormals();
    uvCyl(g, 3);
    g.setAttribute('aCap', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1));
    const m = mesh(g, topBed);
    m.scale.set(r0, 0.07, r0);
    m.position.y = -0.03;
    topGroup.add(m);
    if (cut) {
      // the dome's section above the level, closed at the cut so that nothing looks into it
      const pts: [number, number][] = [[0, 0]];
      const x0 = r0 * 0.9035;
      pts.push([x0, 0]);
      for (let k = 1; k <= 10; k++) {
        const x = x0 * (1 - k / 10);
        pts.push([x, -0.03 + 0.07 * Math.sqrt(Math.max(0, 1 - (x / r0) ** 2))]);
      }
      const c = mesh(capPolygon(pts), topBed);
      c.castShadow = false;
      topGroup.add(c);
    }
    // loose flakes
    const flakes = new THREE.BoxGeometry(COLUMN.chipLength, COLUMN.chipThick, COLUMN.chipWidth);
    const N = cut ? 260 : 520;
    const im = new THREE.InstancedMesh(flakes, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), N);
    const r = rng(9);
    const mtx = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const col = new THREE.Color();
    let k = 0;
    for (let tries = 0; k < N && tries < 4000; tries++) {
      const a = r() * TAU;
      const d = Math.sqrt(r()) * (r0 - 0.012);
      const z = Math.sin(a) * d;
      if (cut && z < 0) continue;
      const h = 0.04 * (1 - (d / r0) ** 2) - 0.03 + 0.005 + r() * 0.012;
      e.set((r() - 0.5) * 0.9, r() * TAU, (r() - 0.5) * 0.9);
      q.setFromEuler(e);
      mtx.compose(v3(Math.cos(a) * d, h, z), q, v3(0.8 + r() * 0.5, 1, 0.8 + r() * 0.5));
      im.setMatrixAt(k, mtx);
      col.setHSL(0.09 + r() * 0.03, 0.5 + r() * 0.2, 0.34 + r() * 0.3);
      im.setColorAt(k, col);
      k++;
    }
    im.count = k;
    im.castShadow = false;
    im.receiveShadow = true;
    topGroup.add(im);
  }

  // ============================================================================================= the flames at the nozzles, the cursor of the journey
  const flames = dynamic(group('nozzle-flames'));
  root.add(flames);
  const flameMeshes: THREE.Mesh[] = [];
  {
    const fm = new THREE.MeshBasicMaterial({
      color: 0xffb04a,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    for (const n of nozzles) {
      if (!keep(n.tip.z)) continue;
      const g = new THREE.ConeGeometry(0.014, 0.075, 10, 1, true);
      g.translate(0, -0.0375, 0);
      const m = new THREE.Mesh(g, fm);
      m.position.copy(n.tip);
      m.userData.dir = n.tip.clone().sub(n.root).normalize();
      m.quaternion.setFromUnitVectors(v3(0, -1, 0), m.userData.dir as THREE.Vector3);
      m.castShadow = false;
      m.userData.noShadow = true;
      m.renderOrder = 6;
      flames.add(m);
      flameMeshes.push(m);
    }
  }
  const cursor = dynamic(group('journey-cursor'));
  {
    // the chip that travels: larger than the others and pale, with a little light of its own, so that it is the thing looked at and not only its ring
    const flake = new THREE.BoxGeometry(COLUMN.chipLength * 2.6, COLUMN.chipThick * 3.4, COLUMN.chipWidth * 2.6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfff1d0,
      roughness: 0.5,
      emissive: 0xffe2a0,
      emissiveIntensity: 0.9,
    });
    const chip = new THREE.Mesh(flake, mat);
    chip.name = 'chip';
    cursor.add(chip);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.036, 0.0014, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0xfff3d8, transparent: true, opacity: 0.85, depthTest: false }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.renderOrder = 30;
    halo.name = 'halo';
    cursor.add(halo);
    cursor.visible = false;
    cursor.position.set(0, 1.2, 0.01);
    root.add(cursor);
  }

  // ============================================================================================= static merge of every part
  for (const [, g] of parts) mergeStatic(g, { name: g.name });

  // ============================================================================================= update
  const lidBase = RIM;
  const spring0 = UNIT.lid.yokeUnder - (RIM + UNIT.lid.dish);
  let grateClock = 0;
  const update = (i: UnitInput): void => {
    // the chips: the top rides the level, the bed above it is clipped by the field's uniform
    const lv = level(i.bunkerShare);
    topGroup.position.y = lv;
    topOffset.value = lv;
    const rl = bedRadius(lv) / (RB - 0.012);
    topGroup.scale.set(rl, 1, rl);
    // the lid: pushed up by the gas against its spring, a few millimetres; the spring squashes with it
    const lift = 0.012 * Math.min(1, Math.max(0, i.lidPush));
    lidLift.position.y = lidBase + lift;
    springMesh.scale.y = spring0 - lift;
    // the grate rocks while the model says it is moved; the shaft's outer end and its crank go with it, so the linkage never lets go
    if (i.grateMoving) grateClock += i.dt * i.slowMo;
    const angle = i.grateMoving ? 0.2 * Math.sin(grateClock * 3.2) : 0;
    grateRock.rotation.x = angle;
    linkRock.rotation.x = angle;
    // the flames at the nozzles: only while the engine draws
    const f = i.engineOn ? 0.35 + 0.65 * i.gasFlowShare : 0;
    for (let k = 0; k < flameMeshes.length; k++) {
      const m = flameMeshes[k]!;
      const flick = 0.85 + 0.15 * Math.sin(i.time * 11 + k * 1.7) * Math.sin(i.time * 7.3 + k);
      m.visible = f > 0.01;
      m.scale.set(f * flick, f * (0.8 + 0.4 * flick), f * flick);
    }
    // the ash and the jar
    heap.scale.y = 0.35 + 0.65 * Math.min(1, i.ashShare);
    if (jarWater) {
      const h = 0.01 + 0.17 * Math.min(1, Math.max(0, i.jarShare));
      jarWater.scale.y = h;
    }
  };

  return {
    root,
    cut,
    parts,
    anchors,
    ports: { outlet: outletEnd, intake: intakeEnd, drainEnd },
    nozzles,
    cursor,
    update,
    level: () => topGroup.position.y,
  };
}

/** The cursor of the journey in U: where on the axis the model's share of the way down stands, in the geometry's own zones. The cursor's zone edges are the simulation's (`ZONE_EDGES`, not to scale); here each zone takes its own height. */
export function cursorY(c: number, top = RIM - 0.05): number {
  const edges: [number, number, number, number][] = [
    [0, 0.3, top, ZONES.drying.y0],
    [0.3, 0.55, ZONES.pyrolysis.y1, ZONES.pyrolysis.y0],
    [0.55, 0.7, ZONES.oxidation.y1, ZONES.oxidation.y0],
    [0.7, 0.95, ZONES.reduction.y1, ZONES.reduction.y0],
    [0.95, 1, HEARTH.grateY, 0.06],
  ];
  const u = Math.min(1, Math.max(0, c));
  for (const [a, b, ya, yb] of edges) if (u <= b) return ya + ((yb - ya) * (u - a)) / (b - a);
  return 0.06;
}

export { clockwise, uvMetric, boxAt };
