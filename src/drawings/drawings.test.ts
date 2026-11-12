import { beforeAll, describe, expect, it } from 'vitest';
import { Drawing } from '@onigam/lab-kit/drawings';
import { l, setLang } from '@onigam/lab-kit/i18n';
import { FIG, type Fig } from '../data/figures';
import { NOT_REPEATED, numbers, printedForms, PROMISES, REPORTED } from '../data/lint';
import { PARTS } from '../data/parts';
import * as REPORT from '../sim/reported';
import { CO_LADDER } from '../sim/ladder';
import { roomRun } from '../sim/runs';
import { HEARTH, HOT, UNIT, ZONES } from '../three/dims';
import { idsOf, type WorldId } from '../three/part-ids';
import { PLAN_GROUPS, SHEETS } from './index';
import { benchFlow, modelFlow } from './pl06-energy-balance';
import { journeyProfile } from './pl05-reaction-zones';
import { lossPct, engineRows } from './pl07-engine-power';
import { LIVES } from './pl04-working-day';
import { ly } from './pl08-co-ladder';
import { roomProfile } from './pl09-the-stop';
import { FIRES, FLEET_WAR, INSPECTED, PEAK } from './pl10-war-and-fires';
import { FakeElement, installFakeDom, textBoxes, textExtent, type TextBox } from './test-dom';

// The ten A3 sheets by script: the contract (ids, numbers, groups, worlds, parts), a render in French and in English with no NaN, no text off the sheet, on another or on the title block, the numbers printed (each from the report's tables, the figures, the simulation or an allowed
// constant, or marked), the marks, the cartouche « not for construction », no size of the hot parts in any printed form, nothing that promises safety, and the model's results on the sheets against the figures of the texts.

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;
const key = (id: string, lang: Lang): string => `${id}/${lang}`;
let blank: Record<Lang, TextBox[]>;

beforeAll(() => {
  installFakeDom();
  const frame = (): Drawing => {
    const d = new Drawing();
    d.frame({ title: l('t', 't'), subtitle: l('s', 's'), number: 'PL-G00', scale: 'x' });
    return d;
  };
  blank = { fr: [], en: [] };
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
    blank[lang] = textBoxes(root(frame()));
  }
  setLang('fr');
});

const boxes = (id: string, lang: Lang): TextBox[] => textBoxes(rendered.get(key(id, lang)) as FakeElement);
const flat = (id: string, lang: Lang): string =>
  boxes(id, lang)
    .map((t) => t.content)
    .join(' ')
    .replace(/\s+/g, ' ');

const IDS = [
  'general-arrangement',
  'gas-path',
  'gasifier-section',
  'a-working-day',
  'reaction-zones',
  'energy-balance',
  'engine-power',
  'co-ladder',
  'the-stop',
  'war-and-fires',
];

