// The rules of the visitor's texts, shared by the tests of src/data and src/drawings (they are not part of the application). One place for: the numbers a text may print with no mark (REPORTED), the words no text may use, the imperatives no guide or sheet may carry, and the
// printed forms of the sizes the lab refuses to print (research §A.2, R2). Nothing here is read by the app.
import type { L } from '@onigam/lab-kit/i18n';
import { FIG, type Fig } from './figures';
import { figText } from './part-helpers';
import { nEn, nFr } from './units';

export const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && 'fr' in v && 'en' in v;

// ------------------------------------------------------------------------------------------------ numbers

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
export function numbers(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(?<=\d)[  ](?=\d{3}(?!\d))/g, '').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(?<=\d),(?=\d{3}(?!\d))/g, '');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n))).sort();
}

const FIGS = Object.values(FIG as Record<string, Fig>);

/** A text with every figure of figures.ts taken out (they carry their own mark), and the names that hold a digit and are no figures. */
export function bare(text: string, lang: 'fr' | 'en'): string {
  let out = text;
  const rendered = FIGS.map((f) => figText(f, lang)).sort((a, b) => b.length - a.length);
  for (const r of rendered) out = out.split(r).join(' FIG ');
  return out
    .replace(/CO₂|H₂|CH₄|N₂|O₂/g, 'X')
    .replace(/m³\/h|m³|m²|Nm³|cm²|W\/m²/g, 'u')
    .replace(/PL-\d+/g, 'PL');
}

/**
 * The figures REPORTED by a source of docs/research.md, written in a text with no mark, each with where it comes from (research K numbers, tables of §2 and §3). Anything else must carry a mark, which `lf` adds to a placeholder: a number typed by hand
 * with a † or a * is caught by the tests, and a number that is in no list here is a number nobody has read.
 */
export const REPORTED = new Set(
  [
    // the machine and its tractor: K1, K2, K3, K5, K6, K7, K38, K39; third party (S10): wheelbase, length, width, clearance, cab, tyres
    '5090',
    '450',
    '2.22',
    '0.5',
    '0.50',
    '2.25',
    '2.4',
    '2.40',
    '1100',
    '1968',
    '2500',
    '2830',
    '5.8',
    '6',
    '4',
    '5',
    '2',
    '10',
    '1',
    '2.59',
    '4.09',
    '2.7',
    '2.70',
    '0.43',
    '2.88',
    '18.4',
    '38',
    '7.50',
    '7.5',
    '18',
    // the bench: K9 to K12, K14 to K16, K20, K22, K26, K28, K29, K30
    '40',
    '41',
    '2.2',
    '1.9',
    '1.2',
    '15',
    '20',
    '80',
    '85',
    '64',
    '51',
    '79',
    '2170',
    '1855',
    '3800',
    '29',
    '21',
    '0.007',
    '0.019',
    '0.05',
    '0.06',
    '0.005',
    '0.031',
    '0.54',
    '1.97',
    '0.12',
    '0.2',
    '0.3',
    // the fuel: K8, K59, K60, K64
    '8',
    '152',
    '30',
    '25',
    '13',
    '0.18',
    '0.13',
    '0.09',
    '0.08',
    '16.8',
    '18.1',
    '21.1',
    '21',
    '1800',
    '0',
    '3',
    '14',
    '34',
    '4.2',
    '60',
    '35',
    '45',
    // the working life: K40, K41, K43, K21, K44
    '50',
    '100',
    '500',
    '700',
    '600',
    '1000',
    '400',
    '2000',
    '4000',
    '75',
    '135',
    '3.5',
    '0.1',
    '2',
    '9',
    // the gas, the zones, the train: K4, K13, K14, K19, K46, K47, K62, K63, K27, K31
    '4.9',
    '2.5',
    '5.60',
    '71',
    '0.04',
    '0.17',
    '17',
    '22',
    '12',
    '250',
    '1200',
    '1500',
    '300',
    '0.25',
    '1.1',
    '3.8',
    '0.97',
    '0.65',
    '0.7',
    '0.9',
    '150',
    '200',
    '400',
    '3000',
    '0.3',
    '6.6',
    '2.6',
    // the war and the fires: K52 to K58; dates; S7
    '54',
    '70',
    '18.9',
    '26',
    '0.8',
    '2865',
    '1939',
    '1944',
    '1942',
    '1945',
    '1941',
    '1940',
    '1970',
    '350',
    '120',
    '155',
    '230',
    '10000',
    '2002',
    // the room and the carbon monoxide: K48, K50, K51, K65; S5, S6
    '23',
    '27',
    '1000',
    '200000',
    '50000',
    '80000',
    '0.97',
    '300',
    '1400',
    // the false-colour ramp's ends and the dots' (research §2.6, docs/3d.md)

    // the lessons: Table 3.13's idle chips, K23/K24 engines, K18, Fig. 3.11 by eye and the table's misprint, K35, K36, K68, S5's delayed syndrome (7 to 21 days), K66's 250; the numbers of the emergency services, from general knowledge, to check (research §A.4)
    '19.6',
    '42',
    '56',
    '8.5',
    '19',
    '5.3',
    '0.55',
    '3.6',
    '7.8',
    '1986',
    '112',
    '144',
    '7',
    '21',
  ].map((n) => String(Number(n))),
);

