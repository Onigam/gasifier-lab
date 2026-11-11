import { describe, expect, it } from 'vitest';
import { HEARTH, HOT, UNIT, ZONES } from '../three/dims';
import { printedForms } from './lint';
import { spokenToDigits } from './spoken';

// The sizes of the hot parts are printed nowhere (research §A.2, R2): not in a text, not on a sheet, and not in a document of the repository either, because the spoken guide and the film are written from the documents. This reads the notes, the README, the spoken guide's notes, `public/lab.json` and `index.html` for every printed form of every refused length when a hot part is named beside it, for a hearth load with its figures and for the throat's area. The spoken guide itself (narration/<lang>.json) says its numbers in words: its last describe reads them back as digits (src/data/spoken.ts) and holds the same lines, and a stricter one, off every sentence that names a hot part. The values live in `src/sim/machine.ts` and `src/three/dims.ts`, in the code, as the owner accepted (research Q4).

const flatten = (o: unknown): number[] =>
  typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flatten) : [];

const REFUSED = [
  ...new Set([...flatten(HOT), ...flatten(HEARTH), ...flatten(ZONES), UNIT.lowerR * 2, UNIT.lowerR, UNIT.lowerH]),
]
  .filter((v) => v > 0 && v < 2 && !Number.isInteger(v))
  .sort();