describe('the contract', () => {
  it('has at least the eight sheets of the bar: ten, in reading order, numbered as the kit lists them, group by group', () => {
    expect(SHEETS.length).toBe(10);
    expect(SHEETS.map((s) => s.id)).toEqual(IDS);
    expect(SHEETS.map((s) => s.number)).toEqual(
      Array.from({ length: 10 }, (_, i) => `PL-G${String(i + 1).padStart(2, '0')}`),
    );
    const groups = new Set(PLAN_GROUPS.map((g) => g.id));
    for (const s of SHEETS) expect(groups.has(s.group), s.id).toBe(true);
    for (const g of PLAN_GROUPS)
      expect(
        SHEETS.some((s) => s.group === g.id),
        g.id,
      ).toBe(true);
    // the kit lists the sheets group by group: the numbers run only if the sheets are already in that order
    const order = SHEETS.map((s) => PLAN_GROUPS.findIndex((g) => g.id === s.group));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('shows only part ids of the world it opens, each once, and each with a sheet', () => {
    for (const s of SHEETS) {
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      expect(new Set(s.parts).size, s.id).toBe(s.parts!.length);
      for (const id of s.parts!) {
        expect(idsOf(s.scene as WorldId), `${s.id}: ${id}`).toContain(id);
        expect(PARTS.find((p) => p.id === id)?.scene, `${s.id}: ${id}`).toBe(s.scene);
      }
    }
  });

  it('gives each sheet a title and a description in both languages, different, of a similar length', () => {
    for (const s of SHEETS) {
      for (const t of [s.title, s.description]) {
        expect(t.fr.length, s.id).toBeGreaterThan(5);
        expect(t.en.length, s.id).toBeGreaterThan(5);
        expect(t.fr, s.id).not.toBe(t.en);
      }
      expect(s.description.fr.length / s.description.en.length, s.id).toBeGreaterThan(0.6);
      expect(s.description.fr.length / s.description.en.length, s.id).toBeLessThan(1.7);
      expect(s.description.en, s.id).not.toMatch(/\bK\d{1,2}\b|\bS\d{1,2}\b/);
    }
  });
});

describe('the render', () => {
  it('has no NaN, no undefined and no placeholder, in both languages', () => {
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const t = flat(s.id, lang);
        expect(t.length, `${s.id} ${lang}`).toBeGreaterThan(100);
        expect(t, `${s.id} ${lang}`).not.toMatch(/NaN|undefined|Infinity|\[object|\{\w+\}/);
        for (const b of boxes(s.id, lang)) expect(b.content.trim().length, `${s.id}: an empty text`).toBeGreaterThan(0);
      }
  });

  it('has no French left in the English sheets, the title block included', () => {
    for (const s of SHEETS) expect(flat(s.id, 'en'), s.id).not.toMatch(/[éèêàùûôîç]/);
    for (const s of SHEETS)
      expect(flat(s.id, 'en'), s.id).not.toMatch(/\btr\/min\b|\btours? (par|a)\b|\bpar (heure|minute|seconde|jour)\b/i);
  });

  it('marks every sheet « not for construction » in its title block, once, and says nothing of a reconstruction', () => {
    for (const s of SHEETS) {
      expect(flat(s.id, 'en').match(/NOT FOR CONSTRUCTION/g)?.length, s.id).toBe(1);
      expect(flat(s.id, 'fr').match(/PAS POUR LA CONSTRUCTION/g)?.length, s.id).toBe(1);
      expect(flat(s.id, 'en'), s.id).not.toMatch(/reconstruction/i);
      expect(flat(s.id, 'fr'), s.id).not.toMatch(/reconstitution/i);
    }
  });

  it('stays on the sheet', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of boxes(s.id, lang)) {
          const e = textExtent(t);
          expect(e.x0, `${s.id} ${lang}: ${t.content}`).toBeGreaterThan(8);
          expect(e.x1, `${s.id} ${lang}: ${t.content}`).toBeLessThan(412);
          expect(e.y0, `${s.id} ${lang}: ${t.content}`).toBeGreaterThan(8);
          expect(e.y1, `${s.id} ${lang}: ${t.content}`).toBeLessThan(292);
        }
  });

  it('keeps off the title block: in its corner only the block’s own texts stand', () => {
    for (const lang of LANGS) {
      const own = blank[lang].filter((t) => t.y > 252 && t.x > 225).length;
      for (const s of SHEETS) {
        const low = boxes(s.id, lang).filter((t) => t.y > 252 && t.x > 225).length;
        expect(low, `${s.id} ${lang}`).toBe(own);
      }
    }
  });

  it('has no text over another text', () => {
    const over: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const list = boxes(s.id, lang).filter((t) => !t.rotated);
        const ext = list.map((t) => textExtent(t));
        for (let i = 0; i < list.length; i++)
          for (let j = i + 1; j < list.length; j++) {
            const a = ext[i]!;
            const b = ext[j]!;
            const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
            if (w <= 0 || h <= 0) continue;
            const small = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
            if ((w * h) / small > 0.25)
              over.push(`${s.id} ${lang}: « ${list[i]!.content} » over « ${list[j]!.content} »`);
          }
      }
    expect(over.join('\n')).toBe('');
  });

  it('says in both languages the same numbers, sheet by sheet', () => {
    for (const s of SHEETS) {
      const per = (lang: Lang): string[] =>
        boxes(s.id, lang)
          .flatMap((t) => numbers(t.content, lang))
          .sort();
      const fr = per('fr');
      const en = per('en');
      expect(en, s.id).toEqual(fr);
    }
  });
});

