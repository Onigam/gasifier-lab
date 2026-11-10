// Every bilingual text a visitor reads from src/data, gathered with a label, for the tests of src/data and for the guard of refused sizes. Not part of the application.
import type { GuideStep, PartInfo } from '@onigam/lab-kit/content';
import type { L } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from './assembly';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { isL } from './lint';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';
import { DIM_SPECS } from './parts/dim-specs';

export function partTexts(p: PartInfo): [string, L][] {
  const out: [string, L][] = [
    ['name', p.name],
    ['short', p.short],
    ['description', p.description],
    ['material', p.material],
  ];
  if (p.maintenance) out.push(['maintenance', p.maintenance]);
  if (p.tip) out.push(['tip', p.tip]);
  if (p.design) out.push(['design', p.design]);
  p.specs.forEach((s, i) => {
    out.push([`specs[${i}].label`, s.label]);
    out.push([`specs[${i}].value`, isL(s.value) ? s.value : { fr: s.value, en: s.value }]);
  });
  return out;
}

/** The sheets' own texts, with no dimension row (they are read from dims.ts). */
export function ownPartTexts(p: PartInfo): [string, L][] {
  const generated = DIM_SPECS[p.id]?.length ?? 0;
  return partTexts(p).filter(([k]) => {
    const m = k.match(/^specs\[(\d+)\]/);
    return !m || Number(m[1]) < p.specs.length - generated;
  });
}

export function stepTexts(s: GuideStep): [string, L][] {
  const out: [string, L][] = [
    ['title', s.title],
    ['text', s.text],
  ];
  if (s.tip) out.push(['tip', s.tip]);
  if (s.warning) out.push(['warning', s.warning]);
  for (const [i, t] of (s.tools ?? []).entries()) out.push([`tools[${i}]`, t]);
  return out;
}

/** The sheets' texts, labelled. Guides, overviews, lessons and the Sources have their own files, added to the list below as they exist. */
export function allTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) for (const [k, v] of ownPartTexts(p)) out.push([`part ${p.id}.${k}`, v]);
  for (const [guide, steps] of [
    ['assembly', ASSEMBLY],
    ['install', INSTALL],
  ] as const)
    for (const s of steps) for (const [k, v] of stepTexts(s)) out.push([`${guide} ${s.id}.${k}`, v]);
  for (const [world, o] of Object.entries(OVERVIEWS)) {
    out.push([`overview ${world}.title`, o.title]);
    out.push([`overview ${world}.text`, o.text]);
  }
  for (const [where, v] of lessonTexts()) out.push([where, v]);
  return out;
}

/** The lessons' texts: title, summary, paragraphs, chips, questions, choices, explanations. */
export function lessonTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const les of LESSONS) {
    out.push([`lesson ${les.id}.title`, les.title], [`lesson ${les.id}.summary`, les.summary]);
    les.body.forEach((b, i) => out.push([`lesson ${les.id}.body[${i}]`, b]));
    for (const [i, f] of (les.figures ?? []).entries()) {
      out.push([`lesson ${les.id}.chip[${i}].label`, f.label]);
      out.push([`lesson ${les.id}.chip[${i}].value`, isL(f.value) ? f.value : { fr: f.value, en: f.value }]);
    }
    for (const [i, qu] of (les.quiz ?? []).entries()) {
      out.push([`lesson ${les.id}.q${i}`, qu.q], [`lesson ${les.id}.q${i}.explain`, qu.explain]);
      qu.choices.forEach((c, j) => out.push([`lesson ${les.id}.q${i}.choice${j}`, c]));
    }
  }
  return out;
}
