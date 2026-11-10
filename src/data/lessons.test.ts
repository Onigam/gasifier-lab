import { describe, expect, it } from 'vitest';
import type { L } from '@onigam/lab-kit/i18n';
import { SCENARIO_IDS } from '../sim/presets';
import { ALARM_TEXTS, SCENARIO_TEXTS } from '../sim/texts';
import { PARTS } from './parts';
import { ASSEMBLY } from './assembly';
import { INSTALL } from './install';
import { OVERVIEWS } from './overviews';
import { lessonTexts } from './all-texts';
import { LESSONS } from './lessons';
import { NOT_REPEATED, PROMISES } from './lint';

// The lessons: seven, two questions each, every one opening on a scenario of the simulation and naming others, so that together they go through all twelve (docs/lessons.md). What docs/physics.md says not to write is not written, and the model’s gaps are said where its figure stands.
// The rules of the visitor’s texts (parity, marks, numbers, no research code, British English, no wording that promises safety, no size of the hot parts) are held for every text, lessons included, by data.test.ts and refusals.test.ts.

const LANGS = ['fr', 'en'] as const;
const words = (s: string): number => s.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
const name = (id: (typeof SCENARIO_IDS)[number]): L => ({
  fr: SCENARIO_TEXTS[id].name[0],
  en: SCENARIO_TEXTS[id].name[1],
});
const body = (les: (typeof LESSONS)[number], lang: 'fr' | 'en'): string => les.body.map((b) => b[lang]).join('\n\n');