describe('the numbers', () => {
  /** Every number the sources print that a sheet draws, flattened: the report’s tables read by the simulation, the ladder, the lives, the war’s counts. */
  const flatten = (o: unknown): number[] =>
    typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flatten) : [];

  const known = new Set<string>(REPORTED);
  const add = (v: number): void => {
    known.add(String(v));
    known.add(String(Number(v.toFixed(1))));
    known.add(String(Math.round(v)));
  };
  for (const v of Object.values(REPORT).flatMap(flatten)) add(v);
  for (const r of CO_LADDER) for (const v of [r.ppm, r.ppmHigh]) if (v) add(v);
  for (const e of LIVES) for (const v of e.hours) add(v);
  for (const v of [...flatten(FLEET_WAR.map((r) => r.n)), ...flatten(PEAK), ...flatten(FIRES), ...flatten(INSPECTED)])
    add(v);
  for (const f of Object.values(FIG as Record<string, Fig>)) {
    known.add(String(Number(f.v.toFixed(f.d))));
    for (const t of f.t ?? [])
      for (const m of t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2').match(/\d+(?:[.,]\d+)?/g) ?? [])
        known.add(String(Number(m.replace(',', '.'))));
  }
  // the charts’ own grids and the sheets’ labels: hours, minutes, ppm decades, the journey’s cursor, per cents, the A3 sheet, the dates of the sources
  for (const v of [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 40, 50, 60, 90, 100, 120, 150, 180, 200, 400, 800, 1000, 1600, 1e4, 1e5, 1e6,
    0.3, 0.55, 0.7, 0.95, 0.5, 1939, 1940, 1941, 1943, 1944, 1945, 1950, 1988, 2026, 11, 25, 5000, 3, 72, 70000, 15000,
    10000, 40,
  ])
    known.add(String(v));

  it('prints only numbers of the reports’ tables, of the figures, of the simulation, or marked † or *', () => {
    const stray: string[] = [];
    for (const s of SHEETS)
      for (const t of boxes(s.id, 'en')) {
        if (/^123[†*]?$/.test(t.content.trim())) continue;
        let named = t.content;
        for (const e of [...REPORT.FLEET, ...REPORT.CONVERTED]) named = named.split(e.name).join('');
        const text = named
          .replace(
            /PL-G?\d+|1:\d+|A3|3D|CO₂|O₂|H₂O?|N₂|CH₄|m³|cm²|Nm³|\b\d{4}-\d{2}-\d{2}\b|[A-Z]{2,}-\d+(?:\.\d+)?|Table \d+(?:[.-]\d+)?|FT \d+|FAO Forestry Paper \d+/g,
            '',
          )
          .replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
          // a number with its unit and a mark is a figure of the model or a sum: checked by its own test below
          .replace(/\d+(?:\.\d+)?(?:\s?(?:%|[A-Za-z°/³²]+(?:\s[A-Za-z]+)?))?\s?[†*]/g, '');
        for (const m of text.match(/\d+(?:\.\d+)?/g) ?? [])
          if (!known.has(String(Number(m)))) stray.push(`${s.id}: ${m} in « ${t.content} »`);
      }
    expect(stray.join('\n')).toBe('');
  });

  it('marks what is derived or estimated with † or *, and the legend says what they mean', () => {
    for (const id of [
      'energy-balance',
      'engine-power',
      'a-working-day',
      'war-and-fires',
      'the-stop',
      'co-ladder',
      'reaction-zones',
    ])
      expect(flat(id, 'en'), id).toMatch(/[†*]/);
    for (const id of ['general-arrangement', 'energy-balance', 'reaction-zones', 'the-stop']) {
      expect(flat(id, 'en'), id).toMatch(/given by a source/);
      expect(flat(id, 'fr'), id).toMatch(/donné par une source/);
    }
  });

  it('tags what the model gives: every sheet with a curve or a flow of the model says MODEL RESULT, and the estimates of the room are starred', () => {
    for (const id of ['reaction-zones', 'energy-balance', 'engine-power', 'the-stop']) {
      expect(flat(id, 'en'), id).toMatch(/MODEL RESULT · not a measurement/);
      expect(flat(id, 'fr'), id).toMatch(/RÉSULTAT DU MODÈLE · pas une mesure/);
    }
    expect(flat('the-stop', 'en')).toMatch(/50 m³ garage\*/);
    expect(flat('co-ladder', 'en')).toMatch(/3,500 ppm\*/);
    expect(flat('co-ladder', 'en')).toMatch(/200 ppm\*/);
  });
});

