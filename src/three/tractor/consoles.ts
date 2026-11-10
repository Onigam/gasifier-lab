import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { boxAt, joined, stick, v3 } from '../common';
import { ENGINE, FILTER, FILTER_AT, UNIT, UNIT_AT } from '../dims';
import { mergeStatic } from '../merge';
import { castIron, darkSteel, greyPaint, steel } from '../materials';

// The left consoles: what carries the unit and the filter on the tractor's left side (K6): box-section beams bolted to plates on the engine's flank, a pad under the unit's base ring, a shelf for the jar of the drain, a pair of cantilevers under the
// filter box. Frame T. The unit's base ring stands on the pad's top (y = the clearance), the filter box on the beams' top.

export interface Consoles {
  group: THREE.Group;
  /** The top of the unit's pad and of the filter's beams, for the tests. */
  padTop: number;
  beamTop: number;
}

const bolt = (x: number, y: number, z: number, axis: 'y' | 'z' = 'z', r = 0.011): THREE.BufferGeometry => {
  const g = new THREE.CylinderGeometry(r, r, r * 0.8, 6);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
};

export function buildConsoles(): Consoles {
  const g = group('left-consoles');
  g.userData.partId = 'left-consoles';
  const beams: THREE.BufferGeometry[] = [];
  const bolts: THREE.BufferGeometry[] = [];
  const padTop = UNIT_AT.y;
  const beamTop = FILTER_AT.y;

  // ---- the unit's: two beams out from a plate on the clutch housing's flank, a pad under the base ring
  const ch = ENGINE.clutchHousing;
  const plateZ = -0.24;
  g.add(mesh(boxAt(ch.x0 + 0.02, 0.36, plateZ - 0.022, ch.x1 - 0.02, padTop + 0.03, plateZ), greyPaint()));
  for (const x of [UNIT_AT.x - 0.16, UNIT_AT.x + 0.16]) {
    beams.push(
      boxAt(x - 0.035, padTop - 0.13, UNIT_AT.z - UNIT.baseR - 0.08, x + 0.035, padTop - 0.012, plateZ - 0.022),
    );
    // the gusset under each beam
    beams.push(stick(v3(x, padTop - 0.13, plateZ - 0.1), v3(x, padTop - 0.27, plateZ - 0.0), 0.014, 6));
  }
  // the third beam for the jar's shelf, ahead of the unit
  const shelfX = UNIT_AT.x + 0.36;
  beams.push(boxAt(shelfX - 0.035, padTop - 0.13, -0.66, shelfX + 0.035, padTop - 0.012, -0.23));
  const pad = boxAt(
    UNIT_AT.x - UNIT.baseR - 0.04,
    padTop - 0.012,
    UNIT_AT.z - UNIT.baseR - 0.04,
    UNIT_AT.x + UNIT.baseR + 0.04,
    padTop,
    UNIT_AT.z + UNIT.baseR + 0.04,
  );
  g.add(mesh(pad, steel()));
  // the shelf the starting fan stands on, welded to the pad's rear corner
  g.add(mesh(boxAt(1.16, padTop - 0.012, -1.34, 1.6, padTop, -0.98), steel()));
  beams.push(stick(v3(1.3, padTop - 0.014, -1.32), v3(UNIT_AT.x - 0.18, padTop - 0.07, -0.99), 0.012, 6));
  g.add(mesh(boxAt(UNIT_AT.x + 0.1, padTop - 0.012, -0.66, shelfX + 0.1, padTop, -0.4), steel()));
  // bolts of the plate and along the beams
  for (const x of [ch.x0 + 0.06, ch.x1 - 0.06])
    for (const y of [0.42, padTop - 0.06]) bolts.push(bolt(x, y, plateZ - 0.026, 'z'));

  // ---- the filter's: two cantilevers from a plate on the engine's flank, under the box
  const bx = ENGINE.block;
  const fz = FILTER_AT.z;
  g.add(
    mesh(
      boxAt(
        FILTER_AT.x + 0.04,
        beamTop - 0.14,
        plateZ + 0.0 - 0.0 + 0.0 - 0.022 + 0.0,
        FILTER_AT.x + FILTER.length - 0.04,
        beamTop - 0.02,
        -bx.halfW,
      ),
      greyPaint(),
    ),
  );
  for (const dx of [0.16, FILTER.length - 0.16]) {
    const x = FILTER_AT.x + dx;
    beams.push(boxAt(x - 0.035, beamTop - 0.1, fz - FILTER.width / 2 - 0.03, x + 0.035, beamTop, -bx.halfW - 0.0));
    beams.push(stick(v3(x, beamTop - 0.1, -bx.halfW - 0.12), v3(x, beamTop - 0.26, -bx.halfW - 0.0), 0.014, 6));
    bolts.push(bolt(x - 0.02, beamTop - 0.06, -bx.halfW - 0.012, 'z'));
    bolts.push(bolt(x + 0.02, beamTop - 0.06, -bx.halfW - 0.012, 'z'));
  }
  // a rail along the beams' tips, under the box's long side
  beams.push(
    boxAt(
      FILTER_AT.x + 0.06,
      beamTop - 0.03,
      fz - FILTER.width / 2 - 0.03,
      FILTER_AT.x + FILTER.length - 0.06,
      beamTop,
      fz - FILTER.width / 2 - 0.006,
    ),
  );
  g.add(mesh(joined(beams), castIron()));
  g.add(mesh(joined(bolts), darkSteel()));
  mergeStatic(g, { name: g.name });
  return { group: g, padTop, beamTop };
}