describe('the lessons', () => {
  it('are seven, with fourteen questions, two each, in the order of the plan', () => {
    expect(LESSONS.length).toBe(7);
    expect(LESSONS.map((l) => l.quiz?.length)).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(LESSONS.map((l) => l.id)).toEqual([
      'the-match',
      'the-gas-that-kills',
      'journey-of-a-chip',
      'what-the-engine-gets',
      'dirty-gas',
      'where-the-energy-goes',
      'what-a-day-costs',
    ]);
  });

  it('open each on one world, one existing part of that world, and a scenario of the simulation', () => {
    for (const les of LESSONS) {
      const part = PARTS.find((p) => p.id === les.focus.part);
      expect(part?.scene, les.id).toBe(les.focus.scene);
      expect(SCENARIO_IDS, les.id).toContain(les.focus.scenario);
    }
  });

  it('reach all twelve scenarios: opened by a lesson, or named word for word in its text', () => {
    for (const id of SCENARIO_IDS) {
      const opened = LESSONS.some((l) => l.focus.scenario === id);
      const n = name(id);
      const named =
        LESSONS.some((l) => body(l, 'fr').includes(`« ${n.fr} »`)) &&
        LESSONS.some((l) => body(l, 'en').includes(`“${n.en}”`));
      expect(opened || named, id).toBe(true);
    }
  });

  it('name every scenario the way the panel does, in the sheets, the guides, the overviews and the lessons: a quotation that starts with a capital is a scenario or an alarm', () => {
    const known = { fr: new Set<string>(), en: new Set<string>() };
    for (const id of SCENARIO_IDS) {
      known.fr.add(name(id).fr);
      known.en.add(name(id).en);
    }
    for (const a of Object.values(ALARM_TEXTS)) {
      known.fr.add(a.text[0]);
      known.en.add(a.text[1]);
    }
    // the names of the worlds, as the top bar gives them, and of the kit’s tools
    const tools =
      /^(Garage|Ferme|Farm|Tracteur|Tractor|Gazogène|Gasifier|Ligne de gaz|Gas line|Éclaté|Explode|Transparence|X-ray|Flux|Flows|Coupe|Section|Ralenti|Slow-mo|Charge|Load)$/;
    const problems: string[] = [];
    const texts: L[] = [
      ...PARTS.flatMap((p) => [p.description, p.tip ?? p.short, p.maintenance ?? p.short, p.design ?? p.short]),
      ...[...ASSEMBLY, ...INSTALL].map((s) => s.text),
      ...Object.values(OVERVIEWS).map((o) => o.text),
      ...LESSONS.flatMap((l) => l.body),
    ];
    for (const t of texts) {
      for (const m of t.fr.matchAll(/« ([^»]+) »/g)) {
        const q = m[1] ?? '';
        if (/^[A-ZÉ]/.test(q) && !known.fr.has(q) && !tools.test(q)) problems.push(`fr: « ${q} »`);
      }
      for (const m of t.en.matchAll(/“([^”]+)”/g)) {
        const q = m[1] ?? '';
        if (/^[A-Z]/.test(q) && !known.en.has(q) && !tools.test(q)) problems.push(`en: “${q}”`);
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('have four paragraphs of at most 95 words, a formula and three chips', () => {
    for (const les of LESSONS) {
      expect(les.body.length, les.id).toBe(4);
      expect(les.formula, les.id).toBeTruthy();
      expect(les.figures?.length, les.id).toBe(3);
      for (const b of les.body)
        for (const lang of LANGS)
          expect(words(b[lang]), `${les.id} ${lang}: ${words(b[lang])} words`).toBeLessThanOrEqual(95);
    }
  });

  it('ask questions with three choices of about the same length, the right answer not always in one place, and not told by its length', () => {
    const answers = new Set<number>();
    const questions = LESSONS.flatMap((les) => les.quiz ?? []);
    for (const les of LESSONS) {
      for (const qu of les.quiz ?? []) {
        expect(qu.choices.length, les.id).toBe(3);
        expect(qu.answer, les.id).toBeLessThan(3);
        answers.add(qu.answer);
        for (const lang of LANGS) {
          const lengths = qu.choices.map((c) => c[lang].length);
          expect(Math.max(...lengths) / Math.min(...lengths), `${les.id}: ${qu.q[lang]}`).toBeLessThan(2.1);
        }
      }
    }
    expect(answers).toEqual(new Set([0, 1, 2]));
    for (const lang of LANGS) {
      const lengths = questions.map((qu) => ({ of: qu.choices.map((c) => c[lang].length), right: qu.answer }));
      const longest = lengths.filter((q) => q.of[q.right] === Math.max(...q.of)).length;
      const shortest = lengths.filter((q) => q.of[q.right] === Math.min(...q.of)).length;
      // chance is 14/3 ≈ 5: neither the longest nor the shortest may become a tell
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeGreaterThanOrEqual(2);
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeLessThanOrEqual(8);
      expect(shortest, `${lang}: the shortest is right in ${shortest} of ${questions.length}`).toBeLessThanOrEqual(8);
    }
  });

  it('write French and English together: every text there, none empty, none a placeholder', () => {
    for (const [where, t] of lessonTexts()) {
      expect(t.fr.trim().length, where).toBeGreaterThan(0);
      expect(t.en.trim().length, where).toBeGreaterThan(0);
      expect(t.fr + t.en, where).not.toMatch(/\{|\}|TODO|lorem/i);
    }
  });

  it('promise no safety and repeat none of the sources’ reassurances', () => {
    for (const [where, t] of lessonTexts()) {
      for (const lang of LANGS) {
        expect(t[lang], `${where} [${lang}]`).not.toMatch(PROMISES);
        expect(t[lang], `${where} [${lang}]`).not.toMatch(NOT_REPEATED);
      }
    }
  });
});

describe('what the lessons must say, and not say', () => {
  const les = (id: string) => LESSONS.find((l) => l.id === id)!;

  it('lesson 1 says the model’s wood first, 34 before 41, and that the model’s engine does not reach the table', () => {
    for (const lang of LANGS) {
      const t = body(les('the-match'), lang);
      expect(t.search(/\b34\b/), lang).toBeGreaterThan(-1);
      expect(t.search(/\b41\b/), lang).toBeGreaterThan(t.search(/\b34\b/));
    }
    expect(body(les('the-match'), 'en')).toMatch(/does not reach the table/);
  });

  it('lesson 2 gives about 20 minutes and sometimes hours, no end, and none of the source’s advice: no wait, no delay, no cooling, no air changes, no ground floor', () => {
    const fr = body(les('the-gas-that-kills'), 'fr');
    const en = body(les('the-gas-that-kills'), 'en');
    expect(en).toMatch(/about 20 minutes/);
    expect(en).toMatch(/sometimes for hours/);
    expect(fr).toMatch(/parfois des heures/);
    expect(en).toMatch(/No figure says when it ends/);
    expect(en).not.toMatch(/allow|let it cool|cool for|air changes|ground floor|wait\b|safe/i);
    expect(fr).not.toMatch(/laisser refroidir|rez-de-chaussée|attendre|renouvellements d’air/i);
    // the reason of the refusals is said here, plainly, and the lesson explains the machine: it does not say how to make or run it
    expect(en).toMatch(/does not say how to make it, or how to run it/);
  });

  it('lesson 2 gives no dose, no blood level, no time to a rung: only the 250 times, and the delayed effects', () => {
    const en = body(les('the-gas-that-kills'), 'en');
    expect(en).toMatch(/250 times/);
    expect(en).not.toMatch(
      /carboxyhaemoglobin|COHb|blood level|dose|per cent of the blood|before you (collapse|pass)/i,
    );
  });

  it('lesson 3 explains the throat and prints no size, and says the flame of the model never goes out', () => {
    const en = body(les('journey-of-a-chip'), 'en');
    expect(en).toMatch(/gives no size for that part/);
    expect(en).toMatch(/its flame never goes out/);
    expect(en).toMatch(/narrowing/);
  });

  it('lesson 4 says the agreement of the engine is worth little, and that the pilot is needed: not on wood alone', () => {
    const en = body(les('what-the-engine-gets'), 'en');
    expect(en).toMatch(/agreement is worth little/);
    expect(en).toMatch(/Wood alone is not enough/);
  });

  it('lesson 5 says what the model finds of the cloth, and sends the black water to the farm without advice', () => {
    const en = body(les('dirty-gas'), 'en');
    expect(en).toMatch(/loses only/);
    expect(en).toMatch(/the farm’s barrel/);
    expect(en).not.toMatch(/dispose|dilute|compost|spread/i);
  });

  it('lesson 6 shows the table’s misprints as such, and says no one efficiency does both vehicles', () => {
    const en = body(les('where-the-energy-goes'), 'en');
    expect(en).toMatch(/A misprint, or another test/);
    expect(en).toMatch(/No single efficiency does both/);
    expect(en).toMatch(/the lab takes the curve, and says so/);
  });

  it('lesson 7 says the honest answer: not alone, and dear, and that the lab does not sell it', () => {
    const en = body(les('what-a-day-costs'), 'en');
    expect(en).toMatch(/not alone, and dear/);
    expect(en).toMatch(/does not sell it/);
    expect(en).toMatch(/students/i);
  });

  it('say in no lesson that the model retrieves the machine, nor that a room is fit, nor that a door or a volume helps', () => {
    const all = LESSONS.map((l) => body(l, 'en')).join('\n');
    expect(all).not.toMatch(/retriev|matches the bench|agrees with the bench|reproduces the (table|measure)/i);
    expect(all).not.toMatch(/\b(helps|enough to|keeps? the room|fit for)\b/i);
  });
});
