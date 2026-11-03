import { describe, expect, it } from 'vitest';
import { GasifierSim, STEP } from './engine';
import { journey, newAnalyser, zoneAt } from './journey';
import { ladderRung, CO_LADDER } from './ladder';
import { Plant } from './plant';
import { DEFAULT_TIME_SCALE, PRESET_IDS, presetParams, RANGES, SCENARIO_IDS, SPEEDS } from './presets';
import { stripAlarms, stripClock, stripValues } from './strip';
import { MODEL } from './machine';
import { MODEL_TAGS, NEVER_DISPLAYED, PARAM_TAGS, STATE_TAGS } from './tags';
import type { ScenarioId } from './types';

// The simulation as the kit and the 3D see it: the clock, the state, what may and may not leave src/sim.

const run = (sim: GasifierSim, seconds: number, dt = 1 / 60): void => {
  const frames = Math.round(seconds / sim.params.timeScale / dt);
  for (let i = 0; i < frames; i++) sim.step(dt);
};

describe('the clock', () => {
  it('moves on dt × timeScale in fixed steps, and not at all when paused', () => {
    const sim = new GasifierSim();
    sim.set({ timeScale: 60 });
    const t0 = sim.state.simTime;
    run(sim, 600);
    expect(sim.state.simTime - t0).toBeCloseTo(600, -1);
    sim.set({ running: false });
    const t1 = sim.state.simTime;
    run(sim, 60);
    expect(sim.state.simTime).toBe(t1);
    expect(STEP).toBe(1);
  });
  it('the same inputs give the same state: nothing random, no wall clock', () => {
    const a = new GasifierSim();
    const b = new GasifierSim();
    a.applyScenario('closed-garage');
    b.applyScenario('closed-garage');
    run(a, 1800);
    run(b, 1800);
    expect(a.state.garageCoPpm).toBe(b.state.garageCoPpm);
    expect(a.state.casingT).toBe(b.state.casingT);
  });
  it('speeds and the default', () => {
    expect(SPEEDS).toContain(DEFAULT_TIME_SCALE);
    expect(presetParams('mf-1100').timeScale).toBe(DEFAULT_TIME_SCALE);
  });
  it('a step is cheap: the 3D reads the state every frame on a phone', () => {
    const sim = new GasifierSim();
    const pl = sim.plantNow;
    const t0 = performance.now();
    for (let i = 0; i < 20000; i++) pl.step(1);
    const ms = performance.now() - t0;
    // a solution every ten simulated seconds is inside this
    expect(ms / 20000).toBeLessThan(0.05);
  });
});

