import * as THREE from 'three';
import { group, mesh, rng } from '@onigam/lab-kit/three';
import { FARM } from '../dims';
import { boxAt, joined, softBox, stick, uvMetric, v3 } from '../common';
import { dynamic, mergeStatic } from '../merge';
import { boardsMap, brickMap, chipsMap, masonryMap, shingleMap, tiled, woodMap } from '../textures';
import { terrainHeight } from './terrain';

// The buildings of the farm, built from the plan of `FARM` (estimates: no source gives any): a farmhouse of red-painted boards with white corners, a porch and a chimney; the chip barn, with its doors open on a heap of dry chips. The garage under its
// bedroom is drawn by `garage/building.ts`, the one function that also draws it cut open. Each building's frame: its centre on the ground, the long side facing +z (south), the ridge along x.

const mat = (
  p: THREE.MeshStandardMaterial['userData'] & THREE.MeshStandardMaterialParameters,
): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial(p);

export const RED_BOARDS = mat({ color: 0x8a2f24, map: tiled(boardsMap(), 1.2, 1.2), roughness: 0.88 });
export const WHITE_PAINT = mat({ color: 0xe9e4d6, roughness: 0.75 });
const STONE = mat({ color: 0x8a867d, map: tiled(masonryMap(), 0.6, 0.6), roughness: 0.95 });
const ROOF_SHEET = mat({ color: 0x4c4a4c, map: tiled(shingleMap(), 1.1, 1.1), roughness: 0.7, metalness: 0.2 });
const ROOF_TILE = mat({ color: 0x7a3a2a, map: tiled(shingleMap(), 1.0, 1.0), roughness: 0.85 });
const BRICK = mat({ color: 0xb2705a, map: tiled(brickMap(), 0.5, 0.5), roughness: 0.9 });
const GLASS = mat({ color: 0x2c3a46, roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.82 });
const WOOD_DARK = mat({ color: 0x5b4330, map: tiled(woodMap(), 1, 1), roughness: 0.9 });
const CURTAIN = mat({ color: 0xf0eadc, roughness: 1, side: THREE.DoubleSide });

/** A window of white frame and four panes, `w` wide, `h` high, facing +z, its origin at the middle of its sill. */
export function farmWindow(w: number, h: number, curtains = true): THREE.Group {
  const g = group('window');
  const t = 0.05;
  g.add(
    mesh(
      joined([
        boxAt(-w / 2, 0, 0, w / 2, t, 0.1),
        boxAt(-w / 2, h - t, 0, w / 2, h, 0.1),
        boxAt(-w / 2, 0, 0, -w / 2 + t, h, 0.1),
        boxAt(w / 2 - t, 0, 0, w / 2, h, 0.1),
        boxAt(-0.012, 0, 0.02, 0.012, h, 0.08),
        boxAt(-w / 2, h / 2 - 0.012, 0.02, w / 2, h / 2 + 0.012, 0.08),
      ]),
      WHITE_PAINT,
    ),
  );
  g.add(mesh(boxAt(-w / 2 + t, t, 0.035, w / 2 - t, h - t, 0.045), GLASS));
  // the sill, projecting
  g.add(mesh(boxAt(-w / 2 - 0.05, -0.04, 0.0, w / 2 + 0.05, 0.0, 0.16), WHITE_PAINT));
  if (curtains) {
    g.add(mesh(boxAt(-w / 2 + t, h * 0.45, -0.02, -w / 2 + t + w * 0.22, h - t - 0.03, -0.015), CURTAIN));
    g.add(mesh(boxAt(w / 2 - t - w * 0.22, h * 0.45, -0.02, w / 2 - t, h - t - 0.03, -0.015), CURTAIN));
  }
  return g;
}

/** The two slopes of a roof with its ridge along x, over a plan `w` (x) by `d` (z), eaves at y = 0 of the group, the ridge `rise` above them. */
function gableRoof(w: number, d: number, rise: number, overhang: number, m: THREE.Material, thick = 0.1): THREE.Group {
  const g = group('roof');
  const half = d / 2 + overhang;
  const slope = Math.atan2(rise, d / 2);
  const len = Math.hypot(half, (half / (d / 2)) * rise);
  for (const s of [-1, 1]) {
    const slab = new THREE.BoxGeometry(w + 2 * overhang, thick, len);
    uvMetric(slab);
    const mm = mesh(slab, m);
    mm.rotation.x = s * slope;
    mm.position.set(0, rise / 2 + (thick / 2) * Math.cos(slope) - 0.0, (s * half) / 2);
    g.add(mm);
  }
  // the ridge cap and the barge boards at the gables
  g.add(mesh(boxAt(-(w + 2 * overhang) / 2, rise - 0.02, -0.08, (w + 2 * overhang) / 2, rise + 0.14, 0.08), WOOD_DARK));
  for (const sx of [-1, 1])
    for (const s of [-1, 1]) {
      const b = new THREE.BoxGeometry(0.04, 0.2, len);
      const mm = mesh(b, WHITE_PAINT);
      mm.rotation.x = s * slope;
      mm.position.set(sx * ((w + 2 * overhang) / 2), rise / 2 - 0.02, (s * half) / 2);
      g.add(mm);
    }
  return g;
}

