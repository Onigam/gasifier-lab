// Every bilingual text a visitor reads from the panels and the frame's own words, gathered with a label, for the tests and for the guard of the refused sizes (src/data/refusals.test.ts, src/panels/guard.test.ts). Not part of the application.
import type { L } from '@onigam/lab-kit/i18n';
import { LAB_STRINGS } from '../i18n/ui';
import { CO_LADDER } from '../sim/ladder';
import { roomRows, workRows } from '../sim/strip';
import {
  ALARM_TEXTS,
  BELOW_LADDER,
  DOOR_TEXTS,
  GRADE_TEXTS,
  MODE_TEXTS,
  OUTLET_NOTE,
  PRESET_TEXTS,
  ROOM_NOTE,
  SCENARIO_TEXTS,
  TAG_NOTE,
  TRUCK_TEXTS,
  ZONE_TEXTS,
  type Pair,
} from '../sim/texts';
import { GasifierSim } from '../sim/engine';
import { analyserReadouts, moreReadouts } from './model';
import { PANEL } from './strings';

const l = (p: Pair): L => ({ fr: p[0], en: p[1] });

/** The words of the simulation panel and of the frame: the panel's strings, the simulation's own pairs, the strip's and the figures' labels, the notice on the way in and the shortcuts. */
export function panelTexts(): [string, L][] {
  const out: [string, L][] = [];
  const add = (where: string, p: Pair) => out.push([where, l(p)]);
  for (const [k, v] of Object.entries(PANEL)) add(`panel ${k}`, v);
  for (const k of [
    'labTitle',
    'tagline',
    'goSimulation',
    'entryEyebrow',
    'entryTitle',
    'entryGarage',
    'entryFire',
    'entryBurns',
    'entryEnter',
    'warning',
  ] as const)
    add(`ui ${k}`, LAB_STRINGS[k]);
  for (const [k, v] of Object.entries(PRESET_TEXTS)) add(`preset ${k}`, v);
  for (const [k, v] of Object.entries(MODE_TEXTS)) add(`mode ${k}`, v);
  for (const [k, v] of Object.entries(GRADE_TEXTS)) add(`grade ${k}`, v);
  for (const [k, v] of Object.entries(DOOR_TEXTS)) add(`door ${k}`, v);
  for (const [k, v] of Object.entries(TRUCK_TEXTS)) add(`truck ${k}`, v);
  for (const [k, v] of Object.entries(ZONE_TEXTS)) add(`zone ${k}`, v);
  for (const [k, v] of Object.entries(ALARM_TEXTS)) add(`alarm ${k}`, v.text);
  for (const [k, v] of Object.entries(SCENARIO_TEXTS)) {
    add(`scenario ${k}.name`, v.name);
    add(`scenario ${k}.lesson`, v.lesson);
  }
  add('note tags', TAG_NOTE);
  add('note room', ROOM_NOTE);
  add('note below ladder', BELOW_LADDER);
  add('note outlet', OUTLET_NOTE);
  CO_LADDER.forEach((r, i) => add(`ladder ${i}`, r.text));
  // the labels of the figures, read from a live state
  const s = new GasifierSim().state;
  for (const r of workRows(s)) add(`strip work ${r.key}`, r.label);
  for (const r of roomRows(s)) add(`strip room ${r.key}`, r.label);
  for (const r of moreReadouts(s)) add(`more ${r.key}`, r.label);
  for (const r of analyserReadouts(s)) add(`analyser ${r.key}`, r.label);
  return out;
}
