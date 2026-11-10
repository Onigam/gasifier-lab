import { describe, expect, it } from 'vitest';
import { LAYOUT, MF_1100, MODEL, NOT_PRINTED, ROOM, lowerCasingHeight } from '../sim/machine';
import { NEVER_DISPLAYED } from '../sim/tags';
import {
  BODY,
  COOLER,
  ENGINE,
  FARM,
  FILTER,
  FILTER_AT,
  GARAGE,
  HEARTH,
  HOT,
  M,
  TRACTOR,
  UNIT,
  UNIT_AT,
  ZONES,
} from './dims';
import { PART_NAMES } from './part-ids';

// What `dims.ts` owns and what it only imports: the simulation's numbers are read from `src/sim/machine.ts`, never retyped; the sizes of the hot parts are the simulation's `NOT_PRINTED` and are drawn, never printed; the geometry agrees with the reported figures
// (the unit's 2.22 m, the filter's and the cooler's areas, the engine's swept volume, the garage's two volumes).

describe('one source of dimensions', () => {
  it('the machine is the simulation’s', () => {
    expect(M).toBe(MF_1100);
    expect(HOT).toBe(NOT_PRINTED['mf-1100']);
    expect(UNIT.bunkerR).toBe(MF_1100.bunkerDiameter / 2);
    expect(UNIT.bunkerH).toBe(MF_1100.bunkerHeight);
    expect(UNIT.lowerH).toBe(lowerCasingHeight(MF_1100));
    expect(UNIT.top).toBe(LAYOUT.unitTop);
    expect(UNIT.clearance).toBe(LAYOUT.unitClearance);
    expect(TRACTOR.mass).toBe(MF_1100.vehicleMass);
    expect(FILTER.area).toBe(MF_1100.filterArea);
    expect(COOLER.area).toBe(MF_1100.coolerArea);
    expect(ENGINE.displacement).toBe(MF_1100.displacement);
    expect(ENGINE.stroke).toBe(MF_1100.stroke);
  });

  it('the hot parts are NOT_PRINTED, to scale', () => {
    const n = NOT_PRINTED['mf-1100'];
    expect(HEARTH.boxR * 2).toBeCloseTo(n.fireboxDiameter, 9);
    expect(HEARTH.throatR * 2).toBeCloseTo(n.throatDiameter, 9);
    expect(HEARTH.nozzleCount).toBe(n.nozzleCount);
    expect(HEARTH.nozzleBore).toBe(n.nozzleBore);
    expect(HEARTH.nozzleLength).toBe(n.nozzleLength);
    expect(HEARTH.nozzleY - HEARTH.throatY).toBeCloseTo(n.nozzlePlaneAboveThroat, 9);
    expect(HEARTH.throatY - HEARTH.grateY).toBeCloseTo(n.grateBelowThroat, 9);
  });

  it('the unit’s top is the reported height: the lid’s yoke is the highest thing on it', () => {
    expect(UNIT.height + UNIT.clearance).toBeCloseTo(LAYOUT.unitTop, 9);
    expect(UNIT.lid.yokeUnder).toBeLessThan(UNIT.height);
    expect(UNIT.rimTop).toBeLessThan(UNIT.lid.yokeUnder);
  });

  it('the zones stand in order, one on the next, inside the casings', () => {
    expect(ZONES.reduction.y1).toBeCloseTo(ZONES.oxidation.y0, 9);
    expect(ZONES.oxidation.y1).toBeLessThan(ZONES.pyrolysis.y0 + 1e-9);
    expect(ZONES.pyrolysis.y1).toBeCloseTo(ZONES.drying.y0, 9);
    expect(ZONES.reduction.y0).toBe(HEARTH.grateY);
    expect(ZONES.drying.y1).toBeLessThan(UNIT.rimTop);
    // the hearth sits in the lower casing, the hood under the joint
    expect(HEARTH.nozzleY + HEARTH.boxTopAboveNozzle).toBeLessThan(UNIT.jointY);
    expect(HEARTH.boxR).toBeLessThan(UNIT.lowerR);
  });

  it('the filter’s bags give the reported area, the cooler’s tubes theirs (derived: count and size are estimates)', () => {
    expect(FILTER.areaDrawn).toBeGreaterThan(FILTER.area * 0.98);
    expect(FILTER.areaDrawn).toBeLessThan(FILTER.area * 1.02);
    const drawn = COOLER.tubes * Math.PI * COOLER.tubeD * COOLER.tubeL;
    expect(drawn).toBeCloseTo(COOLER.area, 6);
    expect(COOLER.rows * COOLER.cols).toBe(COOLER.tubes);
    expect(FILTER.bags * FILTER.pitch).toBeLessThan(FILTER.length);
  });

  it('the engine’s bore and stroke give the swept volume', () => {
    const v = ENGINE.cylinders * (Math.PI / 4) * ENGINE.bore ** 2 * ENGINE.stroke;
    expect(v).toBeCloseTo(M.displacement, 9);
  });

  it('the pipes are the simulation’s equivalent pipe', () => {
    expect(2 * 0.0375).toBeCloseTo(MODEL.pipeDiameter, 9);
  });

  it('the garage: free air plus what the machine displaces is the drawn room, for both volumes', () => {
    const gross = (g: { w: number; d: number; h: number }): number => g.w * g.d * g.h;
    expect(gross(GARAGE.small)).toBeGreaterThan((ROOM.garageSmall + GARAGE.machineM3) * 0.99);
    expect(gross(GARAGE.small)).toBeLessThan((ROOM.garageSmall + GARAGE.machineM3) * 1.01);
    expect(gross(GARAGE.large)).toBeGreaterThan((ROOM.garageLarge + GARAGE.machineM3) * 0.99);
    expect(gross(GARAGE.large)).toBeLessThan((ROOM.garageLarge + GARAGE.machineM3) * 1.01);
    // the room above is the model's 60 m³
    expect(GARAGE.above.w * GARAGE.above.d * GARAGE.above.h).toBeCloseTo(ROOM.aboveVolume, 6);
    expect(GARAGE.smallM3).toBe(ROOM.garageSmall);
    expect(GARAGE.largeM3).toBe(ROOM.garageLarge);
  });

  it('the tractor’s rear tread is the overall width less a tyre, inside the third party’s range', () => {
    expect(TRACTOR.rear.tread).toBeCloseTo(TRACTOR.width - TRACTOR.rear.width, 9);
    expect(TRACTOR.rear.tread).toBeGreaterThan(1.52);
    expect(TRACTOR.rear.tread).toBeLessThan(2.43);
    expect(TRACTOR.front.tread).toBeGreaterThan(1.42);
    expect(TRACTOR.front.tread).toBeLessThan(2.03);
    expect(BODY.cab.top).toBe(TRACTOR.cabTop);
  });

  it('the filter stands where the pipe from the unit’s outlet meets it (derived, not typed)', () => {
    expect(FILTER_AT.y).toBeCloseTo(UNIT_AT.y + 0.44 + 0.34 - FILTER.inlet.y, 6);
    expect(FILTER_AT.z).toBeCloseTo(UNIT_AT.z - FILTER.inlet.z, 9);
  });

  it('the 4 m crusher is 4 m (K38) and the farm sits on the research’s plan', () => {
    expect(FARM.crusher.width).toBe(4);
    expect(FARM.garage.x).toBeGreaterThan(FARM.house.x + FARM.house.w / 2 - 0.5);
  });
});

