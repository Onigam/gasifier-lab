import { describe, expect, it } from 'vitest';
import { GasifierSim, PETROL_MIXTURE } from './engine';
import { dewPoint, mixtureEnergy, stoichAirToGas, heatingValue, stepRooms, toPpm, waterGasK } from './gas';
import { CO_LADDER } from './ladder';
import {
  CHIP_GRADES,
  DIESEL_LHV,
  FAN_CO,
  FILTER_MAX_T,
  FILTER_WET_FACTOR,
  GAS_MIN,
  IDLE_EXHAUST_CO,
  LAYOUT,
  LHV_AT_8,
  LHV_DRY,
  lowerCasingHeight,
  MF_1100,
  MODEL,
  MOISTURE_NO_BURN,
  MOISTURE_UPPER,
  NOT_PRINTED,
  POST_GAS_CO,
  ROOM,
  SCANIA_L8050,
  TEST_MOISTURE,
} from './machine';
import { MOLAR_MASS, N2_PER_O2 } from './gas';
import { Plant } from './plant';
import { DOOR_ACH } from './machine';
import {
  CONVERTED,
  FINES_POWER_KW,
  FLEET,
  FORDSON_PART_LOAD,
  HEARTH_LOAD_TABLE,
  SCANIA_L5150_DUAL,
  TABLE_3_13,
  tarMeasured,
  TRUCK_ROAD,
} from './reported';
import {
  fullPower,
  loadCurve,
  moistureAtHeating,
  moistureSweep,
  otherAtPower,
  otherFullPower,
  params,
  roomRun,
  serviceRange,
  steadyPoint,
  tableIdle,
  tableMax,
  tablePart,
  truckRun,
  wotCurve,
} from './runs';
import { filterAgeFactor, filterDrop } from './train';

// A test per key figure of docs/research.md, K1 to K68, with its number in the name. Three kinds, as in docs/physics.md §3:
//   exact      arithmetic on reported figures: `toBeCloseTo` the source, what research §2.10 asked for
//   retrieved  the model's own value against the source's: the pin holds the model, the source is beside it. A pin is not a target
//   not found  a test of what the model does give, and a line in docs/physics.md saying why
// The † of research §2.2 are never asserted of the model: conflicts 3 and 4.
//
// R2: the hearth load is computed here, in this file alone, from the throat. It shows that the throat and the table belong together, and it stops here.

const max = tableMax();
const part = tablePart();
const idle = tableIdle();
const full = fullPower();
const off = (model: number, source: number): number => model / source - 1;

const KW_WOOD_MAX = (41 * LHV_AT_8) / 3.6e6;
const KW_DIESEL = (kg: number): number => (kg * DIESEL_LHV) / 3.6e6;

describe('K1 to K8, the machine as tested', () => {
  it('K1 tractor: 5,090 kg in the gas version', () => expect(MF_1100.vehicleMass).toBe(5090));
  it('K2 engine: 5.8 dm³. The compression stays out of the model and the state (R4)', () => {
    expect(MF_1100.displacement).toBeCloseTo(5.8e-3, 8);
    // S10's bore and stroke give the same volume: 6 × π/4 × 3.875² × 5 in³
    expect(((6 * Math.PI) / 4) * 0.098425 ** 2 * MF_1100.stroke).toBeCloseTo(5.8e-3, 3);
  });
  it('K3 gasifier: 0.2 m³ of bunker. Its throat is in NOT_PRINTED, nowhere in a state (R2)', () => {
    expect(MF_1100.bunkerVolume).toBe(0.2);
    expect(NOT_PRINTED['mf-1100'].throatDiameter).toBe(0.12);
    expect(((Math.PI / 4) * MF_1100.bunkerDiameter ** 2 * MF_1100.bunkerHeight) / 0.2).toBeGreaterThan(1.3);
  });
  it('K4 filter 4.9 m², cooler 5.8 m²; the first filter’s 2.5 m² doubles the drop, which explains the change', () => {
    expect(MF_1100.filterArea).toBe(4.9);
    expect(MF_1100.coolerArea).toBe(5.8);
    const G = 89 / 3600;
    expect(filterDrop(G, 2.5, 0, false) / filterDrop(G, 4.9, 0, false)).toBeCloseTo(1.95, 0);
  });
  it('K5 system: 450 kg', () => expect(MF_1100.systemMass).toBe(450));
  it('K6 layout: 2.22 m, 0.50 m, eye 2.25–2.40 m, and the lower casing that follows', () => {
    expect(LAYOUT.unitTop).toBe(2.22);
    expect(LAYOUT.unitClearance).toBe(0.5);
    expect(LAYOUT.eyeLow).toBe(2.25);
    expect(LAYOUT.eyeHigh).toBe(2.4);
    expect(lowerCasingHeight()).toBeCloseTo(0.79, 2);
  });
  it('K7 changes to the tractor: the 3D’s and the sheets’, nothing here', () => expect(true).toBe(true));
  it('K8 fuel: 8 %, 152 kg/m³, so 30.4 kg in the bunker', () => {
    expect(TEST_MOISTURE).toBe(0.08);
    expect(MF_1100.bulkDensity).toBe(152);
    expect(MF_1100.bunkerVolume * MF_1100.bulkDensity).toBeCloseTo(30.4, 6);
  });
});

