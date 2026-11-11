import { Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { CO_LADDER, type Rung } from '../sim/ladder';
import { nEn, nFr } from '../data/units';
import { cat, fig, heading, INKS, marksLegend, note, RED } from './draw';

// PL-G08: what the sources say about carbon monoxide, on a logarithmic scale from 10 ppm to a million. Every rung says what its source says and nothing more, with that source named. There is no side of it to stand on: no rung is a level one may stay under (research R5): the legal limits are for work, the published effects are for a person,
// and nobody stands in this lab's room. The model's two rooms are marked beside the ladder, as a concentration from a stated source and an estimate: the sheet computes no time to any rung and none for a person. S1 Table 2.9's first row (« 50 ppm: no significant effects ») is left out on purpose and must not come back.

export const NUMBER = 'PL-G08';

const SOURCE: Record<Rung['source'], L> = {
  'S1 Table 2.9, S4 Table 3-2': l(
    'FAO, Forestry Paper 72, tableau 2.9, et ORNL-6404, tableau 3-2',
    'FAO Forestry Paper 72, Table 2.9, and ORNL-6404, Table 3-2',
  ),
  S5: l('INRS, fiche toxicologique FT 47', 'INRS, toxicological sheet FT 47'),
  S3: l('Gengas, l’expérience suédoise 1939–1945', 'Generator Gas, the Swedish experience 1939–1945'),
};
const COLOR: Record<Rung['source'], string> = {
  'S1 Table 2.9, S4 Table 3-2': INKS.hot,
  S5: INKS.cool,
  S3: INKS.diesel,
};

const AX = 66;
const BOTTOM = 236;
const DEC = 37;
/** y of a concentration on the log axis: 10 ppm at the bottom. */
export const ly = (ppm: number): number => BOTTOM - Math.log10(ppm / 10) * DEC;

/** The rungs of the ladder as the sheet draws them: the simulation's list, read here. */
export const rungs = (): readonly Rung[] => CO_LADDER;

function ppmText(v: number): L {
  return l(nFr(v, 0), nEn(v, 0));
}

function ladder(d: Drawing): void {
  const p = d.paper();
  heading(
    d,
    18,
    24,
    l(
      'LE MONOXYDE DE CARBONE, DE 10 PPM À UN MILLION, ÉCHELLE LOGARITHMIQUE',
      'CARBON MONOXIDE, FROM 10 PPM TO A MILLION, LOGARITHMIC SCALE',
    ),
    {
      size: 2.1,
    },
  );
  // the axis and its decades
  p.line([AX, ly(1e6)], [AX, ly(10)], { w: W.medium });
  for (const v of [10, 100, 1000, 1e4, 1e5, 1e6]) {
    p.line([AX - 1.5, ly(v)], [AX + 1.5, ly(v)], { w: W.thin });
    p.text([AX - 3, ly(v)], cat(ppmText(v), ' ppm'), {
      size: 1.7,
      anchor: 'end',
      baseline: 'middle',
      mono: true,
      color: INK_2,
    });
  }
  for (const r of rungs()) {
    const color = COLOR[r.source];
    const y = r.ppmHigh ? (ly(r.ppm) + ly(r.ppmHigh)) / 2 : ly(r.ppm);
    if (r.ppmHigh) p.rect([AX - 1.2, ly(r.ppmHigh)], [AX + 1.2, ly(r.ppm)], { w: W.thin, fill: color, color });
    else p.circle([AX, y], 1.4, { w: W.thin, fill: color, color });
    p.line([AX + 2, y], [AX + 10, y], { w: W.thin, color, dash: [1, 0.8] });
    const label = cat(
      l(
        `${ppmText(r.ppm).fr}${r.ppmHigh ? ` à ${ppmText(r.ppmHigh).fr}` : ''} ppm : `,
        `${ppmText(r.ppm).en}${r.ppmHigh ? ` to ${ppmText(r.ppmHigh).en}` : ''} ppm: `,
      ),
      l(r.text[0], r.text[1]),
    );
    const end = note(d, AX + 12, y - 3.8, 172, label, { size: 1.95, lineH: 3.1 });
    p.text([AX + 12, end - 0.6], SOURCE[r.source], { size: 1.7, baseline: 'top', color: INK_2 });
  }
}

/** The model's two rooms, on the left of the axis: a concentration from a stated source, and an estimate. */
function rooms(d: Drawing): void {
  const p = d.paper();
  const marks: [number, L][] = [
    [
      3500,
      l(
        'modèle : garage de 50 m³ fermé, une demi-heure après l’arrêt',
        'model: a closed 50 m³ garage, half an hour after the stop',
      ),
    ],
    [
      200,
      l(
        'modèle : garage de 1 000 m³ fermé, une demi-heure après l’arrêt',
        'model: a closed 1,000 m³ garage, half an hour after the stop',
      ),
    ],
  ];
  for (const [ppm, label] of marks) {
    const y = ly(ppm);
    p.rect([AX - 3.8, y - 1.3], [AX - 1.2, y + 1.3], { w: W.medium, fill: RED, color: RED });
    const bits: string[] = [];
    void bits;
    p.line([56.5, y], [AX - 4.2, y], { w: W.thin, color: RED });
    note(d, 16, y - 5.5, 40, cat(label, ' : ', l(`${nFr(ppm, 0)} ppm*`, `${nEn(ppm, 0)} ppm*`)), {
      size: 1.6,
      lineH: 2.5,
      color: RED,
    });
  }
}

function draw(d: Drawing): void {
  ladder(d);
  rooms(d);
  const X = 250;
  const W_ = 156;
  let y = 26;
  y = note(
    d,
    X,
    y,
    W_,
    l(
      'Chaque barreau dit ce que dit sa source, et rien d’autre. Aucun n’est un niveau sous lequel on peut rester : les limites valent pour le travail, les effets publiés pour une personne, et personne n’est dans la pièce du lab.',
      'Each rung says what its source says, and nothing more. None is a level one may stay under: the limits are for work, the published effects for a person, and nobody stands in the lab’s room.',
    ),
    { size: 1.85 },
  );
  y = note(
    d,
    X,
    y + 1,
    W_,
    cat(
      l(
        'Les marques rouges sont celles du modèle : un gaz échappé après l’arrêt, supposé de ',
        'The red marks are the model’s: gas escaped after the stop, assumed to be ',
      ),
      fig('postGas'),
      l(
        ', dans un garage fermé de 50 m³ ou de 1 000 m³, une demi-heure après l’arrêt. Ce sont des estimations, sur une source que personne n’a mesurée, d’une pièce où le gaz se mélange parfaitement. Dans une vraie pièce il est inégal, par couches. La feuille ne calcule aucun temps : ni avant tel barreau, ni pour une personne.',
        ', in a closed garage of 50 m³ or 1,000 m³, half an hour after the stop. They are estimates, on a source nobody measured, of a room where the gas mixes perfectly. In a real room it is uneven, in layers. The sheet computes no time: none to any rung, none for a person.',
      ),
    ),
    { size: 1.85 },
  );
  y = marksLegend(d, X, y + 2, W_);
  const key: [string, L][] = [
    [INKS.cool, l('une limite de travail', 'a limit for work')],
    [INKS.hot, l('un effet publié, pour une personne', 'a published effect, for a person')],
    [
      INKS.diesel,
      l('l’échappement et le gaz, publiés pour ces moteurs', 'the exhaust and the gas, published for such engines'),
    ],
    [RED, l('le modèle : une estimation', 'the model: an estimate')],
  ];
  key.forEach(([color, t], i) => {
    d.paper().circle([X + 2, y + 5 + i * 5.5], 1.4, { w: W.thin, fill: color, color });
    d.paper().text([X + 7, y + 5 + i * 5.5], t, { size: 1.85, baseline: 'middle' });
  });
  void INK;
}

export const coLadder: DrawingSheet = {
  id: 'co-ladder',
  number: NUMBER,
  group: 'danger',
  title: l('Le monoxyde de carbone, échelle des sources', 'Carbon monoxide, the ladder of sources'),
  description: l(
    'Ce que disent les sources sur le monoxyde de carbone, de 20 ppm à 300 000, sur une échelle logarithmique : les limites du travail, les effets publiés, l’échappement et le gaz lui-même, chacun avec sa source. Aucun barreau n’est un niveau où rester. Les deux pièces du modèle sont marquées à côté, comme des estimations ; la feuille ne calcule aucun temps.',
    'What the sources say about carbon monoxide, from 20 ppm to 300,000, on a logarithmic scale: the limits at work, the published effects, the exhaust and the gas itself, each with its source. No rung is a level to stay at. The model’s two rooms are marked beside it, as estimates; the sheet computes no time.',
  ),
  scene: 'garage',
  parts: ['co-indicator', 'closed-garage', 'post-gas-plume', 'exhaust-plume'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le monoxyde de carbone', 'Carbon monoxide'),
      subtitle: l('Ce que disent les sources, sans côté où se tenir', 'What the sources say, with no side to stand on'),
      number: NUMBER,
      scale: l('logarithmique', 'logarithmic') as unknown as string,
    });
    draw(d);
    return d;
  },
};
