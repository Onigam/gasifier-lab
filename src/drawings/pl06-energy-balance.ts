import { Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { DIESEL_LHV, LHV_AT_8 } from '../sim/machine';
import { TABLE_3_13 } from '../sim/reported';
import { tableIdle, tableMax, tablePart, type PointResult } from '../sim/runs';
import {
  cat,
  fig,
  FILL,
  grid,
  heading,
  INKS,
  marksLegend,
  modelTag,
  note,
  numL,
  RED,
  type Cell,
  type Mark,
} from './draw';

// PL-G06: where the energy goes at the bench's three loads. Two Sankeys of the maximum on one scale: what the bench's table gives (the wood and the diesel it burned, the gas that came on, the shaft's 40 kW) and what the model finds at the same point. Then the table's three loads, the report beside the model; the two lines the table
// prints wrongly are shown as printed, in red, with the recomputed figure under them (research §2.9, conflicts 3 and 4). Nothing here is set to the table: the model's chips are 16 % under it, and the sheet says so.

export const NUMBER = 'PL-G06';

const kwWood = (kg: number): number => (kg * LHV_AT_8) / 3.6e6;
const kwDiesel = (kg: number): number => (kg * DIESEL_LHV) / 3.6e6;

interface Flow {
  wood: number;
  diesel: number;
  gas: number;
  gl: number;
  shaft: number;
  el: number;
}
interface Marks {
  wood: Mark;
  diesel: Mark;
  gas: Mark;
  gl: Mark;
  shaft: Mark;
  el: Mark;
}

/** The bench's maximum, from the table's own kilos and its 56.3 kW of gasifier losses: derived, except the losses and the shaft, which it prints. */
export function benchFlow(): Flow {
  const wood = kwWood(TABLE_3_13.chipsKgH[0]);
  const diesel = kwDiesel(TABLE_3_13.dieselKgH[0]);
  const gl = TABLE_3_13.gasifierLossKw[0];
  const shaft = TABLE_3_13.powerKw[0];
  return { wood, diesel, gas: wood - gl, gl, shaft, el: wood + diesel - gl - shaft };
}
const BENCH_MARKS: Marks = { wood: '†', diesel: '†', gas: '†', gl: '', shaft: '', el: '†' };

/** The model at the same point: its own kilowatts, run to its temperatures. */
export function modelFlow(): Flow {
  const p = tableMax();
  const gas = p.woodKw - p.gasifierLossKw;
  return {
    wood: p.woodKw,
    diesel: p.dieselKw,
    gas,
    gl: p.gasifierLossKw,
    shaft: p.power,
    el: gas + p.dieselKw - p.power,
  };
}
const MODEL_MARKS: Marks = { wood: '†', diesel: '†', gas: '†', gl: '†', shaft: '', el: '†' };

const K = 0.27; // mm of ribbon per kW, the same on both Sankeys

function ribbon(
  d: Drawing,
  xa: number,
  ya: number,
  ha: number,
  xb: number,
  yb: number,
  hb: number,
  fill: string,
): void {
  const xm = (xa + xb) / 2;
  d.paper().pathPaper(
    `M ${xa} ${ya} C ${xm} ${ya} ${xm} ${yb} ${xb} ${yb} L ${xb} ${yb + hb} C ${xm} ${yb + hb} ${xm} ${ya + ha} ${xa} ${ya + ha} Z`,
    { w: W.thin, color: INK_2, fill, opacity: 0.9 },
  );
}

function sankey(d: Drawing, x0: number, top: number, f: Flow, m: Marks): void {
  const p = d.paper();
  const A = x0;
  const B = x0 + 50;
  const C = x0 + 104;
  const D = x0 + 148;
  const bar = 2.4;
  const gap = 5;
  const hw = f.wood * K;
  const hg = f.gas * K;
  const hl = f.gl * K;
  const hd = f.diesel * K;
  const hs = f.shaft * K;
  const he = f.el * K;
  const kw = (v: number, mark: Mark): L => numL(v, 0, ' kW', mark);
  // the wood splits in two at the gasifier: the gas that carries on, and the losses
  ribbon(d, A + bar, top, hg, B, top, hg, FILL.hot);
  ribbon(d, A + bar, top + hg, hl, B, top + hg + gap, hl, FILL.loss);
  // the gas goes on to the engine, where the diesel joins it
  ribbon(d, B + bar, top, hg, C, top, hg, FILL.hot);
  ribbon(d, C - 22 + bar, top + hg + 18, hd, C, top + hg, hd, FILL.wood);
  // the engine's two outputs: the shaft, and the losses
  ribbon(d, C + bar, top, hs, D, top, hs, FILL.green);
  ribbon(d, C + bar, top + hs, he + 0, D, top + hs + gap, he, FILL.loss);
  const solid = (x: number, y: number, h: number, c: string): void => {
    p.rect([x, y], [x + bar, y + h], { w: W.thin, fill: c, color: INK });
  };
  solid(A, top, hw, INKS.diesel);
  solid(B, top, hg, INKS.hot);
  solid(B, top + hg + gap, hl, INKS.loss);
  solid(C, top, hg + hd, INKS.hot);
  solid(D, top, hs, INKS.work);
  solid(D, top + hs + gap, he, INKS.loss);
  solid(C - 22, top + hg + 18, hd, INKS.diesel);
  const label = (x: number, y: number, name: L, v: number, mark: Mark, anchor: 'start' | 'middle' | 'end'): void => {
    p.text([x, y], name, { size: 1.8, anchor, baseline: 'bottom', weight: 'bold', halo: true });
    p.text([x, y + 3], kw(v, mark), { size: 1.8, anchor, baseline: 'bottom', mono: true, halo: true });
  };
  label(A, top - 4, l('bois', 'wood'), f.wood, m.wood, 'start');
  label((B + C) / 2 + 2, top - 4, l('gaz', 'gas'), f.gas, m.gas, 'middle');
  label(B + bar + 2, top + hg + gap + hl / 2 - 1, l('pertes du gazogène', 'gasifier losses'), f.gl, m.gl, 'start');
  label(C - 22, top + hg + 18 + hd + 5, l('gazole', 'diesel'), f.diesel, m.diesel, 'start');
  label(D + bar + 2, top + hs / 2 + 1, l('arbre', 'shaft'), f.shaft, m.shaft, 'start');
  label(D + bar + 2, top + hs + gap + he / 2 - 1, l('pertes du moteur', 'engine losses'), f.el, m.el, 'start');
  // the engine's own efficiency, on its node
  p.text([C + bar / 2, top + hg + hd + 3], l('moteur', 'engine'), {
    size: 1.8,
    anchor: 'middle',
    baseline: 'top',
    color: INK_2,
  });
}

const cellOf = (v: number, digits: number, mark: Mark, red = false): Cell => ({
  t: numL(v, digits, '', mark),
  mono: true,
  color: red ? RED : undefined,
});

function loadsTable(d: Drawing, x: number, y: number): number {
  const pts: PointResult[] = [tableMax(), tablePart(), tableIdle()];
  const T = TABLE_3_13;
  const share = (i: number): number =>
    (kwDiesel(T.dieselKgH[i]!) / (kwWood(T.chipsKgH[i]!) + kwDiesel(T.dieselKgH[i]!))) * 100;
  const eff = (i: number): number => (T.powerKw[i]! / (kwWood(T.chipsKgH[i]!) + kwDiesel(T.dieselKgH[i]!))) * 100;
  const dash: Cell = { t: l('—', '—'), mono: true };
  const row = (label: L, rep: Cell[], mod: Cell[]): (Cell | L)[] => [label, ...rep, ...mod];
  const three = (vals: readonly number[], digits: number, mark: Mark, red: number[] = []): Cell[] =>
    vals.map((v, i) => cellOf(v, digits, mark, red.includes(i)));
  const rows: (Cell | L)[][] = [
    row(
      l('Copeaux, kg/h', 'Chips, kg/h'),
      three(T.chipsKgH, 1, ''),
      pts.map((p) => cellOf(p.chips, 1, '†')),
    ),
    row(
      l('Énergie du gaz, MJ/Nm³', 'Gas energy, MJ/Nm³'),
      three(T.gasMJ, 2, ''),
      pts.map((p) => cellOf(p.gasMJ, 2, '†')),
    ),
    row(
      l('Rendement du gazogène à froid, %', 'Cold-gas efficiency, %'),
      three(T.coldGasPct, 1, ''),
      pts.map((p) => cellOf(p.coldGasPct, 1, '†')),
    ),
    row(
      l('Part du gazole, %, imprimée', 'Diesel’s share, %, as printed'),
      three(T.dieselSharePct, 1, '', [0]),
      pts.map((p) => cellOf(p.dieselSharePct, 1, '†')),
    ),
    row(
      l('… recalculée sur ses kilos', '… recomputed from its own kilos'),
      [0, 1, 2].map((i) => cellOf(share(i), 1, '†')),
      [dash, dash, dash],
    ),
    row(
      l('Rendement total, %, imprimé', 'Total efficiency, %, as printed'),
      three(T.totalEffPct, 1, '', [1]),
      pts.map((p) => cellOf(p.totalEffPct, 1, '†')),
    ),
    row(
      l('… recalculé', '… recomputed'),
      [0, 1, 2].map((i) => cellOf(eff(i), 1, '†')),
      [dash, dash, dash],
    ),
    row(
      l('Pertes, kW', 'Losses, kW'),
      three(T.lossesKw, 1, ''),
      pts.map((p) => cellOf(p.lossesKw, 1, '†')),
    ),
  ];
  return grid(
    d,
    x,
    y,
    [
      { label: l('Au banc et dans le modèle', 'At the bench and in the model'), w: 62 },
      { label: l('Rapport, maximum', 'Report, maximum'), w: 22, align: 'end', mono: true },
      { label: l('Rapport, partiel', 'Report, part load'), w: 22, align: 'end', mono: true },
      { label: l('Rapport, ralenti', 'Report, idle'), w: 22, align: 'end', mono: true },
      { label: l('Modèle, maximum', 'Model, maximum'), w: 22, align: 'end', mono: true },
      { label: l('Modèle, partiel', 'Model, part load'), w: 22, align: 'end', mono: true },
      { label: l('Modèle, ralenti', 'Model, idle'), w: 22, align: 'end', mono: true },
    ],
    rows,
    { size: 1.75, pad: 0.7 },
  );
}

/** The three loads as bars: what went in, what came out at the shaft. */
function bars(d: Drawing, x: number, y: number): void {
  const p = d.paper();
  const s = 0.6; // mm per kW
  const T = TABLE_3_13;
  const inKw = [0, 1, 2].map((i) => kwWood(T.chipsKgH[i]!) + kwDiesel(T.dieselKgH[i]!));
  const names: L[] = [l('maximum', 'maximum'), l('partiel', 'part load'), l('ralenti', 'idle')];
  const effs: L[] = [l(`${'18'} %`, '18%'), fig('partEff'), l('0 %', '0%')];
  const ins: L[] = [fig('kwIn'), fig('partIn'), fig('idleIn')];
  for (let i = 0; i < 3; i++) {
    const yy = y + i * 11;
    const out = T.powerKw[i]!;
    p.text([x, yy + 3], names[i]!, { size: 1.8, baseline: 'middle', weight: 'bold' });
    p.rect([x + 24, yy], [x + 24 + inKw[i]! * s, yy + 6], { w: W.thin, fill: FILL.loss });
    if (out > 0) p.rect([x + 24, yy], [x + 24 + out * s, yy + 6], { w: W.thin, fill: INKS.work, color: INKS.work });
    p.text(
      [x + 24 + inKw[i]! * s + 3, yy + 3],
      cat(numL(out, 0, ' kW', ''), l(' sur ', ' of '), ins[i]!, l(' : ', ': '), effs[i]!),
      { size: 1.8, baseline: 'middle', mono: true },
    );
  }
}

function draw(d: Drawing): void {
  const p = d.paper();
  modelTag(d, 222, 20, 184);
  heading(d, 18, 28, l('AU BANC : CE QUE DIT LE RAPPORT', 'AT THE BENCH: WHAT THE REPORT SAYS'), { size: 2.1 });
  heading(d, 222, 28, l('DANS LE MODÈLE, AU MÊME POINT', 'IN THE MODEL, AT THE SAME POINT'), { size: 2.1 });
  p.text([18, 36], l('maximum : 40 kW à l’arbre', 'maximum: 40 kW at the shaft'), { size: 1.8, color: INK_2 });
  p.text([222, 36], l('mêmes 40 kW à l’arbre, même échelle', 'the same 40 kW at the shaft, the same scale'), {
    size: 1.8,
    color: INK_2,
  });
  sankey(d, 18, 52, benchFlow(), BENCH_MARKS);
  sankey(d, 222, 52, modelFlow(), MODEL_MARKS);

  heading(d, 18, 130, l('LES TROIS CHARGES, LE RAPPORT ET LE MODÈLE', 'THE THREE LOADS, THE REPORT AND THE MODEL'), {
    size: 2.1,
  });
  const h = loadsTable(d, 18, 138);

  heading(
    d,
    18,
    138 + h + 9,
    l('OÙ VA L’ÉNERGIE, AUX TROIS CHARGES DU BANC', 'WHERE THE ENERGY GOES, AT THE BENCH’S THREE LOADS'),
    {
      size: 2.1,
    },
  );
  bars(d, 18, 138 + h + 19);
  // the key of the bars
  const ky = 138 + h + 54;
  p.rect([18, ky], [24, ky + 3], { w: W.thin, fill: INKS.work, color: INKS.work });
  p.text([26, ky + 1.5], l('travail à l’arbre', 'work at the shaft'), { size: 1.8, baseline: 'middle' });
  p.rect([66, ky], [72, ky + 3], { w: W.thin, fill: FILL.loss });
  p.text([74, ky + 1.5], l('perdu', 'lost'), { size: 1.8, baseline: 'middle' });

  heading(
    d,
    222,
    124,
    l('CE QUE LE TABLEAU DIT, ET CE QU’EN FAIT LE MODÈLE', 'WHAT THE TABLE SAYS, AND WHAT THE MODEL MAKES OF IT'),
    {
      size: 2.1,
    },
  );
  let y = 138;
  y = note(
    d,
    222,
    y,
    184,
    cat(
      l('Le modèle brûle ', 'The model burns '),
      fig('chipsModel'),
      l(
        ' de copeaux pour les mêmes 40 kW ; le banc en a brûlé 41, le modèle en brûle donc ',
        ' of chips for the same 40 kW; the bench burned 41, so the model burns ',
      ),
      fig('woodGap'),
      l(
        ' de moins. Aux deux autres charges il reste en dessous de même. Son gaz est un peu plus pauvre, ',
        ' less. At the other two loads it falls short in the same way. Its gas is a little poorer, ',
      ),
      numL(tableMax().gasMJ, 2, ' MJ/Nm³', '†'),
      l(' contre 5,60 MJ/Nm³, mais son gazogène rend mieux, ', ' against 5.60 MJ/Nm³, but its gasifier does better, '),
      fig('cgeModel'),
      l(' contre 71,1 %. Le tout ressort à ', ' against 71.1%. The whole comes out at '),
      fig('effModel'),
      l(', là où le banc dit 18 %.', ', where the bench says 18%.'),
    ),
    { size: 1.8 },
  );
  y = note(
    d,
    222,
    y + 1,
    184,
    cat(
      l(
        'Le tableau du rapport se contredit en deux endroits, montrés en rouge. Au maximum il imprime la part du gazole à 18,9 % ; ses propres kilos donnent ',
        'The report’s table contradicts itself in two places, shown in red. At the maximum it prints the diesel’s share as 18.9%; its own kilos give ',
      ),
      fig('dieselShareMax'),
      l(
        '. À charge partielle il imprime un rendement total de 5,3 % ; ses propres chiffres donnent ',
        '. At part load it prints a total efficiency of 5.3%; its own figures give ',
      ),
      fig('partEff'),
      l(
        '. On garde l’imprimé et le recalcul côte à côte, et le modèle n’est réglé sur aucun des deux.',
        '. The printed figure and the recomputation stand side by side, and the model is set to neither.',
      ),
    ),
    { size: 1.8 },
  );
  y = note(
    d,
    222,
    y + 1,
    184,
    l(
      'Ce que le modèle ne ferme pas : 5,60 MJ/Nm³, 71 % et la composition publiée du gaz ne tiennent pas ensemble sur un même bilan du bois. L’écart reste ouvert. Cette comparaison n’est pas une validation : un tableau, une machine, lu dans un résumé du rapport.',
      'What the model does not close: 5.60 MJ/Nm³, 71% and the published make-up of the gas do not hold together on one balance of the wood. The gap stays open. This comparison is not a validation: one table, one machine, read in a summary of the report.',
    ),
    { size: 1.8 },
  );
  y = note(
    d,
    222,
    y + 1,
    184,
    l(
      'Au ralenti, rien ne sort à l’arbre : l’énergie entrée sert à faire tourner le moteur lui-même, qui reste allumé.',
      'At idle nothing comes out at the shaft: the energy that goes in turns the engine itself, which stays lit.',
    ),
    { size: 1.8 },
  );
  marksLegend(d, 222, y + 3, 184);
}

export const energyBalance: DrawingSheet = {
  id: 'energy-balance',
  number: NUMBER,
  group: 'model',
  title: l('Où va l’énergie : le banc et le modèle', 'Where the energy goes: the bench and the model'),
  description: l(
    'Deux diagrammes de Sankey à la même échelle, au maximum : ce que dit le tableau du rapport (221 kW entrés, 40 kW à l’arbre) et ce que trouve le modèle au même point. Dessous, les trois charges du banc, le rapport à côté du modèle, avec les deux lignes que le tableau imprime à tort montrées en rouge et recalculées.',
    'Two Sankey diagrams on one scale, at the maximum: what the report’s table says (221 kW in, 40 kW at the shaft) and what the model finds at the same point. Below, the bench’s three loads, the report beside the model, with the two lines the table prints wrongly shown in red and recomputed.',
  ),
  scene: 'gas-train',
  parts: ['hot-gas-pipe', 'filter-box', 'gas-cooler', 'gas-air-mixer', 'cylinder-cutaway'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Où va l’énergie', 'Where the energy goes'),
      subtitle: l('Le banc et le modèle, sans échelle de longueur', 'The bench and the model, no length scale'),
      number: NUMBER,
      scale: l('sans échelle', 'not to scale') as unknown as string,
    });
    draw(d);
    return d;
  },
};
