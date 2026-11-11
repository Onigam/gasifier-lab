import { setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { GasifierSim } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { roomRows, workRows } from '../sim/strip';
import { ALARM_TEXTS, ROOM_NOTE } from '../sim/texts';
import { analyserReadouts, band, mainReadouts, moreReadouts, niceCeil3, roomFacts, statusOf } from './model';
import { SimPanel } from './sim';
import { num, say, st, STRIP_ALARMS, sx } from './strings';
import { rowsFor, setActiveScene, stripAlarms, stripClock, stripValues } from './strip';
import { FakeElement, installFakeDom } from './test-dom';

// The panel rendered on a stand-in for the DOM: that it builds, what it offers, that it follows the simulation, that a click does what it says, in both languages; then the strip.

beforeAll(() => installFakeDom());
afterEach(() => {
  setLang('fr');
  setActiveScene('');
});

interface Fixture {
  sim: GasifierSim;
  panel: SimPanel;
  root: FakeElement;
  went: string[];
}

function open(lang: 'fr' | 'en' = 'fr', sim = new GasifierSim()): Fixture {
  setLang(lang);
  const went: string[] = [];
  const ctx = {
    sim,
    ui: { scene: 'farm' },
    gotoScene: (id: string) => went.push(id),
  } as unknown as AppContext<GasifierSim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement, went };
}

const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
const run = (panel: SimPanel, sim: GasifierSim, seconds: number): void => {
  for (let i = 0; i < seconds * 30; i++) {
    sim.step(1 / 30);
    panel.tick(1 / 30);
  }
};
/** Simulated seconds, at the clock's own speed, in the kit's own steps. */
const advance = (sim: GasifierSim, simSeconds: number): void => {
  const steps = Math.ceil(simSeconds / (0.25 * sim.params.timeScale));
  for (let i = 0; i < steps; i++) sim.step(0.25);
};
/** The control of a label: the `label` element whose first span says it. */
const field = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('label').find((e) => e.textContent.startsWith(label));
  if (!found) throw new Error(`no control « ${label} »`);
  return found;
};

describe('what the panel offers', () => {
  it('opens on the machine with its presets, a custom entry and a chip per scenario', () => {
    const { root, sim } = open();
    const options = root.find('option');
    expect(PRESET_IDS).toEqual(['mf-1100', 'scania-l8050']);
    expect(options.slice(0, PRESET_IDS.length).map((o) => o.textContent)).toEqual([st('presetMf'), st('presetScania')]);
    expect(options.some((o) => o.textContent === st('custom'))).toBe(true);
    for (const id of SCENARIO_IDS) expect(button(root, sx('scenario', id))).toBeDefined();
    expect(root.find('.part-chip')).toHaveLength(12);
    expect(sim.params.preset).toBe('mf-1100');
  });

  it('shows the strip’s nine figures in boxes, each with its mark in the data, and the marks in the text', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    expect(root.find('.readout')).toHaveLength(9);
    for (const r of mainReadouts(sim.state)) expect(['†', '*', '']).toContain(r.tag);
    expect(root.textContent).toContain('†');
    expect(root.textContent).toContain('kW');
  });

  it('says the marks once, at the top, and the box that is not a garage once, in the room', () => {
    const { root } = open();
    expect(root.textContent.split(say(ROOM_NOTE)).length - 1).toBe(1);
    expect(root.textContent).toContain('† résultat du modèle');
  });

  it('writes the numbers the way the language does, with a true minus sign', () => {
    setLang('fr');
    expect(num(5700)).toBe('5 700');
    expect(num(7.5, 1)).toBe('7,5');
    expect(num(-2)).toBe('−2');
    setLang('en');
    expect(num(5700)).toBe('5,700');
    expect(num(7.5, 1)).toBe('7.5');
  });

  it('opens in English with the English words and nothing French left in the figures', () => {
    const { root } = open('en');
    expect(root.textContent).toContain(st('scenarioHint'));
    expect(st('simIntro')).toMatch(/Swedish institute/);
    expect(root.textContent).toContain('Engine running');
    expect(root.textContent).not.toMatch(/Moteur en marche/);
  });
});

