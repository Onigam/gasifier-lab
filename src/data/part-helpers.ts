// Helpers shared by the part catalogues (src/data/parts/*.ts), the guides, the overviews, the lessons and the sheets. Adapted from the biodigester lab's.
//
// A figure with no mark is REPORTED by a source of docs/research.md, typed in the text in both spellings and checked against the list of data.test.ts. Any other figure is written by {placeholder}: `lf` fills in the number, its unit and its mark
// (see figures.ts), so that a computed or estimated number cannot lose its mark. Research codes never reach the visitor.
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { FIG, markOf, type Fig, type FigName } from './figures';
import { nEn, nFr } from './units';

/** A figure as it reads: number (a true minus sign), unit and mark, in one language. */
export function figText(fig: Fig, lang: 'fr' | 'en'): string {
  const i = lang === 'fr' ? 0 : 1;
  const n = fig.t ? fig.t[i] : (lang === 'fr' ? nFr(fig.v, fig.d) : nEn(fig.v, fig.d)).replace('-', '−');
  const u = typeof fig.u === 'string' ? fig.u : fig.u ? fig.u[i] : '';
  return `${n}${u}${markOf(fig.s)}`;
}

function fill(text: string, lang: 'fr' | 'en'): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const fig = FIG[key as FigName] as Fig | undefined;
    if (!fig) throw new Error(`unknown figure {${key}} in "${text}"`);
    return figText(fig, lang);
  });
}

/** Bilingual text whose {placeholders} are figures of FIG: number, unit and mark, the right way in each language. */
export function lf(fr: string, en: string): L {
  return l(fill(fr, 'fr'), fill(en, 'en'));
}

/** The same text in both languages, for a value made only of figures: `v('{kwIn}')`. */
export const v = (text: string): L => lf(text, text);

/** English form of a number written the French way (7,5 -> 7.5 ; 5 090 -> 5,090 ; 40 % -> 40%). */
export function enNum(fr: string): string {
  return fr
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d) (\d{3})(?!\d)/g, '$1,$2')
    .replace(/(\d) %/g, '$1%');
}

/** Spec row: a bilingual label and a value (`lf`, `l`, or a plain value written the French way: its English form is derived, for numbers and units only). */
export function sp(fr: string, en: string, value: L | string): Spec {
  if (typeof value !== 'string') return { label: l(fr, en), value };
  const e = enNum(value);
  return { label: l(fr, en), value: e === value ? value : l(value, e) };
}

/**
 * The three paragraphs of a `maintenance` text (the kit renders a blank line as a paragraph break), each opened by a bold label, in this order: the typical failure, how it is looked for, the routine care. History in the past tense, durations
 * only: no gesture is described (research §A.2, R3).
 */
export function maint(
  fr: { failure: string; check: string; care: string },
  en: { failure: string; check: string; care: string },
): L {
  return lf(
    `**Panne à prévoir.** ${fr.failure}\n\n**À vérifier.** ${fr.check}\n\n**Entretien.** ${fr.care}`,
    `**Typical failure.** ${en.failure}\n\n**How to check.** ${en.check}\n\n**Maintenance.** ${en.care}`,
  );
}

/** Where a guide step comes from, the last sentence of its text, in both languages (docs/research.md §0.5). */
export type Origin = 'reported' | 'practice' | 'reading';
const ORIGIN: Record<Origin, readonly [string, string]> = {
  reported: ['rapporté', 'reported'],
  practice: ['pratique courante', 'usual practice'],
  reading: ['notre lecture', 'our reading'],
};

/** A guide step's text with its origin as its last words: `Origine : notre lecture.` An optional precision goes after the word. */
export function step(origin: Origin, fr: string, en: string, more?: readonly [string, string]): L {
  const [of, oe] = ORIGIN[origin];
  return lf(`${fr} Origine : ${of}${more ? ` ${more[0]}` : ''}.`, `${en} Origin: ${oe}${more ? ` ${more[1]}` : ''}.`);
}