describe('what the sheets refuse', () => {
  it('prints no size of the hot parts in any form, in either language (R2)', () => {
    const flattenN = (o: unknown): number[] =>
      typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flattenN) : [];
    const refused = [
      ...new Set([
        ...flattenN(HOT),
        ...flattenN(HEARTH),
        ...flattenN(ZONES),
        UNIT.lowerR * 2,
        UNIT.lowerR,
        UNIT.lowerH,
      ]),
    ].filter((v) => v > 0 && v < 2 && !Number.isInteger(v));
    expect(refused.length).toBeGreaterThan(8);
    const problems: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of boxes(s.id, lang)) {
          const text = t.content.replace(/[  ]/g, ' ');
          for (const v of refused)
            for (const f of printedForms(v)) {
              const re = new RegExp(
                `(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}²³\\d/]|\\s(?:par|a|an)\\s)`,
                'u',
              );
              if (re.test(text)) problems.push(`${s.id} [${lang}] prints ${f} in « ${t.content} »`);
            }
        }
    expect(problems).toEqual([]);
  });

  it('promises no safety, repeats no sentence of the sources that the lab does not, and says nothing of a procedure', () => {
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const t = flat(s.id, lang);
        expect(t, `${s.id} ${lang}`).not.toMatch(PROMISES);
        expect(t, `${s.id} ${lang}`).not.toMatch(NOT_REPEATED);
        expect(t, `${s.id} ${lang}`).not.toMatch(/\bK\d{1,2}\b|\bS\d{1,2}\b|\(S\d|\(K\d/);
        expect(t, `${s.id} ${lang}`).not.toMatch(/\bno significant effects\b|\baucun effet significatif\b/i);
      }
  });

  it('the carbon monoxide sheet has no side to stand on: the ladder, its sources, the model’s two rooms, and no time', () => {
    const en = flat('co-ladder', 'en');
    const fr = flat('co-ladder', 'fr');
    for (const r of CO_LADDER) {
      expect(en, String(r.ppm)).toContain(r.text[1].slice(0, 25));
      expect(fr, String(r.ppm)).toContain(r.text[0].slice(0, 25));
    }
    expect(en).toMatch(/None is a level one may stay under/);
    expect(fr).toMatch(/Aucun n’est un niveau sous lequel on peut rester/);
    expect(en).toMatch(/computes no time/);
    expect(en).not.toMatch(/\b50 ppm\b/);
    expect(en).not.toMatch(/\b(time to|minutes? (?:before|until)|before you|within \d)/i);
    // the rungs go up the axis in the order of the ladder
    const ys = CO_LADDER.map((r) => ly(r.ppm));
    for (let i = 1; i < ys.length; i++) expect(ys[i]!, String(i)).toBeLessThan(ys[i - 1]!);
  });

  it('the stop draws no line of the ladder across the time, and no threshold', () => {
    const en = flat('the-stop', 'en');
    expect(en).toMatch(/draws no line of the sources’ ladder/);
    expect(en).not.toMatch(/\b(3,200|12,800|800) ppm/);
    expect(en).not.toMatch(/minutes? (?:before|until|to reach)/i);
  });
});

