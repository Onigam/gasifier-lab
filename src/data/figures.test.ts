import { describe, expect, it } from 'vitest';
import { GasifierSim } from '../sim/engine';
import { DOOR_ACH, DIESEL_LHV, LHV_AT_8, MF_1100, MODEL, ROOM } from '../sim/machine';
import { FINES_POWER_KW, TABLE_3_13 } from '../sim/reported';
import {
  fullPower,
  moistureAtHeating,
  roomRun,
  steadyPoint,
  tableIdle,
  tableMax,
  truckRun,
  wotCurve,
} from '../sim/runs';
import { UNIT } from '../three/dims';
import { FIG, type Fig, type FigName } from './figures';

// The figures of figures.ts, recomputed from the simulation, from src/three/dims.ts and from the report's own numbers: a change of any of them cannot go unnoticed. A figure is not a target: when the model moves, the figure and the words that carry it move with it.

const max = tableMax();
const idle = tableIdle();
const v = (k: FigName): number => (FIG[k] as Fig).v;
const near = (k: FigName, actual: number, tol: number): void =>
  expect(Math.abs(v(k) - actual), `${k}: ${v(k)} against ${actual}`).toBeLessThanOrEqual(tol);

describe('the arithmetic on reported figures (derived, †)', () => {
  const woodKw = (41 * LHV_AT_8) / 3.6e6;
  const dieselKw = (2.2 * DIESEL_LHV) / 3.6e6;
  it('221 kW in, the shift’s 216 to 328 kg and 1.4 to 2.2 m³, the system’s share', () => {
    near('kwIn', woodKw + dieselKw, 0.6);
    expect(8 * 27).toBe(216);
    expect(8 * 41).toBe(328);
    expect(FIG.shiftKg.t![0]).toContain('216 à 328');
    expect(216 / MF_1100.bulkDensity).toBeCloseTo(1.42, 1);
    expect(328 / MF_1100.bulkDensity).toBeCloseTo(2.16, 1);
    near('systemShare', (450 / 5090) * 100, 0.05);
  });
  it('the sieve’s quarter, the eye’s gap, the tyres in inches', () => {
    const gain = FINES_POWER_KW['10-40'] / FINES_POWER_KW.unsieved;
    expect(gain).toBeGreaterThan(1.24);
    expect(gain).toBeLessThan(1.27);
    expect(2.25 - UNIT.top).toBeCloseTo(0.03, 6);
    expect(2.4 - UNIT.top).toBeCloseTo(0.18, 6);
    near('rearW', 18.4 * 0.0254, 0.001);
    near('frontW', 7.5 * 0.0254, 0.001);
  });
  it('the engine’s 24 %, the bunker’s 30.4 kg, the column’s 1.5 cm a minute, the wood’s 17.1 MJ/kg', () => {
    const gasKw = (56.3 / (1 - 0.711)) * 0.711;
    near('engineEff', (40 / (gasKw + dieselKw)) * 100, 0.7);
    near('bunkerKg', MF_1100.bunkerVolume * MF_1100.bulkDensity, 0.05);
    const section = (Math.PI / 4) * MF_1100.bunkerDiameter ** 2;
    const minutes = ((MF_1100.bunkerVolume * MF_1100.bulkDensity) / 41) * 60;
    near('fall', ((MF_1100.bunkerVolume / section) * 100) / minutes, 0.1);
    near('woodMJ', LHV_AT_8 / 1e6, 0.05);
    near('bunkerHand', ((MF_1100.bunkerVolume * MF_1100.bulkDensity) / 41) * 60, 0.1);
    near('bunkerMin', ((MF_1100.bunkerVolume * MF_1100.bulkDensity) / max.chips) * 60, 0.6);
  });
  it('the tar’s 0.03 %, the phenols’ 150 to 300 times, the jacket’s litres by hand, the air by hand', () => {
    near('tarShare', ((0.13 * 2.17) / 1000) * 100, 0.01);
    expect(1500 / 10).toBe(150);
    expect(3000 / 10).toBe(300);
    expect(41 * 0.08 * 0.6).toBeCloseTo(1.97, 1);
    expect(41 * 0.08 * 0.8).toBeCloseTo(2.62, 1);
    expect(41 * 0.2 * 0.6).toBeCloseTo(4.92, 1);
    expect(41 * 0.2 * 0.8).toBeCloseTo(6.56, 1);
    const air = (n2: number) => (((89 * n2) / 0.79) * 1.293) / 41;
    expect(air(0.5)).toBeCloseTo(1.78, 1);
    expect(air(0.54)).toBeCloseTo(1.92, 1);
  });
  it('the table’s own idle losses, the pilot’s share, the fan’s ppm, the true turns, the gap of the gas', () => {
    near('idleIn', TABLE_3_13.lossesKw[2], 0.3);
    near(
      'dieselShareMax',
      ((2.2 * DIESEL_LHV) / 3.6e6 / ((41 * LHV_AT_8) / 3.6e6 + (2.2 * DIESEL_LHV) / 3.6e6)) * 100,
      0.1,
    );
    near('fanPpm', (200 / 1000 / 1000) * 1e6, 0.5);
    near('trueTurns', 1855 / 60, 0.2);
    near('gasGap', ((5.6 - max.gasMJ) / 5.6) * 100, 0.5);
    near('vesselHours', MODEL.coolerVesselHours, 0);
  });
});

