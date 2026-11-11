import { readManifest, validateManifest } from '@onigam/lab-kit/narration';
import { describe, expect, it } from 'vitest';
import { LAB_CUE_NAMES, planCue, runCue } from './cues';
import { NOT_REPEATED, OPERATING_EN, OPERATING_FR, PROMISES } from './data/lint';
import { spokenToDigits } from './data/spoken';
import { lab } from './lab';
import { GasifierSim } from './sim/engine';
import { PART_NAMES } from './three/part-ids';

// The spoken guide: the scripts (narration/<lang>.json) and, once generated, the manifests (public/audio/<lang>) must agree with the lab's worlds, parts, modes and simulation cues, say each of the lab's truths once, keep to the rules of docs/research.md §A (no size of the hot
// parts, no instruction, no promise, no warning to repeat, 34 kg an hour before 41) and stay in the budget. The audio files are only listed, never loaded. The sizes of the hot parts are held off the scripts by docs-guard.test.ts and refusals.test.ts, which read the spoken numbers back as digits.

const scenes = lab.scenes;
const sceneIds: string[] = scenes.map((s) => s.id);
const partIds: string[] = PART_NAMES.map((p) => p.id);
const worldOf = (partId: string): string | undefined => PART_NAMES.find((p) => p.id === partId)?.world;
const sceneDef = (id: string) => scenes.find((s) => s.id === id)!;

const CUE = /\[\[([a-z]+)(?::([^\]]*))?\]\]/g;
const BOOLEAN_CUES = ['xray', 'cutaway', 'flows', 'isolate'];
const MODES = ['explore', 'assembly', 'install', 'sim', 'plans', 'lessons'];
const CAMERA_CUES = ['home', 'scene', 'frame', 'select'];
/** Ceiling set by the owner for the spoken characters of one language, and what this guide aims for (the series' 17,000 to 24,000, with the French a little over: the fix pass of docs/fact-check.md put its hedges in). */
const BUDGET = 30_000;
const AIM = [17_000, 24_850] as const;
/** generate.mjs refuses a longer segment. */
const SEGMENT_CAP = 2_500;
/** This lab's guide is in the local voice (generate.mjs --engine voicebox): a change of voice must be a decision, not an accident. */
const LOCAL_VOICE = 'qwen3-tts-1.7B';

interface Segment {
  id: string;
  scope: string;
  title: string;
  scene: string;
  text: string;
}
interface Script {
  lang: string;
  segments: Segment[];
}

