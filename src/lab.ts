import { strL } from '@onigam/lab-kit/i18n';
import type { AppContext, LabDefinition } from '@onigam/lab-kit/ui';
import { runCue } from './cues';
import { ASSEMBLY, INSTALL } from './data/guide';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { sourcesPanel } from './data/sources';
import { PLAN_GROUPS, SHEETS } from './drawings';
import './i18n/ui';
import { SimPanel } from './panels/sim';
import { setActiveScene, STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { GasifierSim } from './sim/engine';
import {
  createFarmScene,
  createGarageScene,
  createGasifierScene,
  createGasTrainScene,
  createTractorScene,
  PART_OPENS,
  WORLD,
} from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).
// `configureDrawings` is called by src/drawings/index.ts, which sets the title block with its « not for construction » line: this file does not set the project's name over it.

const sim = new GasifierSim();

/** The application's context, kept when the kit builds the simulation panel (at mount): the worlds read the selected part from it. */
let app: AppContext<GasifierSim> | null = null;
const selected = (): string | null => app?.ui.selected ?? null;
const params = () => sim.params;

/** What each part that opens a detailed world says on its button. */
const OPEN_LABEL = {
  tractor: strL('goTractor'),
  gasifier: strL('goGasifier'),
  'gas-train': strL('goGasTrain'),
  garage: strL('goGarage'),
} as const;

/** The spoken guide (narration/<lang>.json, audio in public/audio/<lang>/): the kit is asked for a manifest only where the file exists (a missing one would be a 404 in the console), and `src/lab.test.ts` ties each flag to its file. Both true since the audio was delivered (2026-11-11). */
const SPOKEN: Record<'fr' | 'en', boolean> = { fr: true, en: true };

export const lab: LabDefinition<GasifierSim> = {
  id: 'gasifier-lab',
  brand: { title: strL('labTitle'), tagline: strL('tagline') },
  // a part's envelope is measured on the 3D model, which is an estimate beside the tractor's reported dimensions: the notice on reading the figures says what the mark means
  envelopeMark: '*',
  sim,
  defaultScene: 'farm',
  parts: PARTS,
  scenes: [
    {
      id: 'farm',
      label: strL('sceneFarm'),
      module: createFarmScene({ params, selected }),
      ...WORLD.farm,
      overview: {
        ...OVERVIEWS.farm,
        actions: [
          { label: strL('goTractor'), scene: 'tractor', primary: true },
          { label: strL('goGarage'), scene: 'garage' },
        ],
      },
    },
    {
      id: 'tractor',
      label: strL('sceneTractor'),
      module: createTractorScene({ params, selected }),
      ...WORLD.tractor,
      overview: {
        ...OVERVIEWS.tractor,
        actions: [
          { label: strL('goGasifier'), scene: 'gasifier', primary: true },
          { label: strL('goGasTrain'), scene: 'gas-train' },
          { label: strL('goFarm'), scene: 'farm' },
        ],
      },
    },
    {
      id: 'gasifier',
      label: strL('sceneGasifier'),
      module: createGasifierScene({ params, selected }),
      ...WORLD.gasifier,
      overview: {
        ...OVERVIEWS.gasifier,
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goGasTrain'), scene: 'gas-train' },
          { label: strL('goTractor'), scene: 'tractor' },
        ],
      },
    },
    {
      id: 'gas-train',
      label: strL('sceneGasTrain'),
      module: createGasTrainScene({ params, selected }),
      ...WORLD['gas-train'],
      overview: {
        ...OVERVIEWS['gas-train'],
        actions: [
          { label: strL('goGarage'), scene: 'garage', primary: true },
          { label: strL('goGasifier'), scene: 'gasifier' },
          { label: strL('goTractor'), scene: 'tractor' },
        ],
      },
    },
    {
      id: 'garage',
      label: strL('sceneGarage'),
      module: createGarageScene({ params, selected }),
      ...WORLD.garage,
      overview: {
        ...OVERVIEWS.garage,
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goTractor'), scene: 'tractor' },
          { label: strL('goFarm'), scene: 'farm' },
        ],
      },
    },
  ],
  partLinks: Object.fromEntries(
    Object.entries(PART_OPENS).map(([part, scene]) => [part, { scene, label: OPEN_LABEL[scene] }]),
  ),
  guides: {
    // each step names its own world: the assembly plays mostly in the unit and the line, the installation from the farm to the garage
    assembly: { scene: 'gasifier', steps: ASSEMBLY },
    install: { scene: 'farm', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: { sheets: SHEETS, groups: PLAN_GROUPS, intro: strL('plansIntro') },
  // spoken guide: audio and subtitles generated from narration/<lang>.json. `[[lab:…]]` cues move the simulation: src/cues.ts lists them.
  narration: {
    manifest: (lang) => (SPOKEN[lang] ? `audio/${lang}/manifest.json` : null),
    onCue: (ctx: AppContext<GasifierSim>, name, arg) => {
      runCue(ctx.sim, name, arg);
    },
  },
  simPanel: (ctx: AppContext<GasifierSim>) => {
    app = ctx;
    return new SimPanel(ctx);
  },
  // the strip shows the room's figures in the garage's world (the kit does not hand `values` the world: docs/kit-requests.md, 5); a landscape keeps its camera above the land (the kit does it for a world called `site`)
  onFrame: ({ activeScene }) => {
    setActiveScene(activeScene);
    if (activeScene === 'farm' && app) app.stage.controls.maxPolarAngle = Math.PI * 0.48;
  },
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: sourcesPanel,
};
