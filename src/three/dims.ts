import { LAYOUT, MF_1100, MODEL, NOT_PRINTED, ROOM, lowerCasingHeight } from '../sim/machine';

// The one place for every dimension the 3D draws, in metres. What the simulation also owns comes from `src/sim/machine.ts` and is not retyped (`dims.test.ts` holds that). What only the drawing needs is here, each constant with its word, as in
// docs/research.md:
//   reported   said by a source (K and S numbers of docs/research.md)
//   derived    computed from reported figures, the formula is beside it
//   estimate   the sources are silent: a choice of ours, with its reason. No source publishes these, and a sheet that prints one says so
//   third-party  the base tractor's figures, from TractorData (S10), no maker's brochure read
//
// **Geometry the model does not print.** `HOT` is `NOT_PRINTED` of `src/sim/machine.ts`: the throat, the nozzles, the firebox, the heights of the zones. The 3D draws them to scale because a false model is no answer (research §A.2, R2), and nothing prints them: no
// sheet, spec, lesson, label, hotspot or voice. `src/three/dims.test.ts` and `worlds.test.ts` hold that. Everything below that sits beside them (`HEARTH`: the ring, the hood, the grate's bars) is the same kind of number and is held to the same rule.
//
// Not a build plan (BRIEF §8, research §0.5, R1). No cut line, no weld, no seal, no tolerance, no tool lives here: these are the numbers of a reconstruction, for looking at, and nothing here shows that a build would be acceptable or allowed.
//
// Frames. **Tractor frame T** (the machine's own, for every world): origin on the ground under the rear axle, x forward, y up, z to the tractor's right (so its left, where the unit stands, is −z). A world places the root and nothing else.
// **Unit frame U**: origin on the unit's axis at the foot of its lower casing, the same axes as T (no rotation): +x is where the gas leaves, −x where the air comes in, −z the ash port and the left of the tractor.

export const DEG = Math.PI / 180;
export const M = MF_1100;
/** Geometry only: never printed (R2). */
export const HOT = NOT_PRINTED['mf-1100'];

// ------------------------------------------------------------------------------------------------ the base tractor

export const TRACTOR = {
  /** Third party (S10): wheelbase, length, width, height at the steering wheel, cab, clearance. No maker's brochure was found. */
  wheelbase: 2.59,
  length: 4.09,
  width: 2.7,
  steeringWheelTop: 1.89,
  cabTop: 2.88,
  clearance: 0.43,
  /** Reported (K1): the gas version's mass, kg. */
  mass: M.vehicleMass,
  rear: {
    x: 0,
    /** 18.4-38: width 18.4 in. Radius: estimate, 38 in of rim and a tall agricultural sidewall (the sources give the size, not the diameter). */
    width: 0.467,
    R: 0.88,
    /** Derived: the overall width less one tyre. Inside the 1.52 to 2.43 range of S10. */
    tread: 2.7 - 0.467,
  },
  front: {
    x: 2.59,
    /** 7.50-18 (S10): width 7.5 in. Radius: estimate. */
    width: 0.19,
    R: 0.4,
    /** Estimate, inside the 1.42 to 2.03 range of S10. */
    tread: 1.9,
  },
} as const;

/** The tractor's body, estimates from the photograph of Fig. 3.9 and the heights above; the castings of a unit-construction tractor are the frame. */
export const BODY = {
  /** The platform the driver stands on, estimate. */
  floorY: 1.25,
  cab: { x0: -0.3, x1: 1.2, halfW: 0.74, top: TRACTOR.cabTop },
  bonnet: { x0: 1.2, x1: 3.15, halfW: 0.4, y0: 1.0, top: 1.58 },
  /** Radiator and grille, ahead of the engine. */
  grilleX: 3.15,
  /** Final-drive and gearbox castings. */
  rearHousing: { x0: -0.35, x1: 0.55, y0: 0.62, y1: 1.3, halfW: 0.62 },
  gearbox: { x0: 0.55, x1: 1.62, y0: 0.5, y1: 1.2, halfW: 0.3 },
  /** Front axle bolster. */
  bolster: { x0: 2.35, x1: 2.85, y0: 0.45, y1: 0.78, halfW: 0.28 },
  fender: { halfLength: 0.9, top: 1.82, width: 0.6 },
  seat: { x: 0.55, y: 1.55 },
  steeringWheel: { x: 1.02, y: 1.89, R: 0.2 },
} as const;

