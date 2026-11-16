import * as THREE from 'three';
import { group, mesh, rng } from '@onigam/lab-kit/three';
import { GARAGE } from '../dims';
import { TAU, boxAt, joined, softBox, stick, tubeGeometry, uvMetric, v3 } from '../common';
import {
  concreteMap,
  masonryMap,
  oakMap,
  plasterMap,
  plankMap,
  renderMap,
  boardsMap,
  tiled,
  woodMap,
  shingleMap,
} from '../textures';
import { mergeStatic, dynamic } from '../merge';
import { cabGlass, darkSteel, steel, blackPaint, bright, brassMat, rubber } from '../materials';

// The farm's garage, one building for the farm (seen from outside, roofed) and for `garage` (cut open, no roof): a garage on the ground floor with a bedroom above it, attached to the house. Its size follows the model's volume: the free air of 50 or
// 1,000 m³ plus what the tractor displaces (`GARAGE`), so that the drawn room and the well-mixed box of the simulation are the same room. Walls are separate meshes so that the world can step aside the ones between the eye and the room.

const mat = (p: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial(p);

interface Lining {
  boards: THREE.BufferGeometry;
  tar: THREE.BufferGeometry;
}

export const PLASTER = mat({ color: 0xcfc4ab, map: tiled(renderMap(), 0.9, 0.9), roughness: 0.95 });
export const PLASTER_IN = mat({
  color: 0xe6dcc2,
  map: tiled(plasterMap(), 0.7, 0.7),
  roughness: 0.95,
  side: THREE.DoubleSide,
});
export const FLOOR = mat({ color: 0xb8b2a6, map: tiled(concreteMap(), 1.2, 1.2), roughness: 0.92 });
export const BOARDS = mat({ color: 0x8b3a2a, map: tiled(boardsMap(), 1, 1), roughness: 0.85 });
export const FLOOR_BOARDS = mat({ color: 0xb98a58, map: tiled(oakMap(), 1, 1), roughness: 0.8 });
export const CEILING = mat({
  color: 0xcfc4a8,
  map: tiled(plasterMap(), 0.8, 0.8),
  roughness: 0.95,
  side: THREE.DoubleSide,
});
export const ROOF = mat({ color: 0x59423a, map: tiled(shingleMap(), 1.4, 1.4), roughness: 0.85 });
const WOOD = mat({ color: 0x9c7a52, map: tiled(woodMap(), 1, 1), roughness: 0.8 });
/** The garage inside: upright boards, weathered and sooted, a dark ground for the pale gas to be seen against; a tarred strip at the foot. */
export const LINING = mat({ color: 0x93765a, map: tiled(plankMap(), 1, 1), roughness: 0.9 });
const TAR = mat({ color: 0x1d1a17, roughness: 0.6 });
/** The slab between the storeys, cut: concrete, grey, with the grain of its aggregate. */
export const SLAB = mat({ color: 0x9d9a93, map: tiled(concreteMap(), 1.4, 1.4), roughness: 0.96 });
/** The bedroom's walls inside: painted lime plaster, pale, with a skirting of dark wood. */
const BEDROOM_WALL = mat({
  color: 0xe4d8bd,
  map: tiled(plasterMap(), 0.8, 0.8),
  roughness: 0.95,
});
const SKIRTING = mat({ color: 0x4a3626, map: tiled(woodMap(), 1, 1), roughness: 0.7 });

export interface GarageDims {
  w: number;
  d: number;
  h: number;
  /** Plan and height of the room above. */
  aboveH: number;
}

/** The room for a free volume, m³: the small room's size, the large one's, or in between by a geometric blend whose gross volume is exactly the free air plus what the machine displaces. */
export function garageFor(volume: number): GarageDims {
  const s = GARAGE.small;
  const L = GARAGE.large;
  const vs = s.w * s.d * s.h;
  const vl = L.w * L.d * L.h;
  const target = volume + GARAGE.machineM3;
  const u = Math.min(1, Math.max(0, Math.log(target / vs) / Math.log(vl / vs)));
  const blend = (a: number, b: number) => Math.exp((1 - u) * Math.log(a) + u * Math.log(b));
  return { w: blend(s.w, L.w), d: blend(s.d, L.d), h: blend(s.h, L.h), aboveH: GARAGE.above.h };
}

export const grossVolume = (g: GarageDims): number => g.w * g.d * g.h;

/** Door: two leaves, each its own group on a hinge. */
export interface Door {
  group: THREE.Group;
  leaves: THREE.Group[];
  /** Opening 0 shut, 1 open (90°). */
  set(open: number): void;
  width: number;
  height: number;
}

function buildDoor(w: number, h: number): Door {
  const g = group('garage-door');
  g.userData.partId = 'garage-door';
  const leaves: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    // the leaf: boards on a frame, iron straps, a handle; hinged at the jamb, so its origin is at the hinge
    const leaf = dynamic(group('leaf'));
    const lw = w / 2 - 0.01;
    const boards = new THREE.BoxGeometry(lw, h - 0.04, 0.045);
    uvMetric(boards);
    boards.translate((s * -lw) / 2, (h - 0.04) / 2 + 0.02, 0);
    // (the leaf extends from the hinge towards the middle)
    leaf.add(mesh(boards, BOARDS));
    const straps: THREE.BufferGeometry[] = [];
    for (const y of [0.4, h - 0.45])
      straps.push(boxAt(s > 0 ? -lw : 0, y - 0.04, -0.05, s > 0 ? 0 : lw, y + 0.04, 0.05));
    for (const x of [0.25, 0.5, 0.75])
      straps.push(
        boxAt(
          (s > 0 ? -lw : 0) + (s > 0 ? 1 : 1) * x * lw - 0.015,
          0.05,
          -0.027,
          (s > 0 ? -lw : 0) + x * lw + 0.015,
          h - 0.05,
          -0.024,
        ),
      );
    straps.push(stick(v3(s > 0 ? -lw : 0, 0.1, -0.03), v3(s > 0 ? 0 : lw, h - 0.1, -0.03), 0.012, 6));
    leaf.add(mesh(joined(straps), darkSteel()));
    // the bolts that hold each strap through the boards, a round head every 22 cm on both faces, and the hinge: a pin and its knuckles at the post
    const fix: THREE.BufferGeometry[] = [];
    for (const y of [0.4, h - 0.45])
      for (let k = 0; k < Math.floor(lw / 0.22); k++) {
        const x = (s > 0 ? -lw : 0) + 0.11 + k * 0.22;
        for (const zf of [-0.053, 0.053]) {
          const b = new THREE.SphereGeometry(0.01, 8, 6, 0, TAU, 0, Math.PI / 2);
          b.rotateX(zf < 0 ? -Math.PI / 2 : Math.PI / 2);
          b.translate(x, y, zf);
          fix.push(b);
        }
      }
    for (const y of [0.4, h - 0.45]) {
      fix.push(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 10).translate(0, y, -0.052));
      fix.push(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8).translate(0, y, -0.052));
    }
    leaf.add(mesh(joined(fix), darkSteel()));
    // the handle and its plate on the shut edge
    const handle = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8);
    handle.translate(s * (-lw + 0.1), 1.1, -0.05);
    leaf.add(mesh(handle, steel()));
    leaf.position.set(s * (w / 2), 0, 0);
    // the leaf swings on its hinge about Y
    g.add(leaf);
    leaves.push(leaf);
  }
  void rng;
  mergeStatic(g, { name: 'garage-door' });
  const set = (open: number): void => {
    const a = (Math.PI / 2) * Math.min(1, Math.max(0, open));
    // leaves open outward (towards −z), each about its own hinge
    leaves[0]!.rotation.y = a;
    leaves[1]!.rotation.y = -a;
  };
  set(0);
  return { group: g, leaves, set, width: w, height: h };
}