describe('the sizes of the hot parts are never printed (R2)', () => {
  const sizes = [
    HOT.throatDiameter,
    HOT.nozzleBore,
    HOT.fireboxDiameter,
    HOT.nozzlePlaneAboveThroat,
    HOT.grateBelowThroat,
    HOT.nozzleLength,
  ];
  const forms = (v: number): string[] => [
    String(v),
    String(v * 1000),
    (v * 100).toString(),
    v.toFixed(3),
    v.toFixed(2),
    `${v * 1000} mm`,
    `${v * 1000}mm`,
    `${Math.round(v * 1000)}`,
  ];

  it('no label, name or hotspot of any world carries one of those numbers, in either language', () => {
    const text = PART_NAMES.flatMap((p) => [p.fr, p.en]).join(' | ');
    for (const v of sizes) for (const f of forms(v)) expect(text, f).not.toContain(` ${f}`);
    // and no digit in a part's name but a year: a name is a name
    for (const p of PART_NAMES) {
      expect(p.fr.replace('1940', ''), p.id).not.toMatch(/\d/);
      expect(p.en.replace('1940', ''), p.id).not.toMatch(/\d/);
    }
  });

  it('no module of src/three imports the sizes into text: the hot geometry is read, never formatted', () => {
    // a template literal or a toFixed on a name of the hot sizes would be a print
    const sources = import.meta.glob('./**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
      string,
      string
    >;
    const names =
      /(throatDiameter|nozzleBore|fireboxDiameter|nozzlePlaneAboveThroat|grateBelowThroat|HEARTH\.throatR|HEARTH\.boxR)/;
    let checked = 0;
    for (const [file, text] of Object.entries(sources)) {
      if (file.endsWith('.test.ts')) continue;
      for (const line of text.split('\n')) {
        if (!names.test(line)) continue;
        checked++;
        // geometry may use them; nothing may format them
        expect(line, `${file}: ${line.trim()}`).not.toMatch(
          /toFixed|toLocaleString|`[^`]*\$\{[^}]*(throat|nozzle|firebox|HEARTH)/i,
        );
      }
    }
    expect(checked).toBeGreaterThan(3);
  });

  it('the NEVER_DISPLAYED patterns match no name of a state key (held by the simulation) and none of the part names', () => {
    for (const rule of NEVER_DISPLAYED) {
      // the parts `throat-ring`, `air-nozzles`, `injection-pump` and `pilot-injector` are the research's names of parts, not sizes or settings: their sheets carry none (the data role's test)
      if (rule.pattern.source.includes('throat') || rule.pattern.source.includes('pilot')) continue;
      for (const p of PART_NAMES) expect(`${p.fr} ${p.en}`, `${rule.what}: ${p.id}`).not.toMatch(rule.pattern);
    }
  });
});