/** The engine: a Perkins six-cylinder diesel (K2: 5.8 dm³). The bore is third party (S10: 3.875 in) and the stroke is the simulation's (`MF_1100.stroke`). */
export const ENGINE = {
  displacement: M.displacement,
  cylinders: 6,
  stroke: M.stroke,
  /** Derived: the bore from the swept volume of one cylinder, V/6 = π/4·bore²·stroke. */
  bore: Math.sqrt((4 * (M.displacement / 6)) / (Math.PI * M.stroke)),
  /** The block. */
  block: { x0: 2.02, x1: 3.0, y0: 0.62, y1: 1.2, halfW: 0.23 },
  /** Cylinder pitch, estimate. */
  pitch: 0.155,
  clutchHousing: { x0: 1.62, x1: 2.02, y0: 0.58, y1: 1.18 },
  sump: { y0: TRACTOR.clearance, y1: 0.66 },
  /** Fan and pulleys, at the front of the block. */
  fan: { x: 3.04, y: 1.0, R: 0.27 },
} as const;

// ------------------------------------------------------------------------------------------------ the gasifier unit

/** The unit's place on the tractor, in T: its axis, and the foot of the lower casing at the clearance (K6: 500 mm). */
export const UNIT_AT = { x: 1.82, y: LAYOUT.unitClearance, z: -0.795 } as const;

export const UNIT = {
  /** Reported (K6): top above the ground; the clearance below it. */
  top: LAYOUT.unitTop,
  clearance: LAYOUT.unitClearance,
  /** Reported (S1 Table 3.2's 199 dm³ row): the bunker's radius and height. */
  bunkerR: M.bunkerDiameter / 2,
  bunkerH: M.bunkerHeight,
  /** Derived (research §3): top less clearance less bunker. */
  lowerH: lowerCasingHeight(M),
  /** Estimate, about 0.63 from Fig. 3.2a. */
  lowerR: 0.315,
  /** Sheet steel, estimate. */
  wall: 0.004,
  /** Where the two casings meet, in U. */
  jointY: lowerCasingHeight(M),
  /** The band that holds them together and carries the eccentric lock. */
  band: { R: 0.33, h: 0.05 },
  /** Total height of the drawn unit, in U: the lower casing, the bunker. */
  height: lowerCasingHeight(M) + M.bunkerHeight,
  /** The fuel casing's rolled rim, where the lid sits, in U. Estimate: the lid, its yoke and spring stand over it, so the unit's top is reported. */
  rimTop: 1.6,
  /** The lid on the bunker: a dished plate, estimate; the yoke over it brings the top to the reported height. */
  lid: { R: 0.325, dish: 0.03, thick: 0.004, yokeUnder: 1.69 },
  /** The bunker's perforated sleeve and the gap behind it, estimate (Fig. 3.2a). */
  sleeve: { R: 0.272, y0: 0.02, h: 0.46, holes: 36 },
  /** The condensate gutter inside the casing at the foot of the gap, estimate. */
  gutter: { h: 0.045 },
  /** The ring the unit stands on, bolted to its console, estimate. */
  baseR: 0.34,
} as const;

/**
 * The hot parts, in U. **Never printed** (R2): the throat, the nozzles, the firebox and the heights come from `NOT_PRINTED`; the ash pit's depth, the ring's profile, the hood, the bars and the plenum are estimates beside them, and
 * held to the same rule. The zones' heights are the geometry's: the throat at the grate's height plus `grateBelowThroat`, the nozzle plane at `nozzlePlaneAboveThroat` above it.
 */