export interface GarageBuilding {
  /** The shell of the garage: walls, floor, ceiling slab, the window. */
  shell: THREE.Group;
  /** The bedroom over it, with its furniture. */
  above: THREE.Group;
  door: Door;
  roof: THREE.Group;
  /** Walls by side, for the cut: the world hides the ones between the eye and the room. */
  walls: { id: string; mesh: THREE.Object3D; normal: THREE.Vector3; centre: THREE.Vector3 }[];
  /** Where things are, for the world: the inside box, the ceiling's height, the stairhead. */
  dims: GarageDims;
  /** Rebuild for another free volume. */
  setVolume(volume: number): void;
  /** Places the world needs: the floor's centre, the back wall's z, the inside height. */
  inside: THREE.Box3;
  /** The hatch and the pipe through the ceiling, where the room above is reached from below. */
  leaks: THREE.Vector3[];
  /** Dynamic fittings: the lamp (swings), the window. */
  lamp: THREE.Group;
}

/** The room's meshes in its frame: x across (centre 0), z deep from the door (z = 0) to the back wall (z = d), y up from the floor. */
export function buildGarageBuilding(opts: { roof: boolean; volume: number }): GarageBuilding {
  const shell = group('closed-garage');
  shell.userData.partId = 'closed-garage';
  const above = group('room-above');
  above.userData.partId = 'room-above';
  const roof = group('roof');
  const walls: GarageBuilding['walls'] = [];
  const t = GARAGE.wall;
  let dims = garageFor(opts.volume);
  const inside = new THREE.Box3();
  const leaks: THREE.Vector3[] = [];
  const lamp = dynamic(group('lamp'));
  let door = buildDoor(Math.min(3.4, dims.w - 0.6), 3.0);

  const clear = (g: THREE.Group, keep: (c: THREE.Object3D) => boolean): void => {
    for (const c of [...g.children]) {
      if (keep(c)) continue;
      g.remove(c);
      c.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
    }
  };

  const build = (): void => {
    clear(shell, () => false);
    clear(above, () => false);
    clear(roof, () => false);
    walls.length = 0;
    leaks.length = 0;
    const { w, d, h, aboveH } = dims;
    inside.set(v3(-w / 2, 0, 0), v3(w / 2, h, d));
    // ---- floor, ceiling slab (also the bedroom's floor)
    shell.add(mesh(uvMetric(new THREE.BoxGeometry(w + 2 * t, 0.2, d + 2 * t).translate(0, -0.1, d / 2)), FLOOR));
    // the slab: joists under boards
    const slab = new THREE.BoxGeometry(w + 2 * t, 0.3, d + 2 * t);
    uvMetric(slab);
    shell.add(mesh(slab.translate(0, h + 0.15, d / 2), SLAB));
    // under it, the boards of the ceiling on their joists (a section shows the slab as concrete, a plank ceiling hangs beneath)
    shell.add(mesh(boxAt(-w / 2, h - 0.025, 0, w / 2, h, d), LINING));
    const joists: THREE.BufferGeometry[] = [];
    for (let k = 0; k < Math.floor(d / 0.6); k++)
      joists.push(boxAt(-w / 2, h - 0.1, 0.3 + k * 0.6 - 0.04, w / 2, h - 0.025, 0.3 + k * 0.6 + 0.04));
    shell.add(mesh(joined(joists), WOOD));
    // oil on the floor under where the tractor stands: a dark patch
    const patch = new THREE.CircleGeometry(0.45, 24);
    patch.rotateX(-Math.PI / 2);
    patch.translate(0.6, 0.002, 2.4);
    shell.add(
      mesh(
        patch,
        new THREE.MeshStandardMaterial({
          color: 0x151412,
          roughness: 0.25,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      ),
    );

    // ---- walls: +x, −x, back (+z), front (z = 0, with the door's opening)
    const wall = (
      id: string,
      w0: number,
      h0: number,
      x: number,
      y: number,
      z: number,
      ry: number,
      normal: THREE.Vector3,
      lining: Lining[],
    ): THREE.Group => {
      // the wall stands as a group, so that it steps aside whole: its plaster outside and its boards inside go together
      const grp = group(`wall-${id}`);
      const g = new THREE.BoxGeometry(w0, h0, t);
      uvMetric(g);
      const m = mesh(g, PLASTER);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      grp.add(m);
      if (lining.length) {
        grp.add(mesh(joined(lining.map((b) => b.boards)), LINING));
        grp.add(mesh(joined(lining.map((b) => b.tar)), TAR));
      }
      grp.userData.keep = true;
      shell.add(grp);
      walls.push({ id, mesh: grp, normal, centre: m.position.clone() });
      return grp;
    };
    const L = 0.03;
    // linings in the room's frame, on the inner face of each wall: boards above a strip of tar at the foot
    const lining = (x0: number, z0: number, x1: number, z1: number): Lining => {
      const ex = x1 - x0 < 0.1 ? 0.002 : 0;
      const ez = z1 - z0 < 0.1 ? 0.002 : 0;
      return { boards: boxAt(x0, 0.25, z0, x1, h, z1), tar: boxAt(x0 - ex, 0, z0 - ez, x1 + ex, 0.25, z1 + ez) };
    };
    const lin = {
      plusX: lining(w / 2 - L, 0, w / 2, d),
      minusX: lining(-w / 2, 0, -w / 2 + L, d),
      back: lining(-w / 2 + L, d - L, w / 2 - L, d),
    };
    wall('plus-x', d + 2 * t, h + 0.3, w / 2 + t / 2, (h + 0.3) / 2, d / 2, Math.PI / 2, v3(1, 0, 0), [lin.plusX]);
    wall('minus-x', d + 2 * t, h + 0.3, -w / 2 - t / 2, (h + 0.3) / 2, d / 2, Math.PI / 2, v3(-1, 0, 0), [lin.minusX]);
    wall('back', w, h + 0.3, 0, (h + 0.3) / 2, d + t / 2, 0, v3(0, 0, 1), [lin.back]);
    // the front wall in pieces round the door's opening
    const dw = door.width;
    const dh = door.height;
    const sideW = (w - dw) / 2;
    const front = group('front-wall');
    const frontLinings: Lining[] = [];
    for (const s of [-1, 1]) {
      const g = new THREE.BoxGeometry(sideW, h + 0.3, t);
      uvMetric(g);
      const m = mesh(g, PLASTER);
      m.position.set(s * (dw / 2 + sideW / 2), (h + 0.3) / 2, -t / 2);
      front.add(m);
      const x0 = s > 0 ? dw / 2 : -w / 2 + L;
      const x1 = s > 0 ? w / 2 - L : -dw / 2;
      frontLinings.push(lining(x0, 0, x1, L));
    }
    front.add(mesh(joined(frontLinings.map((b) => b.boards)), LINING));
    front.add(mesh(joined(frontLinings.map((b) => b.tar)), TAR));
    const lintel = new THREE.BoxGeometry(dw, h + 0.3 - dh, t);
    uvMetric(lintel);
    const lm = mesh(lintel, PLASTER);
    lm.position.set(0, dh + (h + 0.3 - dh) / 2, -t / 2);
    front.add(lm);
    front.userData.keep = true;
    shell.add(front);
    walls.push({ id: 'front', mesh: front, normal: v3(0, 0, -1), centre: v3(0, h / 2, 0) });
    // the door in its opening, a threshold sill of stone, a drain
    door.group.position.set(0, 0, -t * 0.25);
    shell.add(door.group);
    shell.add(
      mesh(
        boxAt(-dw / 2 - 0.1, -0.02, -t - 0.1, dw / 2 + 0.1, 0.03, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x8a867d, roughness: 0.95 }),
      ),
    );

    // ---- a small window high in the back wall, a lamp on its cord
    const win = group('window');
    win.add(mesh(boxAt(-0.5, h - 1.2, d - 0.02, 0.5, h - 0.4, d + 0.02), cabGlass()));
    win.add(
      mesh(
        joined([
          boxAt(-0.52, h - 1.22, d - 0.04, 0.52, h - 1.18, d + 0.04),
          boxAt(-0.52, h - 0.42, d - 0.04, 0.52, h - 0.38, d + 0.04),
          boxAt(-0.52, h - 1.22, d - 0.04, -0.48, h - 0.38, d + 0.04),
          boxAt(0.48, h - 1.22, d - 0.04, 0.52, h - 0.38, d + 0.04),
          boxAt(-0.01, h - 1.22, d - 0.04, 0.01, h - 0.38, d + 0.04),
        ]),
        WOOD,
      ),
    );
    shell.add(win);
    lamp.clear();
    lamp.position.set(0, h, d * 0.5);
    lamp.add(mesh(tubeGeometry([v3(0, 0, 0), v3(0, -0.4, 0)], 0.004, 4, 5), blackPaint()));
    lamp.add(
      mesh(
        new THREE.SphereGeometry(0.045, 14, 10),
        new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xfff1c8, emissiveIntensity: 0.9 }),
        [0, -0.44, 0],
      ),
    );
    lamp.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), brassMat(), [0, -0.38, 0]));
    shell.add(lamp);

    // ---- the ceiling's way up: the pipe of a stove that was, and a hatch with its ring; both leaks, small
    const pipePos = v3(-w / 2 + 0.35, h, d - 0.4);
    shell.add(
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 14, 1, true), steel(), [pipePos.x, h + 0.15, pipePos.z]),
    );
    shell.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 14), darkSteel(), [pipePos.x, h - 0.01, pipePos.z]));
    leaks.push(pipePos.clone().add(v3(0, 0.3, 0)));
    const hatch = v3(w / 2 - 0.6, h, 0.9);
    shell.add(mesh(boxAt(hatch.x - 0.35, h - 0.03, hatch.z - 0.35, hatch.x + 0.35, h, hatch.z + 0.35), WOOD));
    shell.add(mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 14), steel(), [hatch.x, h - 0.03, hatch.z]));
    leaks.push(hatch.clone().add(v3(0, 0.3, 0)));
    // the boards of the ceiling do not meet: three dark gaps along the room
    for (const z of [d * 0.25, d * 0.5, d * 0.75])
      shell.add(mesh(boxAt(-w / 2 + 0.2, h - 0.004, z - 0.004, w / 2 - 0.2, h, z + 0.004), blackPaint()));
    leaks.push(v3(0, h + 0.3, d * 0.5));

    // ---- the room above: the same plan, a made bed, a table, a wardrobe, a rug, a lamp, a window
    const y0 = h + 0.3;
    const rw = w;
    const rd = d;
    const room = group('room-shell');
    const aw = (
      id: string,
      w0: number,
      x: number,
      z: number,
      ry: number,
      n: THREE.Vector3,
      inner: [number, number, number, number],
    ): void => {
      const grp = group(`wall-${id}`);
      const g = new THREE.BoxGeometry(w0, aboveH, t * 0.8);
      uvMetric(g);
      const m = mesh(g, PLASTER);
      m.position.set(x, y0 + aboveH / 2, z);
      m.rotation.y = ry;
      grp.add(m);
      // the wall inside: pale painted plaster, a skirting of dark wood at its foot
      const [x0, z0, x1, z1] = inner;
      grp.add(mesh(boxAt(x0, y0, z0, x1, y0 + aboveH, z1), BEDROOM_WALL));
      const ex = x1 - x0 < 0.1 ? 0.008 : 0;
      const ez = z1 - z0 < 0.1 ? 0.008 : 0;
      grp.add(mesh(boxAt(x0 - ex, y0, z0 - ez, x1 + ex, y0 + 0.11, z1 + ez), SKIRTING));
      grp.userData.keep = true;
      above.add(grp);
      walls.push({ id, mesh: grp, normal: n, centre: m.position.clone() });
    };
    const B = 0.02;
    aw('above-plus-x', rd + 0.4, rw / 2 + t * 0.4, rd / 2, Math.PI / 2, v3(1, 0, 0), [rw / 2 - B, 0, rw / 2, rd]);
    aw('above-minus-x', rd + 0.4, -rw / 2 - t * 0.4, rd / 2, Math.PI / 2, v3(-1, 0, 0), [-rw / 2, 0, -rw / 2 + B, rd]);
    aw('above-back', rw, 0, rd + t * 0.4, 0, v3(0, 0, 1), [-rw / 2 + B, rd - B, rw / 2 - B, rd]);
    aw('above-front', rw, 0, -t * 0.4, 0, v3(0, 0, -1), [-rw / 2 + B, 0, rw / 2 - B, B]);
    // the boards of the floor
    above.add(mesh(uvMetric(new THREE.BoxGeometry(rw, 0.02, rd).translate(0, y0 + 0.01, rd / 2)), FLOOR_BOARDS));
    // a window on the back wall with curtains
    const wy = y0 + 1.0;
    above.add(mesh(boxAt(-0.6, wy, rd - 0.03, 0.6, wy + 1.2, rd + 0.01), cabGlass()));
    above.add(
      mesh(
        joined([
          boxAt(-0.63, wy - 0.03, rd - 0.05, 0.63, wy, rd + 0.04),
          boxAt(-0.63, wy + 1.2, rd - 0.05, 0.63, wy + 1.23, rd + 0.04),
          boxAt(-0.63, wy, rd - 0.05, -0.6, wy + 1.2, rd + 0.04),
          boxAt(0.6, wy, rd - 0.05, 0.63, wy + 1.2, rd + 0.04),
          boxAt(-0.01, wy, rd - 0.05, 0.01, wy + 1.2, rd + 0.04),
        ]),
        mat({ color: 0xf1ece0, roughness: 0.8 }),
      ),
    );
    for (const s of [-1, 1])
      above.add(
        mesh(softBox(s * 0.78, wy + 0.6, rd - 0.1, 0.34, 1.5, 0.05, 0.02), mat({ color: 0x8c6a4d, roughness: 1 })),
      );
    // two windows in the front wall, on both faces, so that the bedroom reads as one from the yard as from inside
    for (const x of [-1.0, 1.0])
      for (const z0 of [-t * 0.8 - 0.03, 0.0]) {
        above.add(mesh(boxAt(x - 0.5, wy, z0, x + 0.5, wy + 1.1, z0 + 0.03), cabGlass()));
        above.add(
          mesh(
            joined([
              boxAt(x - 0.53, wy - 0.03, z0 - 0.01, x + 0.53, wy, z0 + 0.04),
              boxAt(x - 0.53, wy + 1.1, z0 - 0.01, x + 0.53, wy + 1.13, z0 + 0.04),
              boxAt(x - 0.53, wy, z0 - 0.01, x - 0.5, wy + 1.1, z0 + 0.04),
              boxAt(x + 0.5, wy, z0 - 0.01, x + 0.53, wy + 1.1, z0 + 0.04),
              boxAt(x - 0.012, wy, z0 - 0.01, x + 0.012, wy + 1.1, z0 + 0.04),
              boxAt(x - 0.5, wy + 0.55, z0 - 0.01, x + 0.5, wy + 0.57, z0 + 0.04),
            ]),
            mat({ color: 0xf1ece0, roughness: 0.8 }),
          ),
        );
      }
    // the bed, made: frame, mattress, a quilt, a pillow
    const bx = -rw / 2 + 1.0;
    const bz = rd - 1.15;
    above.add(mesh(softBox(bx, y0 + 0.28, bz, 1.0, 0.1, 2.0, 0.02), WOOD));
    above.add(mesh(softBox(bx, y0 + 0.42, bz, 0.92, 0.2, 1.92, 0.05), mat({ color: 0xe8e2d0, roughness: 1 })));
    above.add(mesh(softBox(bx, y0 + 0.53, bz - 0.15, 0.96, 0.06, 1.5, 0.03), mat({ color: 0x3d5a73, roughness: 1 })));
    above.add(mesh(softBox(bx, y0 + 0.56, bz + 0.78, 0.5, 0.12, 0.3, 0.05), mat({ color: 0xf0ede4, roughness: 1 })));
    above.add(mesh(softBox(bx, y0 + 0.62, bz + 1.03, 1.04, 0.5, 0.06, 0.02), WOOD));
    // a night table with a lamp, a wardrobe, a rug, a chair
    above.add(mesh(softBox(bx + 0.78, y0 + 0.25, bz + 0.8, 0.4, 0.5, 0.4, 0.02), WOOD));
    above.add(
      mesh(
        new THREE.CylinderGeometry(0.1, 0.17, 0.2, 14, 1, true),
        mat({ color: 0xf0d9a0, roughness: 0.8, side: THREE.DoubleSide, emissive: 0x5a4a20, emissiveIntensity: 0.3 }),
        [bx + 0.78, y0 + 0.62, bz + 0.8],
      ),
    );
    above.add(mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.12, 10), brassMat(), [bx + 0.78, y0 + 0.56, bz + 0.8]));
    above.add(mesh(softBox(rw / 2 - 0.35, y0 + 1.0, 1.0, 0.55, 2.0, 1.1, 0.03), WOOD));
    above.add(mesh(softBox(0.2, y0 + 0.012, rd * 0.5, 1.6, 0.012, 2.2, 0.004), mat({ color: 0x7a3b32, roughness: 1 })));
    above.add(mesh(softBox(0.2, y0 + 0.012, rd * 0.5, 1.3, 0.013, 1.9, 0.004), mat({ color: 0xc9a86b, roughness: 1 })));
    above.add(mesh(softBox(rw / 2 - 0.8, y0 + 0.43, rd * 0.5 - 0.5, 0.42, 0.04, 0.42, 0.01), WOOD));
    for (const [cx, cz] of [
      [-0.18, -0.18],
      [0.18, -0.18],
      [-0.18, 0.18],
      [0.18, 0.18],
    ] as const)
      above.add(
        mesh(new THREE.BoxGeometry(0.03, 0.42, 0.03), WOOD, [rw / 2 - 0.8 + cx, y0 + 0.21, rd * 0.5 - 0.5 + cz]),
      );
    above.add(mesh(softBox(rw / 2 - 0.8, y0 + 0.78, rd * 0.5 - 0.32, 0.42, 0.7, 0.04, 0.01), WOOD));
    // a picture on the wall and a clock
    above.add(mesh(softBox(rw / 2 - 0.03, y0 + 1.6, rd * 0.5, 0.03, 0.4, 0.55, 0.01), WOOD));
    above.add(
      mesh(
        softBox(rw / 2 - 0.04, y0 + 1.6, rd * 0.5, 0.012, 0.34, 0.49, 0.005),
        mat({ color: 0x7e9a8a, roughness: 0.9 }),
      ),
    );
    void room;
    // the bedroom's own ceiling joist lines are left out: the room is cut open from above

    // ---- seen from the yard (the farm): the stone course the house has at its foot, a drip sill under each window of the bedroom, a gutter and its downpipe
    if (opts.roof) {
      const out = t + 0.05;
      const plinthTop = 0.5;
      const stone = mat({ color: 0x8a867d, map: tiled(masonryMap(), 0.6, 0.6), roughness: 0.95 });
      shell.add(mesh(boxAt(-w / 2 - out, -0.2, -out, w / 2 + out, plinthTop, d + out), stone));
      const sills = mat({ color: 0xe9e4d6, roughness: 0.75 });
      for (const x of [-1.0, 1.0])
        above.add(mesh(boxAt(x - 0.58, y0 + 0.97, -t * 0.8 - 0.22, x + 0.58, y0 + 1.0, -t * 0.8 + 0.02), sills));
      const total0 = y0 + aboveH;
      const metal = mat({ color: 0x3a3d40, roughness: 0.5, metalness: 0.6 });
      above.add(mesh(boxAt(-w / 2 - 0.3, total0 - 0.05, -t - 0.16, w / 2 + 0.3, total0 + 0.03, -t - 0.06), metal));
      const down = new THREE.CylinderGeometry(0.045, 0.045, total0 - 0.1, 12);
      down.translate(w / 2 + t - 0.05, (total0 - 0.1) / 2 + 0.1, -t - 0.11);
      above.add(mesh(down, metal));
      for (const yb of [0.4, 2.2, 4.0, 5.6])
        above.add(mesh(boxAt(w / 2 + t - 0.1, yb, -t - 0.15, w / 2 + t, yb + 0.03, -t - 0.07), metal));
    }

    // ---- the roof, for the farm's view: a pitched roof over both storeys
    if (opts.roof) {
      const total = y0 + aboveH;
      const ridge = 1.5;
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 - 0.5, 0);
      shape.lineTo(w / 2 + 0.5, 0);
      shape.lineTo(0, ridge);
      shape.closePath();
      const eg = new THREE.ExtrudeGeometry(shape, { depth: d + 2 * t + 0.6, bevelEnabled: false });
      eg.translate(0, total, -t - 0.3);
      uvMetric(eg);
      roof.add(mesh(eg, ROOF));
    }
    mergeStatic(shell, { name: 'closed-garage' });
    mergeStatic(above, { name: 'room-above' });
  };
  build();

  return {
    shell,
    above,
    door,
    roof,
    walls,
    get dims() {
      return dims;
    },
    setVolume(volume: number) {
      const next = garageFor(volume);
      if (Math.abs(next.w - dims.w) + Math.abs(next.d - dims.d) < 1e-4) return;
      dims = next;
      door = door; // the door's size follows the walls' opening, which is the same
      build();
    },
    inside,
    leaks,
    lamp,
  } as GarageBuilding;
}

void [TAU, rubber, bright];
