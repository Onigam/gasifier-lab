// Checks that every spoken segment of `public/audio/<lang>/manifest.json` has its audio file next to it and that the
// manifest matches the script it was generated from (`narration/<lang>.json`). Run by `npm run build`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const audio = join(root, 'public/audio');
const problems = [];

// no audio yet (the script alone is written): nothing to check
for (const lang of existsSync(audio) ? readdirSync(audio) : []) {
  const dir = join(audio, lang);
  if (!statSync(dir).isDirectory()) continue;
  // an empty folder is no audio yet either: the voice's run creates the folders before it writes anything
  if (!readdirSync(dir).some((name) => !name.startsWith('.'))) continue;
  const manifestPath = join(dir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    problems.push(`${lang}: files but no manifest.json`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const scriptPath = join(root, 'narration', `${lang}.json`);
  const script = existsSync(scriptPath) ? JSON.parse(readFileSync(scriptPath, 'utf8')) : null;
  const ids = new Set();
  for (const seg of manifest.segments) {
    if (ids.has(seg.id)) problems.push(`${lang}: duplicate segment ${seg.id}`);
    ids.add(seg.id);
    if (!existsSync(join(dir, seg.file))) problems.push(`${lang}: missing audio file ${seg.file}`);
  }
  if (!ids.has('intro')) problems.push(`${lang}: no intro segment`);
  if (script) {
    for (const seg of script.segments)
      if (!ids.has(seg.id)) problems.push(`${lang}: ${seg.id} is in the script, not in the manifest`);
    for (const id of ids)
      if (!script.segments.some((s) => s.id === id))
        problems.push(`${lang}: ${id} is in the manifest, not in the script`);
  }
}

// the tics of the owner's « less AI slop » pass (scripts/slop-check.mjs, patterns in scripts/slop-patterns.json): no pattern over its ceiling, and at most 0.8 tics per 1,000 characters
const TIC = [
  'P1-opener',
  'P2-signpost',
  'P3-short-question',
  'P4-not-x-but-y',
  'P5-honesty',
  'P6-kicker',
  'P7-personified',
  'P8-exclamation',
  'P10-triplet',
  'P11-anaphora',
  'P12-wonder-words',
  'P13-ellipsis-beat',
  'P14-and-yet',
  'P17-invitation-formula',
  'P19-qa-pair',
];
for (const lang of ['fr', 'en']) {
  const file = join(root, 'narration', `${lang}.json`);
  if (!existsSync(file)) continue;
  const out = spawnSync('node', [join(root, 'scripts/slop-check.mjs'), file, '--lang', lang, '--json'], {
    encoding: 'utf8',
  });
  let r;
  try {
    r = JSON.parse(out.stdout);
  } catch {
    problems.push(`${lang}: scripts/slop-check.mjs gave no result`);
    continue;
  }
  for (const x of r.rows.filter((x) => x.over))
    problems.push(
      `${lang}: ${x.id} is over its ceiling (${x.hits} hits, ${x.allowed} allowed): node scripts/slop-check.mjs narration/${lang}.json --lang ${lang} --list`,
    );
  const hits = r.rows.filter((x) => TIC.includes(x.id)).reduce((n, x) => n + x.hits, 0);
  const index = (hits * 1000) / r.chars;
  if (index > 0.8) problems.push(`${lang}: tic index ${index.toFixed(2)} per 1,000 characters, over 0.8`);
  console.log(
    `narration ${lang}: tic index ${index.toFixed(2)} per 1,000 characters (${hits} tics in ${r.chars} characters)`,
  );
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
