import { Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { CONVERTED, FLEET } from '../sim/reported';
import { fullPower } from '../sim/runs';
import { FIG } from '../data/figures';
import { cat, fig, FILL, heading, INKS, marksLegend, modelTag, note, numL, RED, type Mark } from './draw';

// PL-G07: what an engine loses when it burns wood gas. The report's tables of 14 engines (power on diesel alone, then on the gas of the chips), the two diesels converted to spark; the mixture's energy beside petrol's. The model's one engine, the MF 1100, is marked on its bar, and the sheet says why that agreement is worth little.
// Everything on the bars is the report's (no mark); the percentages are computed from them (†); the model's own numbers are marked as the model's.

export const NUMBER = 'PL-G07';

const S = 1.1; // mm per kW
const X0 = 96;
const PITCH = 8.2;
const BAR = 3.3;

export interface EngineRow {
  name: string;
  litres: number;
  before: number;
  after: number;
  spark: boolean;
  gasAlone: boolean;
}

/** The fleet by displacement, then the two converted diesels: the report's numbers, read from the simulation's table of what it prints. */
export function engineRows(): { fleet: EngineRow[]; converted: EngineRow[] } {
  const fleet = [...FLEET]
    .sort((a, b) => a.litres - b.litres)
    .map((e) => ({
      name: e.name,
      litres: e.litres,
      before: e.before,
      after: e.after,
      spark: e.spark,
      gasAlone: false,
    }));
  const converted = CONVERTED.map((e) => ({
    name: e.name,
    litres: e.litres,
    before: e.before,
    after: e.after,
    spark: true,
    gasAlone: true,
  }));
  return { fleet, converted };
}

/** The loss on gas, in per cent, from the report's two powers. */
export const lossPct = (e: EngineRow): number => (1 - e.after / e.before) * 100;

function rows(d: Drawing, y0: number, list: EngineRow[], hot: string): void {
  const p = d.paper();
  list.forEach((e, i) => {
    const y = y0 + i * PITCH;
    const mf = e.name.includes('MF 1100');
    if (mf) p.rect([16, y - 0.4], [258, y + PITCH - 0.6], { w: 0, fill: FILL.band, color: FILL.band });
    p.text(
      [18, y + PITCH / 2 - 0.3],
      cat(
        e.name,
        l(` · ${String(e.litres).replace('.', ',')} L`, ` · ${e.litres} L`),
        e.spark ? l(' (bougies)', ' (spark)') : '',
      ),
      { size: 1.75, baseline: 'middle', weight: mf ? 'bold' : 'normal' },
    );
    p.rect([X0, y], [X0 + e.before * S, y + BAR], { w: W.thin, fill: FILL.steel });
    p.rect([X0, y + BAR], [X0 + e.after * S, y + BAR * 2], { w: W.thin, fill: hot, color: INKS.hot });
    const val = (v: number, yy: number, edge: number): void => {
      p.text([edge - 0.8, yy + BAR / 2], numL(v, Number.isInteger(v) ? 0 : 1, '', ''), {
        size: 1.5,
        anchor: 'end',
        baseline: 'middle',
        mono: true,
      });
    };
    val(e.before, y, X0 + e.before * S);
    val(e.after, y + BAR, X0 + e.after * S);
    p.text([256, y + PITCH / 2 - 0.3], numL(-lossPct(e), 0, [' %', '%'], '†'), {
      size: 1.75,
      anchor: 'end',
      baseline: 'middle',
      mono: true,
    });
  });
}

function draw(d: Drawing): void {
  const p = d.paper();
  const { fleet, converted } = engineRows();
  heading(
    d,
    18,
    24,
    l('LA PUISSANCE, AU GAZOLE SEUL PUIS SUR LE GAZ DU BOIS, kW', 'POWER, ON DIESEL ALONE AND THEN ON WOOD GAS, kW'),
    {
      size: 2.1,
    },
  );
  // the key
  p.rect([X0, 33], [X0 + 6, 36], { w: W.thin, fill: FILL.steel });
  p.text([X0 + 8, 34.5], l('gazole seul', 'diesel alone'), { size: 1.75, baseline: 'middle' });
  p.rect([X0 + 40, 33], [X0 + 46, 36], { w: W.thin, fill: FILL.hot, color: INKS.hot });
  p.text([X0 + 48, 34.5], l('sur le gaz du bois', 'on wood gas'), { size: 1.75, baseline: 'middle' });
  p.text([256, 34.5], l('perte', 'loss'), { size: 1.75, anchor: 'end', baseline: 'middle', weight: 'bold' });
  const Y1 = 40;
  rows(d, Y1, fleet, FILL.hot);
  // the model's engine, on the MF 1100's bar: the highest speed on dual fuel
  const mfIndex = fleet.findIndex((e) => e.name.includes('MF 1100'));
  const my = Y1 + mfIndex * PITCH;
  const modelKw = fullPower().power;
  const mx = X0 + modelKw * S;
  p.line([mx, my + BAR - 0.6], [mx, my + BAR * 2 + 1.4], { w: W.medium, color: RED });
  p.text([mx + 1.6, my + BAR * 2 + 0.6], cat(l('modèle : ', 'model: '), fig('powerModel')), {
    size: 1.7,
    baseline: 'middle',
    color: RED,
    halo: true,
  });
  const Y2 = Y1 + fleet.length * PITCH + 11;
  heading(
    d,
    18,
    Y2 - 8,
    l('DEUX DIESELS CONVERTIS À L’ÉTINCELLE, GAZ SEUL', 'TWO DIESELS CONVERTED TO SPARK, GAS ALONE'),
    {
      size: 2.1,
    },
  );
  rows(d, Y2, converted, FILL.hot);
  // the rule of thumb against the measured losses
  const diesels = fleet.filter((e) => !e.spark);
  const lo = Math.min(...diesels.map(lossPct));
  const hi = Math.max(...diesels.map(lossPct));
  const ford = fleet.find((e) => e.spark)!;
  let y = Y2 + converted.length * PITCH + 8;
  const perL = diesels.map((e) => e.after / e.litres);
  const mf = fleet[mfIndex]!;
  y = note(
    d,
    18,
    y,
    232,
    cat(
      l(
        'La règle publiée dit 15 à 20 % de perte en double carburant à injection directe, environ 30 % à bougies. Les tableaux du livre sont moins réguliers : de ',
        'The published rule says 15 to 20% lost on dual fuel with direct injection, about 30% on spark. The book’s tables are less regular: from ',
      ),
      numL(lo, 0, [' %', '%'], '†'),
      l(' à ', ' to '),
      numL(hi, 0, [' %', '%'], '†'),
      l(' pour les diesels au double carburant, ', ' for the diesels on dual fuel, '),
      numL(lossPct(ford), 0, [' %', '%'], '†'),
      l(
        ' pour le Ford 5000 à bougies. Le MF 1100 (64 → 51 kW, vers 2 170 tr/min) perd ',
        ' for the spark-ignition Ford 5000. The MF 1100 (64 to 51 kW, at about 2,170 rpm) loses ',
      ),
      numL(lossPct(mf), 0, [' %', '%'], '†'),
      l(', au milieu des autres ; pourtant il donne ', ', in the middle of the others; yet it gives '),
      numL(mf.after / mf.litres, 1, [' kW par litre', ' kW per litre'], '†'),
      l(
        ' sur le gaz, le plus haut des diesels du livre, qui vont de ',
        ' on gas, the highest of the book’s diesels, which run from ',
      ),
      numL(Math.min(...perL), 1, '', '†'),
      l(' à ', ' to '),
      numL(Math.max(...perL), 1, '', '†'),
      l(' kW par litre.', ' kW per litre.'),
    ),
    { size: 1.8 },
  );
  note(
    d,
    18,
    y + 1,
    232,
    l(
      'Les puissances sont celles du livre, lues sur ses tableaux ; le régime n’y est pas toujours donné, et les moteurs ne sont pas tous au même. Les pourcentages sont calculés sur ces deux puissances.',
      'The powers are the book’s, read from its tables; the speed is not always given, and the engines are not all at the same one. The percentages are computed from those two powers.',
    ),
    { size: 1.8, color: INK_2 },
  );

  // right column: the mixture
  const XR = 268;
  heading(d, XR, 24, l('L’ÉNERGIE DU MÉLANGE, kJ/m³', 'THE MIXTURE’S ENERGY, kJ/m³'), { size: 2.1 });
  const mix: [L, number, Mark, string][] = [
    [l('essence et air', 'petrol and air'), 3800, '', FILL.steel],
    [l('gaz du bois et air', 'wood gas and air'), 2500, '', FILL.hot],
    [l('gaz du bois et air, modèle', 'wood gas and air, model'), Math.round(FIG.mixMJ.v * 1000), '†', FILL.hot],
  ];
  mix.forEach(([name, v, mark, fill], i) => {
    const yy = 34 + i * 11;
    p.text([XR, yy], name, { size: 1.75, baseline: 'top' });
    p.rect([XR, yy + 3.2], [XR + v * 0.034, yy + 7.2], { w: W.thin, fill, color: mark ? RED : INK });
    p.text([XR + v * 0.034 + 1.5, yy + 5.2], numL(v, 0, '', mark), { size: 1.75, baseline: 'middle', mono: true });
  });
  let yr = 34 + 3 * 11 + 2;
  yr = note(
    d,
    XR,
    yr,
    138,
    cat(
      l(
        'Un mélange de gaz du bois et d’air contient environ 35 % de moins d’énergie qu’un mélange d’essence et d’air : à volume égal, le moteur travaille moins, et c’est la première raison de la perte. Le modèle trouve ',
        'A mixture of wood gas and air holds about 35% less energy than one of petrol and air: for the same volume the engine does less work, and that is the first reason for the loss. The model finds ',
      ),
      fig('mixMJ'),
      l(' sur la composition médiane du rapport.', ' on the middle of the report’s composition.'),
    ),
    { size: 1.8 },
  );
  modelTag(d, XR, yr + 4, 138);
  yr = note(
    d,
    XR,
    yr + 12,
    138,
    cat(
      l(
        'Au régime le plus haut en double carburant, le modèle donne ',
        'At the highest speed on dual fuel the model gives ',
      ),
      fig('powerModel'),
      l(' contre 51 kW mesurés, soit ', ' against 51 kW measured, which is '),
      numL((modelKw / 51 - 1) * 100, 0, [' %', '%'], '†'),
      l(
        ' de plus. Cet accord vaut peu : selon le rendement qu’on lui donne, que personne n’a mesuré, il va de ',
        ' more. That agreement is worth little: depending on an efficiency that nobody measured, it goes from ',
      ),
      fig('engineLow'),
      l(' à ', ' to '),
      fig('engineHigh'),
      l(', et le même modèle lit environ ', ', and the same model reads about '),
      fig('fleetHigh'),
      l(
        ' trop haut les autres moteurs du livre, parce que le MF 1100 était le meilleur du lot au litre. À bougies, gaz seul, il trouve environ ',
        ' high on the book’s other engines, because the MF 1100 was the best of the lot per litre. On spark, gas alone, it finds about ',
      ),
      fig('sparkModel'),
      l(
        ' : personne n’a mesuré ce moteur, mais deux diesels convertis ont perdu la moitié environ de leur puissance. Le modèle n’a ni flamme lente, ni cognement, ni calage.',
        ': nobody measured that engine, but two converted diesels lost about half their power. The model has no slow flame, no knock and no timing.',
      ),
    ),
    { size: 1.8 },
  );
  marksLegend(d, XR, yr + 2, 138);
}

export const enginePower: DrawingSheet = {
  id: 'engine-power',
  number: NUMBER,
  group: 'model',
  title: l('Ce que perd un moteur au gaz de bois', 'What an engine loses on wood gas'),
  description: l(
    'La puissance de quatorze moteurs du livre, au gazole seul puis sur le gaz du bois, et de deux diesels convertis à l’étincelle ; l’énergie d’un mélange de gaz et d’air à côté de celle de l’essence. Le moteur du modèle est marqué sur la barre du MF 1100, avec la raison pour laquelle cet accord vaut peu.',
    'The power of fourteen of the book’s engines, on diesel alone and then on wood gas, and of two diesels converted to spark; the energy of a gas-and-air mixture beside petrol’s. The model’s engine is marked on the MF 1100’s bar, with the reason why that agreement is worth little.',
  ),
  scene: 'gas-train',
  parts: ['gas-air-mixer', 'cylinder-cutaway', 'exhaust-pipe'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Ce que perd un moteur', 'What an engine loses'),
      subtitle: l('Le gazole seul et le gaz du bois, côte à côte', 'Diesel alone and wood gas, side by side'),
      number: NUMBER,
      scale: l('sans échelle', 'not to scale') as unknown as string,
    });
    draw(d);
    return d;
  },
};