describe('the state', () => {
  it('every key has its word, every word a key', () => {
    const sim = new GasifierSim();
    expect(Object.keys(sim.state).sort()).toEqual(Object.keys(STATE_TAGS).sort());
  });
  it('every parameter and every constant of the model has its word', () => {
    const sim = new GasifierSim();
    expect(Object.keys(sim.params).sort()).toEqual(Object.keys(PARAM_TAGS).sort());
    expect(Object.keys(MODEL).sort()).toEqual(Object.keys(MODEL_TAGS).sort());
  });
  it('no number is NaN or infinite, in any preset or scenario, at any point of a run', () => {
    const sim = new GasifierSim();
    const check = () => {
      for (const [k, v] of Object.entries(sim.state)) {
        if (typeof v === 'number') expect(Number.isFinite(v), k).toBe(true);
      }
    };
    for (const id of PRESET_IDS) {
      sim.applyPreset(id);
      check();
    }
    for (const id of SCENARIO_IDS) {
      sim.applyScenario(id);
      check();
      for (let i = 0; i < 40; i++) {
        sim.step(0.25);
        check();
      }
    }
  });
  it('the energy closes: wood and diesel go to the shaft and the losses, and the gasifier’s parts sum', () => {
    const s = new GasifierSim().state;
    expect(s.woodKw + s.dieselKw).toBeCloseTo(s.powerKw + s.totalLossKw, 6);
    expect(s.woodKw).toBeCloseTo(s.gasKw + s.gasifierLossKw, 6);
    expect(s.gasKw + s.dieselKw).toBeCloseTo(s.shaftKw + s.engineLossKw, 6);
    // to a tenth of a kilowatt: Table 2.1's two columns differ by that much, per mole and per Nm³
    expect(Math.abs(s.gasifierLossKw - (s.lossHotGasKw + s.lossResidueKw + s.lossCasingKw))).toBeLessThan(0.1);
  });
  it('the mechanical sides of the state move with the machine: bunker, dots, wheels, zones', () => {
    const sim = new GasifierSim();
    const s = sim.state;
    const before = s.bunkerKg;
    run(sim, 60);
    expect(s.bunkerKg).toBeLessThan(before);
    expect(s.gasFlowShare).toBeGreaterThan(0.5);
    expect(s.groundSpeedMs).toBeGreaterThan(0);
    expect(s.zoneOxidationT).toBeGreaterThan(s.zoneReductionT);
    expect(s.zoneReductionT).toBeGreaterThan(s.zonePyrolysisT);
    expect(s.zonePyrolysisT).toBeGreaterThan(s.zoneDryingT);
    expect(s.outletT).toBeLessThan(s.zoneReductionT);
    expect(s.filterT).toBeLessThan(s.outletT);
    expect(s.coolerOutT).toBeLessThan(s.filterT);
    expect(s.gaugeMbar!).toBeLessThan(0);
    expect(s.pressureSign).toBe('suction');
  });
  it('a bunker runs out and is filled again, and the count says so', () => {
    const sim = new GasifierSim();
    sim.set({ timeScale: 600 });
    run(sim, 2 * 3600);
    expect(sim.state.fillCount).toBe(2);
    expect(sim.state.bunkerKg).toBeGreaterThan(0);
  });
});

describe('the journey of a chip', () => {
  const j = (sim: GasifierSim, at: number) => {
    sim.set({ journey: at });
    return { ...sim.state.analyser };
  };
  it('goes through the zones in order', () => {
    expect(zoneAt(0)).toBe('drying');
    expect(zoneAt(0.4)).toBe('pyrolysis');
    expect(zoneAt(0.6)).toBe('oxidation');
    expect(zoneAt(0.8)).toBe('reduction');
    expect(zoneAt(1)).toBe('ash');
  });
  it('shares add up at every point, and it ends on the model’s gas', () => {
    const sim = new GasifierSim();
    for (let s = 0; s <= 1.0001; s += 0.05) {
      const a = j(sim, s);
      const sum = a.xCO + a.xH2 + a.xCH4 + a.xCO2 + a.xH2O + a.xN2 + a.xO2;
      expect(sum).toBeCloseTo(1, 6);
    }
    const end = j(sim, 1);
    const g = sim.plantNow.gas;
    expect(end.xCO).toBeCloseTo(
      g.moles.CO / (g.moles.CO + g.moles.H2 + g.moles.CH4 + g.moles.CO2 + g.moles.H2O + g.moles.N2),
      6,
    );
  });
  it('the chip dries, loses its volatiles, and the gas gains CO and H₂ only below the fire', () => {
    const sim = new GasifierSim();
    const dry = j(sim, 0.29);
    const pyro = j(sim, 0.54);
    const ox = j(sim, 0.69);
    const red = j(sim, 0.94);
    expect(dry.chipWater).toBeLessThan(0.05);
    expect(pyro.chipMass).toBeLessThan(0.25);
    expect(ox.chipT).toBeGreaterThan(pyro.chipT);
    expect(red.chipT).toBeLessThan(ox.chipT);
    expect(red.xCO).toBeGreaterThan(ox.xCO);
    expect(red.xH2).toBeGreaterThan(ox.xH2);
    expect(red.xCO2).toBeLessThan(ox.xCO2);
    expect(red.xH2O).toBeLessThan(ox.xH2O);
  });
  it('the tar peaks at the end of pyrolysis and the fire takes it: the mechanism, by estimated rates', () => {
    const sim = new GasifierSim();
    expect(j(sim, 0.54).tarShare).toBeGreaterThan(0.9);
    expect(j(sim, 0.8).tarShare).toBeLessThan(0.01);
  });
  it('allocates nothing: one analyser, written in place', () => {
    const a = newAnalyser();
    const pl = new Plant(presetParams('mf-1100'));
    const out = journey(
      0.5,
      {
        ambientT: 15,
        hearthT: pl.hearthT,
        oxidationT: pl.oxidationT,
        outletT: pl.outletT,
        alive: true,
        crackedShare: 1,
        afterOxidation: pl.zones.afterOxidation,
        final: pl.gas.moles,
      },
      a,
    );
    expect(out).toBe(a);
  });
});