describe('K9 to K19, the energy balance', () => {
  it('K9 speed: an input, the line of the three reported points', () => {
    const pl = new Plant(params());
    expect(pl.speedForLoad(1)).toBeCloseTo(1855, 6);
    expect(pl.speedForLoad(29 / 40)).toBeCloseTo(1440, 6);
    expect(pl.speedForLoad(0)).toBeCloseTo(1015, 6);
  });
  it('K10 output: 40 and 29 kW are asked of the model. Full throttle at those speeds gives more: the 40 kW test was not the limit there (conflict 2)', () => {
    expect(max.power).toBeCloseTo(40, 3);
    expect(part.power).toBeCloseTo(29, 3);
    expect(idle.power).toBeCloseTo(0, 3);
    expect(max.powerWot).toBeCloseTo(52.4, 0);
    expect(part.powerWot).toBeCloseTo(45.2, 0);
  });
  it('K11 chips: 34.3, 23.9, 6.9 kg/h against 41, 27, 8.5. NOT retrieved: −16, −12, −19 %', () => {
    expect(max.chips).toBeCloseTo(34.3, 0);
    expect(part.chips).toBeCloseTo(23.9, 0);
    expect(idle.chips).toBeCloseTo(6.9, 0);
    expect(off(max.chips, TABLE_3_13.chipsKgH[0])).toBeCloseTo(-0.16, 1);
    expect(off(part.chips, TABLE_3_13.chipsKgH[1])).toBeCloseTo(-0.12, 1);
    expect(off(idle.chips, TABLE_3_13.chipsKgH[2])).toBeCloseTo(-0.19, 1);
  });
  it('K11, what would change it: the indicated efficiency the book’s other engines imply goes the other way; this tractor’s own would close it', () => {
    expect(tableMax({ etaDual: 0.43 }).chips).toBeCloseTo(31.6, 0);
    expect(tableMax({ etaDual: 0.36 }).chips).toBeCloseTo(38.5, 0);
  });
  it('K12 diesel: 2.2 is the input, a constant injection per stroke (S1 §3.1.4). It finds 1.71 against 1.9 and 1.20 against 1.2', () => {
    expect(max.diesel).toBeCloseTo(2.2, 6);
    expect(part.diesel).toBeCloseTo(1.71, 2);
    expect(idle.diesel).toBeCloseTo(1.2, 1);
    expect(off(part.diesel, 1.9)).toBeCloseTo(-0.1, 1);
  });
  it('K13 gas: 5.27, 5.37, 5.55 against 5.60, 5.56, 5.54 MJ/Nm³. Retrieved to −6 %, flat in the table and rising towards idle here', () => {
    expect(max.gasMJ).toBeCloseTo(5.27, 1);
    expect(part.gasMJ).toBeCloseTo(5.37, 1);
    expect(idle.gasMJ).toBeCloseTo(5.55, 1);
    expect(off(max.gasMJ, TABLE_3_13.gasMJ[0])).toBeGreaterThan(-0.07);
    expect(Math.abs(off(idle.gasMJ, TABLE_3_13.gasMJ[2]))).toBeLessThan(0.01);
  });
  it('K14 cold-gas efficiency: 75.5, 76.3, 77.9 against 71.1, 66.5, 73.1 %. High by 4 to 10 points, with one estimate of loss', () => {
    expect(max.coldGasPct).toBeCloseTo(75.5, 0);
    expect(part.coldGasPct).toBeCloseTo(76.3, 0);
    expect(idle.coldGasPct).toBeCloseTo(77.9, 0);
    expect(max.coldGasPct - TABLE_3_13.coldGasPct[0]).toBeLessThan(5);
    expect(part.coldGasPct - TABLE_3_13.coldGasPct[1]).toBeGreaterThan(9);
  });
  it('K15 diesel’s share, exact on the table’s kg: 11.8, 14.9, 26.1 %, where it prints 18.9 †, 15.0, 26.2. The model: 13.8, 15.2, 30.3', () => {
    const share = (chips: number, d: number): number =>
      (KW_DIESEL(d) / ((chips * LHV_AT_8) / 3.6e6 + KW_DIESEL(d))) * 100;
    expect(share(41, 2.2)).toBeCloseTo(11.8, 1);
    expect(share(27, 1.9)).toBeCloseTo(14.9, 0);
    expect(share(8.5, 1.2)).toBeCloseTo(26.1, 0);
    expect(max.dieselSharePct).toBeCloseTo(13.8, 0);
    expect(part.dieselSharePct).toBeCloseTo(15.2, 0);
    expect(idle.dieselSharePct).toBeCloseTo(30.3, 0);
  });
  it('K16 total efficiency, exact: 18.1 % at the maximum, 19.2 % at part load where the table prints 5.3 † and its Fig. 3.11 shows 19', () => {
    const total = (kw: number, chips: number, d: number): number =>
      (kw / ((chips * LHV_AT_8) / 3.6e6 + KW_DIESEL(d))) * 100;
    expect(total(40, 41, 2.2)).toBeCloseTo(18.1, 1);
    expect(total(29, 27, 1.9)).toBeCloseTo(19.2, 1);
    expect(max.totalEffPct).toBeCloseTo(21.2, 0);
    expect(part.totalEffPct).toBeCloseTo(21.7, 0);
  });
  it('K16, the curve’s shape: the model’s best is between 70 and 80 %, where the figure’s is at about 72 %, and it falls to zero at idle', () => {
    const c = loadCurve(20);
    const best = c.reduce((a, b) => (b.effPct > a.effPct ? b : a));
    expect(best.load).toBeGreaterThanOrEqual(65);
    expect(best.load).toBeLessThanOrEqual(85);
    expect(best.effPct).toBeCloseTo(21.6, 0);
    expect(c[0]!.effPct).toBeCloseTo(0, 3);
  });
  it('K17 total losses, exact: 180.9 kW, 121.8 kW, 54.6 kW, where the table prints 181.5, 143.3 †, 54.8. The model: 149, 105, 47', () => {
    expect(KW_WOOD_MAX + KW_DIESEL(2.2) - 40).toBeCloseTo(180.9, 0);
    expect((27 * LHV_AT_8) / 3.6e6 + KW_DIESEL(1.9) - 29).toBeCloseTo(121.8, 0);
    expect((8.5 * LHV_AT_8) / 3.6e6 + KW_DIESEL(1.2)).toBeCloseTo(54.6, 0);
    expect(max.lossesKw).toBeCloseTo(149, -1);
    expect(part.lossesKw).toBeCloseTo(105, -1);
    expect(idle.lossesKw).toBeCloseTo(47, -1);
  });
  it('K18 gasifier’s losses: 39.9, 26.8, 7.3 kW against 56.3, 43.0, 10.1. NOT retrieved: it follows K11 and K14', () => {
    expect(max.gasifierLossKw).toBeCloseTo(39.9, 0);
    expect(part.gasifierLossKw).toBeCloseTo(26.8, 0);
    expect(idle.gasifierLossKw).toBeCloseTo(7.3, 0);
    expect(off(max.gasifierLossKw, 56.3)).toBeLessThan(-0.25);
  });
  it('K19 tar is carried, not predicted: the state reads the table at its three points', () => {
    expect(tarMeasured(1)).toBe(0.13);
    expect(tarMeasured(29 / 40)).toBeCloseTo(0.04, 6);
    expect(tarMeasured(0)).toBe(0.17);
  });
  it('K19, why a downdraft cracks its tars, by arithmetic on what is reported: 0.13 g/Nm³ × 2.17 Nm³/kg is 0.03 % of the wood, against S2’s 5–20 % for an updraft: over 99 % gone', () => {
    const left = (0.13 * 2.17) / 1000;
    expect(left * 100).toBeCloseTo(0.028, 3);
    expect(1 - left / 0.05).toBeGreaterThan(0.99);
    expect(1 - left / 0.2).toBeLessThan(0.999);
  });
  it('K19, the mechanism by estimated rates (Boroson, from memory): everything is gone at the flame’s temperature, half at idle’s. Not a prediction of the tar', () => {
    expect(max.crackedShare).toBeCloseTo(1, 3);
    expect(idle.crackedShare).toBeCloseTo(0.5, 0);
  });
  it('★ The balance and the throat close: 0.787, 0.488, 0.170 against 0.79, 0.49, 0.17. In this test only (R2)', () => {
    const area = (Math.PI / 4) * (NOT_PRINTED['mf-1100'].throatDiameter * 100) ** 2;
    const lhvMJ = LHV_AT_8 / 1e6;
    const load = (chips: number, cge: number, H: number): number => (chips * lhvMJ * cge) / H / area;
    expect(load(41, 0.711, 5.6)).toBeCloseTo(HEARTH_LOAD_TABLE[0], 2);
    expect(load(27, 0.665, 5.56)).toBeCloseTo(HEARTH_LOAD_TABLE[1], 2);
    expect(load(8.5, 0.731, 5.54)).toBeCloseTo(HEARTH_LOAD_TABLE[2], 2);
  });
  it('K20 substitution: 78.5, 76.3, and nothing at idle, against 80–85 %. Near', () => {
    expect(max.substitution).toBeCloseTo(0.785, 2);
    expect(part.substitution).toBeCloseTo(0.763, 2);
    expect(idle.substitution).toBe(0);
    expect(full.substitution).toBeCloseTo(0.81, 1);
  });
  it('K21 residue: 5 % of the energy is an input, and 2.5 % of the fuel as carbon: K21’s 3.5 % with ash', () => {
    const g = new Plant(params()).gas;
    expect(g.lossResidue / g.lhvWet).toBeCloseTo(0.05, 2);
    expect(MODEL.residueCarbon * 0.012011 * 0.92 * 100).toBeCloseTo(2.55, 1);
  });
});

