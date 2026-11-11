import { describe, expect, it } from 'vitest';
import { HEARTH, HOT, UNIT, ZONES } from '../three/dims';
import { printedForms } from './lint';

// The sizes of the hot parts are printed nowhere (research §A.2, R2): not in a text, not on a sheet, and not in a document of the repository either, because the spoken guide and the film are written from the documents. This reads the notes, the README, `public/lab.json` and `index.html` for every printed form of every refused length when a hot part is named beside it, for a hearth load with its figures and for the throat's area. The values live in `src/sim/machine.ts` and `src/three/dims.ts`, in the code, as the owner accepted (research Q4).

const flatten = (o: unknown): number[] =>
  typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flatten) : [];

const REFUSED = [
  ...new Set([...flatten(HOT), ...flatten(HEARTH), ...flatten(ZONES), UNIT.lowerR * 2, UNIT.lowerR, UNIT.lowerH]),
]
  .filter((v) => v > 0 && v < 2 && !Number.isInteger(v))
  .sort();

const files = import.meta.glob(['../../docs/*.md', '../../README.md', '../../public/lab.json', '../../index.html'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

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