const langOf = (path: string, folder: RegExp): string => folder.exec(path)![1]!;
const scripts = Object.fromEntries(
  Object.entries(
    import.meta.glob('../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
  ).map(([path, script]) => [langOf(path, /\/(\w+)\.json$/), script]),
);
const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [langOf(path, /\/audio\/(\w+)\//), raw],
  ),
);
const audioFiles = Object.keys(import.meta.glob('../public/audio/*/*.mp3'));

const spokenOf = (s: Pick<Segment, 'text'>): string => s.text.replace(CUE, '').replace(/\s+/g, ' ').trim();
const cuesOf = (text: string): [string, string, string][] =>
  [...text.matchAll(CUE)].map((m) => [m[0], m[1] ?? '', m[2] ?? '']);

/** Each truth of the lab, said in one segment and no other. Regular expressions per language; `where` is the only segment allowed. */
const ONCE: Record<string, Record<string, [RegExp, string]>> = {
  fr: {
    reconstruction: [/reconstitution pédagogique/i, 'intro'],
    notOfficial: [/ni un plan officiel/i, 'intro'],
    noPlan: [/ne donne aucun plan/i, 'intro'],
    sources: [/panneau Sources/i, 'intro'],
    marks: [/une croix marque/i, 'intro'],
    bench: [/environ deux cent vingt kilowatts/i, 'intro'],
    layers: [/en couches/i, 'part-closed-garage'],
    thirtyFour: [/trente-quatre kilos/i, 'part-wood-gas-tractor'],
    neverGoesOut: [/ne s’éteint jamais/i, 'part-drying-zone'],
    oneCubicMetre: [/un mètre cube de gaz après l’arrêt/i, 'part-closed-garage'],
    noEnd: [/ne peut pas écrire/i, 'part-post-gas-plume'],
  },
  en: {
    reconstruction: [/educational reconstruction/i, 'intro'],
    notOfficial: [/neither an official design/i, 'intro'],
    noPlan: [/gives no plans/i, 'intro'],
    sources: [/Sources panel/i, 'intro'],
    marks: [/a cross marks/i, 'intro'],
    bench: [/about two hundred and twenty kilowatts/i, 'intro'],
    layers: [/in layers/i, 'part-closed-garage'],
    thirtyFour: [/thirty-four kilos/i, 'part-wood-gas-tractor'],
    neverGoesOut: [/flame never goes out/i, 'part-drying-zone'],
    oneCubicMetre: [/one cubic metre of gas in it after the stop/i, 'part-closed-garage'],
    noEnd: [/cannot write/i, 'part-post-gas-plume'],
  },
};

/** Names no text may carry: a person, a channel, a company, a brand, an institution, a place of a source, an existing series (the credits are in the Sources panel). */
const NAMES =
  /massey|ferguson|perkins|scania|\bford\b|\bfao\b|inrs|\breed\b|\bdas\b|axelsson|nordstr|salén|lindmark|lafontaine|zimmerman|imbert|karbogen|lobéline|lobeline|sabbatsberg|stockholm|oak ridge|midwest|cirad|uved|youtube|foxtizzo|wikipedia|tractordata|il était une fois|once upon a time|maestro|f-5/i;

/** The warning is not in the voice (research §A.4, Q5): it is the entry notice's, the Sources panel's and the garage overview's. Nor is any of its words about what to do. */
const WARNING: Record<string, RegExp> = {
  fr: /\b112\b|\b144\b|air libre|appelez|n’y retournez|ne retournez pas|intoxication|premiers secours/i,
  en: /\b112\b|\b144\b|open air|call (the )?(emergency|doctor|ambulance)|do not go back|poisoning|first aid/i,
};

describe('the contract', () => {
  it('has 5 worlds and 67 parts, so 73 segments per language, and nothing else', () => {
    expect(sceneIds).toEqual(['farm', 'tractor', 'gasifier', 'gas-train', 'garage']);
    expect(partIds).toHaveLength(67);
    expect(Object.keys(scripts).sort()).toEqual(['en', 'fr']);
    for (const lang of Object.keys(scripts)) expect(scripts[lang]!.segments, lang).toHaveLength(1 + 5 + 67);
  });
});

describe('the spoken numbers read back', () => {
  // the guards of the refused sizes read the scripts through this: it must turn words into the digits a printed form is made of
  it('turns French number words into digits, with their length unit', () => {
    expect(spokenToDigits('un anneau de soixante-quinze millimètres', 'fr')).toContain('75 mm');
    expect(spokenToDigits('sept virgule cinq centimètres', 'fr')).toContain('7,5 cm');
    expect(spokenToDigits('zéro virgule zéro sept mètre', 'fr')).toContain('0,07 m');
    expect(spokenToDigits('mille neuf cent soixante-dix', 'fr')).toBe('1970');
    expect(spokenToDigits('quatre-vingt-dix-neuf pour cent', 'fr')).toContain('99');
    expect(spokenToDigits('deux cent vingt et un kilowatts', 'fr')).toContain('221 kilowatts');
    expect(spokenToDigits('un virgule douze', 'fr')).toBe('1,12');
    expect(spokenToDigits('quinze à trente millimètres', 'fr')).toBe('15 à 30 mm');
    // « et » is part of a number only inside it: « vingt et un », not « six cents et mille heures »
    expect(spokenToDigits('quarante et un kilos', 'fr')).toBe('41 kilos');
    expect(spokenToDigits('entre six cents et mille heures', 'fr')).toBe('entre 600 et 1000 heures');
  });

  it('turns English number words into digits, with their length unit', () => {
    expect(spokenToDigits('a ring seventy-five millimetres wide', 'en')).toContain('75 mm');
    expect(spokenToDigits('seven point five centimetres', 'en')).toContain('7.5 cm');
    expect(spokenToDigits('one thousand five hundred degrees', 'en')).toContain('1500 degrees');
    expect(spokenToDigits('two hundred and sixteen millimetres of water', 'en')).toContain('216 mm');
    expect(spokenToDigits('ten per cent', 'en')).toBe('10 per cent');
    expect(spokenToDigits('between six hundred and one thousand hours', 'en')).toBe('between 600 and 1000 hours');
  });
});

describe.each(Object.keys(scripts))('narration script %s', (lang) => {
  const script = scripts[lang]!;
  const seg = (id: string): Segment => script.segments.find((s) => s.id === id)!;
  const where = (re: RegExp): string[] => script.segments.filter((s) => re.test(spokenOf(s))).map((s) => s.id);
  const spokenAll = script.segments.map(spokenOf).join(' ');

  it('has the lab language and a segment for the intro, every world and every part, once each', () => {
    expect(script.lang).toBe(lang);
    const scopes = script.segments.map((s) => s.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(new Set(script.segments.map((s) => s.id)).size).toBe(script.segments.length);
    expect([...scopes].sort()).toEqual(
      ['intro', ...sceneIds.map((id) => `scene:${id}`), ...partIds.map((id) => `part:${id}`)].sort(),
    );
  });

  it('names its segments intro, scene-<world> and part-<id>, with a title, a size generate.mjs accepts and the voice label', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      expect(s.id, s.scope).toBe(kind === 'intro' ? 'intro' : `${kind === 'part' ? 'part' : 'scene'}-${id}`);
      expect(s.title.trim().length, s.id).toBeGreaterThan(2);
      expect(spokenOf(s).length, s.id).toBeGreaterThan(190);
      expect(spokenOf(s).length, s.id).toBeLessThanOrEqual(SEGMENT_CAP);
    }
    expect(script).toHaveProperty('voiceLabel.fr', 'Voix de synthèse');
    expect(script).toHaveProperty('voiceLabel.en', 'Synthetic voice');
  });

  it('starts every segment in the right world: the introduction on the farm, a world in itself, a part in its own', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      const expected = kind === 'part' ? worldOf(id) : kind === 'scene' ? id : lab.defaultScene;
      expect(s.scene, s.id).toBe(expected);
    }
  });

  it('writes only cues the app knows, on worlds, parts, modes and simulation cues of the lab', () => {
    for (const s of script.segments) {
      for (const [whole, name, arg] of cuesOf(s.text)) {
        const at = `${s.id}: ${whole}`;
        if (name === 'home') expect(arg, at).toBe('');
        else if (name === 'scene') expect(sceneIds, at).toContain(arg);
        else if (name === 'frame') for (const id of arg.split(',')) expect(partIds, at).toContain(id);
        else if (name === 'select') expect([...partIds, 'none'], at).toContain(arg);
        else if (name === 'explode') {
          expect(Number(arg), at).toBeGreaterThanOrEqual(0);
          expect(Number(arg), at).toBeLessThanOrEqual(1);
        } else if (BOOLEAN_CUES.includes(name)) expect(['on', 'off'], at).toContain(arg);
        else if (name === 'mode') expect(MODES, at).toContain(arg);
        else if (name === 'lab') {
          // the lab's own cues: the name is listed in src/cues.ts and the argument is one `runCue` accepts
          const [lname = '', ...rest] = arg.split(':');
          expect(LAB_CUE_NAMES as readonly string[], at).toContain(lname);
          expect(planCue(lname, rest.length ? rest.join(':') : undefined), at).not.toBeNull();
        } else expect.fail(`${at}: unknown cue`);
      }
    }
  });

  it('frames only parts of the current world, and switches off what it switches on', () => {
    for (const s of script.segments) {
      let world = s.scene;
      const on = new Set<string>();
      for (const [, name, arg] of cuesOf(s.text)) {
        if (name === 'scene') world = arg;
        if (name === 'frame') for (const id of arg.split(',')) expect(worldOf(id), `${s.id}: frame ${id}`).toBe(world);
        if (name === 'select' && arg !== 'none') expect(worldOf(arg), `${s.id}: select ${arg}`).toBe(world);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
      }
      expect([...on], `${s.id} leaves cues on`).toEqual([]);
    }
  });

  it('asks for a tool only where the world has it: no section anywhere, no explode in the farm, X-ray on a part that opens', () => {
    for (const s of script.segments) {
      let world = s.scene;
      for (const [, name, arg] of cuesOf(s.text)) {
        if (name === 'scene') world = arg;
        const def = sceneDef(world);
        if (name === 'cutaway' && arg === 'on') expect(def.cutaway, `${s.id}: section in ${world}`).toBe(true);
        if (name === 'explode' && Number(arg) > 0) expect(def.explode, `${s.id}: explode in ${world}`).not.toBe(false);
        if (name === 'xray' && arg === 'on') {
          expect(def.xrayShell, `${s.id}: X-ray in ${world}, which has no shell to open`).toBeTypeOf('function');
          // a part's own X-ray opens the shell of its world: the part itself must be one of the parts that open
          if (s.scope.startsWith('part:'))
            expect(def.xrayShell!(s.scope.slice(5)), `${s.id}: X-ray on a part that does not open`).toBe(true);
          if (def.xrayNeedsSelection)
            expect(s.scope.startsWith('part:'), `${s.id}: X-ray in ${world} with nothing selected`).toBe(true);
        }
      }
    }
  });

  it('keeps a part segment framed by itself: no camera cue, no change of world or mode', () => {
    for (const s of script.segments.filter((x) => x.scope.startsWith('part:'))) {
      const camera = cuesOf(s.text).filter(([, name]) => CAMERA_CUES.includes(name) || name === 'mode');
      expect(
        camera.map(([w]) => w),
        s.id,
      ).toEqual([]);
    }
  });

  it('moves the camera at most once every 35 spoken characters', () => {
    for (const s of script.segments) {
      let last: { at: number; cue: string } | undefined;
      for (const m of s.text.matchAll(CUE)) {
        // the position in the spoken text, as the generator counts it: cues out, runs of spaces made one
        const at = s.text.slice(0, m.index).replace(CUE, '').replace(/\s+/g, ' ').trimStart().length;
        if (!CAMERA_CUES.includes(m[1] ?? '')) continue;
        if (last) expect(at - last.at, `${s.id}: ${last.cue} then ${m[0]}`).toBeGreaterThanOrEqual(35);
        last = { at, cue: m[0] };
      }
    }
  });

  it('hops through the worlds and the modes in the introduction, and ends on the farm, nothing selected', () => {
    const cues = cuesOf(seg('intro').text).map(([w]) => w);
    for (const w of ['tractor', 'gasifier', 'gas-train', 'garage', 'farm']) expect(cues, w).toContain(`[[scene:${w}]]`);
    const modes = cues.filter((c) => c.startsWith('[[mode:'));
    expect(modes).toEqual(['assembly', 'install', 'sim', 'lessons', 'plans', 'explore'].map((m) => `[[mode:${m}]]`));
    expect(cues.slice(-2)).toEqual(['[[mode:explore]]', '[[select:none]]']);
    expect(cues.lastIndexOf('[[scene:farm]]'), 'the last hop is to the farm, before the modes').toBeLessThan(
      cues.indexOf('[[mode:assembly]]'),
    );
  });

  it('gives each world a home view first and walks through its parts, four at least', () => {
    for (const w of sceneIds) {
      const text = seg(`scene-${w}`).text;
      expect(text.startsWith('[[home]]'), w).toBe(true);
      const framed = new Set([...text.matchAll(/\[\[frame:([^\]]*)\]\]/g)].flatMap((m) => m[1]!.split(',')));
      expect(framed.size, `${w} frames at least 4 parts`).toBeGreaterThanOrEqual(4);
    }
  });

  it('puts the simulation back where it found it: the drawn machine, the journey at its own default, whatever the segment did', () => {
    for (const s of script.segments) {
      const calls = [...s.text.matchAll(/\[\[lab:([a-z]+)(?::([^\]]*))?\]\]/g)];
      if (!calls.length) continue;
      const sim = new GasifierSim();
      for (const m of calls) expect(runCue(sim, m[1]!, m[2]), `${s.id}: ${m[0]}`).toBe(true);
      expect(sim.params, `${s.id} leaves the simulation changed`).toEqual(new GasifierSim().params);
    }
  });

  it('shows the journey only where its cursor is drawn: in the gasifier', () => {
    for (const s of script.segments)
      for (const m of s.text.matchAll(/\[\[lab:journey:[^\]]*\]\]/g)) {
        // the world in force at that cue
        let w = s.scene;
        for (const c of s.text.slice(0, m.index).matchAll(/\[\[scene:([^\]]*)\]\]/g)) w = c[1]!;
        expect(w, `${s.id}: ${m[0]}`).toBe('gasifier');
      }
  });

  it('says each truth of the lab once, in its place', () => {
    const set = ONCE[lang]!;
    for (const [truth, [re, id]] of Object.entries(set)) expect(where(re), truth).toEqual([id]);
  });

  it('says 34 kilos an hour before 41, and never that the model retrieves the machine', () => {
    const at =
      lang === 'fr'
        ? { thirtyFour: /trente-quatre/, fortyOne: /quarante et un/ }
        : { thirtyFour: /thirty-four/, fortyOne: /forty-one/ };
    expect(where(at.fortyOne).length, 'the bench’s 41 is said somewhere').toBeGreaterThan(0);
    for (const s of script.segments) {
      const t = spokenOf(s);
      const i41 = t.search(at.fortyOne);
      if (i41 < 0) continue;
      expect(t.search(at.thirtyFour), `${s.id}: 41 said with no 34 before it`).toBeGreaterThanOrEqual(0);
      expect(t.search(at.thirtyFour), `${s.id}: 41 said before 34`).toBeLessThan(i41);
    }
    const retrieves =
      lang === 'fr'
        ? /(retrouve|reproduit|rejoint|colle à)\s+(bien\s+)?(la machine|le banc|la mesure|les mesures)|accord parfait/i
        : /(retrieves|reproduces|matches|recovers)\s+(the\s+)?(machine|bench|measurement)|perfect agreement/i;
    expect(where(retrieves)).toEqual([]);
  });

  it('never says the model’s flame goes out', () => {
    const goesOut =
      lang === 'fr'
        ? /s’éteint(?! (jamais|plus))|s’éteindre|éteint le feu/gi
        : /\b(flame|fire)\b(?![^.!?]*never)[^.!?]{0,60}\b(goes out|go out|went out|is put out)/gi;
    expect(spokenAll.match(goesOut) ?? []).toEqual([]);
    // the only flame it speaks of is the model’s, and it says it stays
    expect(spokenAll).toMatch(lang === 'fr' ? /sa flamme ne s’éteint jamais/i : /its flame never goes out/i);
  });

  it('never says that a door, a window or the open air helps: a door is spoken of with the Swedes’ verdict before the figure falls', () => {
    const helps =
      lang === 'fr'
        ? /(porte|fenêtre)s?[^.!?]{0,30}\b(aide|aident|sauve|protège|suffit|suffisent|règle|réduit le danger)\b|ouvrez|aérez|aération|ventilez|ventilation/i
        : /(door|window)s?[^.!?]{0,30}\b(helps?|saves?|protects?|is enough|are enough|solves?)\b|open (a|the) (door|window)|ventilate|ventilation/i;
    expect(where(helps)).toEqual([]);
    // what the Swedes judged: fanning, starting and idling with the doors open, not the post-gassing of a parked car (docs/fact-check.md §2 item 6)
    const verdict =
      lang === 'fr'
        ? /très insuffisant de lancer le ventilateur ou le moteur portes de garage ouvertes/
        : /far from satisfactory to fan or start with the garage doors open/;
    for (const s of script.segments) {
      const i = s.text.indexOf('[[lab:door:open]]');
      if (i < 0) continue;
      expect(s.text.slice(0, i), `${s.id}: the open door falls with no verdict before it`).toMatch(verdict);
    }
  });

  it('keeps what docs/fact-check.md corrected: each sentence that went past its source stays out, and each correction stays in', () => {
    // [pattern that must be nowhere, why]
    const retired: [RegExp, string][] =
      lang === 'fr'
        ? [
            [
              /portes ouvertes très insuffisantes/,
              'the Swedes judged fanning and starting with the doors open, not a parked car',
            ],
            [/ne boit presque pas/, 'the hook overstated: a thread of diesel stays (QA D17)'],
            [
              /rien ne dit quand cela finit|aucune source ne dit que ce gaz s’en va|il n’y a pas de fin/i,
              'the sources give durations; « no end » is the model’s choice',
            ],
            [/gazole d’un diesel seul/, 'the pilot quantity is refused (R4, QA D2)'],
            [
              /un pour cent de puissance en plus pour trois degrés/,
              'the lab’s density-only figure, far from both sources',
            ],
            [/à quel point c’était courant/, 'nothing says that rescue sets hung in garages'],
            [/appareil de secours de mille neuf cent quarante/, 'the book dates no apparatus: « des années quarante »'],
            [
              /plus de quatre-vingt-dix-neuf pour cent des goudrons/,
              'the 99 per cent assumed what the pyrolysis releases',
            ],
            [/livre suédois (la range|range la cendre)/, 'hot ash among the fire risks is an American source’s'],
            [/institut suédois a compté/, '221 kilowatts is the lab’s sum, not the report’s'],
            [
              /bois stocké dégage|arrêt de moteur, sous une pièce/,
              'pellets in a closed store; a leaking lid under a living room',
            ],
            [/qui faisaient attention|gens attentifs/, 'the source says « careless »'],
            [
              /le plus souvent par un défaut électrique/,
              'the book’s « most » keeps its reserve out: « souvent, selon le livre »',
            ],
            [/aucune source ne (dit|décrit|le dit)/i, 'what the lab read, not every source: « aucune source lue »'],
          ]
        : [
            [
              /open doors very unsatisfactory/,
              'the Swedes judged fanning and starting with the doors open, not a parked car',
            ],
            [/hardly drinks any diesel/, 'the hook overstated: a thread of diesel stays (QA D17)'],
            [
              /nothing says when it ends|no source says that this gas goes away|there is no end/i,
              'the sources give durations; « no end » is the model’s choice',
            ],
            [/of a diesel’s fuel/, 'the pilot quantity is refused (R4, QA D2)'],
            [/one per cent more power for every three degrees/, 'the lab’s density-only figure, far from both sources'],
            [/how common it was/, 'nothing says that rescue sets hung in garages'],
            [/rescue set from nineteen forty\./, 'the book dates no apparatus: « the nineteen forties »'],
            [/more than ninety-nine per cent of the tars/, 'the 99 per cent assumed what the pyrolysis releases'],
            [/Swedish book lists hot ash/, 'hot ash among the fire risks is an American source’s'],
            [/Swedish institute counted/, '221 kilowatts is the lab’s sum, not the report’s'],
            [
              /stored wood gives off|counts a stopped engine/,
              'pellets in a closed store; a leaking lid under a living room',
            ],
            [/people who were being careful/, 'the source says « careless »'],
            [
              /most often from an electrical fault/,
              'the book’s « most » keeps its reserve out: « often, says the book »',
            ],
            [/\bno source (says|describes)/i, 'what the lab read, not every source: « no source we read »'],
          ];
    for (const [re, why] of retired) expect(where(re), why).toEqual([]);

    // [segment, pattern that must be there]
    const corrected: [string, RegExp][] =
      lang === 'fr'
        ? [
            ['intro', /roule au bois, avec un filet de gazole/],
            ['intro', /par le calcul, environ deux cent vingt/],
            ['intro', /d’un rapport sur cet institut, d’un livre suédois sur les gazogènes, et de manuels/],
            [
              'scene-gasifier',
              /planches du gazogène ne sont pas à l’échelle : exprès\. La coupe, elle, est à l’échelle/,
            ],
            ['part-wood-gas-tractor', /roule au bois, avec un filet de gazole/],
            ['part-wood-gas-tractor', /et son gazogène aussi/],
            ['part-chip-barn', /granulés stockés dans un local fermé/],
            ['part-farmhouse', /couvercle qui fuyait/],
            ['part-room-above', /couvercle qui fuyait/],
            ['part-ash-bin', /source américaine/],
            ['part-condensate-barrel', /Typiquement/],
            ['part-fuel-casing', /chercheurs sont morts du monoxyde de carbone, après être descendus/],
            ['part-exhaust-pipe', /moteurs de la guerre/],
            ['part-gas-cooler', /Selon le rapport, dix pour cent de température en moins/],
            ['part-cooler-condensate-vessel', /panne grave de ce tracteur/],
            ['part-filter-bags', /Sur le camion du programme/],
            [
              'part-post-gas-plume',
              /laisse la poussée s’affaiblir sans jamais s’arrêter : c’est un choix, pas une mesure/,
            ],
            ['part-post-gas-plume', /Aucune source lue ne dit quand une pièce/],
            ['part-farm-garage', /Souvent d’un défaut électrique, selon le livre suédois/],
            ['part-farmhouse', /Aucune source lue ne décrit la maison/],
            ['part-front-wheels', /aucune source lue ne le dit/],
            ['part-old-rescue-set', /années quarante/],
          ]
        : [
            ['intro', /runs on wood, with a thread of diesel/],
            ['intro', /by our sum, about two hundred and twenty/],
            ['intro', /a report on that institute, a Swedish book on gasifiers, and some handbooks/],
            ['scene-gasifier', /gasifier’s drawings are not to scale: on purpose\. The section is drawn to scale/],
            ['part-wood-gas-tractor', /runs on wood, with a thread of diesel/],
            ['part-wood-gas-tractor', /and so does its gasifier/],
            ['part-chip-barn', /wood pellets kept in a closed store/],
            ['part-farmhouse', /leaking lid/],
            ['part-room-above', /leaking lid/],
            ['part-ash-bin', /American source/],
            ['part-condensate-barrel', /Typically/],
            ['part-fuel-casing', /researchers died of carbon monoxide after climbing/],
            ['part-exhaust-pipe', /exhaust of wartime engines/],
            ['part-gas-cooler', /By the report, ten per cent less temperature/],
            ['part-cooler-condensate-vessel', /This tractor’s one serious failure/],
            ['part-filter-bags', /On the programme’s truck/],
            ['part-post-gas-plume', /lets the push weaken without ever stopping: a choice, not a measurement/],
            ['part-post-gas-plume', /No source we read says when a room/],
            ['part-farm-garage', /Often from an electrical fault, says the Swedish book/],
            ['part-farmhouse', /No source we read describes the farmhouse/],
            ['part-front-wheels', /no source we read says/],
            ['part-old-rescue-set', /nineteen forties/],
          ];
    for (const [id, re] of corrected) expect(spokenOf(seg(id)), `${id} lost a correction`).toMatch(re);
  });

  it('keeps the warning out of the voice: no emergency number, no first aid, no what-to-do', () => {
    expect(where(WARNING[lang]!)).toEqual([]);
  });

  it('gives no instruction to build, light, run or make safe a gasifier, and no promise of safety', () => {
    const operating = lang === 'fr' ? OPERATING_FR : OPERATING_EN;
    for (const s of script.segments) {
      const t = spokenOf(s);
      expect(t, `${s.id}: an operating verb at the start of a sentence`).not.toMatch(operating);
      expect(t, `${s.id}: a word that promises`).not.toMatch(PROMISES);
      expect(t, `${s.id}: a sentence of the sources the lab never repeats`).not.toMatch(NOT_REPEATED);
    }
  });

  it('keeps the hedges to where a figure stands against a source: « le modèle » in a minority of segments, and never on every figure', () => {
    const model =
      lang === 'fr'
        ? /\b(le|du|au|dans le|selon le|d’après le) modèle\b|\bmodèle\b/i
        : /\b(the|in the|by the|to the) model\b|\bmodel\b/i;
    const n = where(model).length;
    expect(n).toBeLessThanOrEqual(36);
    expect(n).toBeGreaterThanOrEqual(15);
  });

  it('is anonymous: no person, channel, company, brand, institution or existing series, in a text or a title', () => {
    for (const s of script.segments) expect(`${s.title} ${s.text}`, s.id).not.toMatch(NAMES);
  });

  it('is spoken text: no digit, symbol, abbreviation or straight quote, one space, no markdown', () => {
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      expect(spoken, s.id).not.toMatch(/[*≈×Ø″%°²³_#<>/\\|†]|\d/);
      expect(spoken, s.id).not.toMatch(/\b(kW|kJ|MJ|kg|mm|cm|km|m3|ppm|rpm|tr\/min|mbar|etc|CO|CO2|FAO|INRS|PL|vs)\b/);
      expect(spoken, s.id).not.toMatch(/['"]/);
      // a cue stands between two spaces (or at an edge), so that taking it out never glues two words together
      expect(s.text, s.id).not.toMatch(/ {2}|\n|^\s|\s$|\S\[\[|\]\]\S/);
      expect(spoken, s.id).not.toMatch(/\.\.(?!\.)|\.{3}/);
    }
  });

  it('keeps the sentences short enough for the subtitles', () => {
    let over120 = 0;
    for (const s of script.segments) {
      for (const sentence of spokenOf(s).split(/(?<=[.!?…])\s+/)) {
        expect(sentence.length, `${s.id}: ${sentence.slice(0, 60)}`).toBeLessThanOrEqual(130);
        if (sentence.length > 120) over120++;
      }
    }
    expect(over120).toBeLessThanOrEqual(4);
  });

  it('speaks to the listener the way the series does: "vous", "on", never "tu"', () => {
    if (lang !== 'fr') return;
    const tu = /(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(tu);
  });

  it('writes British English', () => {
    if (lang !== 'en') return;
    const american =
      /\b(meters?|liters?|tons?|aluminum|colors?|gray|program|center|fiber|gasoline|tires?|neighbors?|favor)\b/i;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(american);
  });

  it('asks questions and marvels a little, as the series does: about as many exclamations and questions as Pelton’s', () => {
    const total = spokenAll.length;
    const exclamations = (spokenAll.match(/!/g) ?? []).length;
    const questions = (spokenAll.match(/\?/g) ?? []).length;
    expect((exclamations * 1000) / total).toBeGreaterThanOrEqual(0.5);
    expect((exclamations * 1000) / total).toBeLessThanOrEqual(1.2);
    expect((questions * 1000) / total).toBeGreaterThanOrEqual(0.25);
    expect((questions * 1000) / total).toBeLessThanOrEqual(0.9);
  });

  it('stays within the budget, and near the aim', () => {
    const total = script.segments.reduce((n, s) => n + spokenOf(s).length, 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
    expect(total).toBeGreaterThanOrEqual(AIM[0]);
    expect(total).toBeLessThanOrEqual(AIM[1]);
  });
});

describe.each(Object.keys(manifests))('narration audio %s', (lang) => {
  const { manifest, problems } = readManifest(manifests[lang]);

  it('is a usable manifest that agrees with the lab, in the local voice', () => {
    expect(problems).toEqual([]);
    expect(manifest).not.toBeNull();
    expect(validateManifest(manifest!, { scenes: sceneIds, parts: partIds })).toEqual([]);
    expect((manifests[lang] as { model?: string }).model).toBe(LOCAL_VOICE);
  });

  it('has an audio file for every segment and none without a segment', () => {
    const files = audioFiles.filter((f) => f.includes(`/audio/${lang}/`)).map((f) => f.split('/').pop());
    expect(files.sort()).toEqual(manifest!.segments.map((s) => s.file).sort());
  });

  it('is the audio of the script of the same language', () => {
    const script = scripts[lang];
    if (!script) return;
    expect(manifest!.segments.map((s) => s.id).sort()).toEqual(script.segments.map((s) => s.id).sort());
    // the manifest's own count of the characters it was made from, which the kit's reader does not keep: read the file as it is
    const raw = (manifests[lang] as { segments: { id: string; chars: number }[] }).segments;
    for (const s of raw) expect(s.chars, s.id).toBe(spokenOf(script.segments.find((x) => x.id === s.id)!).length);
  });
});

describe('the private transcripts', () => {
  // Third-party transcripts stay outside any repository (docs/research.md): where they are present on this machine, no run of seven words of either script may be copied from them. Absent in CI: skipped. No node types in this lab: the modules are named at run time.
  const load = (name: string): Promise<any> => import(/* @vite-ignore */ name);
  const words = (t: string): string[] =>
    t
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-zàâäçéèêëîïôöùûüÿœ0-9' ]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const grams = (w: string[], n: number): string[] =>
    Array.from({ length: Math.max(0, w.length - n + 1) }, (_, i) => w.slice(i, i + n).join(' '));

  it('copies no seven-word run of the videos’ captions', async () => {
    const [fs, os, path] = await Promise.all([load('node:fs'), load('node:os'), load('node:path')]);
    const dirs: string[] = [
      path.join(os.homedir(), '.cache/lab-review/research/gasifier-lab'),
      path.join(os.homedir(), 'Dev/gasifier-lab/docs'),
    ];
    const files: string[] = dirs.flatMap((dir) =>
      fs.existsSync(dir)
        ? fs
            .readdirSync(dir)
            .filter((f: string) => /^transcript.*\.(txt|md)$/.test(f))
            .map((f: string) => path.join(dir, f))
        : [],
    );
    const source = new Set(
      files.flatMap((f) =>
        grams(words(String(fs.readFileSync(f, 'utf8')).replace(/\b\d{1,2}(:\d\d){1,2}\b/g, ' ')), 7),
      ),
    );
    const copied = Object.entries(scripts).flatMap(([lang, script]) =>
      script.segments.flatMap((s) =>
        grams(words(spokenOf(s)), 7)
          .filter((g) => source.has(g))
          .map((g) => `${lang}/${s.id}: "${g}"`),
      ),
    );
    expect(copied).toEqual([]);
  });
});

describe('narration scripts agree between languages', () => {
  it('have the same segments and the same cues in the same order', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    expect(en.segments.map((s) => [s.id, s.scope, s.scene])).toEqual(fr.segments.map((s) => [s.id, s.scope, s.scene]));
    for (const s of fr.segments)
      expect(
        cuesOf(en.segments.find((x) => x.id === s.id)!.text).map(([w]) => w),
        s.id,
      ).toEqual(cuesOf(s.text).map(([w]) => w));
  });

  it('put the cues at the same place in the sentence (within a quarter of the segment)', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    for (const s of fr.segments) {
      const t = en.segments.find((x) => x.id === s.id)!;
      const share = (text: string) => {
        let removed = 0;
        const total = spokenOf({ text }).length || 1;
        return [...text.matchAll(CUE)].map((m) => {
          const at = m.index - removed;
          removed += m[0].length;
          return at / total;
        });
      };
      const [a, b] = [share(s.text), share(t.text)];
      a.forEach((x, i) => expect(Math.abs(x - b[i]!), `${s.id}: cue ${i}`).toBeLessThanOrEqual(0.25));
    }
  });
});