const files = import.meta.glob(
  ['../../docs/*.md', '../../README.md', '../../narration/*.md', '../../public/lab.json', '../../index.html'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>;

/** A hot part, named in either language. */
const HOT_WORD =
  /\b(throat|nozzles?|fire ?box|fire-box|grate|hood|plenum|ring|reduction|oxidation|pyrolysis|lower casing|gorge|tuy[èe]res?|foyer|grille|r[ée]duction|oxydation)\b/i;

describe('the documents print no size of the hot parts (R2)', () => {
  it('reads the notes, the README, lab.json and index.html', () => {
    expect(Object.keys(files).length).toBeGreaterThan(10);
    expect(REFUSED.length).toBeGreaterThan(8);
  });

  it('prints no refused length beside the name of a hot part, in millimetres, centimetres or metres', () => {
    const problems: string[] = [];
    for (const [file, raw] of Object.entries(files)) {
      const text = raw.replace(/[  ]/g, ' ');
      for (const v of REFUSED)
        for (const f of printedForms(v)) {
          const re = new RegExp(
            `(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}²³\\d/]|\\s(?:par|a|an)\\s)`,
            'gu',
          );
          for (const m of text.matchAll(re)) {
            // a long paragraph names many parts: only what stands within a sentence of the number counts
            const near = text.slice(Math.max(0, m.index - 90), m.index + f.length + 90);
            if (HOT_WORD.test(near))
              problems.push(`${file}: ${f} beside « ${near.replace(/\s+/g, ' ').trim().slice(0, 80)} »`);
          }
        }
    }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('prints no hearth load with its figures, no area of the throat and no speed of the gas in it', () => {
    const problems: string[] = [];
    for (const [file, raw] of Object.entries(files)) {
      const text = raw.replace(/[  ]/g, ' ');
      if (/Nm³\/cm²/.test(text)) problems.push(`${file}: a hearth load in Nm³/cm²`);
      if (/hearth load[^.\n]{0,40}\b0[.,]\d{2,3}\b/i.test(text))
        problems.push(`${file}: a hearth load with its figures`);
      if (/throat[^.\n]{0,80}\d+ ?cm²|\d+ ?cm²[^.\n]{0,40}throat/i.test(text))
        problems.push(`${file}: the throat's area`);
      if (/at the throat[^.\n]{0,80}\d+(\.\d+)? m\/s/i.test(text))
        problems.push(`${file}: the gas's speed at the throat`);
    }
    expect(problems).toEqual([]);
  });
});

// ------------------------------------------------------------------------------------------------ the spoken guide
// What the voice says is what a visitor hears and reads as subtitles: « soixante-quinze millimètres » is « 75 mm » to this guard, in French and in English.

interface Script {
  lang: 'fr' | 'en';
  segments: { id: string; text: string }[];
}
const scripts = Object.entries(
  import.meta.glob('../../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
).map(([path, script]) => ({ path, script }));
const spoken = (text: string): string =>
  text
    .replace(/\[\[[^\]]*\]\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
/** A length, as a number with its short unit (what `spokenToDigits` writes), « m » not being the cubic metre. */
const A_LENGTH = /\d[\d.,]*\s?(mm|cm|m)(?![\p{L}])(?! cubes?)/u;

describe('the spoken guides print no size of the hot parts (R2)', () => {
  it('reads both scripts, with a hot part named in them', () => {
    expect(scripts.map(({ script }) => script.lang).sort()).toEqual(['en', 'fr']);
    for (const { script } of scripts) {
      expect(script.segments.length).toBeGreaterThan(60);
      expect(script.segments.filter((s) => HOT_WORD.test(spoken(s.text))).length).toBeGreaterThan(5);
    }
  });

  it('says no refused length, in digits or in words, beside the name of a hot part', () => {
    const problems: string[] = [];
    for (const { script } of scripts)
      for (const s of script.segments) {
        const text = spokenToDigits(spoken(s.text), script.lang).replace(/[  ]/g, ' ');
        for (const v of REFUSED)
          for (const f of printedForms(v)) {
            const re = new RegExp(
              `(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}²³\\d/]|\\s(?:par|a|an)\\s)`,
              'gu',
            );
            for (const m of text.matchAll(re)) {
              const near = text.slice(Math.max(0, m.index - 90), m.index + f.length + 90);
              if (HOT_WORD.test(near))
                problems.push(`${script.lang}/${s.id}: ${f} beside « ${near.trim().slice(0, 80)} »`);
            }
          }
      }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('says no length at all in a sentence that names a hot part: what it does, its life and its temperature, never a size', () => {
    const problems: string[] = [];
    for (const { script } of scripts)
      for (const s of script.segments)
        for (const sentence of spokenToDigits(spoken(s.text), script.lang).split(/(?<=[.!?…])\s+/))
          if (HOT_WORD.test(sentence) && A_LENGTH.test(sentence))
            problems.push(`${script.lang}/${s.id}: ${sentence.slice(0, 90)}`);
    expect(problems).toEqual([]);
  });

  it('says no hearth load, no area of the throat and no speed of the gas in it', () => {
    const problems: string[] = [];
    for (const { script } of scripts)
      for (const s of script.segments) {
        const text = spokenToDigits(spoken(s.text), script.lang);
        if (/hearth load|charge de foyer|charge de gazéification|centimètre carré|square centimetre/i.test(text))
          problems.push(`${script.lang}/${s.id}: a hearth load or a throat's area`);
        if (
          /(at the throat|dans la gorge|à la gorge)[^.!?]{0,80}\d+([.,]\d+)? (m\/s|mètres par seconde|metres per second)/i.test(
            text,
          )
        )
          problems.push(`${script.lang}/${s.id}: the gas's speed at the throat`);
      }
    expect(problems).toEqual([]);
  });

  it('is not blind: a refused length said in words is found, in either language', () => {
    // a refused length, whole centimetres, said the way the voice would say it
    const cm = REFUSED.map((v) => Math.round(v * 100)).find(
      (n, i) => n >= 10 && n <= 20 && Math.abs(REFUSED[i]! * 100 - n) < 1e-6,
    );
    expect(cm, 'a refused length in whole centimetres between 10 and 20').toBeDefined();
    const words: Record<string, { fr: string; en: string }> = {
      '12': { fr: 'douze', en: 'twelve' },
      '15': { fr: 'quinze', en: 'fifteen' },
      '10': { fr: 'dix', en: 'ten' },
    };
    const w = words[String(cm)]!;
    const frText = spokenToDigits(`un anneau de ${w.fr} centimètres`, 'fr');
    const enText = spokenToDigits(`a ring of ${w.en} centimetres`, 'en');
    for (const text of [frText, enText])
      expect(
        printedForms(cm! / 100).some((f) => text.includes(f)),
        text,
      ).toBe(true);
  });
});