describe('the stop', () => {
  it('suction ends, pressure has no number, gas leaves, carbon monoxide at 23–27 %', () => {
    const sim = new GasifierSim();
    sim.set({ engineOn: false });
    run(sim, 300);
    const s = sim.state;
    expect(s.engineRpm).toBe(0);
    expect(s.pressureSign).toBe('pressure');
    expect(s.gaugeMbar).toBeNull();
    expect(s.plumeLpm).toBeGreaterThan(0);
    expect(s.plumeCoLpm / s.plumeLpm).toBeGreaterThanOrEqual(0.23);
    expect(s.plumeCoLpm / s.plumeLpm).toBeLessThanOrEqual(0.27);
    expect(s.minutesSinceStop).toBeCloseTo(5, 0);
    expect(s.alarms).toContain('gasOutAfterStop');
    expect(s.plumeVisible).toBe(true);
  });
  it('the source has no end: three hours on, the plume has thinned and has not stopped', () => {
    const sim = new GasifierSim();
    sim.set({ engineOn: false, timeScale: 600 });
    run(sim, 3 * 3600);
    expect(sim.state.plumeLpm).toBeGreaterThan(0);
    expect(sim.state.alarms).toContain('gasOutAfterStop');
    expect(sim.state.zoneOxidationT).toBeCloseTo(sim.state.zoneReductionT, 6);
  });
  it('holds the volume asked: all the plume adds up to the slider', () => {
    const sim = new GasifierSim();
    sim.set({ engineOn: false, postGasVolume: 2, postGasMinutes: 20, timeScale: 600 });
    run(sim, 2 * 3600);
    expect(sim.state.plumeTotalM3).toBeCloseTo(2, 1);
  });
  it('the hearth and casing cool slowly', () => {
    const sim = new GasifierSim();
    const hot = sim.state.casingT;
    sim.set({ engineOn: false, timeScale: 600 });
    run(sim, 20 * 60);
    expect(sim.state.casingT).toBeGreaterThan(100);
    expect(sim.state.casingT).toBeLessThanOrEqual(hot + 60);
    run(sim, 3 * 3600);
    expect(sim.state.casingT).toBeLessThan(80);
  });
  it('a lid that does not seal keeps the gas coming for hours: the model’s, on an estimated leak', () => {
    const plain = new GasifierSim();
    const sim = new GasifierSim();
    plain.set({ engineOn: false, timeScale: 600 });
    sim.set({ engineOn: false, lidLeak: true, timeScale: 600 });
    run(plain, 3600);
    run(sim, 3600);
    expect(sim.state.plumeLpm).toBeGreaterThan(5);
    expect(sim.state.plumeLpm).toBeGreaterThan(5 * plain.state.plumeLpm);
    expect(sim.state.alarms).toContain('lidLeak');
    expect(sim.state.zoneReductionT).toBeGreaterThan(250);
  });
});