// ------------------------------------------------------------------------------------------------ words

/** Research §A.1's banned words, English and French: nothing a visitor reads promises safety. */
export const PROMISES =
  /\b(safe|safely|safe distance|safe level|harmless|risk-free|foolproof|non-toxic|clean gas|easy to build)\b|\b(sûr|sûre|sûrs|sans danger|sans risque|sécurisé|sécurisée|inoffensif|inoffensive|gaz propre|facile à construire)\b/i;

/** Sentences of the sources the lab never repeats (research §A.3, S1, S2, S4). */
export const NOT_REPEATED =
  /no dangerous gases|suitable chimney|no chronic symptoms|no permanent damage|relatively harmless|piece of paper|do not constitute an environmental|comparable to those of diesel|safely when|easy to fabricate|basically only an empty can|simple and easy to follow|minimal risk|risk of poisoning through leakage is therefore minimal/i;

/** No instruction to build or run one at home: an imperative of an operating verb, at the start of a sentence, in French or English (research §A.2, R3). */
export const OPERATING_EN =
  /(^|[.!?:;]\s+|\n)(light|ignite|fan|fill|empty|refuel|restart|shut|close|drain|tighten|weld|cut|drill|build|bolt|clamp|seal|assemble|install|mix|pour|burn|run the gasifier|start the|stop the)\b/i;
export const OPERATING_FR =
  /(^|[.!?:;]\s+|\n)(allumez|ventilez|remplissez|videz|fermez|purgez|serrez|soudez|découpez|percez|construisez|boulonnez|assemblez|installez|mélangez|versez|brûlez|démarrez|arrêtez le)\b/i;

/** No size of the hot parts, in any printed form (research §A.2, R2): the throat, the nozzles, the firebox, the heights of the zones, the ring, the plenum, the hood, the grate. Forms with a unit; a bare number can be a life or a temperature. */
export function printedForms(metres: number): string[] {
  const mm = Math.round(metres * 1000 * 100) / 100;
  const cm = Math.round(metres * 100 * 100) / 100;
  const fr = (x: number): string => String(x).replace('.', ',');
  const out = [
    `${mm} mm`,
    `${fr(mm)} mm`,
    `Ø${mm}`,
    `Ø ${mm}`,
    `${cm} cm`,
    `${fr(cm)} cm`,
    `${metres} m`,
    `${fr(metres)} m`,
  ];
  return out.concat(out.map((f) => f.replace(' ', ' ')));
}

export { nEn, nFr };
