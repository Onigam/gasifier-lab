import { configureDrawings, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { generalArrangement } from './pl01-general';
import { gasPath } from './pl02-gas-path';
import { gasifierSection } from './pl03-gasifier-section';
import { workingDay } from './pl04-working-day';
import { reactionZones } from './pl05-reaction-zones';
import { energyBalance } from './pl06-energy-balance';
import { enginePower } from './pl07-engine-power';
import { coLadder } from './pl08-co-ladder';
import { theStop } from './pl09-the-stop';
import { warAndFires } from './pl10-war-and-fires';

// The title block of every sheet: « not for construction » is said here, once per sheet as any title block does, and nowhere else on the sheets. The reconstruction itself is said once, in the Sources panel. src/lab.ts must not set the project's name on top of this without keeping the disclaimer.
configureDrawings({
  project: { fr: 'LABO DU GAZOGÈNE F-5', en: 'F-5 WOOD GASIFIER LAB' },
  disclaimer: {
    fr: 'Schéma explicatif, PAS POUR LA CONSTRUCTION. Cotes d’ensemble seulement',
    en: 'Explanatory diagram, NOT FOR CONSTRUCTION. Overall sizes only',
  },
  date: '2026-11-11',
});

/** Every drawing of the "Plans" mode, in reading order (the numbers of the title blocks). */
export const SHEETS: DrawingSheet[] = [
  generalArrangement,
  gasPath,
  gasifierSection,
  workingDay,
  reactionZones,
  energyBalance,
  enginePower,
  coLadder,
  theStop,
  warAndFires,
];

/** The groups of the "Plans" mode, for `plans.groups` in src/lab.ts, in the order that keeps the numbers running: the kit lists the sheets group by group. */
export const PLAN_GROUPS: { id: string; label: L }[] = [
  { id: 'machine', label: l('La machine', 'The machine') },
  { id: 'model', label: l('Ce que trouve le modèle', 'What the model finds') },
  { id: 'danger', label: l('Le danger et l’histoire', 'The danger and the history') },
];
