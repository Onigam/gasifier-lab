import '@onigam/lab-kit/styles.css';
import type { PartInfo } from '@onigam/lab-kit/content';
import { l, strL } from '@onigam/lab-kit/i18n';
import { mountLab, type LabDefinition, type SceneDef } from '@onigam/lab-kit/ui';
import { GasifierSim } from '../../sim/engine';
import { stripClock, stripValues } from '../../sim/strip';
import { PART_NAMES } from '../part-ids';
import { WORLDS } from './worlds';

// The modeler's review page: the kit's real frame around the real worlds, stub part sheets, no guides, no sheets. Served by the lab's own dev server at /src/three/review/review.html?world=<id>. The lead removes it when wiring `src/lab.ts`.

void strL;
const sim = new GasifierSim();
const want = new URLSearchParams(location.search).get('world');
const ids = Object.keys(WORLDS);
const order = want && ids.includes(want) ? [want, ...ids.filter((i) => i !== want)] : ids;

const scenes: SceneDef[] = order.map((id) => ({
  id,
  label: l(id, id),
  module: WORLDS[id]!.make(sim),
  ...WORLDS[id]!.def,
}));

const parts: PartInfo[] = PART_NAMES.filter((p) => ids.includes(p.world)).map((p) => ({
  id: p.id,
  scene: p.world,
  category: 'mechanical',
  name: l(p.fr, p.en),
  short: l('Pièce de la maquette', 'A part of the model'),
  description: l('Fiche provisoire de la page de revue.', 'Provisional sheet of the review page.'),
  material: l('—', '—'),
  specs: [],
}));

const def: LabDefinition<GasifierSim> = {
  id: 'gasifier-lab-review',
  brand: { title: 'GASIFIER LAB — review', tagline: l('Revue 3D', '3D review') },
  sim,
  defaultScene: order[0]!,
  parts,
  scenes,
  strip: {
    values: (s) => stripValues(s.state).map((r) => ({ label: r.label[1], value: r.value, unit: r.unit })),
    clock: (s) => ({ time: stripClock(s.state).time, sub: stripClock(s.state).sub[1] }),
    alarms: () => [],
  },
  about: () => [],
};

mountLab(def, { app: document.getElementById('app')!, viewport: document.getElementById('viewport')!, expose: true });