/** The gable wall: a pentagon in (z, y) extruded along x. */
function gableWall(d: number, wall: number, rise: number, thick: number, m: THREE.Material): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0);
  s.lineTo(d / 2, 0);
  s.lineTo(d / 2, wall);
  s.lineTo(0, wall + rise);
  s.lineTo(-d / 2, wall);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  // the shape lies in (z, y) of x = 0: turn it so that its x is z
  g.rotateY(-Math.PI / 2);
  uvMetric(g);
  return mesh(g, m);
}

export interface Building {
  group: THREE.Group;
  /** The base of the building on the land: the box the test rests it on. */
  base: THREE.Box3;
  /** Where the building's door opens. */
  door: THREE.Vector3;
}

/**
 * The farmhouse. `against` (−1 or 1): the gable that has a building built against it, in the house's own frame (x along its length): the roof stops flush with that gable instead of overhanging it, as a roof does over a wall that another house leans on.
 * Without it the house stands free, as in the farm; with it the garage world draws the same house beside its garage.
 */
export function buildFarmhouse(opts: { against?: -1 | 1 } = {}): Building {
  const { w, d, wall } = FARM.house;
  const g = group('farmhouse');
  g.userData.partId = 'farmhouse';
  const rise = 2.7;
  // the plinth: a course of stone round the house, then the boards; white corner boards
  g.add(mesh(boxAt(-w / 2 - 0.08, -0.3, -d / 2 - 0.08, w / 2 + 0.08, 0.5, d / 2 + 0.08), STONE));
  const body = uvMetric(new THREE.BoxGeometry(w, wall - 0.5, d).translate(0, 0.5 + (wall - 0.5) / 2, 0));
  g.add(mesh(body, RED_BOARDS));
  const corners: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      corners.push(
        boxAt(
          (sx * w) / 2 - 0.1 + (sx > 0 ? 0.04 : -0.04),
          0.5,
          (sz * d) / 2 - 0.1 + (sz > 0 ? 0.04 : -0.04),
          (sx * w) / 2 + 0.1 + (sx > 0 ? 0.04 : -0.04),
          wall,
          (sz * d) / 2 + 0.1 + (sz > 0 ? 0.04 : -0.04),
        ),
      );
  // a white band at the eaves and a belt between the floors
  corners.push(boxAt(-w / 2 - 0.05, wall - 0.12, d / 2, w / 2 + 0.05, wall + 0.04, d / 2 + 0.08));
  corners.push(boxAt(-w / 2 - 0.05, wall - 0.12, -d / 2 - 0.08, w / 2 + 0.05, wall + 0.04, -d / 2));
  corners.push(boxAt(-w / 2 - 0.04, 2.9, d / 2, w / 2 + 0.04, 3.0, d / 2 + 0.05));
  g.add(mesh(joined(corners), WHITE_PAINT));
  // gables above the eaves, the roof
  for (const sx of [-1, 1]) {
    const gw = gableWall(d, wall, rise, 0.25, RED_BOARDS);
    gw.position.set(sx * (w / 2 - 0.12), 0, 0);
    g.add(gw);
  }
  const roof = gableRoof(w, d, rise, 0.55, ROOF_SHEET);
  roof.position.y = wall;
  if (opts.against) {
    // one end of the roof without its overhang: shorter by one overhang, its middle moved away from the wall
    roof.scale.x = (w + 0.55) / (w + 2 * 0.55);
    roof.position.x = (-opts.against * 0.55) / 2;
  }
  g.add(roof);
  // windows: five on each floor of the south front, three on the north, two on each gable
  const wins = group('windows');
  const place = (x: number, y: number, z: number, ry: number, ww = 1.0, hh = 1.35): void => {
    const win = farmWindow(ww, hh);
    win.position.set(x, y, z);
    win.rotation.y = ry;
    wins.add(win);
  };
  for (let i = 0; i < 5; i++) {
    const x = -w / 2 + 1.5 + (i * (w - 3)) / 4;
    if (i !== 2) place(x, 1.2, d / 2, 0);
    place(x, 3.35, d / 2, 0);
    if (i < 3) {
      place(-w / 2 + 2.5 + i * 3.5, 1.2, -d / 2, Math.PI);
      place(-w / 2 + 2.5 + i * 3.5, 3.35, -d / 2, Math.PI);
    }
  }
  for (const s of [-1, 1]) {
    place((s * w) / 2, 1.2, 0.0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0.9, 1.2);
    place((s * w) / 2, 3.35, 0.0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0.9, 1.2);
  }
  g.add(wins);
  // front door under a porch: a door of boards, a lamp, a flight of stone steps, four posts, a lean-to roof
  const doorX = 0;
  g.add(mesh(boxAt(doorX - 0.5, 0.5, d / 2 - 0.02, doorX + 0.5, 2.5, d / 2 + 0.05), WOOD_DARK));
  g.add(mesh(boxAt(doorX - 0.58, 0.5, d / 2, doorX + 0.58, 2.62, d / 2 + 0.03), WHITE_PAINT));
  g.add(mesh(boxAt(doorX - 0.46, 0.55, d / 2 + 0.05, doorX + 0.46, 2.45, d / 2 + 0.07), WOOD_DARK));
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8).rotateZ(Math.PI / 2),
      mat({ color: 0xb5a76a, roughness: 0.4, metalness: 0.8 }),
      [doorX + 0.32, 1.4, d / 2 + 0.1],
    ),
  );
  const porch = group('porch');
  porch.add(mesh(boxAt(-1.6, 0.0, d / 2, 1.6, 0.5, d / 2 + 1.8), STONE));
  for (let k = 0; k < 3; k++)
    porch.add(
      mesh(boxAt(-1.2, k * 0.17 - 0.2, d / 2 + 1.8 + k * 0.3, 1.2, k * 0.17 + 0.0, d / 2 + 2.1 + k * 0.3), STONE),
    );
  for (const sx of [-1.45, 1.45])
    porch.add(mesh(boxAt(sx - 0.06, 0.5, d / 2 + 1.65, sx + 0.06, 2.9, d / 2 + 1.77), WHITE_PAINT));
  const pr = new THREE.BoxGeometry(3.6, 0.1, 2.3);
  const pm = mesh(pr, ROOF_SHEET);
  pm.position.set(0, 3.0, d / 2 + 0.95);
  pm.rotation.x = 0.12;
  porch.add(pm);
  porch.add(mesh(boxAt(-1.55, 2.2, d / 2 + 1.74, 1.55, 2.3, d / 2 + 1.8), WHITE_PAINT));
  g.add(porch);
  // the chimney: brick, with a cap, through the ridge near the east gable
  g.add(mesh(boxAt(w / 2 - 2.5, wall + 0.5, -0.5, w / 2 - 1.5, wall + rise + 1.4, 0.5), BRICK));
  g.add(mesh(boxAt(w / 2 - 2.6, wall + rise + 1.4, -0.6, w / 2 - 1.4, wall + rise + 1.55, 0.6), STONE));
  // window boxes with flowers, a bench by the door, a milk churn: the front's small life
  const fl = new THREE.Group();
  const r = rng(2);
  for (const x of [-w / 2 + 1.5, -w / 2 + 1.5 + (w - 3) / 4, w / 2 - 1.5]) {
    fl.add(mesh(boxAt(x - 0.5, 0.65, d / 2 + 0.12, x + 0.5, 0.82, d / 2 + 0.34), WOOD_DARK));
    for (let k = 0; k < 9; k++) {
      const s = new THREE.SphereGeometry(0.07, 8, 6);
      s.translate(x - 0.45 + k * 0.11, 0.9 + 0.05 * r(), d / 2 + 0.23);
      fl.add(mesh(s, mat({ color: r() > 0.5 ? 0xc8344a : 0xf0b8c4, roughness: 0.9 })));
    }
  }
  g.add(fl);
  // a bench by the door: a seat on four legs, a back
  g.add(
    mesh(
      joined([
        boxAt(2.0, 0.42, d / 2 + 0.3, 3.6, 0.47, d / 2 + 0.7),
        boxAt(2.05, 0.0, d / 2 + 0.32, 2.1, 0.42, d / 2 + 0.38),
        boxAt(3.5, 0.0, d / 2 + 0.32, 3.55, 0.42, d / 2 + 0.38),
        boxAt(2.05, 0.0, d / 2 + 0.62, 2.1, 0.42, d / 2 + 0.68),
        boxAt(3.5, 0.0, d / 2 + 0.62, 3.55, 0.42, d / 2 + 0.68),
        boxAt(2.0, 0.47, d / 2 + 0.28, 3.6, 0.95, d / 2 + 0.31),
      ]),
      WOOD_DARK,
    ),
  );
  mergeStatic(g, { name: 'farmhouse' });
  g.position.y = Math.max(terrainHeight(FARM.house.x, FARM.house.z), 0);
  return {
    group: g,
    base: new THREE.Box3(v3(-w / 2 - 0.08, -0.3, -d / 2 - 0.08), v3(w / 2 + 0.08, 0.5, d / 2 + 0.08)),
    door: v3(0, 0, d / 2),
  };
}

