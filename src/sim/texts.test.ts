import { describe, expect, it } from 'vitest';
import { GasifierSim } from './engine';
import { CO_LADDER } from './ladder';
import { NOT_PRINTED } from './machine';
import { PRESET_IDS, SCENARIO_IDS } from './presets';
import { Plant } from './plant';
import {
  fullPower,
  loadCurve,
  moistureAtHeating,
  params,
  roomRun,
  steadyPoint,
  tableIdle,
  tableMax,
  truckRun,
} from './runs';
import {
  ALARM_TEXTS,
  BELOW_LADDER,
  DOOR_TEXTS,
  GRADE_TEXTS,
  MODE_TEXTS,
  OUTLET_NOTE,
  PRESET_TEXTS,
  ROOM_NOTE,
  SCENARIO_TEXTS,
  TAG_NOTE,
  TRUCK_TEXTS,
  ZONE_TEXTS,
  type Pair,
} from './texts';

// What a visitor reads: both languages, no research reference, nothing that promises safety, nothing that reads as reassurance about a room, no procedure, no size of the hot parts, a mark on every model figure, and the figures read back against the model. A pin is not a target: when the model moves, the words and docs/physics.md move with it.

const raw = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const DOC = raw['../../docs/physics.md'] ?? '';

const everyPair = (): Pair[] => [
  ...Object.values(ALARM_TEXTS).map((a) => a.text),
  ...Object.values(PRESET_TEXTS),
  ...Object.values(SCENARIO_TEXTS).flatMap((s) => [s.name, s.lesson]),
  ...Object.values(MODE_TEXTS),
  ...Object.values(GRADE_TEXTS),
  ...Object.values(DOOR_TEXTS),
  ...Object.values(TRUCK_TEXTS),
  ...Object.values(ZONE_TEXTS),
  ...CO_LADDER.map((r) => r.text),
  TAG_NOTE,
  ROOM_NOTE,
  BELOW_LADDER,
  OUTLET_NOTE,
];

const read = (text: string, re: RegExp): number[] => {
  const m = text.match(re);
  expect(m, `${re} in « ${text} »`).not.toBeNull();
  return m!.slice(1).map((n) =>
    Number(
      n
        .replace(',', '.')
        .replace(/[\s  ]/g, '')
        .replace(/(\d),(\d{3})/, '$1$2'),
    ),
  );
};