describe('the lessons’ figures', () => {
  it('the part load’s 151 kW and 19 %, the 82 % lost, the model’s 21 %, the wet gas, the spark engine, the truck, the idle, the day', () => {
    near('partIn', (27 * LHV_AT_8) / 3.6e6 + (1.9 * DIESEL_LHV) / 3.6e6, 0.6);
    near('partEff', (29 / v('partIn')) * 100, 0.5);
    expect(100 - 18).toBe(v('lost82'));
    near('effModel', max.totalEffPct, 0.5);
    near('gasWet20', steadyPoint({ moistureWet: 20 }).gasMJ, 0.05);
    near('gasWet30', steadyPoint({ moistureWet: 30 }).gasMJ, 0.05);
    near('gasWet40', steadyPoint({ moistureWet: 40 }).gasMJ, 0.05);
    near('sparkModel', fullPower('spark').power, 0.6);
    near('truckChips', truckRun('load-8t').chipsPer10, 0.06);
    near('idleChips', idle.chips, 0.5);
    const sim = new GasifierSim();
    sim.applyScenario('working-shift');
    const dt = 1 / 60;
    for (let i = 0; i < (8 * 3600) / sim.params.timeScale / dt; i++) sim.step(dt);
    near('fills', sim.state.fillCount, 0);
    near('serviceModel', sim.state.serviceMinPerHour, 0.5);
  });
});

describe('the model where this machine was measured (†)', () => {
  it('the bench’s maximum: the wood, the gas, its composition, the efficiency, the equivalence ratio, the drop', () => {
    near('chipsModel', max.chips, 0.5);
    near('gasModel', max.gasMJ, 0.05);
    near('cgeModel', max.coldGasPct, 0.05);
    near('gasCO', max.xCO * 100, 0.05);
    near('gasH2', max.xH2 * 100, 0.05);
    near('gasCH4', max.xCH4 * 100, 0.05);
    near('gasCO2', max.xCO2 * 100, 0.05);
    near('gasN2', max.xN2 * 100, 0.05);
    near('er', max.equivalenceRatio, 0.006);
    near('dropModel', max.filterDropMmWg, 0.6);
    near('jacket8', max.jacketLph, 0.05);
    near('coolerLph', max.coolerLph, 0.05);
    near('chargeModel', fullPowerCharge(), 0.8);
    near('substModel', max.substitution * 100, 0.6);
    near('dew8', max.dewPoint, 0.5);
  });
  it('the highest power on gas, the sieve’s gain, the cloth’s ageing', () => {
    const fresh = fullPower().power;
    near('powerModel', fresh, 0.6);
    const fine = steadyPoint({ fullPower: true, chipGrade: 'unsieved' }).power;
    const coarse = steadyPoint({ fullPower: true, chipGrade: '15-40' }).power;
    near('sieveModel', (1 - fine / coarse) * 100, 0.5);
    near('filterAgeLoss', (1 - steadyPoint({ fullPower: true, filterHours: 50 }).power / fresh) * 100, 0.5);
  });
  it('the ash and the heat the reduction takes', () => {
    const sim = new GasifierSim();
    sim.applyScenario('measured-hour');
    for (let i = 0; i < 600; i++) sim.step(1 / 60);
    near('ashKgH', sim.state.ashKgH, 0.05);
    near('reductionKw', sim.state.reductionKw, 0.6);
    near('residueKw', sim.state.lossResidueKw, 0.3);
    near('fallModel', sim.state.chipFallCmMin, 0.05);
    near('casingCalcKw', sim.state.lossCasingKw, 0.6);
  });
});

function fullPowerCharge(): number {
  const sim = new GasifierSim();
  sim.applyScenario('measured-hour');
  for (let i = 0; i < 300; i++) sim.step(1 / 60);
  return sim.state.chargeShare * 100;
}

