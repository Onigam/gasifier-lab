import { beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { installFakeDom, type FakeElement } from '../drawings/test-dom';
import { LAB_STRINGS } from '../i18n/ui';
import { HEARTH, HOT, UNIT, ZONES } from '../three/dims';
import { allTexts } from './all-texts';
import { NOT_REPEATED, PROMISES, printedForms } from './lint';
import { MODEL_LIMITS, REFUSALS, SOURCE_GROUPS, sourcesPanel } from './sources';

// The Sources panel and the lab's own strings: the notices said once, every link over https and none to instructions for making one, how each source was read, what the lab refuses, what the model does not find, the one line of the law, and the title and tagline in both languages.

const LANGS = ['fr', 'en'] as const;
const flatten = (o: unknown): number[] =>
  typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(flatten) : [];
const REFUSED = [
  ...new Set([...flatten(HOT), ...flatten(HEARTH), ...flatten(ZONES), UNIT.lowerR * 2, UNIT.lowerH]),
].filter((v) => v > 0 && v < 2 && !Number.isInteger(v));

let panels: Record<'fr' | 'en', FakeElement[]>;
beforeAll(() => {
  installFakeDom();
  panels = { fr: [], en: [] };
  for (const lang of LANGS) {
    setLang(lang);
    panels[lang] = sourcesPanel() as unknown as FakeElement[];
  }
  setLang('fr');
});

// the kit’s typography sets fixed spaces before a colon and inside numbers: compare with plain ones
const plain = (s: string): string => s.replace(/[\u00a0\u202f]/g, ' ');
const textOf = (els: FakeElement[]): string => plain(els.map((e) => e.textContent).join('\n'));
const links = (els: FakeElement[]): string[] =>
  els
    .flatMap((e) => [e, ...e.all()])
    .filter((e) => e.tag === 'a')
    .map((e) => e.attrs.get('href') ?? '');

describe('the Sources panel', () => {
  it('builds in both languages, with the warning first and every notice', () => {
    for (const lang of LANGS) {
      const text = textOf(panels[lang]);
      expect(panels[lang].length, lang).toBeGreaterThan(14);
      expect(text, lang).toContain(LAB_STRINGS.warningFull[lang === 'fr' ? 0 : 1].slice(0, 60));
      expect(text, lang).toContain(LAB_STRINGS.legal[lang === 'fr' ? 0 : 1].slice(0, 60));
      expect(text, lang).toContain(LAB_STRINGS.noticeReading[lang === 'fr' ? 0 : 1].slice(0, 40));
      expect(text, lang).not.toMatch(/\*\*/);
    }
    expect(plain(panels.fr[0]!.textContent)).toBe(LAB_STRINGS.warningFull[0]);
  });

  it('links every source over https, each once, and links none that gives instructions for making one: the American report and the amateur’s episodes have no link', () => {
    const all = SOURCE_GROUPS.flatMap((g) => g.links);
    const hrefs = all.map((s) => s.href).filter((h): h is string => !!h);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const h of hrefs) expect(h, h).toMatch(/^https:\/\//);
    expect(links(panels.en)).toEqual(hrefs);
    const ornl = all.find((s) => /ORNL-6404/.test(s.label))!;
    const fox = all.find((s) => /FoxTizZo/.test(s.label))!;
    expect(ornl.href).toBeUndefined();
    expect(fox.href).toBeUndefined();
    expect(hrefs.join(' ')).not.toMatch(/osti\.gov|dtic\.|ornl\.gov|FoxTizZo|fIMEs5y4USU|UMGqLCHaRqs|HaNqyOCtBDo/i);
  });

  it('links the sources that explain: FAO, the Swedish book, the handbook, INRS, the guideline, the British alert, the tractor’s dimensions, the two licensed videos', () => {
    const hrefs = SOURCE_GROUPS.flatMap((g) => g.links.map((s) => s.href ?? '')).join(' ');
    for (const part of [
      'fao.org/4/T0512E',
      'docs.nlr.gov/docs/legosti/old/140.pdf',
      'digital.library.unt.edu/ark:/67531/metadc1061385',
      'inrs.fr/dam/ficheTox/FicheFicheTox/FICHETOX_47-1.pdf',
      'task33.ieabioenergy.com',
      'hse.gov.uk/safetybulletins/co-wood-pellets',
      'tractordata.com',
      'v8mM800DqXs',
      '3MbIt_HQ0-8',
    ])
      expect(hrefs, part).toContain(part);
  });

  it('says how each source was read, in both languages, and the FAO’s protected text is only mined for facts', () => {
    for (const g of SOURCE_GROUPS) {
      for (const s of g.links) {
        for (const lang of LANGS) expect(s.note[lang].length, s.label).toBeGreaterThan(70);
        expect(s.note.fr, s.label).toMatch(
          /\b(lu|lue|lus|lues|regard|cité|citée|présenté|présentée|non regardée|aucun)\b/i,
        );
      }
    }
    const fao = SOURCE_GROUPS[0]!.links[0]!;
    expect(fao.note.en).toMatch(/The text is protected: this lab takes facts from it/);
    expect(fao.note.en).toMatch(/Read as text, the tables and figures as images/);
  });

  it('names the carbon monoxide’s source in the panel: the Swedish book, and says it is the lab’s source for it', () => {
    const swedish = SOURCE_GROUPS[0]!.links[1]!;
    expect(swedish.note.en).toMatch(/It is this lab’s source for carbon monoxide/);
    expect(swedish.note.fr).toMatch(/C’est la source du monoxyde dans ce lab/);
  });

  it('credits every body and the two licensed videos with their licence, and says the lab watched neither', () => {
    const text = textOf(panels.en);
    for (const name of [
      'FAO',
      'Swedish Academy of Engineering Sciences',
      'Reed',
      'INRS',
      'Health and Safety Executive',
      'Task 33',
      'TractorData',
      'Cirad',
      'UVED',
      'FoxTizZo',
    ])
      expect(text, name).toContain(name);
    expect(text).toMatch(/CC BY 4\.0/);
    expect(text).toMatch(/have not watched it/);
    expect(text).toMatch(/Not watched by the authors/);
  });

  it('gives the refusals, ten of them, once, in plain words, in both languages', () => {
    expect(REFUSALS.length).toBe(10);
    for (const r of REFUSALS) for (const lang of LANGS) expect(r[lang].length).toBeGreaterThan(30);
    const text = textOf(panels.en);
    for (const r of REFUSALS) expect(text).toContain(r.en);
    expect(REFUSALS[1]!.en).toMatch(/the 3D section draws them to scale/);
    expect(REFUSALS[2]!.en).toMatch(/Only history, in the past tense, with durations/);
  });

  it('gives the law as one plain sentence, naming no status, and claiming nothing that a lawyer has not read', () => {
    const legal = LAB_STRINGS.legal;
    expect(legal[1]).toMatch(/are subject to the rules of your country: ask your authorities before anything else/);
    expect(legal[1]).toMatch(/no lawyer has checked this sentence/);
    expect(legal[0]).toMatch(/relèvent des règles de votre pays/);
    expect(legal[0] + legal[1]).not.toMatch(/ICPE|DREAL|permit|permis de|homologation|TÜV|licen[cs]e|autoris/i);
    // and the law is on no sheet, no guide, no lesson, no overview
    const elsewhere = allTexts().filter(([, t]) => /\b(law|loi|lawyer|juriste)\b/i.test(`${t.fr} ${t.en}`));
    expect(elsewhere.map(([w]) => w)).toEqual([]);
  });

  it('says the warning in full, once, and the reconstruction once: nowhere else on a sheet, a guide, a lesson or an overview', () => {
    const w = LAB_STRINGS.warningFull;
    expect(w[1]).toMatch(/It is not a plan, a procedure or advice/);
    expect(w[1]).toMatch(/get into the open air, do not go back in, call 112/);
    expect(w[0]).toMatch(/à l’air libre, on ne retourne pas à l’intérieur, on appelle le 112/);
    const d = LAB_STRINGS.disclaimer;
    expect(d[1]).toMatch(/independent educational reconstruction/);
    expect(d[0]).toMatch(/Reconstitution pédagogique indépendante/);
    for (const [where, t] of allTexts()) {
      expect(`${t.fr} ${t.en}`, where).not.toMatch(/educational reconstruction|reconstitution pédagogique/i);
    }
  });

  it('promises no safety (the guideline’s own title excepted) and repeats none of the sources’ reassurances', () => {
    const own = [
      ...Object.values(LAB_STRINGS).flat(),
      ...REFUSALS.flatMap((r) => [r.fr, r.en]),
      ...MODEL_LIMITS.flatMap((m) => [m.fr, m.en]),
      ...SOURCE_GROUPS.flatMap((g) => g.links.flatMap((s) => [s.note.fr, s.note.en])),
    ];
    for (const text of own) {
      expect(text, text.slice(0, 60)).not.toMatch(PROMISES);
      expect(text, text.slice(0, 60)).not.toMatch(NOT_REPEATED);
    }
    for (const s of SOURCE_GROUPS.flatMap((g) => g.links))
      expect(s.label.replace('Safe and Eco-friendly', ''), s.label).not.toMatch(PROMISES);
  });

  it('prints no size of the hot parts in the panel or the strings', () => {
    const own = [
      ...Object.values(LAB_STRINGS).flat(),
      ...REFUSALS.flatMap((r) => [r.fr, r.en]),
      ...MODEL_LIMITS.flatMap((m) => [m.fr, m.en]),
      ...SOURCE_GROUPS.flatMap((g) => g.links.flatMap((s) => [s.note.fr, s.note.en])),
    ];
    const problems: string[] = [];
    for (const text of own) {
      const t = text.replace(/[  ]/g, ' ');
      for (const v of REFUSED)
        for (const f of printedForms(v)) {
          const re = new RegExp(
            `(?<![\\d.,])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}²³\\d/]|\\s(?:par|a|an)\\s)`,
            'u',
          );
          if (re.test(t)) problems.push(`${text.slice(0, 40)}: ${f}`);
        }
    }
    expect(problems).toEqual([]);
  });

  it('lists what the model does not find, in one place: the wood first at 34 and 41, the gas, the flame, the tar, the engine, the idle, the service, the garage, the start, the line', () => {
    expect(MODEL_LIMITS.length).toBe(10);
    const en = MODEL_LIMITS.map((m) => m.en);
    expect(en[0]).toMatch(/^\*?\*?The wood\./);
    expect(en[0]!.search(/34/)).toBeGreaterThan(-1);
    expect(en[0]!.search(/\b41\b/)).toBeGreaterThan(en[0]!.search(/34/));
    for (const [i, key] of [
      'wood',
      'gas',
      'flame',
      'tar',
      'engine',
      'idle',
      'service',
      'garage',
      'start',
      'gas line',
    ].entries())
      expect(en[i]!.toLowerCase(), key).toContain(`the ${key}.`);
    expect(en[2]).toMatch(/never goes out/);
    expect(en[4]).toMatch(/is not a success/);
    expect(en[8]).toMatch(/There is none/);
  });
});

describe('the lab’s own strings', () => {
  it('give both languages for every key, with a real title and tagline in each, no leftover of the template', () => {
    for (const [k, v] of Object.entries(LAB_STRINGS)) {
      expect(v[0].trim().length, k).toBeGreaterThan(0);
      expect(v[1].trim().length, k).toBeGreaterThan(0);
      expect(v[0] + v[1], k).not.toMatch(/\{|\}|TODO|à remplacer|to replace|'/);
    }
    expect(LAB_STRINGS.labTitle[0]).not.toBe(LAB_STRINGS.labTitle[1]);
    expect(LAB_STRINGS.labTitle[0]).toMatch(/gazogène F-5/);
    expect(LAB_STRINGS.labTitle[1]).toMatch(/Wood Gasifier/);
    expect(LAB_STRINGS.tagline[0]).not.toMatch(/Explorer · Comprendre|Construire/);
    expect(LAB_STRINGS.tagline[1]).not.toMatch(/Explore · Understand|Build/);
    // the top bar cuts at about 60 capitals: the title must fit
    expect(LAB_STRINGS.labTitle[0].length).toBeLessThanOrEqual(60);
    expect(LAB_STRINGS.labTitle[1].length).toBeLessThanOrEqual(60);
  });

  it('name the five worlds and their shortcuts, as the 3D and the guides name them', () => {
    expect(LAB_STRINGS.sceneFarm[1]).toBe('The farm');
    expect(LAB_STRINGS.sceneGasTrain[1]).toBe('The gas line');
    for (const k of ['goFarm', 'goTractor', 'goGasifier', 'goGasTrain', 'goGarage'] as const) {
      expect(LAB_STRINGS[k][0].length, k).toBeGreaterThan(10);
      expect(LAB_STRINGS[k][1].length, k).toBeGreaterThan(10);
    }
  });

  it('tell the intros of the Drawings and Lessons modes: ten sheets, seven lessons, all twelve scenarios', () => {
    expect(LAB_STRINGS.plansIntro[1]).toMatch(/Ten A3 sheets/);
    expect(LAB_STRINGS.plansIntro[1]).toMatch(/none is a construction drawing/);
    expect(LAB_STRINGS.lessonsIntro[1]).toMatch(/Seven lessons/);
    expect(LAB_STRINGS.lessonsIntro[1]).toMatch(/all twelve/);
  });

  it('say « no alert » rather than « all good »: a model that raises no alert has said nothing of a room', () => {
    expect(LAB_STRINGS.allGood[1]).toBe('No alert');
    expect(LAB_STRINGS.allGood[0]).toBe('Aucune alerte');
  });
});
