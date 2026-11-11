import { Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { getLang, l } from '@onigam/lab-kit/i18n';
import { roomRun } from '../sim/runs';
import { nEn, nFr } from '../data/units';
import { arrow, box, cat, chart, FILL, fig, heading, INKS, marksLegend, modelTag, note } from './draw';

// PL-G09: what the machine does when it stops, and the room it stops in. The suction ends, the pressure rises for about twenty minutes, the gas that stood in the pipes goes out where it can: the primary-air intake (reported). Then what the model puts in a closed garage and in the room above it,
// half an hour at a time: three curves, on a logarithmic scale of ppm, door shut and nobody in the picture. Every curve is an ESTIMATE: the source (1 m³ of gas) was measured by nobody, the buildings are imagined, and the model's room mixes perfectly. The sheet draws no line of any ladder across the time, and computes no time to any level, for a room or for a person (research R5).

export const NUMBER = 'PL-G09';

export interface RoomPoint {
  minute: number;
  garage50: number;
  garage1000: number;
  above: number;
}

let cache: RoomPoint[] | null = null;

/** The room's carbon monoxide every five minutes for three hours, door shut: the simulation's own room, run once. */
export function roomProfile(): RoomPoint[] {
  if (cache) return cache;
  const out: RoomPoint[] = [];
  for (let m = 0; m <= 180; m += 5) {
    const a = roomRun(m, { engineOn: false });
    const b = roomRun(m, { engineOn: false, garageVolume: 1000 });
    out.push({ minute: m, garage50: a.ppm, garage1000: b.ppm, above: a.abovePpm });
  }
  cache = out;
  return out;
}

const lg = (ppm: number): number => Math.log10(Math.max(1, ppm));

function draw(d: Drawing): void {
  const p = d.paper();
  heading(
    d,
    18,
    24,
    l('L’ARRÊT : CE QUI SE PASSE QUAND LA DÉPRESSION CESSE', 'THE STOP: WHAT HAPPENS WHEN THE SUCTION ENDS'),
    { size: 2.1 },
  );
  // the reported sequence
  box(d, 18, 34, 120, 22, l('L’arrêt', 'The stop'), {
    fill: FILL.band,
    sub: l('l’aspiration du moteur cesse', 'the engine’s suction ends'),
  });
  box(d, 154, 34, 120, 22, l('Environ 20 minutes', 'About 20 minutes'), {
    fill: FILL.hot,
    sub: l(
      'la pression monte, le gaz sort, notamment par la prise d’air primaire',
      'the pressure rises, the gas leaves, particularly by the primary-air intake',
    ),
  });
  box(d, 290, 34, 116, 22, l('« Parfois pendant des heures »', '“Sometimes for hours”'), {
    fill: FILL.loss,
    sub: l('Reed et Das, 1988', 'Reed and Das, 1988'),
  });
  arrow(p, [138, 45], [154, 45], INKS.hot);
  arrow(p, [274, 45], [290, 45], INKS.hot);
  p.text(
    [18, 62],
    l(
      'Le gaz qui se forme après l’arrêt est de 23 à 27 % de monoxyde de carbone : il sort même d’un gazogène étanche.',
      'The gas that forms after the stop is 23 to 27% carbon monoxide: it comes out even from a tight gasifier.',
    ),
    {
      size: 1.85,
      color: INK_2,
    },
  );

  // the model's room
  heading(
    d,
    18,
    74,
    l(
      'LE MONOXYDE DANS LA PIÈCE, DANS LE MODÈLE, PORTE FERMÉE',
      'THE CARBON MONOXIDE IN THE ROOM, IN THE MODEL, DOOR SHUT',
    ),
    { size: 2.1 },
  );
  modelTag(d, 34, 84, 216);
  const prof = roomProfile().filter((q) => q.minute > 0);
  const xs = prof.map((q) => q.minute);
  chart(
    d,
    34,
    104,
    216,
    110,
    [
      {
        x: xs,
        y: prof.map((q) => lg(q.garage50)),
        color: INKS.hot,
        label: l('garage de 50 m³*', '50 m³ garage*'),
        w: W.thick,
      },
      {
        x: xs,
        y: prof.map((q) => lg(q.above)),
        color: INKS.diesel,
        label: l('chambre au-dessus du garage de 50 m³*', 'room above the 50 m³ garage*'),
        dash: [2, 1],
      },
      {
        x: xs,
        y: prof.map((q) => lg(q.garage1000)),
        color: INKS.cool,
        label: l('garage de 1 000 m³*', '1,000 m³ garage*'),
      },
    ],
    {
      xMin: 0,
      xMax: 180,
      yMin: 1,
      yMax: 4,
      xTicks: [0, 30, 60, 90, 120, 150, 180],
      yTicks: [1, 2, 3, 4],
      yFormat: (v) => (getLang() === 'fr' ? nFr(10 ** v, 0) : nEn(10 ** v, 0)),
      xLabel: l('minutes après l’arrêt', 'minutes after the stop'),
      yLabel: l('PPM DE MONOXYDE DE CARBONE, ÉCHELLE LOGARITHMIQUE', 'PPM OF CARBON MONOXIDE, LOGARITHMIC SCALE'),
      legendAt: 100,
      legendTop: 4,
    },
  );

  // notes
  const X = 266;
  const W_ = 140;
  let y = 84;
  y = note(
    d,
    X,
    y,
    W_,
    cat(
      l('Le modèle suppose ', 'The model assumes '),
      fig('postGas'),
      l(
        ' de gaz échappé après l’arrêt, répandu dans la pièce. Les courbes sont celles d’un garage fermé, sans personne : un de 50 m³, un de 1 000 m³, et la chambre au-dessus du petit, que le plancher laisse passer. Le gaz s’y mélange parfaitement, ce que le vrai ne fait pas : il est inégal, par couches.',
        ' of gas escaped after the stop, spread through the room. The curves are for a closed garage with nobody in it: one of 50 m³, one of 1,000 m³, and the room above the small one, which the floor lets through. The gas mixes perfectly there, which the real one does not: it is uneven, in layers.',
      ),
    ),
    { size: 1.85 },
  );
  y = note(
    d,
    X,
    y + 1,
    W_,
    l(
      'Tout est estimé : la source, ni mesurée ni connue de personne, les bâtiments, imaginés, le temps que dure la fuite, discuté entre les sources. Le modèle n’a pas de démarrage et ne sait rien de l’allumage.',
      'Everything is estimated: the source, measured by nobody, the buildings, imagined, how long the leak lasts, disputed between the sources. The model has no start and knows nothing of lighting.',
    ),
    { size: 1.85 },
  );
  y = note(
    d,
    X,
    y + 1,
    W_,
    l(
      'La feuille ne tire aucune ligne de l’échelle des sources à travers ces courbes, et ne calcule aucun temps : ni avant tel niveau, ni pour une personne. L’échelle des sources est sur la feuille « Le monoxyde de carbone ».',
      'The sheet draws no line of the sources’ ladder across these curves, and computes no time: none to any level, none for a person. The sources’ ladder is on the sheet “Carbon monoxide”.',
    ),
    { size: 1.85 },
  );
  marksLegend(d, X, y + 2, W_);
}

export const theStop: DrawingSheet = {
  id: 'the-stop',
  number: NUMBER,
  group: 'danger',
  title: l('L’arrêt et la pièce', 'The stop and the room'),
  description: l(
    'Ce que fait la machine quand elle s’arrête : la pression monte une vingtaine de minutes et le gaz sort, notamment par la prise d’air primaire. Puis ce que le modèle met dans un garage fermé de 50 m³, dans un de 1 000 m³ et dans la chambre au-dessus du petit, en trois heures : des estimations, sans personne dans l’image, sur une échelle logarithmique. La feuille ne calcule aucun temps.',
    'What the machine does when it stops: the pressure rises for some twenty minutes and the gas leaves, particularly by the primary-air intake. Then what the model puts in a closed 50 m³ garage, in a 1,000 m³ one and in the room above the small one, over three hours: estimates, nobody in the picture, on a logarithmic scale. The sheet computes no time.',
  ),
  scene: 'garage',
  parts: ['post-gas-plume', 'closed-garage', 'room-above', 'garage-door'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('L’arrêt et la pièce', 'The stop and the room'),
      subtitle: l('Des estimations du modèle, sans personne dans l’image', 'Model estimates, nobody in the picture'),
      number: NUMBER,
      scale: l('logarithmique', 'logarithmic') as unknown as string,
    });
    draw(d);
    return d;
  },
};
