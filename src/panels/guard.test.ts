import { describe, expect, it } from 'vitest';
import { NOT_REPEATED, OPERATING_EN, OPERATING_FR, PROMISES, printedForms } from '../data/lint';
import { LAB_STRINGS } from '../i18n/ui';
import { HEARTH, HOT, UNIT, ZONES } from '../three/dims';
import { panelTexts } from './all-texts';
import { PANEL } from './strings';

// What the panels, the strip, the notice on the way in and the shortcuts print is held to the rules of the sheets: no promise of safety, no instruction to build or run, no size of the hot parts, the model's 34 kg before the bench's 41, nothing that says the model retrieves the machine or that its flame goes out, no time a person has in a room (research §A.1, §A.2, R2, R3, R5; docs/data.md).

const flatten = (o: unknown): number[] =>
  typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flatten) : [];

/** Every length of the hot parts, in metres (the same list as src/data/refusals.test.ts). */
const REFUSED = [
  ...new Set([...flatten(HOT), ...flatten(HEARTH), ...flatten(ZONES), UNIT.lowerR * 2, UNIT.lowerR, UNIT.lowerH]),
]
  .filter((v) => v > 0 && v < 2 && !Number.isInteger(v))
  .sort();

const texts = panelTexts();
const ours = Object.entries(PANEL);

describe('the words of the panels', () => {
  it('gather the whole panel, the strip, the notice and the simulation’s own words', () => {
    expect(texts.length).toBeGreaterThan(150);
    expect(texts.filter(([w]) => w.startsWith('scenario ')).length).toBe(24);
    expect(texts.filter(([w]) => w.startsWith('alarm ')).length).toBeGreaterThan(15);
  });

  it('say everything in both languages, with no placeholder, no straight apostrophe, no research code', () => {
    for (const [where, t] of texts) {
      expect(t.fr.trim().length, where).toBeGreaterThan(0);
      expect(t.en.trim().length, where).toBeGreaterThan(0);
    }
    for (const [k, v] of ours) {
      expect(v[0] + v[1], k).not.toMatch(/\{|\}|TODO|à remplacer|to replace|'|\bK\d{2}\b|\bS\d{1,2}\b/);
      // the two languages are not the same text, unless it is a unit or a formula
      if (v[0].length > 12) expect(v[0], k).not.toBe(v[1]);
    }
  });

  it('promise no safety and repeat none of the sources’ reassurances', () => {
    for (const [where, t] of texts) {
      expect(t.fr, where).not.toMatch(PROMISES);
      expect(t.en, where).not.toMatch(PROMISES);
      expect(t.fr, where).not.toMatch(NOT_REPEATED);
      expect(t.en, where).not.toMatch(NOT_REPEATED);
    }
  });

  it('give no instruction: no operating verb in the imperative', () => {
    // a one-word label (« Empty », for a truck) is no sentence
    for (const [where, t] of texts.filter(([, t]) => t.en.split(/\s+/).length > 3)) {
      expect(t.en, where).not.toMatch(OPERATING_EN);
      expect(t.fr, where).not.toMatch(OPERATING_FR);
    }
  });

  it('print no size of the hot parts, in any form, in either language', () => {
    const problems: string[] = [];
    for (const [where, t] of texts)
      for (const lang of ['fr', 'en'] as const) {
        const text = t[lang].replace(/[  ]/g, ' ');
        for (const v of REFUSED)
          for (const f of printedForms(v)) {
            const re = new RegExp(
              `(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}²³\\d/]|\\s(?:par|a|an)\\s)`,
              'u',
            );
            if (re.test(text)) problems.push(`${where} [${lang}] prints ${f}`);
          }
      }
    expect(problems).toEqual([]);
  });

  it('speak of no hearth load, nozzle count, throat ratio or rule from an engine to a size', () => {
    const banned =
      /hearth load|charge de foyer|charge de gazéification|m³\/cm²|Nm³\/cm²|(seven|sept|7)\s+(air\s+)?(nozzles|tuyères)|throat[- ]to|rapport (de la )?gorge|throat (diameter|size)|diamètre de (la )?gorge|bore of the nozzle|diamètre des tuyères/i;
    for (const [where, t] of texts) {
      expect(t.en, where).not.toMatch(banned);
      expect(t.fr, where).not.toMatch(banned);
    }
  });

  it('say the model’s 34 kg an hour before the bench’s 41, whenever both are said', () => {
    let both = 0;
    for (const [where, t] of texts)
      for (const lang of ['fr', 'en'] as const) {
        const text = t[lang];
        const a = text.search(/\b34\b/);
        const b = text.search(/\b41\b/);
        if (a >= 0 && b >= 0) {
          both++;
          expect(a, `${where} [${lang}]`).toBeLessThan(b);
        }
      }
    expect(both).toBeGreaterThan(0);
  });

  it('never say the model retrieves the machine, nor that its flame goes out, nor a time a person has', () => {
    for (const [where, t] of texts) {
      for (const lang of ['fr', 'en'] as const) {
        const text = t[lang];
        expect(text, `${where} [${lang}]`).not.toMatch(
          /retrieves? the (machine|bench)|retrouve (la machine|le banc)|in under a minute|en moins d’une minute|time (left|you have)|temps (qu’il )?(reste|dont on dispose)/i,
        );
        // a flame that goes out is said only to say that the model's does not
        if (/goes out|s’éteint/i.test(text))
          expect(text, `${where} [${lang}]`).toMatch(/never goes out|ne s’éteint jamais/i);
      }
    }
  });

  it('use no number of their own beyond the 20 % where the measured ground ends', () => {
    for (const [k, v] of ours) {
      // the names of the two machines carry their model numbers
      if (k.startsWith('preset') || (k.startsWith('chart') && k.endsWith('Hint'))) continue;
      const nums = new Set((v[0] + ' ' + v[1]).match(/\d+/g) ?? []);
      for (const n of nums) expect(['20'], `${k}: ${n}`).toContain(n);
    }
  });
});

describe('the notice on the way in', () => {
  const entry = [LAB_STRINGS.warningFull, LAB_STRINGS.entryGarage, LAB_STRINGS.entryFire, LAB_STRINGS.entryBurns];

  it('says carbon monoxide, the closed garage, the backfire and the burns, in both languages, and nothing softened', () => {
    const fr = entry.map((e) => e[0]).join(' ');
    const en = entry.map((e) => e[1]).join(' ');
    expect(en).toMatch(/carbon monoxide/);
    expect(en).toMatch(/closed garage/);
    expect(en).toMatch(/backfire/);
    expect(en).toMatch(/scorching/);
    expect(fr).toMatch(/monoxyde de carbone/);
    expect(fr).toMatch(/garage fermé/);
    expect(fr).toMatch(/retour de flamme/);
    expect(fr).toMatch(/brûlant/);
    expect(en).toMatch(/killed people who were being careful/);
    expect(fr).toMatch(/il a tué des gens qui faisaient attention/);
  });

  it('gives the emergency numbers as they are in the warning: 112, 15 in France, 144 in Switzerland', () => {
    expect(LAB_STRINGS.warningFull[1]).toMatch(/call 112 \(15 in France, 144 in Switzerland\)/);
    expect(LAB_STRINGS.warningFull[0]).toMatch(/le 112 \(le 15 en France, le 144 en Suisse\)/);
  });

  it('is not a plan, a procedure or advice, and says no build or run would be allowed', () => {
    expect(LAB_STRINGS.warningFull[1]).toMatch(/not a plan, a procedure or advice/);
    expect(LAB_STRINGS.warningFull[1]).toMatch(/building or running one would be acceptable or allowed/);
  });
});
