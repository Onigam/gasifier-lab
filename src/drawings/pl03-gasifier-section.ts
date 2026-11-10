import { Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { idsOf, partName } from '../three/part-ids';
import { arrow, cat, fig, FILL, grid, heading, heatHex, INKS, marksLegend, modelTag, note, PAPER } from './draw';

// PL-G03: the gasifier in section, as a diagram, NOT TO SCALE and with no dimension: the zones are in order and each has the same height here, on purpose (their heights would be the hearth's sizes in disguise: research §A.2, R2), the throat is a generic pinch, the nozzles are two marks. What the sheet gives
// is the order of the parts, their numbers, what each does in a line, a life reported for those that wear, and the model's temperature in each zone, in the lab's false colours, 20 to 1,400 °C. The overall figures (the unit's top and foot above the ground, the bunker's volume) are said in words, and nothing else is dimensioned.

export const NUMBER = 'PL-G03';
export const ITEMS = idsOf('gasifier');
const name = (id: string): L => {
  const n = partName(id);
  return l(n.fr, n.en);
};

interface Spot {
  at: [number, number];
  side: 'L' | 'R';
}
const CX = 96;
const SPOTS: Record<string, Spot> = {
  'spring-lid': { at: [CX, 25], side: 'R' },
  'fuel-casing': { at: [62, 44], side: 'L' },
  'chip-column': { at: [CX, 54], side: 'R' },
  'drying-zone': { at: [CX + 10, 90], side: 'R' },
  'pyrolysis-zone': { at: [CX + 10, 108], side: 'R' },
  'oxidation-zone': { at: [CX + 10, 126], side: 'R' },
  'reduction-zone': { at: [CX + 10, 148], side: 'R' },
  'fuel-baffle': { at: [72, 76], side: 'L' },
  'condensate-sleeve': { at: [67, 60], side: 'L' },
  'condensate-drain': { at: [62, 99], side: 'L' },
  'eccentric-lock': { at: [131, 99], side: 'R' },
  'outer-casing': { at: [50, 150], side: 'L' },
  'air-intake': { at: [50, 124], side: 'L' },
  'air-nozzles': { at: [117, 124], side: 'R' },
  'fire-box': { at: [74, 156], side: 'L' },
  'throat-ring': { at: [80, 138], side: 'L' },
  grate: { at: [CX - 10, 168], side: 'R' },
  'grate-linkage': { at: [141, 170], side: 'R' },
  'ash-pit': { at: [CX, 184], side: 'L' },
  'gas-outlet': { at: [141, 132], side: 'R' },
};

function unit(d: Drawing): void {
  // the whole drawing sits 14 mm lower, under the heading
  const p = d.paper().group([0, 14]);
  const band = (y0: number, y1: number, T: number, x0 = 66, x1 = 126): void => {
    p.rect([x0, y0], [x1, y1], { w: W.thin, fill: heatHex(T), opacity: 0.85 });
  };
  // the chip column fills the bunker; the four zones follow, in order, each as high as the others
  p.rect([66, 26], [126, 82], { w: 0, fill: FILL.wood });
  band(82, 100, 100);
  band(100, 116, 370);
  band(116, 136, 1076);
  band(136, 160, 710);
  // the casings, the lid, the fire box
  p.rect([62, 24], [130, 100], { w: W.thick });
  p.rect([50, 100], [142, 196], { w: W.thick });
  p.line([62, 100], [130, 100], { w: W.thin, color: PAPER });
  p.rect([58, 21], [134, 25], { w: W.thick, fill: FILL.steel });
  p.polyline(
    [
      [96, 21],
      [93, 18],
      [99, 16],
      [93, 14],
      [99, 12],
      [96, 10],
    ],
    { w: W.thin },
  );
  p.rect([64, 100], [128, 160], { w: W.medium });
  // the sleeve and the baffle, inside the bunker's wall
  p.line([66, 28], [66, 98], { w: W.thin, dash: 'hidden' });
  p.polyline(
    [
      [66, 70],
      [74, 78],
      [66, 84],
    ],
    { w: W.medium },
  );
  // the throat: a generic pinch, not to scale
  p.polyline(
    [
      [64, 128],
      [82, 138],
      [110, 138],
      [128, 128],
    ],
    { w: W.medium },
  );
  // the nozzles: two marks on the plenum
  for (const x of [64, 128])
    p.polyline(
      [
        [x - 6, 122],
        [x, 124],
        [x - 6, 126],
      ],
      { w: W.medium, color: INKS.hot },
    );
  // the grate and the ash pit
  p.line([66, 160], [126, 160], { w: W.thick });
  for (let x = 70; x < 126; x += 8) p.line([x, 160], [x, 164], { w: W.thin });
  p.rect([66, 166], [126, 194], { w: W.thin, fill: FILL.ash });
  // the outlet and the intake, the linkage, the drain
  p.line([142, 132], [150, 132], { w: W.thick });
  p.line([42, 124], [50, 124], { w: W.thick });
  p.line([142, 170], [150, 170], { w: W.medium });
  p.circle([152, 170], 1.8, { w: W.medium, fill: PAPER });
  p.line([62, 99], [56, 99], { w: W.medium });
  // temperature of each zone, on the band
  const t = (y: number, f: L): void => {
    p.text([68, y], f, { size: 1.7, baseline: 'middle', mono: true, color: INK });
  };
  t(91, fig('dryT'));
  t(108, fig('pyroT'));
  t(126, fig('oxModel'));
  t(148, fig('reductionT'));
  // the balloons, in two columns, in the order of the points, never crossing
  for (const side of ['L', 'R'] as const) {
    const ids = ITEMS.filter((id) => SPOTS[id]!.side === side).sort((a, b) => SPOTS[a]!.at[1] - SPOTS[b]!.at[1]);
    let y = 0;
    for (const id of ids) {
      const s = SPOTS[id]!;
      y = Math.max(s.at[1], y + 8.5);
      const bx = side === 'L' ? 28 : 166;
      p.line([bx + (side === 'L' ? 2.5 : -2.5), y], s.at, { w: W.thin, color: INK_2 });
      p.circle([bx, y], 2.5, { w: W.thin, fill: PAPER });
      p.text([bx, y], String(ITEMS.indexOf(id) + 1), {
        size: 1.9,
        weight: 'bold',
        anchor: 'middle',
        baseline: 'middle',
      });
    }
  }
}

const FACTS: Record<string, L> = {
  'spring-lid': l('se soulève sous la poussée du gaz', 'lifts under the gas’s push'),
  'fuel-casing': l('0,2 m³, 40 à 50 min', '0.2 m³, 40 to 50 min'),
  'chip-column': fig('bunkerKg'),
  'drying-zone': fig('dryT'),
  'pyrolysis-zone': l('dès 250 °C', 'from 250 °C'),
  'oxidation-zone': l('1 200 à 1 500 °C, rapporté', '1,200 to 1,500 °C, reported'),
  'reduction-zone': cat(l('refroidit de ', 'cools by '), fig('coolK')),
  'fuel-baffle': l('notre lecture de la figure', 'our reading of the figure'),
  'condensate-sleeve': l('60 à 80 % de l’eau du bois', '60 to 80% of the wood’s water'),
  'condensate-drain': l('vidée toutes les 8 à 10 h', 'emptied every 8 to 10 h'),
  'eccentric-lock': l('un joint de plus', 'one more joint'),
  'outer-casing': l('rouille en 2 000 à 4 000 h', 'corrodes in 2,000 to 4,000 h'),
  'air-intake': l('air en marche, gaz à l’arrêt', 'air when running, gas at a stop'),
  'air-nozzles': cat(fig('airPerKg'), l(' par kg', ' per kg')),
  'fire-box': l('se fissure en 600 à 1 000 h', 'cracks in 600 to 1,000 h'),
  'throat-ring': l('environ 700 h', 'about 700 h'),
  grate: l('400 à 700 h', '400 to 700 h'),
  'grate-linkage': l('un arbre à travers la paroi', 'a shaft through the wall'),
  'ash-pit': l('jusqu’à 3,5 % du combustible', 'up to 3.5% of the fuel'),
  'gas-outlet': cat(l('sort vers ', 'leaves at about '), fig('outletModel')),
};

export const gasifierSection: DrawingSheet = {
  id: 'gasifier-section',
  number: NUMBER,
  group: 'machine',
  title: l('Le gazogène en coupe', 'The gasifier in section'),
  description: l(
    'Le gazogène en coupe, en schéma : les vingt pièces numérotées dans l’ordre du monde « Gazogène », leur rôle en une ligne, la durée de vie rapportée de celles qui s’usent, et la température du modèle dans chaque zone, en fausses couleurs de 20 à 1 400 °C. Sans échelle et sans cote, exprès : les zones sont dans l’ordre et ont toutes la même hauteur, la gorge est un pincement quelconque, et aucune taille du foyer n’est imprimée.',
    'The gasifier in section, as a diagram: the twenty parts numbered in the order of the “Gasifier” world, their role in a line, the reported life of those that wear, and the model’s temperature in each zone, in false colours from 20 to 1,400 °C. With no scale and no dimension, on purpose: the zones are in order and all have the same height, the throat is a generic pinch, and no size of the hearth is printed.',
  ),
  scene: 'gasifier',
  parts: ['spring-lid', 'fuel-casing', 'oxidation-zone', 'reduction-zone', 'throat-ring', 'grate', 'ash-pit'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le gazogène en coupe', 'The gasifier in section'),
      subtitle: l('Schéma, sans échelle', 'Diagram, not to scale'),
      number: NUMBER,
      scale: l('sans échelle', 'not to scale') as unknown as string,
    });
    heading(d, 16, 14, l('SANS ÉCHELLE : les zones sont dans l’ordre', 'NOT TO SCALE: the zones are in order'));
    unit(d);
    // the table: the twenty parts, two blocks of ten
    const cols = [
      { label: l('N°', 'No.'), w: 7, mono: true },
      { label: l('Pièce', 'Part'), w: 36 },
      { label: l('Ce que disent les sources, ou le modèle', 'What the sources say, or the model'), w: 58 },
    ];
    const rows = (from: number): ReturnType<typeof Array.prototype.map> =>
      ITEMS.slice(from, from + 10).map((id, i) => [String(from + i + 1), name(id), FACTS[id]!]);
    grid(d, 190, 22, cols, rows(0) as never, { size: 1.7, pad: 0.55 });
    grid(d, 298, 22, cols, rows(10) as never, { size: 1.7, pad: 0.55 });
    // the false colours' scale, its two ends only
    const sx = 196;
    const sy = 132;
    heading(d, sx, sy - 12, l('FAUSSES COULEURS, ZONE PAR ZONE', 'FALSE COLOURS, ONE ZONE AT A TIME'));
    for (let i = 0; i < 40; i++) {
      const T = 20 + (i / 39) * 1380;
      d.paper().rect([sx + i * 2.6, sy], [sx + (i + 1) * 2.6, sy + 5], { w: 0, fill: heatHex(T) });
    }
    d.paper().rect([sx, sy], [sx + 104, sy + 5], { w: W.thin });
    d.paper().text([sx, sy + 7], l('20 °C', '20 °C'), { size: 1.8, baseline: 'top', mono: true });
    d.paper().text([sx + 104, sy + 7], l('1 400 °C', '1,400 °C'), {
      size: 1.8,
      baseline: 'top',
      anchor: 'end',
      mono: true,
    });
    arrow(d.paper(), [sx + 52, sy + 14], [sx + 52, sy + 8], INK_2, W.thin);
    d.paper().text([sx + 52, sy + 15], l('la même échelle dans toute la 3D', 'the same scale throughout the 3D'), {
      size: 1.7,
      baseline: 'top',
      anchor: 'middle',
      color: INK_2,
    });
    modelTag(d, sx, sy + 24, 70);
    const y = note(
      d,
      190,
      176,
      216,
      l(
        'Le gazogène est fait de deux corps, la soute au-dessus et le foyer dessous ; il dépasse du sol de 0,50 m à 2,22 m, et sa soute tient 0,2 m³. Les températures des zones sont celles du modèle au maximum du banc, des estimations : le rapport ne donne que la bande de l’oxydation, 1 200 à 1 500 °C, où le modèle reste en dessous une fois la chaleur de la paroi comptée. La 3D dessine la gorge, les tuyères et le foyer à l’échelle ; ce schéma n’en imprime aucune taille.',
        'The gasifier is made of two casings, the bunker above and the hearth below; it stands from 0.50 m to 2.22 m above the ground, and its bunker holds 0.2 m³. The zones’ temperatures are the model’s at the bench’s maximum, estimates: the report gives only the oxidation band, 1,200 to 1,500 °C, which the model stays under once the wall’s heat is counted. The 3D draws the throat, the nozzles and the fire box to scale; this diagram prints no size of them.',
      ),
      { size: 1.85 },
    );
    marksLegend(d, 190, y + 2, 120);
    return d;
  },
};