describe('the same model where it was not (*)', () => {
  it('wet chips: 57 kg an hour at 40 %, 45 % and 40 % where the gas falls to 4.2 MJ/m³, the dew point, the leak', () => {
    near('chipsWet40', steadyPoint({ moistureWet: 40 }).chips, 0.5);
    near('wetLimit', moistureAtHeating(4.2), 1);
    near('wetNoDrain', moistureAtHeating(4.2, { drainShare: 0 }), 1);
    near('dew40', steadyPoint({ moistureWet: 40 }).dewPoint, 0.6);
    near('oxWet40', steadyPoint({ moistureWet: 40 }).oxidationT, 4);
    near('jacket20', steadyPoint({ moistureWet: 20 }).jacketLph, 0.1);
    const leak = steadyPoint({ airLeak: true });
    near('leakGasMJ', leak.gasMJ, 0.1);
    near('leakOutT', leak.outletT, 5);
  });
  it('the dew point at 20 to 35 % moisture, with and without the jacket’s drain', () => {
    const range = (o: object): [number, number] => {
      const d = [20, 25, 30, 35].map((moistureWet) => steadyPoint({ moistureWet }, o).dewPoint);
      return [Math.min(...d), Math.max(...d)];
    };
    const [a, b] = range({ drainShare: 0 });
    expect(FIG.dewNoDrain.t![1]).toBe(`${Math.round(a)} to ${Math.round(b)} °C`);
    const [c, d] = range({});
    expect(FIG.dewDrain.t![1]).toBe(`${Math.round(c)} to ${Math.round(d)} °C`);
  });
  it('a working shift: 274 kg of chips', () => {
    const sim = new GasifierSim();
    sim.applyScenario('working-shift');
    const dt = 1 / 60;
    for (let i = 0; i < (8 * 3600) / sim.params.timeScale / dt; i++) sim.step(dt);
    near('chipsShiftModel', sim.state.chipsUsedKg, 1.5);
  });
  it('the cloth wet: 14 % less power; the engine’s own speed limit near 2,800 rpm', () => {
    near(
      'filterWetLoss',
      (1 - steadyPoint({ fullPower: true, filterWetFault: true }).power / fullPower().power) * 100,
      0.6,
    );
    const rpms = [2200, 2400, 2600, 2800, 3000, 3200];
    const curve = wotCurve(rpms);
    const top = curve.reduce((a, b) => (b.power > a.power ? b : a));
    expect(Math.abs(top.rpm - v('rpmModel'))).toBeLessThanOrEqual(200);
  });
});

describe('the estimates, read from the model’s own constants', () => {
  it('the zones’ temperatures, the outlet, the casing, the filter, the cooler, the mixture', () => {
    const sim = new GasifierSim();
    sim.applyScenario('measured-hour');
    for (let i = 0; i < 3000; i++) sim.step(1 / 60);
    const s = sim.state;
    near('dryT', s.zoneDryingT, 3);
    near('pyroT', s.zonePyrolysisT, 3);
    near('oxModel', s.zoneOxidationT, 3);
    near('reductionT', s.zoneReductionT, 3);
    near('outletModel', s.outletT, 5);
    near('casingModel', s.casingT, 3);
    near('filterInT', s.filterInT, 3);
    near('filterT', s.filterT, 3);
    near('coolerOut', s.coolerOutT, 1);
    near('mixT', s.mixT, 1);
    near('trainModel', s.trainDropMbar, 1);
    near('pipeMbar', s.pipeDropMbar, 0.1);
    near('oxBalance', max.oxidationEndT, 3);
    near('redTo', max.reductionEndT, 3);
    near('coolK', max.oxidationEndT - max.reductionEndT, 10);
    near('exhaustWork', s.exhaustCO * 100, 0.1);
    near('mixAirModel', s.airToGas, 0.01);
    expect(Math.abs(FIG.mixAirModel.v - max.airToGas)).toBeLessThan(0.01);
  });
  it('the idle: the hearth’s 370 °C, friction and the throttle’s 9 kW, two thirds unburnt', () => {
    near('idleHearth', idle.hearthT, 3);
    near('idleFriction', idle.friction + idle.throttling, 1);
    expect(Math.abs(1 - idle.burn - 2 / 3)).toBeLessThan(0.05);
  });
  it('the room: 3,500 ppm and 200 ppm after half an hour, the doors, the bedroom, the leak’s sizes', () => {
    near('ppm50', roomRun(30, { engineOn: false }).ppm, 50);
    near('ppm1000', roomRun(30, { engineOn: false, garageVolume: 1000 }).ppm, 10);
    near('shut30', roomRun(30, { engineOn: false }).ppm, 50);
    near('ajar30', roomRun(30, { engineOn: false, door: 'ajar' }).ppm, 50);
    near('open30', roomRun(30, { engineOn: false, door: 'open' }).ppm, 20);
    near('abovePeak', roomRun(180, { engineOn: false }).peakAbovePpm, 10);
    expect(ROOM.postGasVolume).toBe(FIG.postGas.v);
    expect(ROOM.aboveVolume).toBe(FIG.aboveM3.v);
    expect(ROOM.aboveAch).toBe(FIG.aboveAch.v);
    expect(ROOM.floorExchange[0]).toBe(0.05);
    expect(ROOM.floorExchange[2]).toBe(1);
    expect(DOOR_ACH.shut[0]).toBe(0.1);
    expect(DOOR_ACH.shut[2]).toBe(1.5);
    expect(DOOR_ACH.ajar[0]).toBe(0.5);
    expect(DOOR_ACH.ajar[2]).toBe(5);
    expect(DOOR_ACH.open[0]).toBe(2);
    expect(DOOR_ACH.open[2]).toBe(20);
    expect(ROOM.lidLeakArea * 1e4).toBe(FIG.leakMid.v);
  });
});

describe('what the figures say about themselves', () => {
  it('every model figure is † and every estimate is *, by status', () => {
    for (const [name, f] of Object.entries(FIG as Record<string, Fig>)) {
      const mark = f.s === 'derived' || f.s === 'model' ? '†' : '*';
      expect(mark, name).toMatch(/^[†*]$/);
    }
  });
});
