import type { Pair } from './texts';

// The published ladder for carbon monoxide, for reading beside a number and for sheet 8. Every rung has its source and says what the source says, and that is all. There is no side of it to stand on: no rung is a level one may stay under (R5), the limits are for workplaces,
// the symptoms are for a person, and nobody stands in this lab's room. No state key computes a dose or a time from these. S1 Table 2.9 opens on a row « 50 ppm: no significant effects »: left out on purpose, against the 20 ppm limit value and against R5. Sheet 8 must not bring it back. Its 400, 1,600 and 6,400 ppm rows are not here because research K51 kept four; adding them is the author's call.

export interface Rung {
  ppm: number;
  /** For a range, its top. */
  ppmHigh?: number;
  /** Word of the figure. All reported. */
  source: 'S1 Table 2.9, S4 Table 3-2' | 'S5' | 'S3';
  /** What the source says, for the ladder's own sheet (PL-G08), times included where it gives them. */
  text: Pair;
  /** The same rung for the line beside the room's running figure: it names no time, so that « the box stands on this rung » is never read as « a person would collapse in so many hours ». */
  plain: Pair;
}

export const CO_LADDER: readonly Rung[] = [
  {
    ppm: 20,
    source: 'S5',
    text: [
      'Valeur limite d’exposition professionnelle de la fiche INRS sur 8 h, au travail : une borne de travail, pas une frontière pour le corps ; les limites diffèrent d’un pays à l’autre',
      'Occupational exposure limit value in the INRS sheet (France) over 8 h, at work: a limit for work, not a border for the body; limits differ from country to country',
    ],
    plain: [
      'Valeur limite d’exposition professionnelle de la fiche INRS, au travail : une borne de travail, pas une frontière pour le corps ; les limites diffèrent d’un pays à l’autre',
      'Occupational exposure limit value in the INRS sheet (France), at work: a limit for work, not a border for the body; limits differ from country to country',
    ],
  },
  {
    ppm: 100,
    source: 'S5',
    text: [
      'Valeur limite d’exposition professionnelle de la fiche INRS sur de courtes périodes, au travail',
      'Occupational exposure limit value in the INRS sheet (France), short term, at work',
    ],
    plain: [
      'Valeur limite d’exposition professionnelle de la fiche INRS sur de courtes périodes, au travail',
      'Occupational exposure limit value in the INRS sheet (France), short term, at work',
    ],
  },
  {
    ppm: 200,
    source: 'S1 Table 2.9, S4 Table 3-2',
    text: ['Publié : mal de tête léger possible en 2 à 3 h', 'Published: possibly a mild headache in 2 to 3 h'],
    plain: ['Publié : mal de tête léger possible', 'Published: possibly a mild headache'],
  },
  {
    ppm: 800,
    source: 'S1 Table 2.9, S4 Table 3-2',
    text: [
      'Publié : mal de tête, vertige et nausée en 45 min, effondrement et perte de connaissance possible en 2 h',
      'Published: headache, dizziness and nausea in 45 min, collapse and possibly unconsciousness in 2 h',
    ],
    plain: [
      'Publié : mal de tête, vertige et nausée ; effondrement et perte de connaissance possibles',
      'Published: headache, dizziness and nausea; collapse and possibly unconsciousness',
    ],
  },
  {
    ppm: 3200,
    source: 'S1 Table 2.9, S4 Table 3-2',
    text: ['Publié : inconscience, danger de mort en 30 min', 'Published: unconsciousness, danger of death in 30 min'],
    plain: ['Publié : inconscience, danger de mort', 'Published: unconsciousness, danger of death'],
  },
  {
    ppm: 12800,
    source: 'S1 Table 2.9, S4 Table 3-2',
    text: [
      'Publié : effet immédiat, perte de connaissance et danger de mort en 1 à 3 min',
      'Published: immediate effect, unconsciousness and danger of death in 1 to 3 min',
    ],
    plain: [
      'Publié : effet immédiat, perte de connaissance et danger de mort',
      'Published: immediate effect, unconsciousness and danger of death',
    ],
  },
  {
    ppm: 50000,
    ppmHigh: 80000,
    source: 'S3',
    text: ['Échappement au ralenti, publié pour ces moteurs', 'Idling exhaust, as published for such engines'],
    plain: ['Échappement au ralenti, publié pour ces moteurs', 'Idling exhaust, as published for such engines'],
  },
  {
    ppm: 200000,
    ppmHigh: 300000,
    source: 'S3',
    text: ['Le gaz dans les tuyaux, et après l’arrêt 23 à 27 %', 'The gas in the pipes, and 23 to 27 % after a stop'],
    plain: ['Le gaz dans les tuyaux, et après l’arrêt 23 à 27 %', 'The gas in the pipes, and 23 to 27 % after a stop'],
  },
];

/** Index of the highest rung reached by this concentration, or -1 under the first. The -1 says only that the number is low in this box: the text for it says so. */
export function ladderRung(ppm: number): number {
  let i = -1;
  while (i + 1 < CO_LADDER.length && ppm >= CO_LADDER[i + 1]!.ppm) i++;
  return i;
}
