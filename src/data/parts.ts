import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';

// The parts catalogue: one entry per selectable 3D part (ids match src/three/part-ids.ts). While the 67 sheets of docs/research.md §4 are being written, this list holds the template's three placeholders with no dimension in them: nothing here imports the template's device any more.
// Every text is bilingual `l(fr, en)`; both languages are written together.

export const PARTS: PartInfo[] = [
  {
    id: 'base',
    scene: 'device',
    category: 'structure',
    name: l('Socle', 'Base'),
    short: l('Plaque et montants qui portent l’axe.', 'Plate and posts that carry the axle.'),
    description: l('Le socle est la référence de tout l’assemblage.', 'The base is the datum of the whole assembly.'),
    material: l('Acier peint', 'Painted steel'),
    specs: [],
  },
];
