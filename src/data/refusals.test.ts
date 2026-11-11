import { describe, expect, it } from 'vitest';
import { HEARTH, HOT, UNIT, ZONES } from '../three/dims';
import { allTexts } from './all-texts';
import { printedForms } from './lint';
import { spokenToDigits } from './spoken';

// The sizes of the throat, the nozzles, the firebox and the heights of the zones are drawn to scale in the 3D and printed nowhere (research §A.2, R2; docs/physics.md §9; `GASIFIER_REFUSED` in src/three). The guard of src/three/dims.test.ts holds the 3D's own modules; this one
// holds everything that a visitor reads or draws from src/data, src/drawings and src/i18n: no size, no count, no ratio, no hearth load, in any printed form, in either language, and no module that reads the hot geometry. A text may say what a hot part DOES, its life, its temperature.

const flatten = (o: unknown): number[] =>
  typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flatten) : [];

/** Every length of the hot parts, in metres: `NOT_PRINTED`, the ring, the plenum, the hood, the grate's bars, the zones, the lower casing. */
const REFUSED = [
  ...new Set([...flatten(HOT), ...flatten(HEARTH), ...flatten(ZONES), UNIT.lowerR * 2, UNIT.lowerR, UNIT.lowerH]),
]
  .filter((v) => v > 0 && v < 2 && !Number.isInteger(v))
  .sort();

const sources = import.meta.glob(
  ['./**/*.ts', '../drawings/**/*.ts', '../i18n/*.ts', '../panels/*.ts', '../cues.ts', '../lab.ts', '../main.ts'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>;

describe('the sizes of the hot parts are printed nowhere (R2)', () => {
  it('knows what it guards: seven lengths of the hot parts and the zones, at least', () => {
    expect(REFUSED.length).toBeGreaterThan(8);
    expect(REFUSED).toContain(HOT.throatDiameter);
    expect(REFUSED).toContain(HOT.nozzleBore);
    expect(REFUSED).toContain(HOT.fireboxDiameter);
  });

  it('no text of src/data prints one, in millimetres, centimetres or metres, with a point or a comma', () => {
    const problems: string[] = [];
    for (const [where, t] of allTexts()) {
      for (const lang of ['fr', 'en'] as const) {
        const text = t[lang].replace(/[  ]/g, ' ');
        for (const v of REFUSED) {
          for (const f of printedForms(v)) {
            // a number, then its unit alone: « 10 cm » is not « 10 cm² » nor « 1,5 cm par minute »
            const re = new RegExp(
              `(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}²³\\d/]|\\s(?:par|a|an)\\s)`,
              'u',
            );
            if (re.test(text)) problems.push(`${where} [${lang}] prints ${f}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('no text speaks of a hearth load, a nozzle count, a throat ratio or a rule from an engine to a size', () => {
    const banned =
      /hearth load|charge de foyer|charge de gazéification|m³\/cm²|Nm³\/cm²|(seven|sept|7)\s+(air\s+)?(nozzles|tuyères)|throat[- ]to|rapport (de la )?gorge|throat (diameter|size)|diamètre de (la )?gorge|bore of the nozzle|diamètre des tuyères|per kilowatt of engine|par kilowatt de moteur/i;
    for (const [where, t] of allTexts())
      for (const lang of ['fr', 'en'] as const) expect(t[lang], `${where} [${lang}]`).not.toMatch(banned);
  });

  it('no module of src/data, src/drawings or src/i18n reads the hot geometry: no HOT, HEARTH, ZONES or NOT_PRINTED, no throat, nozzle or firebox size, no lower casing', () => {
    const names =
      /\b(HOT|HEARTH|ZONES|NOT_PRINTED|GASIFIER_REFUSED|lowerCasingHeight)\b|throatDiameter|nozzleBore|nozzleCount|fireboxDiameter|nozzlePlaneAboveThroat|grateBelowThroat|nozzleLength|UNIT\.(lowerH|lowerR|jointY|band|sleeve|gutter|rimTop|lid)\b/;
    let checked = 0;
    for (const [file, text] of Object.entries(sources)) {
      if (file.endsWith('.test.ts')) continue;
      checked++;
      // a comment may name what it refuses; the code may not read it
      const code = text
        .split('\n')
        .filter((line) => !/^\s*\/\//.test(line))
        .join('\n');
      expect(code, file).not.toMatch(names);
    }
    expect(checked).toBeGreaterThan(8);
  });

  it('the dimension rows of the sheets come from dims.ts and are none of the refused ones', () => {
    const dim = sources['./parts/dim-specs.ts'] ?? '';
    expect(dim).toMatch(/from '..\/..\/three\/dims'/);
    const code = dim
      .split('\n')
      .filter((line) => !/^\s*\/\//.test(line))
      .join('\n');
    expect(code).not.toMatch(/HEARTH|HOT\b|ZONES|UNIT\.(lower|joint)/);
  });
});

// ------------------------------------------------------------------------------------------------ the spoken guide
// The spoken guide (narration/<lang>.json) is a visitor's text too, heard and read as subtitles. Its numbers are in words: they are read back as digits (src/data/spoken.ts) and held to the same rules as every text above, anywhere in a segment, not only beside a hot part (docs-guard.test.ts adds the sentence rule).
interface Script {
  lang: 'fr' | 'en';
  segments: { id: string; text: string }[];
}
const scripts = Object.values(
  import.meta.glob('../../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
);

describe('the spoken guide says no size of the hot parts, in any printed form, anywhere in a segment (R2)', () => {
  const spokenDigits = (text: string, lang: 'fr' | 'en'): string =>
    spokenToDigits(
      text
        .replace(/\[\[[^\]]*\]\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      lang,
    ).replace(/[  ]/g, ' ');

  it('reads the French and the English scripts, 73 segments each', () => {
    expect(scripts.map((s) => s.lang).sort()).toEqual(['en', 'fr']);
    for (const s of scripts) expect(s.segments).toHaveLength(73);
  });

  it('says none of them, in millimetres, centimetres or metres, with a point or a comma, in digits or in words', () => {
    const problems: string[] = [];
    for (const script of scripts)
      for (const seg of script.segments) {
        const text = spokenDigits(seg.text, script.lang);
        for (const v of REFUSED) {
          for (const f of printedForms(v)) {
            const re = new RegExp(
              `(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}²³\\d/]|\\s(?:par|a|an)\\s)`,
              'u',
            );
            if (re.test(text)) problems.push(`${script.lang}/${seg.id} says ${f}`);
          }
        }
      }
    expect(problems).toEqual([]);
  });

  it('speaks of no hearth load, no nozzle count, no throat ratio and no rule from an engine to a size', () => {
    const banned =
      /hearth load|charge de foyer|charge de gazéification|mètre cube par centimètre carré|cubic metre per square centimetre|(seven|sept)\s+(air\s+)?(nozzles|tuyères)|throat[- ]to|rapport (de la )?gorge|throat (diameter|size)|diamètre de (la )?gorge|bore of the nozzle|diamètre des tuyères|per kilowatt of engine|par kilowatt de moteur/i;
    for (const script of scripts)
      for (const seg of script.segments)
        expect(spokenDigits(seg.text, script.lang), `${script.lang}/${seg.id}`).not.toMatch(banned);
  });
});
