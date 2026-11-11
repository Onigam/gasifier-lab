import { describe, expect, it } from 'vitest';
import { lab } from './lab';
import { PART_NAMES } from './three/part-ids';
import { OVERVIEWS } from './data/overviews';
import { SCENARIO_IDS } from './sim/presets';

// The lab as the kit receives it: the five worlds in order, every link between a part, a world, a guide, a lesson, a sheet and a shortcut leads somewhere that exists, and the template's leftovers are gone.

const audio = import.meta.glob('../public/audio/*/manifest.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const worlds = lab.scenes.map((s) => s.id);

describe('the lab definition', () => {
  it('has the five worlds, the farm first, each with an overview and shortcuts that lead to a world or a mode that exists', () => {
    expect(worlds).toEqual(['farm', 'tractor', 'gasifier', 'gas-train', 'garage']);
    expect(lab.defaultScene).toBe('farm');
    for (const s of lab.scenes) {
      expect(s.overview?.title.fr, s.id).toBe(OVERVIEWS[s.id as keyof typeof OVERVIEWS].title.fr);
      expect(s.overview?.text.en.length, s.id).toBeGreaterThan(200);
      expect(s.label.fr.length + s.label.en.length, s.id).toBeGreaterThan(8);
      const actions = s.overview?.actions ?? [];
      expect(actions.length, s.id).toBeGreaterThan(1);
      expect(
        actions.filter((a) => a.primary),
        s.id,
      ).toHaveLength(1);
      for (const a of actions) {
        if (a.scene) expect(worlds, `${s.id} → ${a.scene}`).toContain(a.scene);
        if (a.scene) expect(a.scene, `${s.id} points at itself`).not.toBe(s.id);
        if (a.mode) expect(['sim', 'plans', 'lessons', 'parts', 'about']).toContain(a.mode);
        expect(a.label.fr.trim().length + a.label.en.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('gives every world its tools as the 3D role set them, and no tool of another world', () => {
    const by = Object.fromEntries(lab.scenes.map((s) => [s.id, s]));
    expect(by.farm!.explode).toBe(false);
    expect(by.farm!.xrayNeedsSelection).toBe(true);
    for (const id of worlds) expect(by[id]!.cutaway, id).toBe(false);
    expect(by.gasifier!.xrayShell).toBeTypeOf('function');
    expect(by.tractor!.xrayShell!('cab')).toBe(true);
  });

  it('carries the 67 parts, each in a world of the lab, in the numbers the research gave: 10, 13, 20, 17, 7', () => {
    expect(lab.parts).toHaveLength(67);
    const count = (w: string) => lab.parts.filter((p) => p.scene === w).length;
    expect(worlds.map(count)).toEqual([10, 13, 20, 17, 7]);
    for (const p of lab.parts) expect(worlds, p.id).toContain(p.scene);
    expect(PART_NAMES).toHaveLength(67);
  });

  it('opens the four detailed worlds from the parts that stand for them, with a button in both languages', () => {
    const links = lab.partLinks ?? {};
    expect(Object.keys(links).sort()).toEqual(['farm-garage', 'gas-line-run', 'gasifier-unit', 'wood-gas-tractor']);
    for (const [part, link] of Object.entries(links)) {
      expect(
        lab.parts.some((p) => p.id === part),
        part,
      ).toBe(true);
      expect(worlds).toContain(link.scene);
      expect(link.label.fr.length).toBeGreaterThan(8);
      expect(link.label.en.length).toBeGreaterThan(8);
      expect(lab.parts.find((p) => p.id === part)!.scene, part).not.toBe(link.scene);
    }
  });

  it('plays the two guides in worlds that exist, with parts that are in the world of their step', () => {
    for (const [name, guide] of Object.entries(lab.guides ?? {})) {
      expect(worlds, name).toContain(guide!.scene);
      for (const step of guide!.steps) {
        const scene = step.scene ?? guide!.scene;
        expect(worlds, `${name} ${step.id}`).toContain(scene);
        for (const id of step.parts)
          expect(lab.parts.find((p) => p.id === id)?.scene, `${name} ${step.id} ${id}`).toBe(scene);
      }
    }
    expect([lab.guides!.assembly!.steps.length, lab.guides!.install!.steps.length]).toEqual([20, 10]);
  });

  it('opens each lesson on a world, a part of that world and a scenario of the simulation', () => {
    for (const les of lab.lessons!.items) {
      expect(worlds, les.id).toContain(les.focus.scene);
      if (les.focus.part) expect(lab.parts.find((p) => p.id === les.focus.part)?.scene, les.id).toBe(les.focus.scene);
      if (les.focus.scenario) expect(SCENARIO_IDS, les.id).toContain(les.focus.scenario);
    }
  });

  it('lists the ten sheets by group, every group used and every sheet in a group', () => {
    const groups = (lab.plans?.groups ?? []).map((g) => g.id);
    expect(lab.plans!.sheets).toHaveLength(10);
    for (const s of lab.plans!.sheets) expect(groups, s.id).toContain(s.group);
    for (const g of groups)
      expect(
        lab.plans!.sheets.some((s) => s.group === g),
        g,
      ).toBe(true);
  });

  it('has the right name, the Sources panel, a strip and a simulation panel, and none of the template’s', () => {
    expect(lab.id).toBe('gasifier-lab');
    expect(lab.brand.tagline.fr.length).toBeGreaterThan(20);
    expect(lab.simPanel).toBeTypeOf('function');
    expect(lab.about).toBeTypeOf('function');
    expect(lab.strip.speeds).toEqual([1, 10, 60, 600, 3600]);
    expect(worlds).not.toContain('device');
    expect(lab.envelopeMark).toBe('*');
  });

  it('asks the kit for a spoken guide only where there is one: no manifest, no 404 in the console', () => {
    const narration = lab.narration!;
    expect(typeof narration.manifest).toBe('function');
    if (typeof narration.manifest === 'function')
      for (const lang of ['fr', 'en'] as const)
        expect(narration.manifest(lang), lang).toBe(
          audio[`../public/audio/${lang}/manifest.json`] === undefined ? null : `audio/${lang}/manifest.json`,
        );
    expect(narration.onCue).toBeTypeOf('function');
  });
});
