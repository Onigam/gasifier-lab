import { describe, expect, it } from 'vitest';
import { LAB_CUE_NAMES, planCue, runCue } from './cues';
import { GasifierSim } from './sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from './sim/presets';

// The cues of the spoken guide that move the simulation (src/cues.ts): each is idempotent, a value out of its range does nothing, and none is a gesture of use.

const SAMPLE: Record<(typeof LAB_CUE_NAMES)[number], string | undefined> = {
  scenario: 'engine-stops',
  preset: 'scania-l8050',
  reset: undefined,
  journey: '0.8',
  load: '60',
  moisture: '30',
  engine: 'off',
  fuel: 'spark',
  grade: 'unsieved',
  place: 'garage',
  volume: '1000',
  door: 'ajar',
  speed: '600',
  pause: undefined,
  play: undefined,
};

describe('the lab’s cues', () => {
  it('know every name they list, with a sample that plans something', () => {
    for (const name of LAB_CUE_NAMES) expect(planCue(name, SAMPLE[name]), name).not.toBeNull();
    expect(new Set(LAB_CUE_NAMES).size).toBe(LAB_CUE_NAMES.length);
  });

  it('take every scenario and every starting point of the simulation, and no other', () => {
    for (const id of SCENARIO_IDS) expect(planCue('scenario', id)).toEqual({ kind: 'scenario', id });
    for (const id of PRESET_IDS) expect(planCue('preset', id)).toEqual({ kind: 'preset', id });
    expect(planCue('scenario', 'the-flame-goes-out')).toBeNull();
    expect(planCue('preset', 'a-bin')).toBeNull();
  });

  it('refuse a value out of its range or of the wrong kind, and a name they do not know', () => {
    for (const [name, bad] of [
      ['journey', '1.5'],
      ['load', '-1'],
      ['load', '120'],
      ['moisture', '5'],
      ['moisture', '60'],
      ['engine', 'maybe'],
      ['fuel', 'petrol'],
      ['grade', '1-2'],
      ['place', 'kitchen'],
      ['volume', '75'],
      ['door', 'wide'],
      ['speed', '0'],
      ['speed', '99999'],
      ['load', undefined],
      ['load', 'abc'],
    ] as const)
      expect(planCue(name, bad), `${name}:${bad}`).toBeNull();
    expect(planCue('light-the-fire')).toBeNull();
    expect(planCue('fan')).toBeNull();
  });

  it('move the simulation, and the stop is a change of the state', () => {
    const sim = new GasifierSim();
    expect(runCue(sim, 'engine', 'off')).toBe(true);
    expect(sim.params.engineOn).toBe(false);
    expect(runCue(sim, 'place', 'garage')).toBe(true);
    expect(runCue(sim, 'volume', '1000')).toBe(true);
    expect(runCue(sim, 'door', 'open')).toBe(true);
    expect([sim.params.place, sim.params.garageVolume, sim.params.door]).toEqual(['garage', 1000, 'open']);
    expect(runCue(sim, 'moisture', '30')).toBe(true);
    expect(sim.params.moistureWet).toBe(30);
    expect(runCue(sim, 'load', '40')).toBe(true);
    expect(sim.params.load).toBe(40);
    expect(runCue(sim, 'journey', '0.3')).toBe(true);
    expect(sim.params.journey).toBeCloseTo(0.3);
    expect(runCue(sim, 'unknown')).toBe(false);
  });

  it('are idempotent: the kit replays the last cue of each name after a seek', () => {
    const a = new GasifierSim();
    const b = new GasifierSim();
    runCue(a, 'moisture', '30');
    runCue(b, 'moisture', '30');
    runCue(b, 'moisture', '30');
    expect(b.params).toEqual(a.params);
  });

  it('start a scenario, a preset and a reset', () => {
    const sim = new GasifierSim();
    runCue(sim, 'scenario', 'closed-garage');
    expect(sim.scenarioNow).toBe('closed-garage');
    expect(sim.params.place).toBe('garage');
    runCue(sim, 'preset', 'scania-l8050');
    expect(sim.params.machine).toBe('scania-l8050');
    runCue(sim, 'load', '10');
    runCue(sim, 'reset');
    expect(sim.params.load).not.toBe(10);
  });

  it('pause and play the clock', () => {
    const sim = new GasifierSim();
    runCue(sim, 'pause');
    expect(sim.params.running).toBe(false);
    runCue(sim, 'speed', '600');
    expect(sim.params.running).toBe(true);
    expect(sim.params.timeScale).toBe(600);
  });
});