describe('the words', () => {
  it('every id has its words, in both languages', () => {
    for (const id of SCENARIO_IDS) expect(SCENARIO_TEXTS[id]).toBeDefined();
    for (const id of PRESET_IDS) expect(PRESET_TEXTS[id]).toBeDefined();
    for (const [fr, en] of everyPair()) {
      expect(fr.trim().length).toBeGreaterThan(0);
      expect(en.trim().length).toBeGreaterThan(0);
    }
  });
  it('the two languages are of the same length, give or take: no half-translated lesson', () => {
    for (const id of SCENARIO_IDS) {
      const [fr, en] = SCENARIO_TEXTS[id].lesson;
      expect(fr.length / en.length).toBeGreaterThan(0.8);
      expect(fr.length / en.length).toBeLessThan(1.3);
    }
  });
  it('no research reference ever reaches a visitor', () => {
    for (const pair of everyPair()) {
      for (const text of pair) {
        expect(text).not.toMatch(/\(?\bK\d+\b\)?/);
        expect(text).not.toMatch(/\bS\d+\b/);
        expect(text).not.toMatch(/\bR\d+\b/);
        expect(text).not.toMatch(/§/);
        expect(text).not.toMatch(/research|recherche/i);
      }
    }
  });
  it('no wording promises safety, research §A.1’s list and its French', () => {
    const banned =
      /\b(safe|safely|safety|harmless|risk-free|foolproof|non-toxic|nontoxic|clean|easy to build|anyone can|tolerable|acceptable|all clear|no danger|no risk)\b|sans (danger|risque|conséquence)|\bsûr\b|\bsûre\b|sécuris|inoffensi|gaz propre|\bpropre\b|facile à construire|tolérable|acceptable|aucun danger/i;
    for (const pair of everyPair()) {
      for (const text of pair) expect(text).not.toMatch(banned);
    }
  });
  it('no alarm and no line about the room reads as reassurance', () => {
    const calm =
      /\b(ok|okay|fine|normal|back to|returned to|good|enough|only \d|just \d|low enough|under control|dissipat)|\b(rien à craindre|revenu à|suffisant|suffit|seulement \d|sous contrôle|bon\b|normal)/i;
    const room = [
      ALARM_TEXTS.gasOutAfterStop.text,
      ALARM_TEXTS.lidLeak.text,
      ALARM_TEXTS.fanOut.text,
      ALARM_TEXTS.exhaustIndoors.text,
      ALARM_TEXTS.coWorkLimit.text,
      ALARM_TEXTS.coShortLimit.text,
      ALARM_TEXTS.coLadder.text,
      ALARM_TEXTS.coRoomAbove.text,
      ALARM_TEXTS.coDoorOpen.text,
      ALARM_TEXTS.coNoAllClear.text,
      SCENARIO_TEXTS['engine-stops'].lesson,
      SCENARIO_TEXTS['closed-garage'].lesson,
      ROOM_NOTE,
      BELOW_LADDER,
      ...CO_LADDER.map((r) => r.text),
    ];
    for (const pair of room) for (const text of pair) expect(text).not.toMatch(calm);
    // every alarm of the room is severe: none is a footnote
    for (const k of ['gasOutAfterStop', 'coNoAllClear', 'coDoorOpen', 'coWorkLimit'] as const) {
      expect(ALARM_TEXTS[k].severe).toBe(true);
    }
  });
  it('no time in a room: nothing says how long, how soon, or when it would be over', () => {
    const when =
      /\b(you have|before you|in time|time to get|wait|can go back|come back after|cool(s|ing)? for|at least \d+ min)|\b(vous avez|avant de|attendre|on peut revenir|peut y retourner|laisser refroidir|au moins \d+ min)/i;
    for (const pair of everyPair()) for (const text of pair) expect(text).not.toMatch(when);
    // the source's advice to cool for 20 minutes is not repeated, and the note says the box cannot say from when
    expect(ROOM_NOTE[1]).toMatch(/nor from when/);
    expect(ROOM_NOTE[0]).toMatch(/ni à partir de quand/);
  });
  it('no procedure: no imperative, no gesture', () => {
    const en =
      /(^|[.!?:]\s+)(open|close|shut|light|ignite|fan|empty|fill|drain|run|start|stop|keep|wait|leave|stay|use|check|move|set|put|turn|cool|go|get|call|never|always|do not|don't)\b/i;
    const fr =
      /\b(ouvrez|fermez|allumez|ventilez|videz|remplissez|attendez|restez|laissez|sortez|éteignez|vérifiez|déplacez|réglez|il faut|vous devez|on doit|il suffit|faites|ne faites)\b/i;
    const usage = /\b(you should|you must|should be|must be|how to)\b/i;
    // the names of a load and of a door are not sentences: « Empty », « Door open »
    const sentences: Pair[] = [
      ...Object.values(ALARM_TEXTS).map((a) => a.text),
      ...Object.values(SCENARIO_TEXTS).map((s) => s.lesson),
      TAG_NOTE,
      ROOM_NOTE,
      BELOW_LADDER,
      OUTLET_NOTE,
    ];
    for (const pair of sentences) {
      expect(pair[1]).not.toMatch(en);
      expect(pair[1]).not.toMatch(usage);
      expect(pair[0]).not.toMatch(fr);
    }
  });
  it('no size of the hot parts, no pilot, no timing, no compression (R2, R4)', () => {
    const m = NOT_PRINTED['mf-1100'];
    // the truck's throat too, 150 mm by S1 Table 3.14, which this repository holds nowhere else
    const sizes = [
      m.throatDiameter,
      m.nozzleBore,
      m.fireboxDiameter,
      m.nozzlePlaneAboveThroat,
      m.grateBelowThroat,
      0.15,
    ];
    const printed = sizes.flatMap((s) => [
      `${Math.round(s * 1000)} mm`,
      `${Math.round(s * 100)} cm`,
      `${s} m`,
      `${String(s).replace('.', ',')} m`,
    ]);
    for (const pair of everyPair()) {
      for (const text of pair) {
        for (const p of printed) expect(text.includes(p), `${p} in « ${text} »`).toBe(false);
        expect(text).not.toMatch(/hearth load|charge de foyer|compression|injection|calage|avance|timing|mm³|m³\/cm²/i);
      }
    }
  });
  it('« this is a model » for the room is said once, at the room; the lessons send to it by not repeating it', () => {
    const saying = Object.values(SCENARIO_TEXTS).filter((s) =>
      /boîte bien mélangée|well-mixed box/.test(s.lesson[0] + s.lesson[1]),
    );
    expect(saying).toHaveLength(0);
    expect(ROOM_NOTE[1]).toMatch(/well-mixed box/);
    expect(ROOM_NOTE[1]).toMatch(/layers/);
    expect(ROOM_NOTE[1]).toMatch(/can be worse/);
  });
  it('the ladder says published, and offers no side to stand on', () => {
    for (const r of CO_LADDER) {
      expect(r.text[1]).not.toMatch(/below|under this|up to|at most|limit of exposure|never above/i);
    }
    expect(CO_LADDER[0]!.text[1]).toMatch(/a limit for work, not a border for the body/);
    expect(BELOW_LADDER[1]).toMatch(/says nothing of a real room/);
  });
});

const lesson = (id: keyof typeof SCENARIO_TEXTS): readonly [string, string] => SCENARIO_TEXTS[id].lesson;

describe('the figures in the lessons are the model’s', () => {
  it('« The measured hour »: 34 kg †, 5.3 MJ †, 21 % †, 221 kW †', () => {
    const m = tableMax();
    const [fr, en] = lesson('measured-hour');
    expect(Math.abs(m.chips - read(en, /finds (\d+) kg †/)[0]!)).toBeLessThan(0.5);
    expect(Math.abs(m.chips - read(fr, /trouve (\d+) kg †/)[0]!)).toBeLessThan(0.5);
    expect(Math.abs(m.gasMJ - read(en, /(\d\.\d) MJ\/Nm³ †/)[0]!)).toBeLessThan(0.05);
    expect(Math.abs(m.gasMJ - read(fr, /(\d,\d) MJ\/Nm³ †/)[0]!)).toBeLessThan(0.05);
    expect(Math.abs(m.totalEffPct - read(en, /and (\d+) % †/)[0]!)).toBeLessThan(0.5);
    expect(en).toMatch(/221 kW †/);
    expect(fr).toMatch(/221 kW †/);
  });
  it('« Part load »: the best point between 70 and 80 %, at 22 % †; 19 % by the sum', () => {
    const c = loadCurve(20);
    const best = c.reduce((a, b) => (b.effPct > a.effPct ? b : a));
    expect(best.load).toBeGreaterThanOrEqual(70);
    expect(best.load).toBeLessThanOrEqual(80);
    expect(Math.abs(best.effPct - 22)).toBeLessThan(0.5);
    expect(lesson('part-load')[1]).toMatch(/between 70 and 80 %/);
    expect(lesson('part-load')[0]).toMatch(/entre 70 et 80 %/);
    expect(lesson('part-load')[1]).toMatch(/at 22 % †/);
  });
  it('« Idling »: 55 kW †, about 9 kW *, two thirds *, 7 kg *', () => {
    const r = tableIdle();
    const [fr, en] = lesson('idling');
    expect(Math.abs(r.friction + r.throttling - 9)).toBeLessThan(0.5);
    expect(Math.abs(1 - r.burn - 2 / 3)).toBeLessThan(0.05);
    expect(Math.abs(r.chips - read(en, /finds (\d+) kg \*/)[0]!)).toBeLessThan(0.5);
    expect(fr).toMatch(/9 kW \*/);
    expect(en).toMatch(/55 kW †/);
  });
  it('« Wet chips »: 5.3, 5.0, 4.7, 4.4, and 57 kg *, and the two limits *', () => {
    const [fr, en] = lesson('wet-chips');
    for (const [m, said] of [
      [8, 5.3],
      [20, 5.0],
      [30, 4.7],
      [40, 4.4],
    ] as const) {
      expect(Math.abs(steadyPoint({ moistureWet: m }).gasMJ - said)).toBeLessThan(0.05);
    }
    expect(en).toMatch(/5\.3, 5\.0, 4\.7, 4\.4 MJ\/Nm³ \*/);
    expect(fr).toMatch(/5,3, 5,0, 4,7, 4,4 MJ\/Nm³ \*/);
    expect(Math.abs(steadyPoint({ moistureWet: 40 }).chips - read(en, /(\d+) kg \* of chips/)[0]!)).toBeLessThan(0.5);
    expect(Math.abs(moistureAtHeating(4.2) - read(en, /near (\d+) % \* if the jacket/)[0]!)).toBeLessThan(1);
    expect(Math.abs(moistureAtHeating(4.2, { drainShare: 0 }) - read(en, /near (\d+) % \* if not/)[0]!)).toBeLessThan(
      1,
    );
  });
  it('« Fines »: 10 % † on this tractor', () => {
    const fine = steadyPoint({ fullPower: true, chipGrade: 'unsieved' }).power;
    const coarse = steadyPoint({ fullPower: true, chipGrade: '15-40' }).power;
    expect(Math.abs(1 - fine / coarse - 0.1)).toBeLessThan(0.005);
    expect(lesson('fines')[1]).toMatch(/10 % †/);
    expect(lesson('fines')[0]).toMatch(/10 % †/);
  });
  it('« The filter clogs »: 3 % †, 14 % *', () => {
    const fresh = fullPower().power;
    expect(Math.abs(1 - steadyPoint({ fullPower: true, filterHours: 50 }).power / fresh - 0.03)).toBeLessThan(0.005);
    expect(Math.abs(1 - steadyPoint({ fullPower: true, filterWetFault: true }).power / fresh - 0.14)).toBeLessThan(
      0.005,
    );
    expect(lesson('filter-ageing')[1]).toMatch(/only 3 % †/);
    expect(lesson('filter-ageing')[1]).toMatch(/14 % \*/);
  });
  it('« Three engines »: 55 kW †, 31 kW *, 2.5 MJ †, a third', () => {
    const [, en] = lesson('three-engines');
    expect(Math.abs(fullPower().power - read(en, /(\d+) kW † by the model/)[0]!)).toBeLessThan(0.5);
    expect(Math.abs(fullPower('spark').power - read(en, /finds about (\d+) kW \*/)[0]!)).toBeLessThan(0.5);
    expect(Math.abs(tableMax().mixtureMJ - 2.5)).toBeLessThan(0.05);
    expect(Math.abs(1 - tableMax().mixtureMJ / 3.8 - 1 / 3)).toBeLessThan(0.05);
  });
  it('« Air under the grate »: 5.3 to 4.2 *, 240 to 470 °C *, past the 300 °C', () => {
    const a = tableMax();
    const b = steadyPoint({ airLeak: true });
    const [, en] = lesson('air-leak');
    expect(Math.abs(b.gasMJ - 4.2)).toBeLessThan(0.1);
    expect(Math.abs(a.outletT - 240)).toBeLessThan(5);
    expect(Math.abs(b.outletT - 470)).toBeLessThan(5);
    expect(b.filterT).toBeGreaterThan(300);
    expect(en).toMatch(/5\.3 to 4\.2 MJ\/Nm³ \*/);
    expect(en).toMatch(/240 to 470 °C \*/);
  });
  it('« A working day »: 274 kg *, nine *, 13 min *', () => {
    const sim = new GasifierSim();
    sim.applyScenario('working-shift');
    const dt = 1 / 60;
    for (let i = 0; i < (8 * 3600) / sim.params.timeScale / dt; i++) sim.step(dt);
    const [fr, en] = lesson('working-shift');
    expect(Math.abs(sim.state.chipsUsedKg - read(en, /(\d+) kg \* of chips/)[0]!)).toBeLessThan(1.5);
    expect(sim.state.fillCount).toBe(9);
    expect(en).toMatch(/nine \*/);
    expect(fr).toMatch(/neuf \*/);
    expect(Math.abs(sim.state.serviceMinPerHour - 13)).toBeLessThan(0.5);
    expect(en).toMatch(/15 to 25/);
    expect(en).toMatch(/agricultural students/);
  });
  it('« The closed garage »: 3,500 ppm *, 200 ppm *, 670 ppm *, the span of a leak, each read back', () => {
    const small = roomRun(30, { engineOn: false });
    const large = roomRun(30, { engineOn: false, garageVolume: 1000 });
    const long = roomRun(180, { engineOn: false });
    const [fr, en] = lesson('closed-garage');
    expect(Math.abs(small.ppm - 3500)).toBeLessThan(50);
    expect(Math.abs(large.ppm - 200)).toBeLessThan(10);
    expect(Math.abs(long.peakAbovePpm - 670)).toBeLessThan(10);
    expect(long.peakAboveMinute - long.peakMinute).toBeGreaterThan(60);
    const lidAt = (area: number): number => {
      const p = params({ place: 'garage' });
      const pl = new Plant(p, { lidLeakArea: area });
      p.engineOn = false;
      p.lidLeak = true;
      pl.touch();
      for (let i = 0; i < 7200; i++) pl.step(1);
      return pl.room.first * 1e6;
    };
    expect(Math.abs(lidAt(3e-4) - 5000)).toBeLessThan(500);
    expect(Math.abs(lidAt(3e-3) - 50000)).toBeLessThan(2000);
    expect(en).toMatch(/3,500 ppm \*/);
    expect(fr).toMatch(/3 500 ppm \*/);
    expect(en).toMatch(/about 200 ppm \*/);
    expect(en).toMatch(/670 ppm \*/);
    expect(fr).toMatch(/670 ppm \*/);
    expect(en).toMatch(/5,000 to 50,000 ppm \*/);
    expect(fr).toMatch(/5 000 à 50 000 ppm \*/);
  });
  it('« The truck »: 9.4 kg *, 0.51 kg *, 81 % *, within 4 % †', () => {
    const t = truckRun('load-8t');
    const [, en] = lesson('truck');
    expect(Math.abs(t.chipsPer10 - read(en, /finds (\d\.\d) kg \*/)[0]!)).toBeLessThan(0.05);
    expect(Math.abs(t.dieselPer10 - read(en, /(0\.\d+) kg \*/)[0]!)).toBeLessThan(0.01);
    expect(Math.abs(t.substitution * 100 - read(en, /(\d+) % \* of the diesel/)[0]!)).toBeLessThan(1);
    expect(en).toMatch(/within 4 % †/);
  });
  it('« The engine stops » gives no end: about 20 minutes and hours, and the source’s advice stays out', () => {
    const [fr, en] = lesson('engine-stops');
    expect(en).toMatch(/about 20 minutes/);
    expect(en).toMatch(/sometimes for hours/);
    expect(fr).toMatch(/parfois des heures/);
    expect(en).not.toMatch(/after 20|allow|let it|cool/i);
    expect(fr).not.toMatch(/après 20|refroidi/i);
  });
});

describe('docs/physics.md', () => {
  it('has a line for every key figure of the research', () => {
    for (let k = 1; k <= 68; k++) {
      expect(DOC, `K${k}`).toMatch(new RegExp(`\\| K${k}\\b`));
    }
  });
  it('states what it does not find, the estimates and the unknown', () => {
    expect(DOC).toMatch(/Not retrieved/);
    expect(DOC).toMatch(/Nothing is tuned/);
    expect(DOC).toMatch(/estimate/);
    expect(DOC).toMatch(/Not a plan/);
  });
  it('lists what it left out on purpose, and what must never be displayed', () => {
    expect(DOC).toMatch(/Left out on purpose/);
    expect(DOC).toMatch(/Never displayed/);
    expect(DOC).toMatch(/air-to-gas/i);
  });
  it('prints what the model gives for the first table', () => {
    const m = tableMax();
    expect(DOC).toContain(`${m.chips.toFixed(1)} kg/h`);
    expect(DOC).toContain(`${m.gasMJ.toFixed(2)} MJ/Nm³`);
    expect(DOC).toContain(`${fullPower().power.toFixed(1)} kW`);
    expect(DOC).toContain(`${moistureAtHeating(4.2).toFixed(0)} %`);
  });
});
