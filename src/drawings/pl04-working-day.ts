import { Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { partName } from '../three/part-ids';
import { nEn, nFr } from '../data/units';
import { SERVICE } from '../sim/reported';
import { serviceRange } from '../sim/runs';
import { cat, fig, FILL, heading, INKS, marksLegend, note, numL } from './draw';

// PL-G04: what a working day with the machine asks, as the institute's service tables give it (S1 Tables 3.17 and 3.18, K40 to K43). A calendar for the day of eight hours: the daily preparation, the refills, the condensate. Then every job and every part on one logarithmic axis in hours,
// from the refill's three quarters of an hour to the casing's four thousand, so that the short and the long are read together. The lives are the report's lives between failures (K43), not guarantees. Nothing here is the model's but the one figure said so.

export const NUMBER = 'PL-G04';

/** K43: the lives between failures, hours, low and high. The throat ring is « about 700 h »: one number. */
export const LIVES = [
  { id: 'fire-box', hours: [600, 1000] },
  { id: 'throat-ring', hours: [700, 700] },
  { id: 'grate', hours: [400, 700] },
  { id: 'filter-bags', hours: [500, 1000] },
  { id: 'outer-casing', hours: [2000, 4000] },
] as const;

const JOB_NAME: Record<string, L> = {
  prep: l('Préparation du jour', 'Daily preparation'),
  fill: l('Remplissage de la soute', 'Refilling the bunker'),
  'cooler-condensate': l('Condensat du refroidisseur', 'Cooler condensate'),
  ash: l('Cendres', 'Ash'),
  'gasifier-condensate': l('Condensat du gazogène', 'Gasifier condensate'),
  hose: l('Tuyau', 'Hose'),
  filter: l('Filtre', 'Filter'),
  jacket: l('Chemise à condensat', 'Condensate jacket'),
  gaskets: l('Joints', 'Gaskets'),
  'cooler-clean': l('Refroidisseur, nettoyage', 'Cooler, cleaning'),
};

const num = (v: number): { fr: string; en: string } => ({ fr: nFr(v, 0), en: nEn(v, 0) });
/** « 25–100 h »: a range or a single value, with its unit. */
function range(a: number, b: number, unit: string): L {
  const x = num(a);
  const y = num(b);
  return a === b ? l(`${x.fr} ${unit}`, `${x.en} ${unit}`) : l(`${x.fr}–${y.fr} ${unit}`, `${x.en}–${y.en} ${unit}`);
}

// the log axis
const LX0 = 98;
const LDEC = 42;
const L_MIN = 0.5;
const lx = (h: number): number => LX0 + Math.log10(h / L_MIN) * LDEC;

function calendar(d: Drawing): void {
  const p = d.paper();
  const X0 = 92;
  const H = 30;
  const x = (h: number): number => X0 + h * H;
  const Y = 44;
  const pitch = 9;
  const rowName = (i: number, t: L): void => {
    p.text([18, Y + i * pitch + 3], t, { size: 1.75, baseline: 'middle' });
  };
  // the hours
  for (let h = 0; h <= 8; h++) {
    p.line([x(h), Y - 2], [x(h), Y + 6 * pitch - 1], { w: W.thin, color: '#d8d2c4' });
    p.text([x(h), Y - 3], String(h), { size: 1.8, anchor: 'middle', baseline: 'bottom', mono: true });
  }
  p.text([x(8) + 3, Y - 3], l('heures de marche', 'hours of running'), {
    size: 1.75,
    baseline: 'bottom',
    color: INK_2,
  });
  // 0: the daily preparation
  rowName(0, JOB_NAME.prep!);
  p.rect([x(0), Y + 0.5], [x(0.75), Y + 5.5], { w: W.thin, fill: FILL.band, color: INKS.diesel });
  p.rect([x(0), Y + 0.5], [x(0.5), Y + 5.5], { w: W.thin, fill: INKS.diesel, color: INKS.diesel });
  p.text([x(0.75) + 2, Y + 3], range(30, 45, 'min'), { size: 1.75, baseline: 'middle', mono: true });
  // 1: the refills, every 40 minutes and every 50, each less than five minutes
  rowName(1, JOB_NAME.fill!);
  for (const [every, color, dy] of [
    [40, INKS.cool, 0.4],
    [50, INKS.hot, 3.2],
  ] as const) {
    for (let t = every; t < 8 * 60 - 1e-6; t += every)
      p.rect([x(t / 60), Y + pitch + dy], [x(t / 60) + (5 / 60) * H, Y + pitch + dy + 2.4], {
        w: W.thin,
        fill: color,
        color,
      });
  }
  p.text([x(8) + 3, Y + pitch + 1.6], cat(l('toutes les 40 min, en moins de 5 min', 'every 40 min, in under 5 min')), {
    size: 1.7,
    baseline: 'middle',
    color: INKS.cool,
  });
  p.text([x(8) + 3, Y + pitch + 4.6], l('toutes les 50 min', 'every 50 min'), {
    size: 1.7,
    baseline: 'middle',
    color: INKS.hot,
  });
  // 2: the cooler's condensate, every 2 to 3 hours, counted with the refill
  rowName(2, JOB_NAME['cooler-condensate']!);
  for (const [every, color, dy] of [
    [2, INKS.cool, 1.6],
    [3, INKS.hot, 4.4],
  ] as const)
    for (let t = every; t <= 8 + 1e-6; t += every)
      p.circle([x(t), Y + 2 * pitch + dy], 1, { w: W.thin, fill: color, color });
  p.text(
    [x(8) + 3, Y + 2 * pitch + 3],
    l('toutes les 2 à 3 h, avec le remplissage', 'every 2 to 3 h, with the refill'),
    {
      size: 1.7,
      baseline: 'middle',
    },
  );
  // 3 and 4: the gasifier's condensate and the ash, at the end of the day, with the next preparation
  rowName(3, JOB_NAME['gasifier-condensate']!);
  rowName(4, JOB_NAME.ash!);
  for (const [i, a, b] of [
    [3, 8, 10],
    [4, 8, 15],
  ] as const) {
    p.line([x(8), Y + i * pitch + 3], [x(8) + 6, Y + i * pitch + 3], { w: W.medium, color: INKS.diesel });
    p.circle([x(8), Y + i * pitch + 3], 1.2, { w: W.thin, fill: INKS.diesel, color: INKS.diesel });
    p.text(
      [x(8) + 8, Y + i * pitch + 3],
      cat(l('toutes les ', 'every '), range(a, b, 'h'), l(', avec la préparation', ', with the preparation')),
      {
        size: 1.7,
        baseline: 'middle',
      },
    );
  }
  // 5: the whole
  const [lo, hi] = serviceRange();
  rowName(5, l('Au total, selon le rapport', 'In all, by the report'));
  p.rect([x(0), Y + 5 * pitch + 0.5], [x(8), Y + 5 * pitch + 5.5], { w: W.thin, fill: FILL.room });
  p.rect([x(0), Y + 5 * pitch + 0.5], [x(8 * (25 / 60)), Y + 5 * pitch + 5.5], {
    w: W.thin,
    fill: FILL.band,
    color: INKS.diesel,
  });
  p.rect([x(0), Y + 5 * pitch + 0.5], [x(8 * (15 / 60)), Y + 5 * pitch + 5.5], {
    w: W.thin,
    fill: INKS.diesel,
    color: INKS.diesel,
  });
  p.text(
    [x(8) + 3, Y + 5 * pitch + 3],
    cat(
      l('15 à 25 min par heure : ', '15 to 25 min an hour: '),
      numL((8 * 15) / 60, 0, ' h', '†'),
      l(' à ', ' to '),
      numL((8 * 25) / 60, 1, ' h', '†'),
      l(' sur 8', ' of 8'),
    ),
    {
      size: 1.7,
      baseline: 'middle',
    },
  );
  void lo;
  void hi;
}

function lifeChart(d: Drawing): { bottom: number } {
  const p = d.paper();
  const Y0 = 130;
  const pitch = 6.4;
  heading(
    d,
    18,
    112,
    l(
      'LES TRAVAUX ET LA VIE DES PIÈCES, EN HEURES, ÉCHELLE LOGARITHMIQUE',
      'THE JOBS AND THE PARTS’ LIVES, IN HOURS, LOGARITHMIC SCALE',
    ),
    {
      size: 2.1,
    },
  );
  const rows = SERVICE.length + LIVES.length;
  const bottom = Y0 + SERVICE.length * pitch + 12 + LIVES.length * pitch;
  // the decades
  for (const h of [1, 10, 100, 1000]) {
    p.line([lx(h), Y0 - 2], [lx(h), bottom - 2], { w: W.thin, color: '#d8d2c4' });
    p.text([lx(h), Y0 - 3], num(h).fr === '1 000' ? l('1 000', '1,000') : String(h), {
      size: 1.8,
      anchor: 'middle',
      baseline: 'bottom',
      mono: true,
    });
  }
  p.text([lx(5000) + 2, Y0 - 3], l('heures', 'hours'), { size: 1.75, baseline: 'bottom', color: INK_2 });
  p.text([18, Y0 - 3], l('travail : toutes les… · durée', 'job: every… · takes'), {
    size: 1.7,
    baseline: 'bottom',
    color: INK_2,
  });
  const bar = (a: number, b: number, y: number, color: string): void => {
    if (a === b) p.circle([lx(a), y], 1.3, { w: W.thin, fill: color, color });
    else p.rect([lx(a), y - 1.3], [lx(b), y + 1.3], { w: W.thin, fill: color, color });
  };
  SERVICE.forEach((j, i) => {
    const y = Y0 + i * pitch + 2;
    p.text([18, y], JOB_NAME[j.job]!, { size: 1.75, baseline: 'middle' });
    const every = j.job === 'fill' ? ([40, 50] as const) : j.every;
    const a = j.job === 'fill' ? every[0] / 60 : every[0];
    const b = j.job === 'fill' ? every[1] / 60 : every[1];
    bar(a, b, y, INKS.cool);
    const takes =
      'withFill' in j || 'withPrep' in j
        ? l('avec un autre travail', 'inside another job')
        : range(j.takes[0], j.takes[1], 'min');
    const every2 = j.job === 'fill' ? range(40, 50, 'min') : range(j.every[0], j.every[1], 'h');
    p.text([lx(5000) + 12, y], cat(every2, ' · ', takes), { size: 1.6, baseline: 'middle', mono: true });
  });
  const Y1 = Y0 + SERVICE.length * pitch + 12;
  p.text([18, Y1 - 6], l('Vies entre deux pannes', 'Lives between failures'), {
    size: 1.8,
    weight: 'bold',
    baseline: 'middle',
  });
  LIVES.forEach((e, i) => {
    const y = Y1 + i * pitch + 2;
    const n = partName(e.id);
    p.text([18, y], l(n.fr, n.en), { size: 1.75, baseline: 'middle' });
    bar(e.hours[0], e.hours[1], y, INKS.hot);
    const t = range(e.hours[0], e.hours[1], 'h');
    p.text([lx(5000) + 12, y], e.hours[0] === e.hours[1] ? cat(l('environ ', 'about '), t) : t, {
      size: 1.6,
      baseline: 'middle',
      mono: true,
    });
  });
  void rows;
  p.line([18, Y1 - 3], [lx(5000) + 12, Y1 - 3], { w: W.thin, color: INK });
  return { bottom };
}

function draw(d: Drawing): void {
  heading(
    d,
    18,
    24,
    l(
      'UNE JOURNÉE DE HUIT HEURES, D’APRÈS LES TABLEAUX DE L’INSTITUT',
      'A DAY OF EIGHT HOURS, FROM THE INSTITUTE’S TABLES',
    ),
    {
      size: 2.1,
    },
  );
  d.paper().text(
    [18, 33],
    l(
      'Plusieurs travaux ont un intervalle, pas une heure : on dessine les deux bouts.',
      'Several jobs have an interval, not a time: both ends are drawn.',
    ),
    {
      size: 1.75,
      color: INK_2,
    },
  );
  calendar(d);
  lifeChart(d);
  const [lo, hi] = serviceRange();
  const X = 330;
  const W_ = 76;
  let y = 112;
  y = note(
    d,
    X,
    y,
    W_,
    cat(
      l(
        'Le rapport estime le service à 15 à 25 minutes par heure de marche. Les tableaux de l’institut, additionnés, en donnent ',
        'The report estimates the service at 15 to 25 minutes per hour of running. The institute’s tables, added up, give ',
      ),
      numL(lo, 0, '', '†'),
      l(' à ', ' to '),
      numL(hi, 0, ' minutes', '†'),
      l('; le modèle en compte ', '; the model counts '),
      fig('serviceModel'),
      l('. L’écart n’est pas expliqué.', '. The gap is not explained.'),
    ),
    { size: 1.75 },
  );
  y = note(
    d,
    X,
    y + 1,
    W_,
    l(
      'Le foyer, l’anneau de gorge, la grille et les manches du filtre vivent de 400 à 1 000 heures ; l’enveloppe, de 2 000 à 4 000, rouille et dure le plus. Ce sont les durées entre deux pannes de véhicules du programme, d’après l’expérience cumulée de plusieurs d’entre eux, pas des garanties.',
      'The firebox, the throat ring, the grate and the filter bags live 400 to 1,000 hours; the casing, 2,000 to 4,000, corrodes and lasts longest. These are the times between failures of the programme’s vehicles, by the accumulated experience of several of them, not guarantees.',
    ),
    { size: 1.75 },
  );
  y = note(
    d,
    X,
    y + 1,
    W_,
    l(
      'Le rapport ne compte qu’une panne grave du moteur : « probablement » de l’eau aspirée depuis un bac de condensats trop plein. Plus de 2 500 heures en six ans sur deux grandes fermes du sud de la Suède, conduit surtout par des étudiants en agriculture, parce que les conducteurs habituels n’en voulaient pas : « long, sale et lourd ».',
      'The report counts one serious engine failure: “probably” water sucked from an overfull condensate vessel. More than 2,500 hours in six years on two large farms in southern Sweden, driven mainly by agricultural students because the regular drivers were not interested: “time consuming, dirty and heavy”.',
    ),
    { size: 1.75 },
  );
  marksLegend(d, X, y + 2, W_);
}

export const workingDay: DrawingSheet = {
  id: 'a-working-day',
  number: NUMBER,
  group: 'machine',
  title: l('Une journée de travail avec la machine', 'A working day with the machine'),
  description: l(
    'Ce que demande une journée de huit heures, d’après les tableaux de l’institut : la préparation, les remplissages, le condensat, les cendres, et, selon le rapport, 15 à 25 minutes de service par heure en tout. Puis tous les travaux et toutes les pièces sur un même axe en heures, des remplissages d’à peine une heure aux 4 000 heures de l’enveloppe.',
    'What a day of eight hours asks, from the institute’s tables: the preparation, the refills, the condensate, the ash, and, by the report, 15 to 25 minutes of service an hour in all. Then every job and every part on one axis in hours, from refills hardly an hour apart to the casing’s 4,000 hours.',
  ),
  scene: 'gasifier',
  parts: ['fire-box', 'throat-ring', 'grate', 'outer-casing', 'condensate-drain'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Une journée de travail', 'A working day'),
      subtitle: l('Les tableaux de service de l’institut', 'The institute’s service tables'),
      number: NUMBER,
      scale: l('sans échelle', 'not to scale') as unknown as string,
    });
    draw(d);
    return d;
  },
};