describe('what a click does', () => {
  it('a scenario applies itself and its lesson stays while the visitor tries things', () => {
    const { root, sim, panel } = open();
    button(root, sx('scenario', 'engine-stops')).click();
    expect(sim.scenarioNow).toBe('engine-stops');
    expect(root.textContent).toContain(sx('lesson', 'engine-stops').slice(0, 40));
    // a condition changed by hand does not drop the lesson
    sim.set({ load: 50 });
    panel.tick(1);
    expect(root.textContent).toContain(sx('lesson', 'engine-stops').slice(0, 40));
  });

  it('a preset turns the panel back to its starting point, and a change of condition makes it « other settings »', () => {
    const { root, sim } = open();
    const engine = field(root, st('engineOn'));
    const input = engine.querySelector('input')!;
    input.checked = false;
    input.dispatch('change', { target: input });
    expect(sim.params.engineOn).toBe(false);
    expect(sim.params.preset).toBe('custom');
    expect(statusOf(sim.state)).toBe('statusStopped');
  });

  it('a slider moves its parameter live, inside its range', () => {
    const { root, sim } = open();
    const moisture = field(root, st('moisture')).querySelector('input')!;
    moisture.dispatch('input', { target: { value: '30' } });
    expect(sim.params.moistureWet).toBe(30);
    expect(sim.state.figureTag).toBe('*');
  });

  it('the journey’s slider moves the cursor and not the preset, and its button goes to the gasifier', () => {
    const { root, sim, went } = open();
    const preset = sim.params.preset;
    const cursor = field(root, st('journeyLabel')).querySelector('input')!;
    cursor.dispatch('input', { target: { value: '0.9' } });
    expect(sim.params.journey).toBeCloseTo(0.9);
    expect(sim.params.preset).toBe(preset);
    button(root, st('seeInGasifier')).click();
    expect(went).toEqual(['gasifier']);
  });

  it('a scenario that moves a control by itself is followed by the control', () => {
    const { root, sim, panel } = open();
    button(root, sx('scenario', 'wet-chips')).click();
    advance(sim, 10 * 60);
    run(panel, sim, 1);
    const moisture = field(root, st('moisture'));
    expect(Number(moisture.querySelector('input')!.value)).toBe(sim.params.moistureWet);
    expect(sim.params.moistureWet).toBeGreaterThanOrEqual(20);
  });

  it('shows the truck’s load for the truck alone, even when a cue changes the machine from outside', () => {
    const { root, sim, panel } = open();
    expect(root.textContent).not.toContain(st('truckLoad'));
    sim.applyPreset('scania-l8050');
    run(panel, sim, 1);
    expect(root.textContent).toContain(st('truckLoad'));
    sim.applyPreset('mf-1100');
    run(panel, sim, 1);
    expect(root.textContent).not.toContain(st('truckLoad'));
  });

  it('start again goes back to the last starting point', () => {
    const { root, sim } = open();
    sim.set({ load: 20 });
    const reset = root.find('button').find((b) => b.attrs.get('aria-label') === st('resetSim'))!;
    reset.click();
    expect(sim.params.load).toBe(100);
  });
});

describe('every scenario, in both languages', () => {
  it('runs for a simulated hour under the panel: no error, no NaN, no « undefined » in anything it shows', () => {
    for (const lang of ['fr', 'en'] as const)
      for (const id of SCENARIO_IDS) {
        const sim = new GasifierSim();
        const { root, panel } = open(lang, sim);
        button(root, sx('scenario', id)).click();
        for (let i = 0; i < 240; i++) {
          sim.step(0.25);
          panel.tick(0.25);
        }
        const text = root.textContent;
        expect(text, `${lang} ${id}`).not.toMatch(/NaN|undefined|Infinity|\[object/);
        expect(text, `${lang} ${id}`).toContain(sx('lesson', id).slice(0, 30));
      }
  });
});

describe('the room, never a bare figure', () => {
  it('says that nothing has entered the box, and prints no « 0 ppm », while the machine is in the fields', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    expect(root.textContent).toContain(st('roomEmpty'));
    expect(root.textContent).not.toMatch(/(^|[^\d,.])0 ppm/);
    expect(roomFacts(sim.state).garage).toBeNull();
  });

  it('gives a span with its star once the box holds some, and the highest rung of the published ladder', () => {
    const sim = new GasifierSim();
    sim.applyScenario('closed-garage');
    advance(sim, 1800);
    const { root, panel } = open('fr', sim);
    run(panel, sim, 1);
    const f = roomFacts(sim.state);
    expect(f.garage).not.toBeNull();
    expect(f.garage!.low).toBeLessThanOrEqual(f.garage!.high);
    expect(root.textContent).toMatch(/\d[\d  ]* – \d[\d  ]* ppm \*/);
    expect(f.rung).not.toBeNull();
    expect(root.textContent).toContain(say(f.rung!.text));
  });

  it('keeps no all-clear: once there was carbon monoxide the strip never goes back to a dash', () => {
    const sim = new GasifierSim();
    sim.applyScenario('closed-garage');
    advance(sim, 600);
    setActiveScene('garage');
    expect(sim.state.coLatched).toBe(true);
    const row = stripValues(sim)[0]!;
    expect(row.value).not.toBe('—');
    expect(row.unit).toMatch(/ppm \*$/);
  });

  it('band() is null under a twentieth of a ppm, and shows tenths under 10', () => {
    expect(band(0, 0)).toBeNull();
    expect(band(0.2, 0.9)).toEqual({ low: 0.2, high: 0.9, digits: 1 });
    expect(band(30, 400)).toEqual({ low: 30, high: 400, digits: 0 });
  });
});