export const HEARTH = {
  /** Estimate: the depth of the ash pit under the grate. */
  grateY: 0.255,
  /** The firebox is a cylinder of this outer radius (`fireboxDiameter`); its wall, estimate. */
  boxR: HOT.fireboxDiameter / 2,
  boxWall: 0.006,
  /** Throat plane, nozzle plane, grate: from `NOT_PRINTED`. */
  throatY: 0.255 + HOT.grateBelowThroat,
  nozzleY: 0.255 + HOT.grateBelowThroat + HOT.nozzlePlaneAboveThroat,
  throatR: HOT.throatDiameter / 2,
  nozzleCount: HOT.nozzleCount,
  nozzleBore: HOT.nozzleBore,
  nozzleLength: HOT.nozzleLength,
  /** Estimate: the circle the nozzle tips stand on, and the plenum around the firebox that feeds them. */
  nozzleTipR: 0.095,
  plenum: { r0: HOT.fireboxDiameter / 2, r1: HOT.fireboxDiameter / 2 + 0.032, h: 0.05 },
  /** Estimate: the top of the firebox stands this far above the nozzle plane; the hood joins it to the casing. */
  boxTopAboveNozzle: 0.045,
  /** Estimate: the throat ring, a loose pot on its support ring (S1 §3.1.2): its height above the throat plane, and the plate under it. */
  ring: { h: 0.1, plate: 0.015, rimR: 0.15 },
  /** Estimate: the grate's bars and its shaft. */
  grate: { bars: 15, barW: 0.016, barH: 0.022, shaftR: 0.011 },
} as const;

/** What the model's cursor maps to in the geometry: the zone's own span, in U. Each zone fills its own height, so the drawn zones follow the drawn hearth. */
export const ZONES = {
  reduction: { y0: HEARTH.grateY, y1: HEARTH.throatY },
  oxidation: { y0: HEARTH.throatY, y1: HEARTH.nozzleY + 0.02 },
  pyrolysis: { y0: HEARTH.nozzleY + 0.02, y1: HEARTH.nozzleY + 0.02 + 0.22 },
  drying: { y0: HEARTH.nozzleY + 0.02 + 0.22, y1: HEARTH.nozzleY + 0.02 + 0.22 + 0.27 },
} as const;

/** The bunker's chips, in U: the column from the neck to the level, over the zones. */
export const COLUMN = {
  /** Estimate: chips and a loose pile; the full column stops this far under the lid. */
  freeboard: 0.05,
  /** Reported (S1 Table 3.7): most of the mass is 15 to 30 mm. */
  chipLength: 0.022,
  chipWidth: 0.011,
  chipThick: 0.003,
} as const;

/** Where the unit's fittings leave it, in U. Estimates, held to the figure's arrangement (Fig. 3.2a): the gas outlet at about the throat level (S1 §3.1.2), the air intake beside the nozzle plane. */
export const FITTINGS = {
  outletY: HEARTH.throatY,
  /** The air intake meets the plenum at its middle. */
  intakeY: HEARTH.nozzleY + 0.0125,
  drainY: lowerCasingHeight(M) + 0.02,
  /** The grate's shaft leaves on the gas side, low. */
  shaftY: HEARTH.grateY,
  /** The ash port: a half-moon door on the left of the tractor, at the foot. */
  ashDoor: { y0: 0.035, y1: 0.215, R: 0.17 },
  pipeR: 0.0375,
} as const;

// ------------------------------------------------------------------------------------------------ the gas train

/** The pipes: 75 mm bore is the simulation's equivalent pipe (`MODEL.pipeDiameter`, an estimate); the arrangement is Fig. 3.8's. */
export const PIPE = {
  R: MODEL.pipeDiameter / 2,
  wall: 0.003,
  bend: 0.1,
  flangeR: MODEL.pipeDiameter / 2 + 0.022,
  flangeT: 0.008,
} as const;