describe('the room: no all-clear, no time, no person (R5)', () => {
  const garage = (patch = {}) => {
    const sim = new GasifierSim();
    sim.applyScenario('closed-garage');
    sim.set({ timeScale: 600, ...patch });
    return sim;
  };
  it('no CO outside the room’s world', () => {
    const sim = new GasifierSim();
    sim.set({ engineOn: false, timeScale: 600 });
    run(sim, 1800);
    expect(sim.state.garageCoPpm).toBe(0);
  });
  it('the box rises, the room above follows, both carry a span, and the middle stands inside it', () => {
    const sim = garage();
    run(sim, 1800);
    const s = sim.state;
    expect(s.garageCoPpm).toBeGreaterThan(1000);
    expect(s.roomAboveCoPpm).toBeGreaterThan(0);
    expect(s.garageCoPpmLow).toBeLessThanOrEqual(s.garageCoPpm);
    expect(s.garageCoPpmHigh).toBeGreaterThanOrEqual(s.garageCoPpm);
    expect(s.roomAboveCoPpmLow).toBeLessThanOrEqual(s.roomAboveCoPpm);
    expect(s.roomAboveCoPpmHigh).toBeGreaterThanOrEqual(s.roomAboveCoPpm);
  });
  it('an alarm stands at every moment after a stop in a room, and none ever reads as clear', () => {
    const sim = garage({ door: 'open' });
    for (let i = 0; i < 400; i++) {
      run(sim, 120);
      expect(sim.state.alarms.length).toBeGreaterThan(0);
      if (sim.state.coLatched) {
        const co = sim.state.alarms.filter((a) => a.startsWith('co'));
        expect(co.length).toBeGreaterThan(0);
      }
    }
    // the box has long since aired out, and the alarm still does not call it clear
    expect(sim.state.garageCoPpm).toBeLessThan(20);
    expect(sim.state.alarms).toContain('coNoAllClear');
  });
  it('the door lowers the box, and is told it is no answer', () => {
    const shut = garage();
    const open = garage({ door: 'open' });
    run(shut, 1800);
    run(open, 1800);
    expect(open.state.garageCoPpm).toBeLessThan(shut.state.garageCoPpm);
    expect(open.state.alarms).toContain('coDoorOpen');
  });
  it('the ladder is printed beside the number, and is only a ladder', () => {
    expect(ladderRung(0)).toBe(-1);
    expect(ladderRung(20)).toBe(0);
    expect(ladderRung(100)).toBe(1);
    expect(ladderRung(3200)).toBe(4);
    expect(ladderRung(1e6)).toBe(CO_LADDER.length - 1);
    const sim = garage();
    run(sim, 1800);
    expect(sim.state.ladderRung).toBe(ladderRung(sim.state.garageCoPpm));
  });
});

describe('what may not leave src/sim (R1, R2, R4, R5)', () => {
  it('no state key and no parameter is one of these', () => {
    const sim = new GasifierSim();
    const names = [...Object.keys(sim.state), ...Object.keys(sim.params), ...Object.keys(sim.state.analyser)];
    for (const n of names) {
      for (const f of NEVER_DISPLAYED) expect(n, `${n} against « ${f.what} »`).not.toMatch(f.pattern);
    }
  });
  it('the sliders are conditions, and this exact list: adding one is a decision', () => {
    expect(Object.keys(RANGES).sort()).toEqual(
      ['ambientT', 'filterHours', 'journey', 'load', 'moistureWet', 'postGasMinutes', 'postGasVolume'].sort(),
    );
  });
  it('no parameter is a geometry, a mixture, a loss or an efficiency', () => {
    const banned = /diameter|height|length|area|volumeOf|airToGas|mixture|heatLoss|eta|efficiency|bore|bunker/i;
    for (const k of Object.keys(presetParams('mf-1100'))) expect(k).not.toMatch(banned);
  });
  it('the machine cannot be retuned from the panel: a change of machine is a preset, and the numbers are the machine’s', () => {
    const sim = new GasifierSim();
    sim.set({ machine: 'scania-l8050' });
    expect(sim.params.preset).toBe('scania-l8050');
    expect(sim.plantNow.m.displacement).toBe(7.8e-3);
    expect(sim.state.onDrawnMachine).toBe(false);
  });
  it('the state holds no dose: nothing grows without limit while the box stands still', () => {
    const sim = new GasifierSim();
    sim.applyScenario('closed-garage');
    sim.set({ timeScale: 3600 });
    run(sim, 24 * 3600);
    const a = { ...sim.state };
    run(sim, 24 * 3600);
    // a dose would keep climbing; the clock and the ledger are the only keys that may
    for (const [k, v] of Object.entries(sim.state)) {
      if (typeof v !== 'number' || k === 'simTime' || k === 'hour' || k === 'minutesSinceStop') continue;
      const before = (a as unknown as Record<string, number>)[k]!;
      if (before > 1) expect(v, k).toBeLessThan(before * 1.2);
    }
  });
});

