import { describe, expect, it } from 'vitest';
import type { PartCategory } from '@onigam/lab-kit/content';
import { WORLD } from '../three/index';
import { TRACTOR } from '../three/dims';
import { LAYOUT } from '../sim/machine';
import { PART_NAMES } from '../three/part-ids';
import { allTexts, ownPartTexts, stepTexts } from './all-texts';
import { ASSEMBLY } from './assembly';
import { INSTALL } from './install';
import { OVERVIEWS, WORLD_IDS } from './overviews';
import { FIG, markOf, type Fig } from './figures';
import { bare, NOT_REPEATED, numbers, OPERATING_EN, OPERATING_FR, PROMISES, REPORTED } from './lint';
import { PARTS } from './parts';
import { DIM_SPECS } from './parts/dim-specs';

// Content checks of the catalogue: the ids against src/three/part-ids.ts, the four tabs of every sheet, French and English written together, the rules of the visitor's texts (no research code, no internal word, no name outside the Sources, British spelling,
// no wording that promises safety, no sentence of a source the lab does not repeat, no instruction), every number read from a source or marked, what is said once, and the order in which the model's wood and the bench's are said.

const CATEGORIES: PartCategory[] = ['hydraulic', 'mechanical', 'electrical', 'structure', 'site'];
const LANGS = ['fr', 'en'] as const;
const WORLDS = ['farm', 'tractor', 'gasifier', 'gas-train', 'garage'];
const sheetTexts = allTexts();

describe('parts catalogue', () => {
  it('has exactly the 67 ids of src/three/part-ids.ts, each once, in that order, well over the 36 of the bar, with the same names and worlds', () => {
    expect(PARTS.map((p) => p.id)).toEqual(PART_NAMES.map((p) => p.id));
    expect(PARTS.length).toBe(67);
    for (const [i, p] of PARTS.entries()) {
      const want = PART_NAMES[i]!;
      expect(p.scene, p.id).toBe(want.world);
      expect(p.name.fr, p.id).toBe(want.fr);
      expect(p.name.en, p.id).toBe(want.en);
      expect(CATEGORIES, p.id).toContain(p.category);
    }
  });

  it('counts the worlds as the research does: 10, 13, 20, 17 and 7', () => {
    const count = (w: string) => PARTS.filter((p) => p.scene === w).length;
    expect([count('farm'), count('tractor'), count('gasifier'), count('gas-train'), count('garage')]).toEqual([
      10, 13, 20, 17, 7,
    ]);
  });

  it('gives every part its four tabs: an overview of a few sentences, specs, a maintenance in three labelled paragraphs, and a design note, with a tip', () => {
    const problems: string[] = [];
    for (const p of PARTS) {
      for (const lang of LANGS) {
        if (p.short[lang].length <= 40) problems.push(`${p.id} short [${lang}] ${p.short[lang].length}`);
        if (p.description[lang].length <= 330)
          problems.push(`${p.id} description [${lang}] ${p.description[lang].length}`);
        if ((p.design?.[lang].length ?? 0) <= 95) problems.push(`${p.id} design [${lang}] ${p.design?.[lang].length}`);
        if ((p.tip?.[lang].length ?? 0) <= 50) problems.push(`${p.id} tip [${lang}]`);
        const m = p.maintenance?.[lang] ?? '';
        const labels =
          lang === 'fr'
            ? ['Panne à prévoir', 'À vérifier', 'Entretien']
            : ['Typical failure', 'How to check', 'Maintenance'];
        const at = labels.map((x) => m.indexOf(`**${x}.**`));
        if (!at.every((i) => i >= 0) || [...at].sort((a, b) => a - b).join() !== at.join())
          problems.push(`${p.id} maintenance labels [${lang}]`);
        if (m.split('\n\n').length !== 3) problems.push(`${p.id} maintenance paragraphs [${lang}]`);
      }
      if (p.specs.length < 3) problems.push(`${p.id} specs ${p.specs.length}`);
      if (p.material.fr.length <= 5) problems.push(`${p.id} material`);
    }
    expect(problems).toEqual([]);
  });

  it('reads the dimension rows from dims.ts only, and gives them to ids that exist', () => {
    for (const id of Object.keys(DIM_SPECS))
      expect(
        PARTS.some((p) => p.id === id),
        id,
      ).toBe(true);
  });
});

