#!/usr/bin/env node
// Counts the « AI slop » patterns of slop-patterns.json in a narration script, a film script, a Shorts word list or a publish.json.
//   node slop-check.mjs <file> [--lang fr|en] [--film] [--list] [--json]
// --film (or a path under onigam-video) applies the ceilings of a film script, a Short or a description (holdFilm).
// <file>: narration/<lang>.json or scripts/<lab>/doc-<lang>.json (segments[].text, lang from the file), films/<lab>/publish.json
//         (text.<lang>.title and description), a *.words.<lang>.txt (the Shorts' burnt words), or any .txt/.md (whole file).
// Exit code 1 when a pattern is over its ceiling (hits per 1,000 spoken characters, or per segment). Reads only; writes nothing.
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(join(HERE, 'slop-patterns.json'), 'utf8'));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('usage: node slop-check.mjs <file> [--lang fr|en] [--list] [--json]');
  process.exit(2);
}
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const CUE = /\[\[[^\]]*\]\]/g;
const spoken = (t) =>
  t
    .replace(CUE, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const raw = readFileSync(file, 'utf8');
const name = basename(file);
let lang = opt('lang');
/** @type {{id:string,text:string}[]} */
let segments = [];

if (name.endsWith('.json')) {
  const j = JSON.parse(raw);
  if (Array.isArray(j.segments)) {
    lang ??= j.lang ?? (/-en\.json$|\/en\.json$/.test(file) ? 'en' : 'fr');
    segments = j.segments.map((s) => ({ id: s.id, text: spoken(s.text) }));
  } else if (j.text) {
    // publish.json: every language is a pass of its own; the language is --lang (default en)
    lang ??= 'en';
    const t = j.text[lang];
    segments.push({ id: 'title', text: spoken(t.title) });
    (Array.isArray(t.description) ? t.description : [t.description]).forEach((d, i) =>
      segments.push({ id: `description-${i + 1}`, text: spoken(d) }),
    );
  } else if (j.shorts) {
    lang ??= 'en';
    for (const [k, s] of Object.entries(j.shorts)) {
      const t = s.text[lang];
      segments.push({ id: `${k}-title`, text: spoken(t.title) });
      (Array.isArray(t.description) ? t.description : [t.description])
        .slice(0, 1)
        .forEach((d) => segments.push({ id: `${k}-description-1`, text: spoken(d) }));
    }
  }
} else {
  lang ??= /\.(fr)\./.test(name) ? 'fr' : 'en';
  // the Shorts' burnt words: « a / b / c » with * and ^ marks and [x|y] alternatives
  const body = raw
    .split('\n')
    .filter((l) => !l.startsWith('#'))
    .map((l) =>
      l
        .replace(/\[([^\]|]*)\|[^\]]*\]/g, '$1')
        .replace(/[*^]/g, '')
        .replace(/\s*\/\s*/g, ' '),
    )
    .join(' ');
  segments.push({ id: name, text: body.replace(/\s+/g, ' ').trim() });
}

const total = segments.reduce((n, s) => n + s.text.length, 0);
const sentenceEnd = new RegExp(spec.sentenceEnd, 'u');
const sentences = segments.flatMap((s) => s.text.split(sentenceEnd));
const avg = sentences.reduce((n, s) => n + s.length, 0) / Math.max(1, sentences.length);
const long = sentences.filter((s) => s.length > spec.lengths.sentenceMax).length;

const film = flag('film') || /onigam-video/.test(file);
const rows = [];
let failed = false;
for (const p of spec.patterns) {
  const re = new RegExp(p[lang], 'giu');
  const perSeg = [];
  let hits = 0;
  for (const s of segments) {
    const m = [...s.text.matchAll(re)];
    if (m.length) perSeg.push({ id: s.id, n: m.length, samples: m.slice(0, 3).map((x) => x[0].trim().slice(0, 90)) });
    hits += m.length;
  }
  const per1000 = total ? (hits * 1000) / total : 0;
  const hold = film ? (p.holdFilm ?? p.hold) : p.hold;
  const allowed = hold === 0 ? 0 : Math.max(1, Math.round((hold * total) / 1000));
  const over = hits > allowed || perSeg.some((x) => x.n > p.perSegment);
  if (over) failed = true;
  rows.push({
    id: p.id,
    label: p.label,
    hits,
    allowed,
    per1000: Number(per1000.toFixed(2)),
    hold,
    over,
    segments: perSeg,
  });
}

if (flag('json')) {
  console.log(
    JSON.stringify(
      { file, lang, chars: total, segments: segments.length, avgSentence: Math.round(avg), over130: long, rows },
      null,
      1,
    ),
  );
} else {
  console.log(
    `${file} [${lang}] ${segments.length} segments, ${total} characters, average sentence ${Math.round(avg)}, ${long} over ${spec.lengths.sentenceMax}`,
  );
  for (const r of rows) {
    console.log(
      `${r.over ? 'OVER' : 'ok  '} ${r.id.padEnd(22)} ${String(r.hits).padStart(3)} hits  ${r.per1000.toFixed(2).padStart(5)} / 1000  (ceiling ${r.hold}, ${r.allowed} allowed)  ${r.label}`,
    );
    if (flag('list')) for (const s of r.segments) console.log(`       ${s.id}: ${s.n}  ${s.samples.join(' | ')}`);
  }
}
process.exit(failed ? 1 : 0);