describe('K22 to K31, the engines', () => {
  it('K22 MF 1100: 64 kW is an input; dual fuel finds 54.6 kW against 51 measured, +7 %. A derating of 15 % against 20', () => {
    expect(fullPower('diesel').power).toBeCloseTo(64, 3);
    expect(full.power).toBeCloseTo(54.6, 0);
    expect(off(full.power, 51)).toBeCloseTo(0.07, 1);
    expect(1 - full.power / 64).toBeCloseTo(0.147, 1);
  });
  it('K22, how little that proves: the efficiencies in the book move it from 47 to 60 kW', () => {
    expect(fullPower('dual', { etaDual: 0.36 }).power).toBeCloseTo(46.9, 0);
    expect(fullPower('dual', { etaDual: 0.43 }).power).toBeCloseTo(60.3, 0);
  });
  it('K23 Ford 5000 on spark: 22 kW against 23, at an assumed 2,200 rpm. Retrieved, on two estimates', () => {
    const r = otherFullPower(3.8, 2200, 'spark');
    expect(r.power).toBeCloseTo(22.3, 0);
    expect(Math.abs(off(r.power, 23))).toBeLessThan(0.05);
  });
  it('K24 converted diesels, gas alone: 28 kW against 34, and 22 kW against 19.6, at their own speeds and strokes', () => {
    const volvo = otherFullPower(CONVERTED[0].litres, CONVERTED[0].rpm, 'spark', CONVERTED[0].stroke);
    const bm = otherFullPower(CONVERTED[1].litres, CONVERTED[1].rpm, 'spark', CONVERTED[1].stroke);
    expect(volvo.power).toBeCloseTo(28.4, 0);
    expect(bm.power).toBeCloseTo(22, 0);
    expect(off(volvo.power, 34)).toBeCloseTo(-0.16, 1);
    expect(off(bm.power, 19.6)).toBeCloseTo(0.12, 1);
    // and this tractor, which nobody ran on spark
    expect(fullPower('spark').power).toBeCloseTo(31, 0);
    expect(fullPower('spark').power / 64).toBeCloseTo(0.49, 1);
    expect(34 / 71).toBeCloseTo(0.48, 2);
    expect(19.6 / 42).toBeCloseTo(0.47, 2);
  });
  it('K25 the fleet: the model reads high on nearly all of them. The MF 1100 is the fleet’s best per litre, which flatters K22', () => {
    const rows = FLEET.filter((f) => !f.spark).map((f) => ({
      f,
      model: otherFullPower(f.litres, 2170, 'dual').power,
    }));
    const ratio = rows.map((r) => r.model / r.f.after);
    expect(Math.min(...ratio)).toBeGreaterThan(1);
    const mean = ratio.reduce((a, b) => a + b, 0) / ratio.length;
    expect(mean).toBeCloseTo(1.28, 0);
    const perLitre = FLEET.filter((f) => !f.spark).map((f) => f.after / f.litres);
    expect(Math.max(...perLitre)).toBeCloseTo(51 / 5.8, 6);
    expect(Math.min(...perLitre)).toBeCloseTo(68 / 11, 6);
    const derating = FLEET.filter((f) => !f.spark).map((f) => 1 - f.after / f.before);
    expect(Math.min(...derating)).toBeCloseTo(0.06, 1);
    expect(Math.max(...derating)).toBeCloseTo(0.41, 1);
  });
  it('K25 and S1 Table 3.6: the L5150’s dual fuel, 58 kW against 64.6 at 2,200 rpm; 27.5 % against 30.5 %. Low, where the MF is high', () => {
    const top = SCANIA_L5150_DUAL.rows[6];
    const r = otherFullPower(SCANIA_L5150_DUAL.litres, top[0], 'dual');
    expect(r.power).toBeCloseTo(57.9, 0);
    expect(r.engineEff).toBeCloseTo(27.5, 0);
    expect(r.engineEff).toBeLessThan(top[2]);
  });
  it('S1 Table 3.6’s part load on a Fordson: efficiency falls with load as measured, 27.5 % against 30.8, 12.6 % against 12', () => {
    const rows = FORDSON_PART_LOAD.rows.map(([rpm, kw, eff]) => ({ eff, model: otherAtPower(3.6, rpm, kw).effPct }));
    expect(rows[1]!.model).toBeCloseTo(27.5, 0);
    expect(rows[3]!.model).toBeCloseTo(21, 0);
    expect(rows[4]!.model).toBeCloseTo(12.6, 0);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.model).toBeLessThan(rows[i - 1]!.model);
  });
  it('K26 mixture, exact on the composition’s middle: 2.44 MJ/m³ against about 2.5; petrol’s 3.8; 36 % less, against about 35 %', () => {
    const mid = mixtureEnergy(0.195, 0.16, 0.025);
    expect(mid / 1e6).toBeCloseTo(2.44, 2);
    expect(heatingValue(0.195, 0.16, 0.025) / 1e6).toBeCloseTo(5.09, 2);
    expect(PETROL_MIXTURE).toBe(3.8e6);
    expect(1 - mid / PETROL_MIXTURE).toBeCloseTo(0.36, 2);
    expect(max.mixtureMJ).toBeCloseTo(2.49, 1);
    // isooctane by hand: 44.3 MJ/kg, 15.1 kg of air, 1.293 kg/m³ of air: petrol’s figure comes back
    expect((44.3 / 15.1) * 1.293).toBeCloseTo(3.8, 1);
  });
  it('K27 charge: the input 0.8. At the test maximum the mixture is 0.55 of what is swept, research’s hand check 0.57, inside FAO’s 0.65–0.8 × 0.7–0.9', () => {
    expect(MODEL.volumetricEff).toBe(0.8);
    const sim = new GasifierSim();
    expect(sim.state.chargeShare).toBeCloseTo(0.55, 1);
    expect(0.65 * 0.7).toBeLessThan(sim.state.chargeShare);
    expect(0.8 * 0.9).toBeGreaterThan(sim.state.chargeShare);
  });
  it('K28 speed: friction and the train alone top out near 2,800 rpm, against about 2,500 by the slow flame. The model has no flame speed: another cause, near the same place', () => {
    const c = wotCurve([1400, 1800, 2170, 2500, 2800, 3200, 3600]);
    const top = c.reduce((a, b) => (b.power > a.power ? b : a));
    expect(top.rpm).toBe(2800);
    expect(top.power).toBeCloseTo(56.4, 0);
  });
  it('K29 the rule against the measure: dual fuel 15 % by the model, rule 15–20, measured 21 and 29. Spark loses 51 % of a diesel’s power, rule about 30 % of a petrol engine’s', () => {
    expect(1 - full.power / 64).toBeCloseTo(0.15, 1);
    expect(1 - 51 / 64).toBeCloseTo(0.2, 1);
    expect(1 - 49.8 / 70.5).toBeCloseTo(0.29, 2);
    expect(1 - fullPower('spark').power / 64).toBeCloseTo(0.51, 1);
  });
  it('K30 wear: context, no wear in the model', () => expect(true).toBe(true));
  it('K31 air to gas: 1.08 on the composition’s middle, 1.115 on the model’s, against 1:1 to 1.1:1. A fact of the gas, no slider', () => {
    expect(stoichAirToGas(0.195, 0.16, 0.025)).toBeCloseTo(1.08, 2);
    expect(max.airToGas).toBeCloseTo(1.115, 1);
  });
});