export interface Barn extends Building {
  /** The chip heap inside, scaled with the farm's stock. */
  heap: THREE.Mesh;
  /** The doors' leaves, to slide. */
  leaves: THREE.Group[];
}

export function buildBarn(): Barn {
  const { w, d, wall } = FARM.barn;
  const g = group('chip-barn');
  g.userData.partId = 'chip-barn';
  const rise = 3.4;
  g.add(mesh(boxAt(-w / 2 - 0.08, -0.4, -d / 2 - 0.08, w / 2 + 0.08, 0.6, d / 2 + 0.08), STONE));
  // walls in boards, the front with its great opening
  const doorW = 6.0;
  const doorH = 4.0;
  const frontPieces: THREE.BufferGeometry[] = [];
  const sideW = (w - doorW) / 2;
  for (const s of [-1, 1])
    frontPieces.push(
      uvMetric(
        new THREE.BoxGeometry(sideW, wall - 0.6, 0.3).translate(
          s * (doorW / 2 + sideW / 2),
          0.6 + (wall - 0.6) / 2,
          d / 2,
        ),
      ),
    );
  frontPieces.push(
    uvMetric(
      new THREE.BoxGeometry(doorW, wall - 0.6 - doorH, 0.3).translate(0, 0.6 + doorH + (wall - 0.6 - doorH) / 2, d / 2),
    ),
  );
  g.add(mesh(joined(frontPieces), RED_BOARDS));
  g.add(
    mesh(uvMetric(new THREE.BoxGeometry(w, wall - 0.6, 0.3).translate(0, 0.6 + (wall - 0.6) / 2, -d / 2)), RED_BOARDS),
  );
  for (const s of [-1, 1]) {
    const gw = gableWall(d, wall, rise, 0.3, RED_BOARDS);
    gw.position.set(s * (w / 2 - 0.15), 0, 0);
    g.add(gw);
    g.add(
      mesh(
        uvMetric(new THREE.BoxGeometry(0.3, wall - 0.6, d).translate(s * (w / 2 - 0.15), 0.6 + (wall - 0.6) / 2, 0)),
        RED_BOARDS,
      ),
    );
  }
  // white trim: the door frame, the corners, a loft hatch with its beam and pulley, louvred vents in the gables
  const trim: THREE.BufferGeometry[] = [];
  trim.push(boxAt(-doorW / 2 - 0.15, 0.6, d / 2 - 0.02, -doorW / 2, 0.6 + doorH + 0.15, d / 2 + 0.1));
  trim.push(boxAt(doorW / 2, 0.6, d / 2 - 0.02, doorW / 2 + 0.15, 0.6 + doorH + 0.15, d / 2 + 0.1));
  trim.push(boxAt(-doorW / 2 - 0.15, 0.6 + doorH, d / 2 - 0.02, doorW / 2 + 0.15, 0.6 + doorH + 0.15, d / 2 + 0.1));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      trim.push(
        boxAt(
          (sx * w) / 2 - 0.12 + (sx > 0 ? 0.0 : 0.0),
          0.6,
          (sz * d) / 2 - 0.12,
          (sx * w) / 2 + 0.12,
          wall,
          (sz * d) / 2 + 0.12,
        ),
      );
  trim.push(boxAt(-1.0, wall - 1.6, d / 2 + 0.1, 1.0, wall - 0.5, d / 2 + 0.16));
  g.add(mesh(joined(trim), WHITE_PAINT));
  g.add(
    mesh(boxAt(-0.9, wall - 1.5, d / 2 + 0.0, 0.9, wall - 0.6, d / 2 + 0.12), mat({ color: 0x1a1612, roughness: 1 })),
  );
  g.add(mesh(boxAt(-0.05, wall + 0.2, d / 2 - 0.1, 0.05, wall + rise - 0.4, d / 2 + 1.5), WOOD_DARK));
  g.add(
    mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 14), mat({ color: 0x3a3a3a, metalness: 0.8, roughness: 0.5 }), [
      0,
      wall + rise - 0.5,
      d / 2 + 1.45,
    ]),
  );
  // roof of tile, with a ridge vent
  const roof = gableRoof(w, d, rise, 0.7, ROOF_TILE, 0.12);
  roof.position.y = wall;
  g.add(roof);
  g.add(mesh(boxAt(-2.0, wall + rise, -0.25, 2.0, wall + rise + 0.6, 0.25), WOOD_DARK));
  // a lean-to on the west side, open to the south on posts: wood stacked in the dry
  const lean = group('lean-to');
  const lw = 7;
  lean.add(
    mesh(boxAt(-w / 2 - lw, 0.0, -d / 2 + 0.2, -w / 2, 0.15, d / 2 - 0.2), mat({ color: 0x6b6256, roughness: 1 })),
  );
  for (const z of [-d / 2 + 0.4, 0.0, d / 2 - 0.4])
    lean.add(mesh(boxAt(-w / 2 - lw - 0.1, 0.15, z - 0.1, -w / 2 - lw + 0.1, 3.0, z + 0.1), WOOD_DARK));
  const lr = new THREE.BoxGeometry(lw + 0.5, 0.1, d + 0.4);
  const lm = mesh(lr, ROOF_TILE);
  lm.position.set(-w / 2 - lw / 2 + 0.2, 3.5, 0);
  lm.rotation.z = -0.16;
  lean.add(lm);
  g.add(lean);
  // the doors: two leaves on tracks, one slid across the other, the other open on the dark inside
  const leaves: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const leaf = group('leaf');
    leaf.add(mesh(uvMetric(new THREE.BoxGeometry(doorW / 2, doorH, 0.12)), RED_BOARDS));
    leaf.add(
      mesh(
        joined([
          boxAt(-doorW / 4, doorH / 2 - 0.1, -0.08, doorW / 4, doorH / 2 + 0.1, 0.08),
          stick(v3(-doorW / 4, -doorH / 2 + 0.1, 0.07), v3(doorW / 4, doorH / 2 - 0.1, 0.07), 0.05, 5),
        ]),
        WHITE_PAINT,
      ),
    );
    leaf.position.set(s * (doorW / 4), 0.6 + doorH / 2, d / 2 + 0.2);
    dynamic(leaf);
    g.add(leaf);
    leaves.push(leaf);
  }
  // a track along the front above the doors
  g.add(
    mesh(
      boxAt(-doorW - 0.5, 0.6 + doorH + 0.25, d / 2 + 0.28, doorW + 0.5, 0.6 + doorH + 0.32, d / 2 + 0.34),
      mat({ color: 0x3a3a3a, metalness: 0.8, roughness: 0.6 }),
    ),
  );
  // inside: the floor, and the heap of dry chips seen through the opening
  g.add(
    mesh(
      boxAt(-w / 2 + 0.3, 0.0, -d / 2 + 0.3, w / 2 - 0.3, 0.12, d / 2 - 0.3),
      mat({ color: 0x4a3b2c, roughness: 1 }),
    ),
  );
  const hg = new THREE.SphereGeometry(1, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = hg.attributes.position as THREE.BufferAttribute;
  const rr = rng(8);
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (0.92 + 0.16 * rr()));
  hg.computeVertexNormals();
  uvMetric(hg);
  const heapMat = mat({ color: 0xe8d4a8, map: tiled(chipsMap(), 0.7, 0.7), roughness: 1 });
  const heap = dynamic(mesh(hg, heapMat));
  heap.scale.set(4.2, 2.6, 3.4);
  heap.position.set(-1.0, 0.1, d / 2 - 4.2);
  g.add(heap);
  // a pair of beams across the opening's top and ladder rungs up to the loft
  for (let k = 0; k < 6; k++)
    g.add(mesh(boxAt(w / 2 - 1.4, 0.7 + k * 0.5, d / 2 - 2.0, w / 2 - 0.9, 0.78 + k * 0.5, d / 2 - 1.9), WOOD_DARK));
  mergeStatic(g, { name: 'chip-barn' });
  g.position.y = Math.max(terrainHeight(FARM.barn.x, FARM.barn.z), 0);
  void softBox;
  return {
    group: g,
    base: new THREE.Box3(v3(-w / 2 - 0.08, -0.4, -d / 2 - 0.08), v3(w / 2 + 0.08, 0.6, d / 2 + 0.08)),
    door: v3(0, 0, d / 2),
    heap,
    leaves,
  };
}