describe('the strip and the scenarios', () => {
  it('values carry a tag, the room’s always *', () => {
    const sim = new GasifierSim();
    for (const r of stripValues(sim.state)) expect(['†', '*', '']).toContain(r.tag);
    expect(stripValues(sim.state)[0]!.key).toBe('power');
    sim.applyScenario('closed-garage');
    const rows = stripValues(sim.state);
    expect(rows[0]!.key).toBe('garageCo');
    expect(rows[0]!.tag).toBe('*');
    expect(stripClock(sim.state).sub[1]).toBe('engine stopped');
  });
  it('the mark follows the conditions', () => {
    const sim = new GasifierSim();
    expect(sim.state.figureTag).toBe('†');
    sim.set({ moistureWet: 25 });
    expect(sim.state.figureTag).toBe('*');
    sim.set({ moistureWet: 8, engineMode: 'spark' });
    expect(sim.state.figureTag).toBe('*');
    sim.set({ engineMode: 'dual', machine: 'scania-l8050' });
    expect(sim.state.figureTag).toBe('*');
  });
  it('sliders stay in range', () => {
    const sim = new GasifierSim();
    sim.set({ moistureWet: 200, load: -5 });
    expect(sim.params.moistureWet).toBe(RANGES.moistureWet.max);
    expect(sim.params.load).toBe(RANGES.load.min);
  });
  it('twelve scenarios, each opens and runs, each changes what it says it changes', () => {
    expect(SCENARIO_IDS).toHaveLength(12);
    const sim = new GasifierSim();
    const after = (id: ScenarioId, seconds: number) => {
      sim.applyScenario(id);
      run(sim, seconds);
      return sim.state;
    };
    expect(after('measured-hour', 60).powerKw).toBeCloseTo(40, 3);
    expect(after('part-load', 60).powerKw).toBeCloseTo(29, 3);
    expect(after('idling', 700).powerKw).toBeCloseTo(0, 3);
    expect(after('wet-chips', 1000).gasMJ).toBeCloseTo(4.4, 1);
    expect(after('fines', 1000).hearthDropMbar).toBeGreaterThan(after('fines', 60).hearthDropMbar);
    expect(after('filter-ageing', 51 * 3600).filterWet).toBe(true);
    expect(after('three-engines', 60).powerKw).toBeCloseTo(54.6, 0);
    expect(after('three-engines', 400).powerKw).toBeCloseTo(64, 3);
    expect(after('three-engines', 700).engineMode).toBe('spark');
    expect(Math.abs(after('three-engines', 700).powerKw - 31)).toBeLessThan(1);
    expect(after('air-leak', 400).alarms).toContain('airLeak');
    expect(after('working-shift', 8 * 3600).fillCount).toBeGreaterThan(5);
    expect(after('engine-stops', 300).engineOn).toBe(false);
    expect(after('closed-garage', 300).garageCoPpm).toBeGreaterThan(100);
    expect(after('truck', 600).chipsPer10Km).toBeGreaterThan(5);
  });
  it('reset goes back, and a scenario says it is running', () => {
    const sim = new GasifierSim();
    sim.applyScenario('wet-chips');
    expect(sim.scenarioNow).toBe('wet-chips');
    run(sim, 1000);
    sim.reset();
    expect(sim.params.moistureWet).toBe(8);
    sim.applyPreset('mf-1100');
    expect(sim.scenarioNow).toBeNull();
  });
  it('the alarms have words', () => {
    const sim = new GasifierSim();
    sim.applyScenario('closed-garage');
    run(sim, 1800);
    const a = stripAlarms(sim.state);
    expect(a.length).toBeGreaterThan(0);
    for (const x of a) expect(x.label[0].length).toBeGreaterThan(0);
  });
  it('the scope keeps a bounded history', () => {
    const sim = new GasifierSim();
    sim.set({ timeScale: 3600 });
    run(sim, 3 * 86400);
    expect(sim.scope.t.length).toBeLessThanOrEqual(1200);
    expect(sim.scope.powerKw.length).toBe(sim.scope.t.length);
  });
});