describe('K32 to K37, the truck', () => {
  it('K32 Scania: 7.8 dm³, 8,350 kg, 456 kg, 6 m², 5.8 m²', () => {
    expect(SCANIA_L8050.displacement).toBeCloseTo(7.8e-3, 8);
    expect(SCANIA_L8050.vehicleMass).toBe(8350);
    expect(SCANIA_L8050.systemMass).toBe(456);
    expect(SCANIA_L8050.filterArea).toBe(6);
    expect(SCANIA_L8050.coolerArea).toBe(5.8);
  });
  it('K33 70.5 is an input; dual fuel finds 70.8 kW against 49.8. NOT retrieved, +42 %. This truck was the fleet’s weakest but one', () => {
    const r = fullPower('dual', {}, 'scania-l8050');
    expect(fullPower('diesel', {}, 'scania-l8050').power).toBeCloseTo(70.5, 3);
    expect(r.power).toBeCloseTo(70.8, 0);
    expect(off(r.power, 49.8)).toBeGreaterThan(0.35);
  });
  it('K34 91,500 km: context, a record', () => expect(TRUCK_ROAD.empty.chips).toBe(7.2));
  it('K35 per 10 km: 8.3, 9.0, 9.4 kg of chips against 7.2, 7.6, 7.8, high by a fifth; diesel 0.51 against 0.50–0.55, retrieved; 79–81 % saved against 80–81, retrieved', () => {
    const e = truckRun('empty');
    const a = truckRun('load-5t');
    const b = truckRun('load-8t');
    expect(e.chipsPer10).toBeCloseTo(8.34, 0);
    expect(a.chipsPer10).toBeCloseTo(8.97, 0);
    expect(b.chipsPer10).toBeCloseTo(9.44, 0);
    expect(off(e.chipsPer10, 7.2)).toBeCloseTo(0.16, 1);
    expect(off(b.chipsPer10, 7.8)).toBeCloseTo(0.21, 1);
    expect(e.dieselPer10).toBeCloseTo(0.51, 1);
    expect(b.dieselPer10).toBeCloseTo(0.51, 1);
    expect(e.substitution).toBeCloseTo(0.79, 1);
    expect(a.substitution).toBeCloseTo(0.81, 1);
    expect(b.substitution).toBeCloseTo(0.81, 1);
    // at 8 t the diesel’s average power is past this model’s engine
    expect(b.roadKw).toBeGreaterThan(b.powerWot);
    expect(b.short).toBe(true);
    expect(e.short).toBe(false);
  });
  it('K35, the sum: gas and pilot against diesel alone. The truck’s energy is within 4 %, the tractor’s test about a third over', () => {
    const energy = (k: keyof typeof TRUCK_ROAD): number => {
      const t = TRUCK_ROAD[k];
      return (t.chips * 17.1 * 0.711 + t.dualDiesel * 42.7) / (t.diesel * 42.7);
    };
    expect(Math.abs(energy('empty') - 1)).toBeLessThan(0.05);
    expect(Math.abs(energy('load-5t') - 1)).toBeLessThan(0.05);
    expect(Math.abs(energy('load-8t') - 1)).toBeLessThan(0.05);
    const dieselAlone = (40 + max.friction) / MODEL.etaDiesel;
    expect(164.6 / dieselAlone).toBeCloseTo(1.36, 1);
  });
  it('K36 3.6 kg per kg of diesel: exact by hand 3.5, and the model’s 4.2–4.3, +20 %, its engine worse than this truck’s and better than this tractor’s', () => {
    expect(42.7 / (17.1 * 0.71)).toBeCloseTo(3.52, 1);
    const b = truckRun('load-5t');
    expect(b.chipsPerDiesel).toBeCloseTo(4.26, 0);
    expect(off(b.chipsPerDiesel, 3.6)).toBeCloseTo(0.18, 1);
  });
  it('K37 drivers and smoke: context', () => expect(true).toBe(true));
});