describe('the sheets against the sources of their numbers', () => {
  it('the journey’s curves are the model’s: the flame peaks where the texts say, the zones in order, the gas sums to one', () => {
    const prof = journeyProfile();
    expect(prof.length).toBe(41);
    const peak = Math.max(...prof.map((p) => p.chipT));
    expect(Math.abs(peak - FIG.oxModel.v)).toBeLessThanOrEqual(3);
    for (const p of prof) {
      // what is not there is the flame’s oxygen, which the sheet does not draw
      expect(p.CO + p.H2 + p.CH4 + p.CO2 + p.H2O + p.N2, `s=${p.s}`).toBeGreaterThan(90);
      expect(p.CO + p.H2 + p.CH4 + p.CO2 + p.H2O + p.N2, `s=${p.s}`).toBeLessThan(100.5);
    }
    // the table of the outlet: the model’s gas where the figures put it
    const end = prof[prof.length - 1]!;
    // the curves count the steam, the table and the figures are dry gas
    const dry = (x: number): number => (x / (100 - end.H2O)) * 100;
    expect(Math.abs(dry(end.CO) - FIG.gasCO.v)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(dry(end.H2) - FIG.gasH2.v)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(dry(end.N2) - FIG.gasN2.v)).toBeLessThanOrEqual(0.6);
  });

  it('the balance closes on both Sankeys, and prints the figures of the texts', () => {
    for (const f of [benchFlow(), modelFlow()]) {
      expect(f.wood).toBeCloseTo(f.gas + f.gl, 6);
      expect(f.gas + f.diesel).toBeCloseTo(f.shaft + f.el, 6);
    }
    const b = benchFlow();
    expect(Math.abs(b.wood + b.diesel - FIG.kwIn.v)).toBeLessThan(0.6);
    expect(b.shaft).toBe(40);
    const t = flat('energy-balance', 'en');
    expect(t).toContain('195 kW†');
    expect(t).toContain('221 kW†');
    expect(t).toContain('11.8%†');
    expect(t).toContain('34 kg/h†');
    expect(t).toMatch(/does not close/);
    expect(t).toMatch(/not a validation/);
    expect(flat('energy-balance', 'fr')).toMatch(/n’est pas une validation/);
    // the two misprints are shown as printed and recomputed
    expect(t).toContain('18.9');
    expect(t).toContain('5.3');
    expect(t).toContain('19.2†');
  });

  it('the fleet’s losses are computed from the report’s two powers', () => {
    const { fleet, converted } = engineRows();
    expect(fleet.length).toBe(14);
    expect(converted.length).toBe(2);
    const mf = fleet.find((e) => e.name.includes('MF 1100'))!;
    expect(Math.round(lossPct(mf))).toBe(20);
    const t = flat('engine-power', 'en');
    expect(t).toContain('−20%†');
    expect(t).toMatch(/That agreement is worth little/);
    expect(t).toMatch(/model: 55 kW†/);
  });

  it('the working day prints the tables’ ranges, the lives, and the gap between the tables and the sum', () => {
    const t = flat('a-working-day', 'en');
    for (const f of ['30–45 min', '40–50 min', '25–100 h', '75–135 h', '600–1,000 h', '2,000–4,000 h', 'about 700 h'])
      expect(t, f).toContain(f);
    expect(t).toMatch(/The gap is not explained/);
    expect(LIVES.map((e) => e.id)).toEqual(['fire-box', 'throat-ring', 'grate', 'filter-bags', 'outer-casing']);
  });

  it('the room’s curves are the simulation’s, door shut, and match the figures of the texts at half an hour', () => {
    const prof = roomProfile();
    const at30 = prof.find((q) => q.minute === 30)!;
    expect(Math.abs(at30.garage50 - FIG.ppm50.v)).toBeLessThanOrEqual(50);
    expect(Math.abs(at30.garage1000 - FIG.ppm1000.v)).toBeLessThanOrEqual(10);
    expect(Math.abs(roomRun(30, { engineOn: false }).ppm - at30.garage50)).toBeLessThan(1e-6);
    expect(Math.max(...prof.map((q) => q.above))).toBeGreaterThan(FIG.abovePeak.v - 20);
    expect(Math.max(...prof.map((q) => q.above))).toBeLessThan(FIG.abovePeak.v + 20);
  });

  it('the war’s counts add up, and the sheet says what is not drawn', () => {
    expect(PEAK.cars + PEAK.buses + PEAK.trucks).toBe(FLEET_WAR[3].n);
    expect(FIRES.charcoal + FIRES.wood + FIRES.others).toBe(FIRES.total);
    expect(Math.round((INSPECTED.faulty / INSPECTED.inspected) * 100)).toBe(67);
    expect(Math.round(((PEAK.woodShare / 100) * FLEET_WAR[3].n) / 100) * 100).toBe(26800);
    const t = flat('war-and-fires', 'en');
    expect(t).toMatch(/the curve is not drawn, and the question stays open/);
    expect(t).toContain('26,800†');
    expect(t).toContain('30%†');
    expect(flat('war-and-fires', 'fr')).toMatch(/la courbe n’est pas dessinée/);
  });
});