/** The fabric filter: area reported (K4), a box of flat bags on frames (Fig. 3.6). The box's size and the bags' count are estimates; the count and the bag give the reported area. */
export const FILTER = {
  area: M.filterArea,
  bags: 13,
  /** One flat bag: width, height, thickness of its frame, estimates. Two faces of cloth each. */
  bagW: 0.26,
  bagH: 0.72,
  bagT: 0.026,
  /** Derived: bags × 2 faces × width × height. About the reported 4.9 m². */
  areaDrawn: 13 * 2 * 0.26 * 0.72,
  pitch: 0.068,
  /** The box, outside, estimate: insulated, 10 mm of mineral wool (S1 §3.1.3) under a thin skin. */
  length: 0.92,
  width: 0.4,
  height: 0.92,
  skin: 0.012,
  /** The ash tray under the bags, the clean-gas chamber over them: heights. */
  trayH: 0.09,
  chamberH: 0.1,
  /** Where its dirty-gas inlet stands on its rear face, from the foot and the axis, estimates (Fig. 3.6: the dirty gas comes in at mid-height on a side, clean gas leaves by the lid). */
  inlet: { y: 0.28, z: -0.135 },
} as const;

/** The hot-gas pipe from the unit's outlet to the filter: out of the flange, a short run, up a riser to the tee where the fan's stack leaves; the stop valve sits between the tee and the filter. Estimates, Fig. 3.8's arrangement. */
export const HOTPIPE = { run: 0.05, riser: 0.34, teeRun: 0.03, teeStub: 0.06, flange: 0.008 } as const;
/** The stop valve, flange to flange, and the fan's stack. Estimates. */
export const STOPVALVE = { len: 0.08, stackH: 1.15 } as const;

/** The filter box's place in T, derived by following the pipe from the unit's outlet: the box stands where the stop valve's far flange meets its inlet. */
const outletX = UNIT_AT.x + 0.38;
const outletY = UNIT_AT.y + FITTINGS.outletY;
export const FILTER_AT = {
  x: outletX + HOTPIPE.run + HOTPIPE.teeRun + HOTPIPE.flange + (STOPVALVE.len + 2 * HOTPIPE.flange) + 0.058,
  y: outletY + HOTPIPE.riser - FILTER.inlet.y,
  z: UNIT_AT.z - FILTER.inlet.z,
} as const;

/** The gas cooler: reported area 5.8 m² (K4), a bank of vertical tubes in front of the radiator (Fig. 3.8), gas up one half and down the other. The count and the tube are estimates that give the area. */
export const COOLER = {
  area: M.coolerArea,
  tubes: 108,
  tubeD: 0.02,
  /** Derived: L = area / (n·π·d). */
  tubeL: M.coolerArea / (108 * Math.PI * 0.02),
  rows: 6,
  cols: 18,
  pitch: 0.032,
  boxH: 0.12,
  headerH: 0.1,
  /** Its place in T: x of the rear face, y of the foot of the lower box. */
  at: { x: 3.28, y: 0.62 },
  vessel: { R: 0.07, h: 0.2 },
} as const;

/** The starting fan and its stack (Fig. 3.8). Estimates. */
export const FAN = { scrollR: 0.15, depth: 0.1, outletW: 0.08, stackR: 0.03, stackTop: 2.5 } as const;

/** The mixer, throttles and manifold, on the left of the engine (Fig. 3.8). Estimates. */
export const MIXER = {
  bodyR: 0.06,
  bodyH: 0.2,
  at: { x: 2.66, y: 1.592, z: -0.12 },
  manifold: { len: 0.6, r: 0.045 },
} as const;

/** The cyclone: on Fig. 3.5b, the programme's fabric-filter system, not on this tractor's schematic (conflict 22). Estimate. */
export const CYCLONE = { R: 0.11, bodyH: 0.26, coneH: 0.28 } as const;