describe('K38 to K45, the working life', () => {
  it('K38 2,500 h, K39 who drove it: words for the author. The line of the table is K25’s', () => {
    expect(FLEET.find((f) => f.litres === 5.8)!.after).toBe(51);
  });
  it('K40 exact: 30.4 kg ÷ 41 kg/h = 44.5 min against 40–50; 68 min at part load. The model, on its own chips: 53 min', () => {
    expect((30.4 / 41) * 60).toBeCloseTo(44.5, 1);
    expect((30.4 / 27) * 60).toBeCloseTo(67.6, 1);
    const sim = new GasifierSim();
    expect(sim.state.bunkerMinutesLeft).toBeCloseTo(53.2, 0);
  });
  it('K41 and K42: the table’s times add up to 11.8–18.6 min per hour, against 15–25. The live shift: about 13', () => {
    const [low, high] = serviceRange();
    expect(low).toBeCloseTo(11.8, 0);
    expect(high).toBeCloseTo(18.6, 0);
    const sim = new GasifierSim();
    sim.applyScenario('working-shift');
    const dt = 1 / 60;
    for (let i = 0; i < (8 * 3600) / sim.params.timeScale / dt; i++) sim.step(dt);
    expect(sim.state.serviceMinPerHour).toBeCloseTo(13.3, 0);
    expect(sim.state.fillCount).toBe(9);
  });
  it('K43 lives between failures: context, sheet 7', () => expect(true).toBe(true));
  it('K44 the serious failure: when the vessel is not emptied, the state says so, and no procedure', () => {
    const sim = new GasifierSim();
    sim.set({ vesselNeglected: true, timeScale: 3600 });
    const dt = 1 / 60;
    for (let i = 0; i < (3 * 3600) / 3600 / dt; i++) sim.step(dt);
    expect(sim.state.coolerVesselShare).toBeGreaterThan(1);
    expect(sim.state.alarms).toContain('vesselOverfull');
  });
  it('K45 the programme: context. Conflict 21’s 644,000 km adds up', () => {
    expect(117000 + 272000 + 163700 + 91500).toBe(644200);
  });
});