describe('the figures', () => {
  it('are the strip’s rows with their marks, and carry the mark their word gives them', () => {
    const sim = new GasifierSim();
    const s = sim.state;
    expect(mainReadouts(s).map((r) => r.key)).toEqual(workRows(s).map((r) => r.key));
    for (const r of moreReadouts(s)) expect(['†', '*', '']).toContain(r.tag);
    // the bench's own gas is published: no mark; the casing is an estimate
    expect(moreReadouts(s).find((r) => r.key === 'moreCasing')!.tag).toBe('*');
    expect(moreReadouts(s).find((r) => r.key === 'moreTar')!.tag).toBe('');
    for (const r of analyserReadouts(s)) expect(r.tag).toBe('*');
  });

  it('keep the same figures in both languages', () => {
    const sim = new GasifierSim();
    sim.applyScenario('measured-hour');
    advance(sim, 120);
    const digits = (lang: 'fr' | 'en') => {
      const { root, panel } = open(lang, sim);
      panel.tick(1);
      return root
        .find('.readout')
        .map((e) => e.textContent.replace(/[^\d]/g, ''))
        .join('|');
    };
    expect(digits('fr')).toBe(digits('en'));
  });

  it('round the axis to three round intervals', () => {
    expect(niceCeil3(0)).toBe(3);
    expect(niceCeil3(46)).toBe(60);
    expect(niceCeil3(630)).toBe(750);
    expect(niceCeil3(1)).toBe(1.5);
  });

  it('say the status of the machine: running, on diesel alone, stopped', () => {
    const sim = new GasifierSim();
    expect(statusOf(sim.state)).toBe('statusRunning');
    sim.set({ engineMode: 'diesel' });
    expect(statusOf(sim.state)).toBe('statusDiesel');
    sim.set({ engineMode: 'dual', engineOn: false });
    expect(statusOf(sim.state)).toBe('statusStopped');
  });
});

describe('the strip, in one line', () => {
  it('has a short form of every alarm, under fifty characters, and the sentence stays longer', () => {
    expect(Object.keys(STRIP_ALARMS).sort()).toEqual(Object.keys(ALARM_TEXTS).sort());
    for (const [key, pair] of Object.entries(STRIP_ALARMS))
      for (const i of [0, 1] as const) {
        expect(pair[i].length, `${key} ${i}`).toBeLessThanOrEqual(48);
        expect(pair[i].length, `${key} ${i}`).toBeLessThanOrEqual(
          ALARM_TEXTS[key as keyof typeof ALARM_TEXTS].text[i].length,
        );
      }
  });

  it('writes the numbers the way the language does: 1 855 and 2,2 in French, 1,855 and 2.2 in English', () => {
    const sim = new GasifierSim();
    setLang('fr');
    expect(stripValues(sim).find((v) => v.label === 'Régime')!.value).toBe(num(1855));
    expect(stripValues(sim).find((v) => v.label === 'Régime')!.value).toMatch(/^1\s855$/);
    setLang('en');
    expect(stripValues(sim).find((v) => v.label === 'Speed')!.value).toBe('1,855');
  });

  it('says an alarm with its short form in the strip and its sentence in the panel', () => {
    const sim = new GasifierSim();
    sim.set({ engineOn: false });
    setLang('fr');
    const alarm = stripAlarms(sim).find((a) => a.key === 'gasOutAfterStop')!;
    expect(alarm.label).toBe(STRIP_ALARMS.gasOutAfterStop[0]);
    expect(sx('alarm', 'gasOutAfterStop').length).toBeGreaterThan(alarm.label.length);
  });
});

