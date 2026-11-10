import { Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { GasifierSim } from '../sim/engine';
import { ZONE_EDGES } from '../sim/journey';
import { cat, chart, FILL, fig, grid, heading, INKS, marksLegend, modelTag, note, RED } from './draw';

// PL-G05: what surrounds a chip on its journey, from the model: the temperature of the chip and of the gas, the gas's make-up, the tar, the water and the mass left in the chip, against the journey's cursor. The cursor is the simulation's: the zones are in order and NOT to scale, on purpose (a height would be the
// hearth's sizes in disguise: research §A.2, R2). The report gives bands, not a profile: the oxidation's 1,200 to 1,500 °C, the pyrolysis's start at 250 °C, the gas's bands at the outlet; they are drawn beside the model, which is never set to them. Every curve is a MODEL RESULT, an estimate between the model's own end points.

export const NUMBER = 'PL-G05';

export interface JourneyPoint {
  s: number;
  chipT: number;
  gasT: number;
  CO: number;
  H2: number;
  CH4: number;
  CO2: number;
  H2O: number;
  N2: number;
  tar: number;
  water: number;
  mass: number;
}

let cache: JourneyPoint[] | null = null;

/** The analyser along the cursor at the bench's maximum, 41 points: the model's own, read from the simulation (never typed). */
export function journeyProfile(): JourneyPoint[] {
  if (cache) return cache;
  const sim = new GasifierSim();
  sim.applyScenario('measured-hour');
  for (let i = 0; i < 240; i++) sim.step(1 / 60);
  const out: JourneyPoint[] = [];
  for (let k = 0; k <= 40; k++) {
    const s = k / 40;
    sim.set({ journey: s });
    sim.step(1 / 60);
    const a = sim.state.analyser;
    out.push({
      s,
      chipT: a.chipT,
      gasT: a.gasT,
      CO: a.xCO * 100,
      H2: a.xH2 * 100,
      CH4: a.xCH4 * 100,
      CO2: a.xCO2 * 100,
      H2O: a.xH2O * 100,
      N2: a.xN2 * 100,
      tar: a.tarShare,
      water: a.chipWater,
      mass: a.chipMass,
    });
  }
  cache = out;
  return out;
}

const ZONE_NAME: Record<string, L> = {
  drying: l('séchage', 'drying'),
  pyrolysis: l('pyrolyse', 'pyrolysis'),
  oxidation: l('oxydation', 'oxidation'),
  reduction: l('réduction', 'reduction'),
  ash: l('cendrier', 'ash pit'),
};
const ZONE_FILL = ['#f6efe0', '#f0e6d2', '#f7e1cf', '#f0dccf', '#ebe7df'];

function spans(): { from: number; to: number; fill: string }[] {
  let from = 0;
  return ZONE_EDGES.map(([, edge], i) => {
    const s = { from, to: edge, fill: ZONE_FILL[i]! };
    from = edge;
    return s;
  });
}

/** The zones' names, inside the chart at its top, so that they never meet the axis's title. */
function zoneNames(d: Drawing, x: number, y: number, w: number): void {
  let from = 0;
  for (const [z, edge] of ZONE_EDGES) {
    const last = z === 'ash';
    d.paper().text([last ? x + w - 0.8 : x + ((from + edge) / 2) * w, y + 1.2], ZONE_NAME[z]!, {
      size: 1.7,
      anchor: last ? 'end' : 'middle',
      baseline: 'top',
      color: INK_2,
      halo: true,
    });
    from = edge;
  }
}

function draw(d: Drawing): void {
  const prof = journeyProfile();
  const xs = prof.map((p) => p.s);
  const axis = { xMin: 0, xMax: 1, xTicks: [0, 0.3, 0.55, 0.7, 0.95, 1] };
  const xLabel = l(
    'curseur du voyage, du couvercle au cendrier (zones dans l’ordre, pas à l’échelle)',
    'the journey’s cursor, from the lid to the ash pit (zones in order, not to scale)',
  );
  const X0 = 34;
  const W0 = 196;
  const H0 = 74;
  // 1: the temperature, one for the chip and the gas around it (the model has no more)
  const Y0 = 36;
  const map = chart(
    d,
    X0,
    Y0,
    W0,
    H0,
    [
      {
        x: xs,
        y: prof.map((p) => p.chipT),
        color: INKS.hot,
        label: l(
          'la plaquette et le gaz autour d’elle (une seule température)',
          'the chip and the gas around it (one temperature)',
        ),
        w: W.thick,
      },
    ],
    {
      ...axis,
      yMin: 0,
      yMax: 1600,
      yTicks: [0, 400, 800, 1200, 1600],
      xLabel,
      yLabel: l('TEMPÉRATURE, °C', 'TEMPERATURE, °C'),
      spans: spans(),
      legendAt: 4,
      legendTop: 7,
    },
  );
  zoneNames(d, X0, Y0, W0);
  const ink = d.paper();
  // the report's bands, in red beside the model: the oxidation's 1,200 to 1,500 °C, the pyrolysis's start near 250 °C
  const [bx0, by0] = map(0.55, 1500);
  const [bx1, by1] = map(0.7, 1200);
  ink.rect([bx0, by0], [bx1, by1], { w: W.medium, color: RED, dash: [2, 1] });
  ink.text([bx0 - 1.5, (by0 + by1) / 2], l('bande du rapport : 1 200 à 1 500 °C', 'report’s band: 1,200 to 1,500 °C'), {
    size: 1.7,
    anchor: 'end',
    baseline: 'middle',
    color: RED,
    halo: true,
  });
  const [lx0, ly250] = map(0, 250);
  const [lx1] = map(1, 250);
  ink.line([lx0, ly250], [lx1, ly250], { w: W.thin, color: RED, dash: [2, 1] });
  const [tx] = map(0.95, 250);
  ink.text(
    [tx - 1, ly250 - 1.2],
    l('la pyrolyse commence vers 250 °C (rapport)', 'pyrolysis starts near 250 °C (report)'),
    {
      size: 1.7,
      anchor: 'end',
      baseline: 'bottom',
      color: RED,
      halo: true,
    },
  );
  // the model's own hottest point, read from the profile
  const peak = prof.reduce((a, p) => (p.chipT > a.chipT ? p : a));
  const [qx, qy] = map(peak.s, peak.chipT);
  ink.circle([qx, qy], 0.9, { w: W.medium, color: INKS.hot, fill: INKS.hot });
  ink.text([qx + 2, qy - 1.5], cat(l('le modèle : ', 'the model: '), fig('oxModel')), {
    size: 1.8,
    anchor: 'start',
    baseline: 'bottom',
    halo: true,
  });
  // 2: the gas
  const Y1 = 142;
  chart(
    d,
    X0,
    Y1,
    W0,
    H0,
    [
      { x: xs, y: prof.map((p) => p.H2O), color: '#7aa6c9', label: l('H₂O', 'H₂O') },
      { x: xs, y: prof.map((p) => p.N2), color: INK_2, label: l('N₂', 'N₂') },
      { x: xs, y: prof.map((p) => p.CO), color: INKS.hot, label: l('CO', 'CO'), w: W.thick },
      { x: xs, y: prof.map((p) => p.CO2), color: '#6b6b6b', label: l('CO₂', 'CO₂') },
      { x: xs, y: prof.map((p) => p.H2), color: INKS.work, label: l('H₂', 'H₂') },
      { x: xs, y: prof.map((p) => p.CH4), color: INKS.diesel, label: l('CH₄', 'CH₄') },
    ],
    {
      ...axis,
      yMin: 0,
      yMax: 100,
      yTicks: [0, 20, 40, 60, 80, 100],
      xLabel,
      yLabel: l('LE GAZ, % DU VOLUME, VAPEUR COMPRISE', 'THE GAS, % OF VOLUME, STEAM INCLUDED'),
      spans: spans(),
      legendAt: 0.76 * W0,
      legendTop: 6,
    },
  );
  zoneNames(d, X0, Y1, W0);
  // 3: water, dry mass, tar
  const X2 = 266;
  const W2 = 138;
  chart(
    d,
    X2,
    Y0,
    W2,
    H0,
    [
      { x: xs, y: prof.map((p) => p.water), color: INKS.cool, label: l('eau restante', 'water left') },
      {
        x: xs,
        y: prof.map((p) => p.mass),
        color: FILL.char,
        label: l('masse sèche restante', 'dry mass left'),
        w: W.thick,
      },
      {
        x: xs,
        y: prof.map((p) => p.tar),
        color: INKS.diesel,
        label: l('goudron (forme, part du pic)', 'tar (a shape, share of peak)'),
        dash: [2, 1],
      },
    ],
    {
      ...axis,
      yMin: 0,
      yMax: 1.1,
      yTicks: [0, 0.5, 1],
      xLabel: l('curseur du voyage', 'the journey’s cursor'),
      yLabel: l('PART, DE 0 À 1', 'SHARE, 0 TO 1'),
      spans: spans(),
      legendAt: 0.66 * W2,
      legendTop: 7,
    },
  );
  zoneNames(d, X2, Y0, W2);
  modelTag(d, X2, 20, W2);
  // the gas at the outlet, the model beside the report's bands
  heading(d, X2, 122, l('LE GAZ SEC À LA SORTIE', 'THE DRY GAS AT THE OUTLET'));
  grid(
    d,
    X2,
    130,
    [
      { label: l('Gaz', 'Gas'), w: 28 },
      { label: l('Rapport', 'Report'), w: 50, align: 'end', mono: true },
      { label: l('Modèle', 'Model'), w: 60, align: 'end', mono: true },
    ],
    [
      [l('CO', 'CO'), l('17 à 22 %', '17 to 22%'), fig('gasCO')],
      [l('H₂', 'H₂'), l('12 à 20 %', '12 to 20%'), fig('gasH2')],
      [l('CO₂', 'CO₂'), l('9 à 15 %', '9 to 15%'), fig('gasCO2')],
      [l('CH₄', 'CH₄'), l('2 à 3 %', '2 to 3%'), fig('gasCH4')],
      [l('N₂', 'N₂'), l('50 à 54 %', '50 to 54%'), fig('gasN2')],
      [l('Énergie', 'Energy'), l('5,60 MJ/Nm³', '5.60 MJ/Nm³'), fig('gasModel')],
    ],
    { size: 1.8, pad: 0.6 },
  );
  const y = note(
    d,
    X2,
    170,
    W2,
    cat(
      l(
        'Le rapport donne des bandes, pas un profil : le début de la pyrolyse, la bande de l’oxydation, le gaz qui sort. Le tableau est en gaz sec, comme les bandes du rapport ; les courbes comptent la vapeur d’eau. Les courbes sont celles du modèle : ses deux extrémités (le gaz après la flamme, le gaz qui sort) et des estimations lisses entre elles. Elles ne sont réglées sur aucune bande. Le modèle n’a qu’une température pour la plaquette et le gaz autour d’elle. Sa flamme, ',
        'The report gives bands, not a profile: the start of pyrolysis, the oxidation band, the gas leaving. The table is of dry gas, like the report’s bands; the curves count the steam. The curves are the model’s: its two ends (the gas after the flame, the gas leaving) and smooth estimates between them. They are not set to any band. The model has one temperature for the chip and the gas around it. Its flame, ',
      ),
      fig('oxModel'),
      l(
        ', reste sous la bande du rapport : comptée sur le seul bilan, sans la chaleur qui part dans la paroi, elle finirait à ',
        ', stays under the report’s band: counted on the balance alone, without the heat that goes into the wall, it would end at ',
      ),
      fig('oxBalance'),
      l(
        ', dans la bande. C’est une limite du modèle, pas un détail caché. La courbe du goudron est une forme contre son pic, pas une prédiction : le gaz qui sort en emporte une quantité mesurée, 0,13 g/Nm³ à la puissance maximale.',
        ', inside the band. That is a limit of the model, not a hidden detail. The tar curve is a shape against its peak, not a prediction: the gas leaving carries a measured amount, 0.13 g/Nm³ at full power.',
      ),
    ),
    { size: 1.8 },
  );
  marksLegend(d, X2, y + 2, W2);
}

export const reactionZones: DrawingSheet = {
  id: 'reaction-zones',
  number: NUMBER,
  group: 'model',
  title: l('Le voyage d’une plaquette, en courbes', 'A chip’s journey, in curves'),
  description: l(
    'Ce que le modèle met autour d’une plaquette tout au long de sa descente : sa température et celle du gaz, la composition du gaz, l’eau et la masse qui lui restent, les vapeurs de goudron. Le curseur est celui de la simulation : les zones sont dans l’ordre, pas à l’échelle, exprès. Les bandes du rapport sont dessinées à côté en rouge ; le modèle n’y est pas réglé.',
    'What the model puts around a chip all the way down: its temperature and the gas’s, the gas’s make-up, the water and the mass left in it, the tar vapours. The cursor is the simulation’s: the zones are in order, not to scale, on purpose. The report’s bands are drawn beside them in red; the model is not set to them.',
  ),
  scene: 'gasifier',
  parts: ['drying-zone', 'pyrolysis-zone', 'oxidation-zone', 'reduction-zone'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le voyage d’une plaquette', 'A chip’s journey'),
      subtitle: l('Résultats du modèle, sans échelle', 'Model results, not to scale'),
      number: NUMBER,
      scale: l('sans échelle', 'not to scale') as unknown as string,
    });
    draw(d);
    return d;
  },
};
