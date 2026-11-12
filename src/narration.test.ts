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
/** Ceiling set by the owner for the spoken characters of one language, and what this guide holds itself to: the series aims for 17,000 to 24,000, and this lab's upper limit is 25,000 since the fifth pass (docs/narration-notes.md §1d: each part says in a few words which source it quotes, for a visitor who clicks « Écouter » on one part cold). */
const BUDGET = 30_000;
const AIM = [17_000, 25_000] as const;
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
    noEnd: [/ne dit quand une pièce ne garde plus de ce gaz/i, 'part-post-gas-plume'],
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
    noEnd: [/says when a room holds none of this gas/i, 'part-post-gas-plume'],
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
        ? /très insuffisant de [^.]*(ventilateur|l’un ou l’autre)[^.]*portes de garage ouvertes/
        : /far from satisfactory to [^.]*(fan|start)[^.]*garage doors open/;
    for (const s of script.segments) {
      const i = s.text.indexOf('[[lab:door:open]]');
      if (i < 0) continue;
      expect(s.text.slice(0, i), `${s.id}: the open door falls with no verdict before it`).toMatch(verdict);
    }
    // the door has three states and the voice gives three (the fifth pass, docs/fact-check.md F8): the ajar line comes before the verdict, as on the sheet
    const door = seg('part-garage-door').text;
    expect(door.indexOf('[[lab:door:ajar]]'), 'the ajar state is said, with its cue').toBeGreaterThan(0);
    expect(door.indexOf('[[lab:door:ajar]]'), 'the ajar state comes before the open one').toBeLessThan(
      door.indexOf('[[lab:door:open]]'),
    );
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
            [
              /c’est un choix, pas une mesure|phrase que ce lab ne peut pas|réponse honnête|tient dans cette phrase|voilà toute l’affaire|tour de magie|astuce de bon sens/i,
              'the owner’s own samples of slop (docs/narration-notes.md): a kicker, an announced honesty, a trick',
            ],
            [
              /aucune source (lue )?ne (dit|décrit|le dit)/i,
              'what the lab read, not every source: « rien de ce que nous avons lu » (« lue ne » is heard « lune »)',
            ],
            [/lit chaud/, 'in a garage with a bedroom a « lit » is first a bed: « le lit de charbon » (docs/qa.md S4)'],
            [
              /où qu’il aille|du té du|Sept leçons expliquent|Dix planches la dessinent/,
              'sounds a listener cannot parse: two recognisers wrote « au quilaï », « du thé », « cette leçon explique », « displanche » (S5, S6)',
            ],
            [/donne toujours cela/, 'a well-mixed box gives that by construction, not « always » (fact-check F7)'],
            [
              /mesure deux mètres vingt-deux de haut/,
              'the top stands 2.22 m above the ground; the unit’s own height is printed nowhere (F3)',
            ],
            [
              /Personne n’a mesuré l’air de la cabine/,
              'nothing we have read measures it, which is not « nobody » (C1)',
            ],
            [
              /la pièce la plus éprouvée|durée de vie de chaque pièce/,
              'the report gives the life of some critical parts (C3)',
            ],
            [/qu’après avoir vu quelque chose griller/, 'the sourced event is the seized pump (C4)'],
            [/allégées, car/, 'the weights explain « allégées », not the size of the wheels (F5)'],
            [
              /sans un mot|ne confirme cette lecture|sans texte à citer|Notre lecture : elle tient les plaquettes/,
              'the report explains the baffle in its text (FAO §3.1.2): what it says is said as its own (fact-check, fifth pass, B1)',
            ],
            [/sans dire pourquoi/, 'the report gives the headlights’ reason: the left one hidden by the gasifier (B2)'],
            [/se former dans le lit/, 'the report says the still hot, pyrolysing fuel, not the charcoal bed (M1)'],
            [
              /à la main selon le rapport/,
              'the manual control of the secondary air is the truck’s (FAO §3.2.3), not the tractor’s (M2)',
            ],
            [/garé brûle alors comme un poêle/, 'the Swedish book says it « may start burning like a stove » (m1)'],
            [/on le vidait toutes/, 'the two to three hours are several vehicles’, not this tractor’s (m2)'],
            [/fermes de l’institut/, 'nothing says the two large farms were the institute’s (m3)'],
            [
              /institut suédois s’arrêtait/,
              'thirty per cent is the limit the report gives, not where the tests stopped (m4)',
            ],
            [
              /tout près du gazogène, qui est chaud/,
              'the report attributes the pump’s seizure to cooling and lubrication, not to heat (m8)',
            ],
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
            [
              /a choice, not a measurement|sentence this lab cannot write|honest answer|fits in that sentence|whole business of the garage|conjuring trick|sound common sense/i,
              'the owner’s own samples of slop (docs/narration-notes.md): a kicker, an announced honesty, a trick',
            ],
            [/\bno source (says|describes)/i, 'what the lab read, not every source: « no source we read »'],
            [/hot bed/, 'in a garage with a bedroom a bed is first a bed: « the bed of charcoal » (docs/qa.md S4)'],
            [/always gives that/, 'a well-mixed box gives that by construction, not « always » (fact-check F7)'],
            [
              /stands two metres twenty-two tall/,
              'the top stands 2.22 m above the ground; the unit’s own height is printed nowhere (F3)',
            ],
            [/Nobody measured the air in the cab/, 'nothing we have read measures it, which is not « nobody » (C1)'],
            [/the most tested part|life of every part/, 'the report gives the life of some critical parts (C3)'],
            [/only added after something has been seen to fry/, 'the sourced event is the seized pump (C4)'],
            [/lightened, because/, 'the weights explain « lightened », not the size of the wheels (F5)'],
            [
              /without a word|confirms that reading|without any text to cite|Our reading: it keeps the chips/,
              'the report explains the baffle in its text (FAO §3.1.2): what it says is said as its own (fact-check, fifth pass, B1)',
            ],
            [/without saying why/, 'the report gives the headlights’ reason: the left one hidden by the gasifier (B2)'],
            [/forming in the bed/, 'the report says the still hot, pyrolysing fuel, not the charcoal bed (M1)'],
            [
              /by hand according to the report/,
              'the manual control of the secondary air is the truck’s (FAO §3.2.3), not the tractor’s (M2)',
            ],
            [/a parked one then burns/, 'the Swedish book says it « may start burning like a stove » (m1)'],
            [/it was emptied every/, 'the two to three hours are several vehicles’, not this tractor’s (m2)'],
            [/institute’s two farms/, 'nothing says the two large farms were the institute’s (m3)'],
            [
              /institute stopped at thirty/,
              'thirty per cent is the limit the report gives, not where the tests stopped (m4)',
            ],
            [
              /beside the gasifier, which is hot/,
              'the report attributes the pump’s seizure to cooling and lubrication, not to heat (m8)',
            ],
          ];
    for (const [re, why] of retired) expect(where(re), why).toEqual([]);

    // [segment, pattern that must be there]
    const corrected: [string, RegExp][] =
      lang === 'fr'
        ? [
            ['intro', /roule au bois, avec un filet de gazole/],
            ['intro', /par le calcul, environ deux cent vingt/],
            ['intro', /Un matin de juin imaginé/],
            ['intro', /Un institut suédois a essayé ce tracteur au banc, et un rapport en rend compte/],
            ['intro', /dix-huit pour cent de l’énergie qui entrait/],
            ['intro', /comment le système a pu s’assembler, d’après notre lecture/],
            ['intro', /de ce rapport, d’un livre suédois sur les gazogènes, et de manuels/],
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
            ['part-gas-cooler', /Selon le rapport sur l’institut, en général, dix pour cent de température en moins/],
            ['part-gas-cooler', /le modèle compte deux litres deux/],
            ['part-cooler-condensate-vessel', /panne grave de ce tracteur/],
            ['part-filter-bags', /Sur le camion du programme de l’institut/],
            ['part-post-gas-plume', /laisse le débit s’affaiblir sans jamais s’arrêter\. Ce choix est celui du modèle/],
            ['part-post-gas-plume', /sur cette machine/],
            ['part-post-gas-plume', /Rien de ce que nous avons lu ne dit quand une pièce/],
            ['part-farm-garage', /Souvent d’un défaut électrique, selon le livre suédois/],
            ['part-farmhouse', /Rien de ce que nous avons lu ne décrit la maison/],
            ['part-front-wheels', /Rien de ce que nous avons lu ne dit comment la direction/],
            ['part-old-rescue-set', /années quarante/],
            ['part-gasifier-unit', /sommet du gazogène est à deux mètres vingt-deux du sol/],
            ['part-fuel-baffle', /le combustible collait à la paroi, dans la zone de pyrolyse/],
            [
              'part-fuel-baffle',
              /un déflecteur qui supprime ce contact a ramené le problème à un niveau jugé acceptable/,
            ],
            ['part-roof-headlights', /le phare de gauche aurait été caché par le gazogène/],
            ['scene-garage', /dans le combustible encore chaud/],
            ['part-post-gas-plume', /dans le combustible encore chaud/],
            ['scene-garage', /Dans le modèle, porte ouverte/],
            ['part-garage-door', /Dans le modèle, six cent quatre-vingt-dix/],
            [
              'part-secondary-air-throttle',
              /Sur le camion du programme de l’institut, il se manœuvrait à la main, dit le rapport/,
            ],
            ['part-spring-lid', /peut alors se mettre à brûler comme un poêle/],
            ['part-cooler-condensate-vessel', /un bac de ce genre se vidait/],
            ['part-field-ditch', /deux grandes fermes où ce tracteur a travaillé/],
            ['part-chip-barn', /le rapport sur l’institut donne trente pour cent d’humidité comme limite/],
            ['part-injection-pump', /ensuite ajouté un écran de rayonnement, contre la chaleur du gazogène/],
            ['part-exhaust-plume', /cinq à huit pour cent de monoxyde à l’échappement/],
            ['part-injection-pump', /faute de refroidissement et de graissage, dit le rapport sur l’institut/],
            ['part-oxidation-zone', /quinze cents degrés, en général/],
            ['part-cylinder-cutaway', /En général, le rapport sur l’institut/],
            ['part-front-wheels', /plus petites que les roues arrière/],
            ['part-co-indicator', /un chiffre bas ne dit rien d’une vraie pièce/],
            ['part-diesel-engine', /moins d’énergie que celui de l’essence/],
            ['part-diesel-engine', /cinquante-cinq kilowatts, près des cinquante et un du banc/],
            ['scene-garage', /par construction/],
            ['part-garage-door', /Porte entrouverte, même demi-heure\. Le modèle compte environ deux mille cent/],
            ['part-roof-rack', /Le rapport sur l’institut ne dit pas si/],
            ['part-cab', /Rien de ce que nous avons lu ne mesure l’air de la cabine/],
            ['part-fire-box', /l’une des pièces qui s’usent le plus vite/],
            ['part-heat-shield', /après le grippage de la pompe/],
            ['scene-gas-train', /dans le modèle/],
            ['part-gas-throttle', /au banc, cinquante-cinq/],
            ['part-chip-column', /Par le calcul/],
          ]
        : [
            ['intro', /runs on wood, with a thread of diesel/],
            ['intro', /by our sum, about two hundred and twenty/],
            ['intro', /An imagined June morning/],
            ['intro', /A Swedish institute tested this tractor on a bench, and a report tells of it/],
            ['intro', /eighteen per cent of the energy that went in/],
            ['intro', /how the system may have gone together, in our reading/],
            ['intro', /that report, a Swedish book on gasifiers, and some handbooks/],
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
            ['part-gas-cooler', /By the report on the institute, in general, ten per cent less temperature/],
            ['part-gas-cooler', /the model counts two point two/],
            ['part-cooler-condensate-vessel', /This tractor’s one serious failure/],
            ['part-filter-bags', /On the truck of the institute’s programme/],
            ['part-post-gas-plume', /lets the push weaken without ever stopping\. That choice is the model’s/],
            ['part-post-gas-plume', /No source we read says when a room/],
            ['part-post-gas-plume', /on this machine/],
            ['part-farm-garage', /Often from an electrical fault, says the Swedish book/],
            ['part-farmhouse', /No source we read describes the farmhouse/],
            ['part-front-wheels', /no source we read says/],
            ['part-old-rescue-set', /nineteen forties/],
            ['part-gasifier-unit', /top of the gasifier is two metres twenty-two above the ground/],
            ['part-fuel-baffle', /the fuel stuck to the wall, in the pyrolysis zone/],
            [
              'part-fuel-baffle',
              /a baffle that removes this contact brought the problem down to what was judged acceptable/,
            ],
            ['part-roof-headlights', /the left one would have been hidden by the gasifier/],
            ['scene-garage', /in the fuel, still hot/],
            ['part-post-gas-plume', /in the fuel, still hot/],
            ['scene-garage', /In the model, with the door open/],
            ['scene-garage', /and stays lit/],
            ['part-garage-door', /In the model, six hundred and ninety/],
            [
              'part-secondary-air-throttle',
              /On the truck of the institute’s programme, it was worked by hand, says the report/,
            ],
            ['part-spring-lid', /may then start burning like a stove/],
            ['part-cooler-condensate-vessel', /a vessel of this kind was emptied/],
            ['part-field-ditch', /two large farms where this tractor worked/],
            ['part-chip-barn', /the report on the institute gives thirty per cent moisture as the limit/],
            ['part-injection-pump', /then added a radiation shield, against the gasifier’s heat/],
            ['part-roof-rack', /The report on the institute does not say whether/],
            ['part-injection-pump', /for want of cooling and lubrication, says the report on the institute/],
            ['part-oxidation-zone', /one thousand five hundred degrees, in general/],
            ['part-cylinder-cutaway', /In general, the report on the institute/],
            ['part-front-wheels', /smaller than the rear wheels/],
            ['part-co-indicator', /a low figure says nothing about a real room/],
            ['part-diesel-engine', /less energy than a petrol mixture/],
            ['part-diesel-engine', /fifty-five kilowatts, close to the bench’s fifty-one/],
            ['scene-garage', /by construction/],
            ['part-garage-door', /Door ajar, same half hour\. The model counts about two thousand one hundred/],
            ['part-cab', /Nothing we have read measures the air in the cab/],
            ['part-fire-box', /one of the parts that wear fastest/],
            ['part-heat-shield', /after the injection pump seized/],
            ['scene-gas-train', /in the model/],
            ['part-gas-throttle', /on the bench fifty-five/],
            ['part-chip-column', /By our sum/],
          ];
    for (const [id, re] of corrected) expect(spokenOf(seg(id)), `${id} lost a correction`).toMatch(re);
  });

  it('says in a few words which source it quotes, where a part first names the report, the institute, the Swedish book or the programme (a visitor may open one part cold)', () => {
    // [the bare word, the words that must stand with its first use (or before it): the report is the one on the institute, the book is the one on gasifiers…]
    const anchors: [RegExp, RegExp, number][] =
      lang === 'fr'
        ? [
            [/\brapport\b/, /institut/, 45],
            [/\binstitut\b/, /institut suédois|rapport sur l’institut|programme de l’institut/, 25],
            [/livre suédois/, /livre suédois sur les gazogènes/, 40],
            [/\bprogramme\b/, /institut/, 30],
          ]
        : [
            [/\breport\b/, /institute/, 30],
            [/\binstitute\b/, /Swedish institute|report on the institute|institute’s programme/, 25],
            [/Swedish book/, /Swedish book on gasifiers/, 30],
            [/\bprogramme\b/, /institute/, 20],
          ];
    for (const s of script.segments) {
      if (s.id === 'intro') continue; // the introduction is where they are introduced
      const text = spokenOf(s);
      for (const [word, anchor, after] of anchors) {
        const at = text.search(word);
        if (at >= 0) expect(text.slice(0, at + after), `${s.id}: ${word} with no word on which it is`).toMatch(anchor);
      }
    }
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

  it('keeps exclamations and questions rare: ceilings only, no floor (a floor is a rule to write them: docs/narration-notes.md, the slop pass)', () => {
    const total = spokenAll.length;
    const exclamations = (spokenAll.match(/!/g) ?? []).length;
    const questions = (spokenAll.match(/\?/g) ?? []).length;
    expect((exclamations * 1000) / total).toBeLessThanOrEqual(0.3);
    expect((questions * 1000) / total).toBeLessThanOrEqual(0.35);
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

  it.each([
    ['part-garage-door', 3],
    ['part-closed-garage', 1],
  ])(
    'shows the strip at thirty minutes when %s says its figures: each run is restarted at a speed that makes the gap between its speed cue and its pause cue thirty minutes of the model’s clock (docs/qa.md, fifth pass, D-N1)',
    (id, count) => {
      const cues = manifest!.segments.find((s) => s.id === id)!.cues as {
        t: number;
        do: Record<string, unknown>;
      }[];
      const labs = cues
        .filter((c) => c.do.lab)
        .map((c) => ({ t: c.t, name: String(c.do.lab), arg: String(c.do.arg ?? '') }));
      const runs: number[] = [];
      labs.forEach((c, i) => {
        if (c.name !== 'speed') return;
        const stop = labs.slice(i + 1).find((x) => x.name === 'pause');
        expect(stop, 'a speed cue with no pause cue after it').toBeDefined();
        runs.push((stop!.t - c.t) * Number(c.arg));
      });
      expect(runs, `${count} run(s)`).toHaveLength(count as number);
      // the strip is at 30 minutes (1,800 s) within 4 %: the model’s figures are those of the thirtieth minute (ajar falls 2.6 % a minute, open 6 %)
      for (const r of runs) {
        expect(r).toBeGreaterThan(1730);
        expect(r).toBeLessThan(1870);
      }
    },
  );
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
    // the speeds of the garage door and of the closed garage are the clip's own (each makes the gap between its cues thirty minutes of the clock, and the gaps differ between the two voices): their numbers are not compared
    const same = (id: string) => (w: string) =>
      ['part-garage-door', 'part-closed-garage'].includes(id)
        ? w.replace(/^\[\[lab:speed:\d+\]\]$/, '[[lab:speed:N]]')
        : w;
    for (const s of fr.segments)
      expect(
        cuesOf(en.segments.find((x) => x.id === s.id)!.text).map(([w]) => same(s.id)(w)),
        s.id,
      ).toEqual(cuesOf(s.text).map(([w]) => same(s.id)(w)));
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

describe('the slop check: the tics of docs/narration-notes.md stay under their ceilings', () => {
  // scripts/slop-check.mjs and scripts/slop-patterns.json are a copy of studio/narration-style (2026-11-11): the lab cannot import from the studio. The tic index counts the patterns of the owner's « less AI slop » pass (stock opener, signposts, rhetorical questions, « not X, it is Y », announced honesty, kickers, personification, exclamations, triplets, anaphora, wonder-words, ellipsis beats, « and yet », closing formulas, question-and-fragment pairs) per 1,000 characters.
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
  const load = (name: string): Promise<any> => import(/* @vite-ignore */ name);
  const run = async (lang: string) => {
    const [cp, url] = await Promise.all([load('node:child_process'), load('node:url')]);
    const script = url.fileURLToPath(new URL('../scripts/slop-check.mjs', import.meta.url));
    const file = url.fileURLToPath(new URL(`../narration/${lang}.json`, import.meta.url));
    const out = cp.spawnSync('node', [script, file, '--lang', lang, '--json'], { encoding: 'utf8' });
    return JSON.parse(out.stdout) as {
      chars: number;
      rows: { id: string; hits: number; allowed: number; over: boolean }[];
    };
  };

  it.each(['fr', 'en'])(
    '%s: no pattern over its ceiling, and a tic index of 0.8 per 1,000 characters or less',
    async (lang) => {
      const r = await run(lang);
      expect(
        r.rows.filter((x) => x.over).map((x) => `${x.id}: ${x.hits} hits, ${x.allowed} allowed`),
        `${lang}: patterns over their ceilings (node scripts/slop-check.mjs narration/${lang}.json --lang ${lang} --list)`,
      ).toEqual([]);
      const hits = r.rows.filter((x) => TIC.includes(x.id)).reduce((n, x) => n + x.hits, 0);
      expect((hits * 1000) / r.chars, `${lang}: ${hits} tics in ${r.chars} characters`).toBeLessThanOrEqual(0.8);
    },
  );
});