/** The water gauge: a U-tube of water in front of the driver's eye on the cab post, mm Wg (K62). Estimate. */
export const GAUGE = { h: 0.32, tubeR: 0.007 } as const;

// ------------------------------------------------------------------------------------------------ the room

/** The garage: its volume is the simulation's (50 or 1,000 m³, S3, K50). The 3D's gross room is that free air plus what the machine displaces (an estimate): so a well-mixed box of V and the drawn room agree. */
export const GARAGE = {
  smallM3: ROOM.garageSmall,
  largeM3: ROOM.garageLarge,
  /** Estimate: the volume the tractor and its system displace, m³ (about half its box of 4.4 × 2.7 × 3.1). */
  machineM3: 18,
  /** Plan (x across, z deep) and clear height of each size, estimates chosen so that the gross room is the free air plus the machine: 4.2 × 4.85 × 3.35 = 68.2 and 11 × 21 × 4.4 = 1016.4. */
  small: { w: 4.2, d: 4.85, h: 3.35 },
  large: { w: 11, d: 21, h: 4.4 },
  wall: 0.3,
  /** Room above: the simulation's 60 m³ (`ROOM.aboveVolume`). Plan as the small garage's, height derived. */
  above: { w: 4.2, d: 4.85, h: ROOM.aboveVolume / (4.2 * 4.85) },
} as const;

export const tractorBox = { length: TRACTOR.length, width: TRACTOR.width, height: TRACTOR.cabTop };

// ------------------------------------------------------------------------------------------------ the farm

/**
 * The farm of `farm`: a large farm in southern Sweden around 1970 (research §0.4, §3). **No source gives any of it:** the buildings and the land are estimates, drawn at the scale of a farm that could run a 5-tonne tractor on beets and grain over several
 * hundred hectares. The only reported figures are the implement's width (a 4 m clod crusher, K38) and what the farm does (S1 §3.2.2). F frame: x east, z south (towards the field), y up; the yard at the origin.
 */
export const FARM = {
  /** The yard, gravel round the buildings, and the field: soil to the south, across the ditch. */
  yard: { x: 0, z: 0, r: 34 },
  field: { x1: 78, z0: 11, z1: 130 },
  /** The drainage ditch between the yard and the field, along x: width of the bottom, depth, run of its banks per metre of depth. */
  ditch: { z: 8.6, width: 1.1, depth: 0.95, slope: 1.7, length: 420 },
  lane: { z: -3, width: 3.6 },
  /** Farmhouse: plan (x, z), height of the eaves, its centre. Two storeys, red-painted boards. */
  house: { x: -17, z: -9, w: 12, d: 7, wall: 5.2 },
  /** The garage with its bedroom over it, attached to the house's east gable; its door in the front wall. */
  garage: { x: -8.6, z: -5.8 },
  /** The chip barn. */
  barn: { x: 17, z: -22, w: 20, d: 10, wall: 5.0 },
  /** Implements and stores, yard places. */
  chipper: { x: 3.5, z: -9 },
  sieve: { x: 10.5, z: -9.5 },
  chipPile: { x: 5.6, z: -9 },
  woodpile: { x: 25.5, z: -10.5 },
  ashBin: { x: -4.4, z: -3.2 },
  barrel: { x: -4.2, z: -7.4 },
  /** The 4 m clod crusher (K38): width reported. Its length behind the hitch, estimate. */
  crusher: { width: 4.0, depth: 1.4, pole: 2.6, rings: 2 * 24 },
  /** The loop the tractor drives in the field: a rounded rectangle, centre, straight length and radius of the ends. */
  loop: { x: 6, z: 28, len: 46, r: 7 },
  /** The clock: the farm's working day starts at this hour, estimate (the model's clock starts at 0). */
  dayStart: 6.5,
} as const;
