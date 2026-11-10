import { Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { cat, FILL, heading, INKS, marksLegend, note, numL } from './draw';

// PL-G10: Sweden's generator gas in numbers, from the Swedish book of 1950 as translated (S3) and Reed and Das (S2): the vehicles, the fires, the people. Totals only. The book's rate of fires per thousand vehicles by half-year, read here from a scanned table the sheet could not check, is NOT drawn:
// its two end values are said in words and the open question is recorded in docs/data.md. Every number here is the sources' (no mark), except the two sums and the share the sheet computes from them (†). Nothing is the model's.

export const NUMBER = 'PL-G10';

/** S3's counts of generator-gas vehicles in Sweden on the date (K58), and the whole fleet at the end of 1939. */
export const FLEET_WAR = [
  { when: l('fin 1939, tous les véhicules', 'end of 1939, all vehicles'), n: 248854, all: true },
  { when: l('1er octobre 1940', '1 October 1940'), n: 9141, all: false },
  { when: l('1er octobre 1941', '1 October 1941'), n: 68872, all: false },
  { when: l('1er octobre 1943, le sommet', '1 October 1943, the peak'), n: 73853, all: false },
  { when: l('1er avril 1945', '1 April 1945'), n: 72592, all: false },
] as const;
export const PEAK = { cars: 35068, buses: 3533, trucks: 35252, woodShare: 36.3 } as const;
/** K56: the fires from October 1939 to September 1944, by what the vehicle burned. */
export const FIRES = { charcoal: 1740, wood: 1025, others: 100, total: 2865 } as const;
/** K54: the vehicles inspected in the first half of 1945 after police reports. */
export const INSPECTED = { inspected: 230, faulty: 155 } as const;

const num = (v: number): L => l(nFr(v, 0), nEn(v, 0));

function fleet(d: Drawing): void {
  const p = d.paper();
  const X0 = 96;
  const S = 0.00055; // mm per vehicle
  heading(
    d,
    18,
    24,
    l('LES VÉHICULES À GAZ DE BOIS ET DE CHARBON, EN SUÈDE', 'WOOD-GAS AND CHARCOAL-GAS VEHICLES IN SWEDEN'),
    { size: 2.1 },
  );
  FLEET_WAR.forEach((r, i) => {
    const y = 38 + i * 11;
    p.text([18, y + 3], r.when, { size: 1.8, baseline: 'middle', weight: i === 3 ? 'bold' : 'normal' });
    if (i === 3) {
      const wood = r.n * (PEAK.woodShare / 100);
      p.rect([X0, y], [X0 + wood * S, y + 6], { w: W.thin, fill: FILL.wood, color: INKS.diesel });
      p.rect([X0 + wood * S, y], [X0 + r.n * S, y + 6], { w: W.thin, fill: FILL.char, color: FILL.char });
    } else {
      p.rect([X0, y], [X0 + r.n * S, y + 6], {
        w: W.thin,
        fill: r.all ? FILL.room : FILL.steel,
        color: r.all ? INK_2 : INK,
      });
    }
    p.text([X0 + r.n * S + 2, y + 3], num(r.n), { size: 1.8, baseline: 'middle', mono: true });
  });
  // the peak, broken down
  const wood = Math.round((FLEET_WAR[3].n * (PEAK.woodShare / 100)) / 100) * 100;
  const y = 38 + 5 * 11 + 2;
  p.rect([18, y], [24, y + 3], { w: W.thin, fill: FILL.wood, color: INKS.diesel });
  p.text(
    [26, y + 1.5],
    cat(
      l('au bois : ', 'on wood: '),
      l(
        `${PEAK.woodShare.toString().replace('.', ',')} % du sommet, soit environ `,
        `${PEAK.woodShare}% of the peak, about `,
      ),
      numL(wood, 0, '', '†'),
    ),
    {
      size: 1.8,
      baseline: 'middle',
    },
  );
  p.rect([18, y + 6], [24, y + 9], { w: W.thin, fill: FILL.char, color: FILL.char });
  p.text([26, y + 7.5], l('au charbon de bois : le reste', 'on charcoal: the rest'), { size: 1.8, baseline: 'middle' });
  // the peak by type: the share of each that ran on wood
  p.text([18, y + 18], l('AU SOMMET, PAR TYPE : LA PART AU BOIS', 'AT THE PEAK, BY TYPE: THE SHARE ON WOOD'), {
    size: 1.9,
    weight: 'bold',
    baseline: 'middle',
  });
  const types: [L, number, number][] = [
    [l('voitures', 'cars'), PEAK.cars, 15],
    [l('autobus', 'buses'), PEAK.buses, 73],
    [l('camions', 'trucks'), PEAK.trucks, 55],
  ];
  types.forEach(([name, n, share], i) => {
    const yy = y + 23 + i * 8;
    p.text([18, yy + 2.5], cat(name, ' ', num(n)), { size: 1.8, baseline: 'middle' });
    p.rect([X0, yy], [X0 + 60, yy + 5], { w: W.thin, fill: FILL.char, color: FILL.char });
    p.rect([X0, yy], [X0 + (60 * share) / 100, yy + 5], { w: W.thin, fill: FILL.wood, color: INKS.diesel });
    p.text([X0 + 62, yy + 2.5], l(`${share} % au bois`, `${share}% on wood`), {
      size: 1.8,
      baseline: 'middle',
      mono: true,
    });
  });
  note(
    d,
    18,
    y + 52,
    232,
    cat(
      l(
        `« 70 000 véhicules au gaz de bois » est une erreur courante : la plupart roulaient au charbon de bois. « 40 % du parc » n’est pas non plus ce que montrent les tableaux : ${nFr(FLEET_WAR[3].n, 0)} véhicules, c’est environ `,
        `“70,000 wood-gas vehicles” is a common error: most ran on charcoal. “40% of the fleet” is not what the tables show either: ${nEn(FLEET_WAR[3].n, 0)} vehicles is about `,
      ),
      numL((FLEET_WAR[3].n / FLEET_WAR[0].n) * 100, 0, [' %', '%'], '†'),
      l(' du parc de 1939, dans un parc qui avait rétréci.', ' of the 1939 fleet, in a fleet that had shrunk.'),
    ),
    { size: 1.8 },
  );
}

function fires(d: Drawing): void {
  const p = d.paper();
  const X = 272;
  const S = 0.045; // mm per fire
  heading(d, X, 24, l('LES INCENDIES, D’OCTOBRE 1939 À SEPTEMBRE 1944', 'THE FIRES, OCTOBER 1939 TO SEPTEMBER 1944'), {
    size: 2.1,
  });
  p.text(
    [X, 36],
    cat(
      num(FIRES.total),
      l(' incendies, pour environ 15 millions de couronnes', ' fires, for about 15 million kronor'),
    ),
    {
      size: 1.9,
      weight: 'bold',
      baseline: 'middle',
    },
  );
  let x = X;
  const seg = (n: number, fill: string, color: string, name: L, dy: number): void => {
    p.rect([x, 40], [x + n * S, 47], { w: W.thin, fill, color });
    const last = n === FIRES.others;
    p.text([last ? x + n * S : x + (n * S) / 2, 49 + dy], cat(name, ' ', num(n)), {
      size: 1.75,
      anchor: last ? 'end' : 'middle',
      baseline: 'top',
    });
    x += n * S;
  };
  seg(FIRES.charcoal, FILL.char, FILL.char, l('charbon de bois', 'charcoal'), 0);
  seg(FIRES.wood, FILL.wood, INKS.diesel, l('bois', 'wood'), 0);
  seg(FIRES.others, FILL.steel, INK, l('autres', 'others'), 4);
  note(
    d,
    X,
    62,
    134,
    l(
      'Le livre suédois donne aussi le nombre d’incendies pour 1 000 véhicules et par semestre, d’environ 20 au début à environ 3,4 à la fin. L’intitulé du tableau dit « par an » et la page numérisée n’a pu être revérifiée : la courbe n’est pas dessinée, et la question reste ouverte.',
      'The Swedish book also gives the number of fires per 1,000 vehicles by half-year, from about 20 at the start to about 3.4 at the end. The table’s title says “per year” and the scanned page could not be checked again: the curve is not drawn, and the question stays open.',
    ),
    { size: 1.8 },
  );
}

function people(d: Drawing): void {
  const p = d.paper();
  const X = 272;
  heading(d, X, 92, l('LES GENS', 'THE PEOPLE'), { size: 2.1 });
  let y = 102;
  y = note(
    d,
    X,
    y,
    134,
    l(
      '17 morts en Suède, de décembre 1939 à mars 1941, par « conduite négligente » d’un gazogène ; le livre parle d’un « nombre considérable » de morts aiguës sans en donner le total.',
      '17 killed in Sweden, December 1939 to March 1941, from “careless gasifier operation”; the book speaks of a “considerable number” of acute deaths without giving a total.',
    ),
    { size: 1.85 },
  );
  y = note(
    d,
    X,
    y + 1,
    134,
    l(
      'Environ 10 000 cas chroniques enregistrés de 1941 à 1945 ; environ 15 000 conducteurs et mécaniciens formés dans les premières années.',
      'About 10,000 chronic cases recorded from 1941 to 1945; about 15,000 drivers and mechanics trained in the first years.',
    ),
    { size: 1.85 },
  );
  y = note(
    d,
    X,
    y + 1,
    134,
    l(
      'Premier semestre de 1945 : 230 véhicules inspectés après des signalements de la police, 155 défectueux.',
      'First half of 1945: 230 vehicles inspected after police reports, 155 faulty.',
    ),
    { size: 1.85 },
  );
  const S = 0.35;
  p.rect([X, y + 1], [X + INSPECTED.inspected * S, y + 7], { w: W.thin, fill: FILL.room });
  p.rect([X, y + 1], [X + INSPECTED.faulty * S, y + 7], { w: W.thin, fill: INKS.hot, color: INKS.hot });
  p.text([X + INSPECTED.inspected * S + 2, y + 4], l('155 sur 230 : 67 %', '155 of 230: 67%'), {
    size: 1.8,
    baseline: 'middle',
    mono: true,
  });
  marksLegend(d, X, y + 14, 134);
  void INK;
}

function draw(d: Drawing): void {
  fleet(d);
  fires(d);
  people(d);
  note(
    d,
    18,
    168,
    232,
    l(
      'Les chiffres sont ceux du livre suédois de 1950, dans sa traduction américaine, et de Reed et Das ; aucun n’est celui du modèle. Ce sont des comptes de l’époque, sur d’autres machines et d’autres gazogènes que ceux de l’institut : ils disent ce qui s’est passé, pas ce que ferait celui-ci.',
      'The figures are those of the Swedish book of 1950, in its American translation, and of Reed and Das; none is the model’s. They are counts of the period, of other machines and other gasifiers than the institute’s: they say what happened, not what this one would do.',
    ),
    { size: 1.85 },
  );
}

export const warAndFires: DrawingSheet = {
  id: 'war-and-fires',
  number: NUMBER,
  group: 'danger',
  title: l(
    'La Suède en guerre : les véhicules, les incendies, les gens',
    'Sweden at war: the vehicles, the fires, the people',
  ),
  description: l(
    'Les comptes de la Suède en guerre, d’après son livre de 1950 et Reed et Das : combien de véhicules au gaz de bois et au charbon de bois, combien d’incendies, combien de morts et de malades. Des totaux seulement ; la courbe des incendies par semestre n’est pas dessinée, faute d’avoir pu revérifier la page, et le modèle n’y met rien.',
    'The counts of Sweden at war, from its book of 1950 and Reed and Das: how many wood-gas and charcoal-gas vehicles, how many fires, how many dead and sick. Totals only; the curve of fires by half-year is not drawn, for want of a page that could be checked again, and the model adds nothing.',
  ),
  scene: 'tractor',
  parts: ['gasifier-unit'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La Suède en guerre', 'Sweden at war'),
      subtitle: l('Les comptes de l’époque, sans courbe inventée', 'The counts of the period, no invented curve'),
      number: NUMBER,
      scale: l('sans échelle', 'not to scale') as unknown as string,
    });
    draw(d);
    return d;
  },
};