describe('K46 to K47, K59 to K64: the gas, the zones, the fuel', () => {
  it('K46 composition: CO 20.9, H₂ 16.5, CH₄ 2.3, CO₂ 11.3 inside the bands, N₂ 48.9 just under its 50–54', () => {
    expect(max.xCO * 100).toBeGreaterThan(17);
    expect(max.xCO * 100).toBeLessThan(22);
    expect(max.xH2 * 100).toBeGreaterThan(12);
    expect(max.xH2 * 100).toBeLessThan(20);
    expect(max.xCH4 * 100).toBeGreaterThan(2);
    expect(max.xCH4 * 100).toBeLessThan(3);
    expect(max.xCO2 * 100).toBeGreaterThan(9);
    expect(max.xCO2 * 100).toBeLessThan(15);
    expect(max.xN2 * 100).toBeCloseTo(48.9, 0);
    expect(max.gasMJ).toBeGreaterThan(5);
    expect(max.gasMJ).toBeLessThan(5.9);
  });
  it('K46, at Table 2.3’s own 20 % moisture: 5.0 MJ/m³, the bottom of its band', () => {
    expect(steadyPoint({ moistureWet: 20 }).gasMJ).toBeCloseTo(5, 1);
  });
  it('K47 zones: K_we reads the table. The flame, from the balance alone, ends at 1,235 °C, inside 1,200–1,500; with the wall, 1,076 °C, under it', () => {
    expect(waterGasK(700)).toBe(0.62);
    expect(max.oxidationEndT).toBeCloseTo(1235, -1);
    expect(max.oxidationEndT).toBeGreaterThan(1200);
    expect(max.oxidationEndT).toBeLessThan(1500);
    expect(max.oxidationT).toBeCloseTo(1076, -1);
  });
  it('K47 the reduction cools the gas by about 370 K, and the hearth stands near 700 °C, where the equilibrium freezes', () => {
    expect(max.oxidationEndT - max.reductionEndT).toBeCloseTo(366, -1);
    expect(max.hearthT).toBeCloseTo(710, -1);
    expect(full.hearthT).toBeCloseTo(783, -1);
  });
  it('K47 air: an equivalence ratio of 0.34 against S2’s ideal 0.25 and research’s hand 0.31–0.33; 1.96 kg of air per kg against 1.8–1.9; 2.45 Nm³/kg against 2.17', () => {
    expect(max.equivalenceRatio).toBeCloseTo(0.34, 1);
    expect(max.airPerKg).toBeCloseTo(1.96, 1);
    expect(max.yieldWet).toBeCloseTo(2.45, 1);
    expect(89 / 41).toBeCloseTo(2.17, 2);
  });
  it('K47, K13 and the yield do not close together on carbon: at 2.17 Nm³/kg and K46’s middle, 13 % of the carbon is not in the gas', () => {
    const carbonInGas = (2.17 * (0.195 + 0.12 + 0.025)) / 0.022414;
    const carbonInWood = (0.92 * 1000) / 23.02 - MODEL.residueCarbon * 0.92;
    expect(1 - carbonInGas / carbonInWood).toBeCloseTo(0.13, 1);
  });
  it('K59 limit: the gas falls to the 4.2 MJ/m³ engines want at 45 % wet with the jacket’s drain, at 40 % without. Against upper limit 30, no gas past about 40', () => {
    expect(GAS_MIN).toBe(4.2e6);
    expect(MOISTURE_UPPER).toBe(0.3);
    expect(MOISTURE_NO_BURN).toBe(0.4);
    expect(moistureAtHeating(4.2)).toBeCloseTo(45, -1);
    expect(moistureAtHeating(4.2, { drainShare: 0 })).toBeCloseTo(40, -1);
  });
  it('K59, the fuel’s heating value at 20–25 % dry: 15.3 and 14.6 MJ/kg against 13–15. The two bases: 20 % wet is 25 % dry', () => {
    const at = (dry: number): number => {
      const wet = dry / (1 + dry);
      return (LHV_DRY * (1 - wet) - 2.44e6 * wet) / 1e6;
    };
    expect(at(0.2)).toBeCloseTo(15.3, 0);
    expect(at(0.25)).toBeCloseTo(14.6, 0);
    expect(0.25 / 1.25).toBeCloseTo(0.2, 6);
    expect(LHV_DRY / 1e6).toBeCloseTo(18.8, 1);
  });
  it('K59, wetter: more chips, more water, a poorer gas, a cooler fire: every step the same way', () => {
    const rows = moistureSweep(8, 40, 8);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.gasMJ).toBeLessThan(rows[i - 1]!.gasMJ);
      expect(rows[i]!.chips).toBeGreaterThan(rows[i - 1]!.chips);
      expect(rows[i]!.oxidationT).toBeLessThan(rows[i - 1]!.oxidationT);
    }
  });
  it('K60 fines: the drops are inputs; the power goes 33.2 → 29 kW on a 3.6 L engine at the test’s 1,800 rpm, against 21 → 16.8. It explains less than half the gain, as the report says', () => {
    const fine = otherFullPower(3.6, 1800, 'dual', undefined, { chipGrade: 'unsieved' });
    const coarse = otherFullPower(3.6, 1800, 'dual', undefined, { chipGrade: '15-40' });
    expect(CHIP_GRADES.unsieved.drop).toBe(0.18e5);
    expect(CHIP_GRADES['15-40'].drop).toBe(0.08e5);
    const modelGain = coarse.power / fine.power - 1;
    const gain = FINES_POWER_KW['15-40'] / FINES_POWER_KW.unsieved - 1;
    expect(gain).toBeCloseTo(0.25, 2);
    expect(modelGain).toBeCloseTo(0.12, 1);
    expect(modelGain / gain).toBeLessThan(0.5);
    // and on this tractor, full throttle: 55 → 50 kW
    expect(steadyPoint({ fullPower: true, chipGrade: 'unsieved' }).power).toBeCloseTo(49.7, 0);
    expect(steadyPoint({ fullPower: true, chipGrade: '15-40' }).power).toBeCloseTo(55.2, 0);
  });
  it('K61 quality: dust and tar inside what engines ask, by the table; cold gas about flat from 100 % to idle, as the report says', () => {
    expect(tarMeasured(0.5)).toBeGreaterThanOrEqual(0.04);
    expect(tarMeasured(0.5)).toBeLessThanOrEqual(0.2);
    expect(Math.abs(max.coldGasPct - idle.coldGasPct)).toBeLessThan(3);
  });
  it('K62 filter: the fabric’s 300 °C holds, even at full power, 214 °C; the wet fabric’s factor is an input; the drop at the maximum 216 mm of water on normal cubic metres, about 400 in research’s reading', () => {
    expect(FILTER_MAX_T).toBe(300);
    expect(FILTER_WET_FACTOR).toBe(6);
    expect(full.filterT).toBeCloseTo(214, -1);
    expect(full.filterT).toBeLessThan(300);
    expect(max.filterDropMmWg).toBeCloseTo(216, -1);
    const wet = steadyPoint({ fullPower: true, filterWetFault: true });
    expect(wet.filterDropMmWg / full.filterDropMmWg).toBeCloseTo(5.3, 0);
    expect(wet.power).toBeCloseTo(46.8, 0);
  });
  it('K62 dew point: 38–44 °C with the jacket’s drain at 20–35 %, 47–57 °C without, against 45–60. So the report’s figure reads as no drain, and its K64 as a drain: both cannot hold', () => {
    const drained = moistureSweep(20, 35, 15);
    expect(drained[0]!.dewPoint).toBeCloseTo(38, -1);
    expect(drained[1]!.dewPoint).toBeCloseTo(43.8, -1);
    const bare = moistureSweep(20, 35, 15, { drainShare: 0 });
    expect(bare[0]!.dewPoint).toBeGreaterThan(45);
    expect(bare[1]!.dewPoint).toBeLessThan(60);
  });
  it('K63 filter’s age: flat to 625 km, then 1.92 times at 3,000 km against « twice », and K62’s power falls 3 %', () => {
    expect(filterAgeFactor(0)).toBe(1);
    expect(filterAgeFactor(600 / 60)).toBe(1);
    expect(filterAgeFactor(50)).toBeCloseTo(1.92, 2);
    expect(steadyPoint({ fullPower: true, filterHours: 50 }).power / full.power).toBeCloseTo(0.97, 1);
    // and a truck at 60 km/h on the reported chips: 195 mm of water on normal cubic metres, inside 150–200
    const G = (7.2 * 6 * 2.17) / 3600;
    expect(filterDrop(G, 6, 0, false) / 9.80665).toBeCloseTo(195, -1);
  });
  it('K64 drain: an input, middle of 60–80 %. By hand at 41 kg/h, 2–2.6 L/h at 8 %, 5–6.6 L/h at 20 %. The model on its own chips: 1.9 L/h', () => {
    expect(MODEL.drainShare).toBe(0.7);
    expect(41 * 0.08 * 0.6).toBeCloseTo(2, 0);
    expect(41 * 0.08 * 0.8).toBeCloseTo(2.6, 0);
    expect(max.jacketLph).toBeCloseTo(1.92, 1);
    expect(steadyPoint({ moistureWet: 20 }).jacketLph).toBeCloseTo(5.65, 0);
  });
});

