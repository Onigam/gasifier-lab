import { Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { partName } from '../three/part-ids';
import { arrow, box, cat, fig, FILL, heading, INKS, marksLegend, modelTag, note } from './draw';

// PL-G02: the gas's path, the schematic of the tractor laid out as the 3D lays the gas train out, with what the model puts at each stage: the temperature, the pressure it loses, the water it gives up. The arrangement is the institute's (its schematic of the tractor); no pipe, no valve, no fan has a size,
// because none is known. The cyclone stands apart, as on the programme's other system: its place here is an open question. The air of the fire is a second chain, under the first. Everything the model gives is boxed in red: a model result, not a measurement.

export const NUMBER = 'PL-G02';
const name = (id: string): L => {
  const n = partName(id);
  return l(n.fr, n.en);
};

function draw(d: Drawing): void {
  const p = d.paper();
  const W_ = 66;
  const H_ = 24;
  const X1 = [16, 112, 208, 304];
  const Y1 = 40;
  const Y2 = 108;
  const Y3 = 176;
  const right = (i: number, y: number): [number, number] => [X1[i]! + W_, y + H_ / 2];
  const left = (i: number, y: number): [number, number] => [X1[i]!, y + H_ / 2];
  const label = (x: number, y: number, t: L, anchor: 'start' | 'middle' | 'end' = 'middle', below = false): void => {
    p.text([x, y], t, { size: 1.8, anchor, baseline: below ? 'top' : 'bottom', mono: true, color: INK });
  };

  heading(d, 16, 24, l('LE CHEMIN DU GAZ, DU GAZOGÈNE AU MOTEUR', 'THE GAS’S PATH, FROM THE GASIFIER TO THE ENGINE'));
  // row 1, left to right: gasifier, hot pipe, stop valve, filter
  box(d, X1[0]!, Y1, W_, H_, name('gasifier-unit'), { fill: FILL.hot, sub: cat(fig('gasModel')) });
  box(d, X1[1]!, Y1, W_, H_, name('hot-gas-pipe'), { fill: FILL.pipe });
  box(d, X1[2]!, Y1, W_, H_, name('stop-valve'), { fill: FILL.pipe });
  box(d, X1[3]!, Y1, W_, H_, cat(name('filter-box'), l(' et manches', ' and bags')), {
    fill: FILL.band,
    sub: l('4,9 m²', '4.9 m²'),
  });
  arrow(p, right(0, Y1), left(1, Y1), INKS.hot);
  arrow(p, right(1, Y1), left(2, Y1), INKS.hot);
  arrow(p, right(2, Y1), left(3, Y1), INKS.hot);
  label(X1[0]! + W_ + 15, Y1 + H_ / 2 - 2, fig('outletModel'));
  label(X1[1]! + W_ + 15, Y1 + H_ / 2 + 2, fig('pipeMbar'), 'middle', true);
  label(X1[2]! + W_ + 15, Y1 + H_ / 2 - 2, fig('filterInT'));
  // the fan's tee, above the stop valve: the starting fan and its stack, and the cyclone apart
  box(d, X1[1]! + 20, Y1 - 22, 70, 12, cat(name('starting-fan'), l(' et cheminée', ' and stack')), {
    fill: FILL.loss,
    size: 1.7,
  });
  p.line([X1[1]! + W_ + 15, Y1 + H_ / 2], [X1[1]! + W_ + 15, Y1 - 10], { w: W.medium, color: INKS.hot });
  p.rect([X1[3]! - 4, Y1 - 22], [X1[3]! + W_, Y1 - 8], {
    w: W.thin,
    dash: 'hidden',
  });
  p.text([X1[3]! + W_ / 2 - 2, Y1 - 15], cat(name('cyclone'), l(' : sa place est ouverte', ': its place is open')), {
    size: 1.7,
    anchor: 'middle',
    baseline: 'middle',
    color: INK_2,
  });
  label(
    X1[3]! + W_ / 2,
    Y1 + H_ + 8,
    cat(l('toile ', 'cloth '), fig('filterT'), l(' · perte ', ' · loss '), fig('filterMbar')),
    'middle',
  );
  // down to row 2: the cooler, at the right, then right to left: mixer, cylinder, exhaust
  const x2 = [X1[3]!, X1[2]!, X1[1]!, X1[0]!];
  box(d, x2[0]!, Y2, W_, H_, cat(name('gas-cooler'), l(' et bac', ' and vessel')), {
    fill: FILL.cold,
    sub: l('5,8 m²', '5.8 m²'),
  });
  box(d, x2[1]!, Y2, W_, H_, cat(name('gas-air-mixer'), l(' et papillons', ' and throttles')), {
    fill: FILL.pipe,
    sub: cat(l('air/gaz ', 'air/gas '), fig('mixAirModel')),
  });
  box(d, x2[2]!, Y2, W_, H_, cat(name('pilot-injector'), l(' et cylindre', ' and cylinder')), {
    fill: FILL.steel,
    sub: cat(fig('mixMJ'), l(' le m³', ' per m³')),
  });
  box(d, x2[3]!, Y2, W_, H_, name('exhaust-pipe'), {
    fill: FILL.loss,
    sub: cat(fig('exhaustWork'), l(' de CO, au travail', ' CO, at work')),
  });
  arrow(p, [X1[3]! + W_ / 2, Y1 + H_], [x2[0]! + W_ / 2, Y2], INKS.hot);
  arrow(p, [x2[0]!, Y2 + H_ / 2], [x2[1]! + W_, Y2 + H_ / 2], INKS.cool);
  arrow(p, [x2[1]!, Y2 + H_ / 2], [x2[2]! + W_, Y2 + H_ / 2], INKS.cool);
  arrow(p, [x2[2]!, Y2 + H_ / 2], [x2[3]! + W_, Y2 + H_ / 2], INKS.loss);
  label(X1[3]! + W_ / 2 + 4, Y1 + H_ + 26, fig('coolerOut'), 'start');
  label(x2[0]! - 15, Y2 + 8, fig('coolerLph'));
  label(x2[1]! - 15, Y2 + 8, fig('mixT'));
  // the engine's air, from the tractor's air cleaner, into the mixer
  p.text(
    [x2[1]! + W_ / 2 + 3, Y2 + H_ + 8],
    l('air du filtre à air du tracteur', 'air from the tractor’s air cleaner'),
    {
      size: 1.8,
      anchor: 'start',
      baseline: 'middle',
      color: INKS.cool,
    },
  );
  arrow(p, [x2[1]! + W_ / 2, Y2 + H_ + 12], [x2[1]! + W_ / 2, Y2 + H_ + 0.5], INKS.cool);
  // the fire's air: a second chain
  heading(d, 16, Y3 - 14, l('L’AIR DU FEU, AVANT LE GAZOGÈNE', 'THE FIRE’S AIR, BEFORE THE GASIFIER'));
  const chain = ['primary-air-valve', 'air-intake', 'air-nozzles'];
  chain.forEach((id, i) => {
    const x = 16 + i * 84;
    box(d, x, Y3, 66, 20, name(id), { fill: id === 'air-nozzles' ? FILL.hot : FILL.pipe });
    if (i < 2) arrow(p, [x + 66, Y3 + 10], [x + 84, Y3 + 10], INKS.cool);
  });
  p.text(
    [16, Y3 + 28],
    l(
      'en marche, le moteur aspire cet air ; à l’arrêt, la même ouverture laisse sortir le gaz',
      'when running, the engine draws this air; at a stop, the same opening lets the gas out',
    ),
    { size: 1.8, baseline: 'top', color: INK_2 },
  );
  // the suction, the whole line
  p.text(
    [16, 246],
    cat(
      l('Dépression de toute la ligne au maximum : ', 'Suction of the whole line at the maximum: '),
      fig('trainModel'),
      l(', dont le lit ', ', of which the bed '),
      fig('hearthMbar'),
      l(', le filtre ', ', the filter '),
      fig('filterMbar'),
    ),
    { size: 1.9, baseline: 'top', mono: true },
  );
  modelTag(d, 16, 256, 70);
}

export const gasPath: DrawingSheet = {
  id: 'gas-path',
  number: NUMBER,
  group: 'machine',
  title: l('Le chemin du gaz', 'The gas’s path'),
  description: l(
    'Le schéma du tracteur dans l’ordre du gaz, comme le monde « Ligne de gaz » le met à plat : du gazogène au cylindre, avec ce que le modèle trouve à chaque étape, la température, la pression perdue, l’eau rendue. L’arrangement est celui de l’institut ; aucun tuyau, aucune vanne, aucun ventilateur n’a de taille, parce qu’aucune n’est connue. Le cyclone est à part : sa place est une question ouverte.',
    'The tractor’s schematic in the order of the gas, as the “Gas line” world lays it flat: from the gasifier to the cylinder, with what the model finds at each stage, the temperature, the pressure lost, the water given up. The arrangement is the institute’s; no pipe, no valve, no fan has a size, because none is known. The cyclone is apart: its place is an open question.',
  ),
  scene: 'gas-train',
  parts: ['hot-gas-pipe', 'stop-valve', 'filter-box', 'gas-cooler', 'gas-air-mixer', 'cylinder-cutaway'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le chemin du gaz', 'The gas’s path'),
      subtitle: l('Schéma, dans l’ordre du gaz', 'Schematic, in the order of the gas'),
      number: NUMBER,
      scale: l('sans échelle', 'no scale') as unknown as string,
    });
    draw(d);
    const y = note(
      d,
      262,
      176,
      148,
      l(
        'Chaud au filtre, au-dessus de son point de rosée ; froid au moteur, où un gaz plus dense remplit mieux le cylindre : chaque température a sa raison. Les températures sont des estimations du modèle, tenues dans la bande du rapport ; les pertes de pression et l’eau sont ses résultats sur les mesures du banc. Le chemin du gaz est celui de la figure du rapport, que le lab redessine d’après ses pièces : aucune cote de tuyau n’y figure.',
        'Hot at the filter, above its dew point; cold at the engine, where a denser gas fills the cylinder better: each temperature has its reason. The temperatures are the model’s estimates, held in the report’s band; the pressure losses and the water are its results on the bench’s measurements. The gas’s path is that of the report’s figure, which the lab redraws from its parts: no pipe dimension appears on it.',
      ),
      { size: 1.85 },
    );
    marksLegend(d, 262, y + 2, 140);
    return d;
  },
};