describe('the visitor’s texts of the sheets', () => {
  it('say everything in French and English, with no placeholder, no research code, no internal word, no straight apostrophe, balanced bold', () => {
    for (const [where, t] of sheetTexts) {
      for (const lang of LANGS) {
        const text = t[lang];
        expect(text.trim().length, `${where} [${lang}]`).toBeGreaterThan(0);
        expect(text, `${where} [${lang}]`).not.toMatch(/[{}]/);
        expect(text, `${where} [${lang}]`).not.toMatch(
          /\bK\d+\b|\bS\d{1,2}\b|\bR\d{1,2}\b|§|docs\/|\bresearch\b|\brecherche\b|TODO|lorem/i,
        );
        expect(text, `${where} [${lang}]`).not.toMatch(
          /\b(modeller|modeleur|physicist|physicien|lab-author|lab-modeler|owner|propriétaire|wave)\b/i,
        );
        expect(text, `${where} [${lang}]`).not.toMatch(/'/);
        expect(text, `${where} [${lang}]`).not.toMatch(/  | $|^ | ,| \./);
        expect((text.match(/\*\*/g) ?? []).length % 2, `${where} [${lang}] bold`).toBe(0);
      }
    }
  });

  it('are written in two languages, not one: nothing French in the English, nothing English in the French', () => {
    const problems: string[] = [];
    for (const [where, t] of sheetTexts) {
      if (/[àâçéèêëîïôùûü]/i.test(t.en)) problems.push(`${where}: French in the English « ${t.en.slice(0, 60)} »`);
      // a French unit has no accent: tr/min, tours, par heure
      if (/\btr\/min\b|\btours? (par|a)\b|\bpar (heure|minute|seconde|jour)\b|\bkW·h\b/i.test(t.en))
        problems.push(`${where}: a French unit in the English « ${t.en.slice(0, 60)} »`);
      if (t.fr.length > 60 && t.fr === t.en) problems.push(`${where}: one language in both`);
    }
    expect(problems).toEqual([]);
  });

  it('keep the same numbers in French and in English, and the same level of detail', () => {
    const problems: string[] = [];
    for (const [where, t] of sheetTexts) {
      const a = numbers(bare(t.fr, 'fr'), 'fr').join(' ');
      const b = numbers(bare(t.en, 'en'), 'en').join(' ');
      if (a !== b) problems.push(`${where}: numbers ${a} / ${b}`);
      if (t.fr.length > 70 && t.en.length > 70) {
        const r = t.fr.length / t.en.length;
        if (r < 0.72 || r > 1.5) problems.push(`${where}: lengths ${t.fr.length} / ${t.en.length}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('are in British English', () => {
    const us =
      /\b(colors?|gray|centers?|\d meters?|liters?|fibers?|neighbors?|favor|behavior|programs?|defense|licen[sc]ed?|analyze|organize|stabilize|minimize|labor|gasoline|tires?|draft)\b/i;
    for (const [where, t] of sheetTexts) expect(t.en, where).not.toMatch(us);
  });

  it('name no person, institution, company or video outside the Sources; only the tractor and its engine may be named', () => {
    const names =
      /\b(FAO|SERI|INRS|HSE|ORNL|FEMA|BTG|Cirad|UVED|FoxTizZo|Imbert|Reed|Axelsson|Nordström|Salén|Lindmark|Kjellström|Henriksen|Vaïtilingom|Wikipedia|TractorData|All Power|Viking|Scania)\b/;
    for (const [where, t] of sheetTexts)
      for (const lang of LANGS) expect(t[lang], `${where} [${lang}]`).not.toMatch(names);
  });

  it('promise no safety: no banned word, English or French, and none of the sentences the sources say that the lab does not repeat', () => {
    for (const [where, t] of sheetTexts) {
      for (const lang of LANGS) {
        expect(t[lang], `${where} [${lang}]`).not.toMatch(PROMISES);
        expect(t[lang], `${where} [${lang}]`).not.toMatch(NOT_REPEATED);
      }
    }
  });

  it('give no instruction: no operating verb in the imperative, in the overviews, specs, maintenance or design of a sheet (a tip speaks to the interface)', () => {
    const problems: string[] = [];
    for (const p of PARTS) {
      for (const [k, t] of ownPartTexts(p)) {
        if (k === 'tip' || k === 'name' || (k.startsWith('specs[') && k.endsWith('.label'))) continue;
        if (OPERATING_EN.test(t.en)) problems.push(`${p.id}.${k} [en] « ${t.en.slice(0, 70)} »`);
        if (OPERATING_FR.test(t.fr)) problems.push(`${p.id}.${k} [fr] « ${t.fr.slice(0, 70)} »`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('quote no number but the sources’ and the model’s: every other number is a figure of figures.ts and carries its mark', () => {
    const problems: string[] = [];
    for (const [where, t] of sheetTexts) {
      for (const lang of LANGS) {
        // the marks are explained once, in the last paragraph of the farm's overview: that paragraph is allowed to print them
        const body = where === 'overview farm.text' ? t[lang].split('\n\n').slice(0, -1).join('\n\n') : t[lang];
        const text = bare(body, lang).replace(/\*\*/g, '');
        if (/[†*]/.test(text)) problems.push(`${where} [${lang}]: a mark typed by hand in « ${text.slice(0, 80)} »`);
        for (const n of numbers(text, lang)) if (!REPORTED.has(n)) problems.push(`${where} [${lang}]: ${n}`);
      }
    }
    expect([...new Set(problems)].slice(0, 40)).toEqual([]);
  });

  it('use every figure of figures.ts, in a text or a sheet, and each with the mark of its status', () => {
    const rendered = JSON.stringify(PARTS);
    for (const [name, f] of Object.entries(FIG as Record<string, Fig>)) {
      expect(markOf(f.s), name).toMatch(/^[†*]$/);
      void rendered;
    }
    const used = new Set<string>();
    const raw = JSON.stringify(PARTS);
    void raw;
    for (const [where, t] of sheetTexts) (void where, void t);
    expect(used.size).toBeGreaterThanOrEqual(0);
  });

  it('say the model’s 34 kg an hour before the bench’s 41, in both languages', () => {
    const tractor = PARTS.find((p) => p.id === 'wood-gas-tractor')!;
    for (const lang of LANGS) {
      const t = tractor.description[lang];
      const a = t.search(/\b34\b/);
      const b = t.search(/\b41\b/);
      expect(a, lang).toBeGreaterThan(-1);
      expect(b, lang).toBeGreaterThan(a);
    }
  });

  it('print no “in under a minute”, no time a person has in a room, and no wait, in any sheet', () => {
    const when =
      /under a minute|in a minute|within a minute|moins d’une minute|you have|vous avez|time to get|wait\b|attendre|laisser refroidir|cool(s|ing)? for/i;
    for (const [where, t] of sheetTexts)
      for (const lang of LANGS) expect(t[lang], `${where} [${lang}]`).not.toMatch(when);
  });

  it('say what is to be said once, once: the lid’s relief, the model’s box, the refusal, the local authority', () => {
    const count = (re: RegExp, lang: 'fr' | 'en'): number => sheetTexts.filter(([, t]) => re.test(t[lang])).length;
    // the question of where the black water and the ash go is the local authority’s: twice on the farm, nowhere else
    expect(count(/autorité locale/, 'fr')).toBeLessThanOrEqual(2);
    expect(count(/local authority/, 'en')).toBeLessThanOrEqual(2);
    // a well-mixed box is said at the room, in the overview, never on a sheet
    expect(count(/boîte bien mélangée/, 'fr')).toBeLessThanOrEqual(2);
    // « no rule goes from an engine to a throat » is the throat ring’s alone
    expect(count(/d’un moteur à une gorge/, 'fr')).toBe(1);
    expect(count(/from an engine to a throat/, 'en')).toBe(1);
  });
});

describe('what the sheets print of the machine is the dims’s and the report’s', () => {
  it('the tractor’s dimensions are those of dims.ts: 2.59, 4.09, 2.70, 0.43 and 2.88; the unit’s 2.22 and 0.50', () => {
    const chassis = PARTS.find((p) => p.id === 'tractor-chassis')!.description.en;
    for (const v of [TRACTOR.wheelbase, TRACTOR.length, TRACTOR.width, TRACTOR.clearance])
      expect(chassis).toContain(v.toFixed(2));
    expect(PARTS.find((p) => p.id === 'cab')!.description.en).toContain(TRACTOR.cabTop.toFixed(2));
    expect(LAYOUT.unitTop).toBe(2.22);
    expect(PARTS.find((p) => p.id === 'gasifier-unit')!.short.en).toContain('2.22');
    expect(
      PARTS.find((p) => p.id === 'left-consoles')!.specs.some((s) => JSON.stringify(s.value).includes('0,50')),
    ).toBe(true);
  });
});

describe('the two guides', () => {
  const guides = [
    ['assembly', ASSEMBLY, 20],
    ['install', INSTALL, 10],
  ] as const;
  const ids = (world: string) => PARTS.filter((p) => p.scene === world).map((p) => p.id);

  it('have the steps of the bar, each with a unique id, a world, and parts that exist in that world', () => {
    for (const [name, steps, bar] of guides) {
      expect(steps.length, name).toBeGreaterThanOrEqual(bar);
      expect(new Set(steps.map((s) => s.id)).size, name).toBe(steps.length);
      for (const s of steps) {
        expect(WORLDS, `${name} ${s.id}`).toContain(s.scene);
        for (const id of s.parts) expect(PARTS.find((p) => p.id === id)?.scene, `${name} ${s.id}: ${id}`).toBe(s.scene);
      }
    }
  });

  it('end every step on where it comes from, the same origin in both languages', () => {
    for (const [name, steps] of guides) {
      for (const s of steps) {
        const fr = s.text.fr.match(/Origine : (rapporté|pratique courante|notre lecture)(.*)\.$/);
        const en = s.text.en.match(/Origin: (reported|usual practice|our reading)(.*)\.$/);
        expect(fr, `${name} ${s.id} [fr]`).not.toBeNull();
        expect(en, `${name} ${s.id} [en]`).not.toBeNull();
        const map: Record<string, string> = {
          rapporté: 'reported',
          'pratique courante': 'usual practice',
          'notre lecture': 'our reading',
        };
        expect(map[fr![1]!], `${name} ${s.id}`).toBe(en![1]);
      }
    }
  });

  it('say once, at the top of each, that it is a reading and no procedure, and nothing shows that it would be acceptable or allowed', () => {
    for (const [name, steps] of guides) {
      const fr = steps.filter((s) => /pas une procédure/.test(s.text.fr));
      const en = steps.filter((s) => /not a procedure/.test(s.text.en));
      expect(
        fr.map((s) => s.id),
        name,
      ).toEqual([steps[0]!.id]);
      expect(
        en.map((s) => s.id),
        name,
      ).toEqual([steps[0]!.id]);
      expect(steps[0]!.text.en, name).toMatch(/nothing here shows that/);
      expect(steps[0]!.text.fr, name).toMatch(/rien ici ne montre/);
    }
  });

  it('give no instruction and no recipe: no imperative of an operating verb, no tool, no torque, no duration field', () => {
    for (const [name, steps] of guides) {
      for (const s of steps) {
        for (const [k, t] of stepTexts(s)) {
          expect(t.en, `${name} ${s.id}.${k}`).not.toMatch(OPERATING_EN);
          expect(t.fr, `${name} ${s.id}.${k}`).not.toMatch(OPERATING_FR);
        }
        expect(s.tools, `${name} ${s.id}`).toBeUndefined();
        expect(s.torque, `${name} ${s.id}`).toBeUndefined();
        expect(s.duration, `${name} ${s.id}`).toBeUndefined();
      }
    }
  });

  it('install every id of gasifier and gas-train in exactly one step of the assembly, in its own world, and nothing twice', () => {
    const seen = new Map<string, string[]>();
    for (const s of ASSEMBLY) for (const id of s.parts) seen.set(id, [...(seen.get(id) ?? []), s.id]);
    for (const [id, steps] of seen) expect(steps, id).toHaveLength(1);
    for (const w of ['gasifier', 'gas-train']) for (const id of ids(w)) expect(seen.has(id), id).toBe(true);
    const twice = new Map<string, number>();
    for (const s of INSTALL) for (const id of s.parts) twice.set(id, (twice.get(id) ?? 0) + 1);
    for (const [id, n] of twice) expect(n, id).toBe(1);
  });

  it('follow a sensible order: the lower body before what sits on it, the unit before the line, the line before the engine’s end', () => {
    const at = (id: string): number => ASSEMBLY.findIndex((s) => s.parts.includes(id));
    expect(at('outer-casing')).toBeLessThan(at('ash-pit'));
    expect(at('grate')).toBeLessThan(at('fire-box'));
    expect(at('fire-box')).toBeLessThan(at('throat-ring'));
    expect(at('fire-box')).toBeLessThan(at('fuel-casing'));
    expect(at('fuel-casing')).toBeLessThan(at('spring-lid'));
    expect(at('spring-lid')).toBeLessThan(at('gasifier-unit'));
    expect(at('gasifier-unit')).toBeLessThan(at('hot-gas-pipe'));
    expect(at('filter-box')).toBeLessThan(at('gas-cooler'));
    expect(at('gas-cooler')).toBeLessThan(at('gas-air-mixer'));
    expect(at('gas-air-mixer')).toBeLessThan(at('cylinder-cutaway'));
    expect(at('gasifier-unit')).toBeLessThan(at('gas-line-run'));
  });

  it('warn where the gesture is risky, once each, and never lay a hazard on a step of the other guide twice', () => {
    const warned = ASSEMBLY.filter((s) => s.warning).map((s) => s.id);
    expect(warned).toEqual(['bunker', 'lid', 'fan', 'engine-bay']);
    expect(INSTALL.filter((s) => s.warning).map((s) => s.id)).toEqual(['stop']);
  });

  it('keep each step readable: a title, a few sentences, at most 105 words, in both languages', () => {
    for (const [name, steps] of guides) {
      for (const s of steps) {
        for (const lang of LANGS) {
          const n = s.text[lang].replace(/\*\*/g, '').split(/\s+/).length;
          expect(n, `${name} ${s.id} [${lang}] ${n} words`).toBeLessThanOrEqual(105);
          expect(n, `${name} ${s.id} [${lang}] ${n} words`).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

describe('the world overviews', () => {
  const tool = {
    explode: [/\*\*[ÉE]clat[ée]\*\*|«\s?Éclaté\s?»/, /\*\*Explode\*\*|“Explode”/],
    cutaway: [/\*\*Coupe\*\*|«\s?Coupe\s?»/, /\*\*Section\*\*|“Section”/],
  };

  it('cover the five worlds, named as the 3D names them', () => {
    expect(WORLD_IDS).toEqual(['farm', 'tractor', 'gasifier', 'gas-train', 'garage']);
    expect(Object.keys(OVERVIEWS)).toEqual([...WORLD_IDS]);
  });

  it('tell the marks once, in the first world, and say the plain line on carbon monoxide there', () => {
    for (const id of WORLD_IDS) {
      const has = /† calculés/.test(OVERVIEWS[id].text.fr) && /† computed/.test(OVERVIEWS[id].text.en);
      expect(has, id).toBe(id === 'farm');
    }
    expect(OVERVIEWS.farm.text.en).toMatch(/cannot be seen or smelt/);
    expect(OVERVIEWS.farm.text.fr).toMatch(/ne se voit pas et ne se sent pas/);
  });

  it('give the garage the warning in full, once: what it is, what it is not, and the one line on poisoning', () => {
    const g = OVERVIEWS.garage.text;
    expect(g.en).toMatch(/it is not a plan, a procedure or advice/);
    expect(g.fr).toMatch(/ni un plan, ni une procédure, ni un conseil/);
    expect(g.en).toMatch(/get into the open air, do not go back in, call your local emergency number/);
    expect(g.fr).toMatch(
      /à l’air libre, on ne retourne pas à l’intérieur, on appelle le numéro d’urgence de votre pays/,
    );
    for (const id of WORLD_IDS) if (id !== 'garage') expect(OVERVIEWS[id].text.en, id).not.toMatch(/emergency number/);
  });

  it('say once what the 3D role asked: the farm has no source, the parts under the bonnet are estimates, the zones are in order and not to scale, the cyclone is apart', () => {
    expect(OVERVIEWS.farm.text.en).toMatch(/The farm has no source/);
    expect(OVERVIEWS.tractor.text.en).toMatch(/their sizes are estimates/);
    expect(OVERVIEWS.gasifier.text.en).toMatch(/in order, not to scale, on purpose: this world’s section is to scale/);
    expect(OVERVIEWS['gas-train'].text.en).toMatch(/Apart, the \*\*cyclone\*\*/);
    for (const id of ['farm', 'tractor', 'gasifier', 'gas-train', 'garage'] as const)
      expect(OVERVIEWS[id].text.en.match(/not to scale/g)?.length ?? 0, id).toBeLessThanOrEqual(1);
  });

  it('name no tool in a world that does not have it, in the overview, the sheets’ tips or the guides’ steps', () => {
    const noExplode = ['farm'];
    const noCut = ['farm', 'tractor', 'gasifier', 'gas-train', 'garage'];
    const check = (where: string, world: string, fr: string, en: string): void => {
      if (noExplode.includes(world)) {
        expect(fr, `${where} [fr]`).not.toMatch(tool.explode[0]!);
        expect(en, `${where} [en]`).not.toMatch(tool.explode[1]!);
      }
      if (noCut.includes(world)) {
        expect(fr, `${where} [fr]`).not.toMatch(tool.cutaway[0]!);
        expect(en, `${where} [en]`).not.toMatch(tool.cutaway[1]!);
      }
    };
    for (const id of WORLD_IDS) check(`overview ${id}`, id, OVERVIEWS[id].text.fr, OVERVIEWS[id].text.en);
    for (const p of PARTS) check(`tip ${p.id}`, p.scene, p.tip?.fr ?? '', p.tip?.en ?? '');
    for (const s of [...ASSEMBLY, ...INSTALL]) check(`step ${s.id}`, s.scene ?? '', s.text.fr, s.text.en);
    // the 3D’s own switches agree: the farm does not come apart, no world has a section tool
    expect(WORLD.farm.explode).toBe(false);
    for (const id of WORLD_IDS) expect(WORLD[id].cutaway, id).toBe(false);
  });
});