describe('the sections follow the world', () => {
  const sections = (scene: string) => {
    setLang('fr');
    const sim = new GasifierSim();
    const ctx = { sim, ui: { scene }, gotoScene: () => undefined } as unknown as AppContext<GasifierSim>;
    const panel = new SimPanel(ctx);
    panel.render();
    return (panel.el as unknown as FakeElement)
      .find('details')
      .map((d) => ({ title: d.find('summary')[0]!.textContent, open: d.open }));
  };

  it('opens the journey first in the gasifier, and the room first in the garage', () => {
    const g = sections('gasifier');
    expect(g[g.findIndex((s) => s.title === st('secJourney'))]!.open).toBe(true);
    expect(
      g.filter((s) => s.title === st('secJourney' as never) || s.title === st('secRoom')).map((s) => s.title)[0],
    ).toBe(st('secJourney'));
    const r = sections('garage');
    expect(r.find((s) => s.title === st('secRoom'))!.open).toBe(true);
    expect(r.filter((s) => [st('secJourney'), st('secRoom')].includes(s.title)).map((s) => s.title)[0]).toBe(
      st('secRoom'),
    );
  });

  it('keeps the working conditions first and open anywhere else', () => {
    const f = sections('farm');
    expect(f.find((s) => s.title === st('secConditions'))!.open).toBe(true);
    expect(f.find((s) => s.title === st('secJourney'))!.open).toBe(false);
  });

  it('shows the two machines under names that fit in the select', () => {
    const { root } = open();
    const names = root
      .find('option')
      .slice(0, 2)
      .map((o) => o.textContent);
    expect(names).toEqual([st('presetMf'), st('presetScania')]);
    for (const n of names) expect(n.length).toBeLessThanOrEqual(22);
  });
});

describe('the strip', () => {
  it('shows the work in the fields: six figures to keep first, each with its mark after its unit, in the language of the moment', () => {
    const sim = new GasifierSim();
    setLang('fr');
    const fr = stripValues(sim);
    expect(fr[0]!.label).toBe('Puissance');
    expect(fr.map((v) => v.unit).join(' ')).toMatch(/kW †/);
    expect(fr.find((v) => v.label === 'Gazole')!.value).toMatch(/,/);
    setLang('en');
    const en = stripValues(sim);
    expect(en[0]!.label).toBe('Power');
    expect(en.find((v) => v.label === 'Diesel')!.value).toMatch(/\./);
    expect(fr).toHaveLength(workRows(sim.state).length);
  });

  it('shows the room in the garage’s world, and a dash where the box holds nothing yet', () => {
    const sim = new GasifierSim();
    setActiveScene('garage');
    expect(rowsFor(sim).map((r) => r.key)).toEqual(roomRows(sim.state).map((r) => r.key));
    const v = stripValues(sim);
    expect(v[0]!.value).toBe('—');
    expect(v[0]!.unit).toBe('');
    // the engine runs: nothing has stopped
    expect(v.find((x) => x.label === 'Depuis l’arrêt')!.value).toBe('—');
    sim.set({ engineOn: false });
    advance(sim, 120);
    expect(stripValues(sim).find((x) => x.label === 'Depuis l’arrêt')!.value).not.toBe('—');
  });

  it('shows the room wherever the machine stands once it is in the garage', () => {
    const sim = new GasifierSim();
    sim.applyScenario('closed-garage');
    setActiveScene('farm');
    expect(rowsFor(sim).map((r) => r.key)).toEqual(roomRows(sim.state).map((r) => r.key));
  });

  it('has a clock that says whether the engine runs, and alarms in words, both languages', () => {
    const sim = new GasifierSim();
    setLang('fr');
    expect(stripClock(sim).sub).toBe('moteur tournant');
    sim.set({ engineOn: false, moistureWet: 45 });
    expect(stripClock(sim).sub).toBe('moteur arrêté');
    const alarms = stripAlarms(sim);
    expect(alarms.length).toBeGreaterThan(0);
    expect(alarms.some((a) => a.severe)).toBe(true);
    setLang('en');
    expect(stripClock(sim).sub).toBe('engine stopped');
    expect(stripAlarms(sim).every((a) => a.label.length > 10)).toBe(true);
  });
});
