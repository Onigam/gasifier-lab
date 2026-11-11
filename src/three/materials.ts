import * as THREE from 'three';
import { glass } from '@onigam/lab-kit/three';
import {
  chipsMap,
  gravelMap,
  paintMap,
  perforatedAlpha,
  scaleSteelMap,
  soilMap,
  strawMap,
  tarRunsAlpha,
  tiled,
  toolSteelMap,
} from './textures';

// The materials of the machine, one palette for every world: made once, shared (so the merge can join what draws alike). Paint, bare and rusted steel, rubber, glass, and the colour of a cut. No colour here is a logo's:
// the tractor is red and grey, as its maker's were in 1968, and wears nothing of its name.

const cache = new Map<string, THREE.Material>();

function once<T extends THREE.Material>(key: string, make: () => T): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = make();
    m.name = key;
    cache.set(key, m);
  }
  return m;
}

const std = (p: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial(p);

export const COLOURS = {
  tractorRed: 0xa2302a,
  tractorGrey: 0x8b9096,
  castGrey: 0x6a7076,
  engineGrey: 0x7f868c,
  black: 0x1b1c1e,
  hotBlack: 0x2b2824,
  unitUpper: 0x3a3f3b,
  cutFace: 0xcdd0d0,
  chip: 0xc9a46a,
  condensate: 0x2a1c12,
  flame: 0xffa040,
} as const;

/** Paint on the tractor, `tint` the colour. */
export function paint(tint: number, roughness = 0.55): THREE.MeshStandardMaterial {
  return once(`paint-${tint.toString(16)}-${roughness}`, () =>
    std({ color: tint, map: tiled(paintMap(), 4, 4), roughness, metalness: 0.15 }),
  );
}

export const redPaint = (): THREE.MeshStandardMaterial => paint(COLOURS.tractorRed);
/** Red paint on a thin sheet seen from both sides: a fender, a hood. */
export const redSheet = (): THREE.MeshStandardMaterial =>
  once('red-sheet', () =>
    std({
      color: COLOURS.tractorRed,
      map: tiled(paintMap(), 4, 4),
      roughness: 0.55,
      metalness: 0.15,
      side: THREE.DoubleSide,
    }),
  );
export const greyPaint = (): THREE.MeshStandardMaterial => paint(COLOURS.tractorGrey, 0.6);
export const castIron = (): THREE.MeshStandardMaterial =>
  once('cast-iron', () =>
    std({ color: COLOURS.castGrey, map: tiled(paintMap(), 3, 3), roughness: 0.7, metalness: 0.35 }),
  );
export const engineBlock = (): THREE.MeshStandardMaterial =>
  once('engine-block', () =>
    std({ color: COLOURS.engineGrey, map: tiled(paintMap(), 3, 3), roughness: 0.62, metalness: 0.3 }),
  );
export const blackPaint = (): THREE.MeshStandardMaterial =>
  once('black-paint', () => std({ color: COLOURS.black, roughness: 0.6, metalness: 0.2 }));
export const rubber = (): THREE.MeshStandardMaterial =>
  once('rubber', () => std({ color: 0x17181a, roughness: 0.94, metalness: 0 }));
export const hose = (): THREE.MeshStandardMaterial =>
  once('hose', () => std({ color: 0x232426, roughness: 0.8, metalness: 0 }));

/** Bare steel, rolled, a little worn. */
export const steel = (): THREE.MeshStandardMaterial =>
  once('steel', () => std({ color: 0x8e949a, map: tiled(toolSteelMap(), 1, 1), roughness: 0.5, metalness: 0.75 }));
export const darkSteel = (): THREE.MeshStandardMaterial =>
  once('dark-steel', () => std({ color: 0x46494d, map: tiled(toolSteelMap(), 1, 1), roughness: 0.55, metalness: 0.7 }));
export const bright = (): THREE.MeshStandardMaterial =>
  once('bright', () => std({ color: 0xd2d5d8, roughness: 0.3, metalness: 0.95 }));
export const brassMat = (): THREE.MeshStandardMaterial =>
  once('brass', () => std({ color: 0xb8924a, roughness: 0.34, metalness: 1 }));
export const zincMat = (): THREE.MeshStandardMaterial =>
  once('zinc', () => std({ color: 0xaab0b6, roughness: 0.38, metalness: 0.85 }));

/** A weld bead on a casing: a little lighter than the plate round it, whichever finish it is on. */
export const weldBead = (): THREE.MeshStandardMaterial =>
  once('weld-bead', () => std({ color: 0x7c817d, roughness: 0.55, metalness: 0.6 }));

/** The unit's lower casing, dull from the fire: dark scaled steel, blued here and there, soot above the hot places, a few spots of rust. Tiled: `around` times round, `along` times up. */
export function hotCasing(around = 6, along = 2): THREE.MeshStandardMaterial {
  return once(`hot-casing-${around}-${along}`, () =>
    std({
      color: 0xd8d2c8,
      map: tiled(scaleSteelMap(), around, along),
      roughness: 0.78,
      metalness: 0.5,
      side: THREE.DoubleSide,
    }),
  );
}

/** The fuel casing: grey-green paint, once, worn at the seams and chipped, a film of dust low down. A different finish from the lower casing, so that the two read as two bodies bolted together. */
export function upperCasing(around = 6, along = 2): THREE.MeshStandardMaterial {
  return once(`upper-casing-${around}-${along}`, () =>
    std({
      color: 0x6d8070,
      map: tiled(paintMap(), around, along),
      roughness: 0.58,
      metalness: 0.2,
      side: THREE.DoubleSide,
    }),
  );
}

/** The inside of the casing: sooty, dark, matt, but not black: in a section the inside is what is looked at, and it must read as steel, not as a hole. */
export const sootSteel = (): THREE.MeshStandardMaterial =>
  once('soot-steel', () => std({ color: 0x4a4138, roughness: 0.92, metalness: 0.15, side: THREE.DoubleSide }));

/** Section face of a metal wall, drawn as every section is: one pale flat colour. */
export const cutMetal = (): THREE.MeshStandardMaterial =>
  once('cut-metal', () => std({ color: COLOURS.cutFace, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }));

/** A perforated sleeve: the holes are an alpha. */
export function perforated(): THREE.MeshStandardMaterial {
  return once('perforated', () => {
    const m = std({
      color: 0x6a6f6c,
      alphaMap: tiled(perforatedAlpha(), 36, 3),
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.6,
    });
    return m;
  });
}

/** The tar and water on the cold wall: dark brown, a little shine, an alpha of runs. */
export function tarFilm(): THREE.MeshStandardMaterial {
  return once('tar-film', () =>
    std({
      color: COLOURS.condensate,
      alphaMap: tiled(tarRunsAlpha(), 3, 1),
      transparent: true,
      opacity: 0.82,
      roughness: 0.28,
      metalness: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
}

/** Wood chips, to lie on a face: its UVs are in metres, one tile about 0.5 m. */
export function chipFlakes(): THREE.MeshStandardMaterial {
  return once('chip-flakes', () =>
    std({ color: 0xf0e0c0, map: tiled(chipsMap(), 2, 2), roughness: 0.92, metalness: 0 }),
  );
}

/** Ash and char in the pit. */
export const ashMat = (): THREE.MeshStandardMaterial =>
  once('ash', () => std({ color: 0x7c7a76, roughness: 1, metalness: 0 }));
export const charMat = (): THREE.MeshStandardMaterial =>
  once('char', () => std({ color: 0x1a1816, roughness: 0.9, metalness: 0 }));

/** Tractor glass: faintly green-grey, translucent, not clear. */
export function cabGlass(): THREE.MeshPhysicalMaterial {
  return once('cab-glass', () => {
    const m = glass(0.2);
    m.color.set(0xb8cfc8);
    m.roughness = 0.08;
    m.side = THREE.DoubleSide;
    return m;
  });
}

/** Lamp glass. */
export const lampGlass = (): THREE.MeshStandardMaterial =>
  once('lamp-glass', () =>
    std({ color: 0xf2eed2, emissive: 0x6a6040, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.1 }),
  );

/** Black water in a vessel. */
export const blackWater = (): THREE.MeshStandardMaterial =>
  once('black-water', () =>
    std({ color: 0x2b1d12, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }),
  );

/** Clear plastic / glass of a jar. */
export const jarGlass = (): THREE.MeshPhysicalMaterial =>
  once('jar-glass', () => {
    const m = glass(0.22);
    m.color.set(0xdfeee8);
    m.side = THREE.DoubleSide;
    return m;
  });

/** Mineral wool under a skin: the filter box's outside, thin aluminised sheet, dull. */
export const lagging = (): THREE.MeshStandardMaterial =>
  once('lagging', () => std({ color: 0xa9aca9, roughness: 0.55, metalness: 0.7 }));

/** Fibre-glass cloth: pale, rough, a little translucent. */
export const cloth = (): THREE.MeshStandardMaterial =>
  once('fibreglass', () => std({ color: 0xd6d2c4, roughness: 1, metalness: 0, side: THREE.DoubleSide }));

/** Dust on the cloth side that has seen the gas: grey. */
export const dustMat = (): THREE.MeshStandardMaterial =>
  once('dust', () => std({ color: 0x585653, roughness: 1, metalness: 0, side: THREE.DoubleSide }));

/** Soil, gravel, straw: ground materials for the farm. UVs in metres. */
export const soil = (): THREE.MeshStandardMaterial =>
  once('soil', () => std({ color: 0xffffff, map: tiled(soilMap(), 0.5, 0.5), roughness: 1, metalness: 0 }));
export const gravel = (): THREE.MeshStandardMaterial =>
  once('gravel', () => std({ color: 0xffffff, map: tiled(gravelMap(), 0.8, 0.8), roughness: 1, metalness: 0 }));
export const straw = (): THREE.MeshStandardMaterial =>
  once('straw', () => std({ color: 0xffffff, map: tiled(strawMap(), 1.6, 1.6), roughness: 1, metalness: 0 }));

/** Emissive flame colours. */
export const flameMat = (): THREE.MeshBasicMaterial =>
  once(
    'flame',
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffa23c,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
  );

/** Clear glass for small things: a dial's window, a jar. */
export const glassClear = (): THREE.MeshPhysicalMaterial => jarGlass();