describe('K48 to K58, K65 to K68: the hazard’s numbers. Tagged, no time, no person', () => {
  it('K48 gas: the model’s CO is 20.9 %, inside « over 20 % » and 20–30 %. After the stop, 25 % by input, of 23–27 %', () => {
    expect(max.xCO).toBeGreaterThan(0.2);
    expect(max.xCO).toBeLessThan(0.3);
    expect(POST_GAS_CO).toBe(0.25);
  });
  it('K49 the stop: about 20 min of pressure by default, and the slider reaches for S2’s hours. The source has no end', () => {
    expect(ROOM.postGasMinutes).toBe(20);
    const r = roomRun(180, { engineOn: false, garageVolume: 1000 });
    expect(r.ppm).toBeGreaterThan(0);
  });
  it('K50 exact, the room: 1 m³ of 20–30 % CO in 1,000 m³ is 200–300 ppm, 200 L in 1,000 m³ is 200 ppm, 200 L in 50 m³ is 4,000 ppm', () => {
    const inRoom = (litres: number, volume: number): number => {
      const r = { first: 0, second: 0 };
      stepRooms(
        r,
        { volumeFirst: volume, volumeSecond: 60, airFirst: 0, airSecond: 0, exchange: 0 },
        litres / 1000 / 1,
        0,
        1,
      );
      return toPpm(r.first);
    };
    expect(inRoom(200, 1000)).toBeCloseTo(200, 0);
    expect(inRoom(300, 1000)).toBeCloseTo(300, 0);
    expect(inRoom(200, 50)).toBeCloseTo(4000, -2);
    expect(FAN_CO * 60).toBeCloseTo(0.2, 6);
    expect(IDLE_EXHAUST_CO).toBe(0.065);
  });
  it('K50: the idling engine passes S3’s level in a 50 m³ garage in under a minute, as S3 says. The state holds no such time, this test does', () => {
    const r = roomRun(1, { engineOn: true, load: 0, door: 'shut' });
    expect(r.ppm).toBeGreaterThan(300);
    const half = roomRun(0.5, { engineOn: true, load: 0, door: 'shut' });
    expect(half.ppm).toBeGreaterThan(200);
  });
  it('K50, a new conflict: S3 says 1 m³ of idling exhaust in 5,000 m³ also makes 0.02–0.03 %. At 5–8 % it makes 10–16 ppm. The figure fails its own sentence', () => {
    expect(toPpm(0.05 / 5000)).toBeCloseTo(10, 6);
    expect(toPpm(0.08 / 5000)).toBeCloseTo(16, 6);
  });
  it('K51 the published ladder, carried unchanged, and K65 the limits', () => {
    const ppm = CO_LADDER.map((r) => r.ppm);
    expect(ppm).toEqual([20, 100, 200, 800, 3200, 12800, 50000, 200000]);
    expect(CO_LADDER[6]!.ppmHigh).toBe(80000);
    expect(CO_LADDER[7]!.ppmHigh).toBe(300000);
  });
  it('K52 17 dead, K53 10,000 cases: words for the author, no model', () => expect(true).toBe(true));
  it('K54 faulty units: 155 of 230 is 67 %', () => expect((155 / 230) * 100).toBeCloseTo(67, 0));
  it('K55 condensate: no chemistry here. The model says how much water, not what is in it', () => {
    expect(max.jacketLph + max.coolerLph).toBeGreaterThan(0);
  });
  it('K56 fires: 1,740 + 1,025 + 100 = 2,865', () => expect(1740 + 1025 + 100).toBe(2865));
  it('K57 CO’s limits of explosion: 10.9 % is 109,000 ppm, not in the box’s range; the model computes no explosive mixture and says so', () => {
    const r = roomRun(30, { engineOn: false });
    expect(r.peakPpm).toBeLessThan(109000);
  });
  it('K58 the fleet: 35,068 + 3,533 + 35,252 = 73,853; 36.3 % of it on wood is about 26,800', () => {
    expect(35068 + 3533 + 35252).toBe(73853);
    expect(73853 * 0.363).toBeCloseTo(26809, -1);
  });
  it('K65 limits: ladder’s first two rungs; the gas stands 10,000 and 2,000 times over them', () => {
    expect(CO_LADDER[0]!.ppm).toBe(20);
    expect(CO_LADDER[1]!.ppm).toBe(100);
    expect(200000 / 20).toBe(10000);
    expect(200000 / 100).toBe(2000);
  });
  it('K66 the blood: not computed in src/sim, by refusal (R5)', () => {
    const sim = new GasifierSim();
    expect(Object.keys(sim.state).join(' ')).not.toMatch(/hb|haem|blood|cohb/i);
  });
  it('K67 about a million, K68 the policy: words for the author', () => expect(true).toBe(true));
});

describe('the room’s figures, as the docs give them', () => {
  it('a stop in 50 m³, shut: 3,500 ppm by half an hour, a span by the door’s estimate, and the room above', () => {
    const r = roomRun(30, { engineOn: false });
    expect(r.ppm).toBeCloseTo(3497, -2);
    expect(r.ppmHigh).toBeCloseTo(4021, -2);
    expect(r.ppmLow).toBeCloseTo(2495, -2);
    expect(r.peakPpm).toBeCloseTo(3592, -2);
  });
  it('in 1,000 m³: about 200 ppm, which the book’s own example gives', () => {
    const r = roomRun(30, { engineOn: false, garageVolume: 1000 });
    expect(r.ppm).toBeCloseTo(197, -1);
  });
  it('the wide estimates are wide: a door moves the box by a factor', () => {
    expect(DOOR_ACH.open[2] / DOOR_ACH.shut[0]).toBe(200);
  });
  it('N₂ per O₂ and the water’s mass are the module’s', () => {
    expect(N2_PER_O2).toBeCloseTo(3.76, 2);
    expect(MOLAR_MASS.H2O).toBeCloseTo(0.018, 3);
    expect(dewPoint(101325)).toBeCloseTo(100, -1);
  });
});
