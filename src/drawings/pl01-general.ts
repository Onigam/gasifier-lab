import { Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { BODY, COOLER, ENGINE, FILTER, FILTER_AT, TRACTOR, UNIT, UNIT_AT } from '../three/dims';
import { fig, FILL, grid, heading, INKS, marksLegend, mL, mm, note, numL, PAPER } from './draw';

// PL-G01: the machine in elevation, seen from its left, at 1:25, and in plan at 1:40, from the one source of dimensions (src/three/dims.ts): the base tractor, the unit on its console, the filter, the cooler, the rack. Overall sizes and heights only, which is all the sources give: no piece of the
// hearth, no pipe (their sizes are unknown), no detail of the unit, which is drawn as its outline: nothing inside it is dimensioned or divided. Not a construction drawing: the title block says so.

export const NUMBER = 'PL-G01';
const SCALE = 0.04;
const m2 = (m: number): L => mL(m, '', 2);
const pair = (a: number, b: number): L => l(`${m2(a).fr} · ${m2(b).fr}`, `${m2(a).en} · ${m2(b).en}`);

function elevation(d: Drawing): void {
  const v = d.view(52, 204, SCALE);
  const rear = TRACTOR.rear;
  const front = TRACTOR.front;
  v.line([-900, 0], [mm(3.95), 0], { w: W.thick });
  v.circle([mm(rear.x), mm(rear.R)], mm(rear.R), { w: W.thick, fill: '#dcd8cc' });
  v.circle([mm(rear.x), mm(rear.R)], mm(0.12), { w: W.medium, fill: PAPER });
  v.circle([mm(front.x), mm(front.R)], mm(front.R), { w: W.thick, fill: '#dcd8cc' });
  v.circle([mm(front.x), mm(front.R)], mm(0.07), { w: W.medium, fill: PAPER });
  const rh = BODY.rearHousing;
  v.rect([mm(rh.x0), mm(rh.y0)], [mm(rh.x1), mm(rh.y1)], { w: W.medium, fill: FILL.steel });
  const gb = BODY.gearbox;
  v.rect([mm(gb.x0), mm(gb.y0)], [mm(gb.x1), mm(gb.y1)], { w: W.medium, fill: FILL.steel });
  const eb = ENGINE.block;
  v.rect([mm(eb.x0), mm(eb.y0)], [mm(eb.x1), mm(eb.y1)], { w: W.medium, fill: FILL.steel });
  const bn = BODY.bonnet;
  v.rect([mm(bn.x0), mm(bn.y0)], [mm(bn.x1), mm(bn.top)], { w: W.medium, fill: PAPER });
  v.line([mm(BODY.grilleX), mm(0.5)], [mm(BODY.grilleX), mm(bn.top)], { w: W.medium });
  const cab = BODY.cab;
  v.rect([mm(cab.x0), mm(BODY.floorY)], [mm(cab.x1), mm(cab.top)], { w: W.medium, fill: '#f4f1e8' });
  v.line([mm(cab.x0 - 0.1), mm(cab.top)], [mm(cab.x1 + 0.1), mm(cab.top)], { w: W.thick });
  // the unit on its console, as its outline: the bunker's diameter, from the clearance to the top, and nothing inside
  const ux = UNIT_AT.x;
  v.rect([mm(ux - UNIT.bunkerR), mm(UNIT.clearance)], [mm(ux + UNIT.bunkerR), mm(UNIT.top)], {
    w: W.thick,
    fill: FILL.hot,
  });
  // the filter box on its cantilevers, the cooler in front of the radiator
  v.rect([mm(FILTER_AT.x), mm(FILTER_AT.y)], [mm(FILTER_AT.x + FILTER.length), mm(FILTER_AT.y + FILTER.height)], {
    w: W.thick,
    fill: FILL.band,
  });
  const coolerTop = COOLER.at.y + COOLER.boxH + COOLER.tubeL + COOLER.headerH;
  v.rect([mm(COOLER.at.x), mm(COOLER.at.y)], [mm(COOLER.at.x + COOLER.rows * COOLER.pitch), mm(coolerTop)], {
    w: W.thick,
    fill: FILL.cold,
  });

  // names, at the item and not on it
  const name = (at: [number, number], dx: number, dy: number, text: L): void =>
    v.leader(at, dx, dy, text, { size: 2.1 });
  name([mm(ux), mm(UNIT.top - 0.15)], -22, -10, l('gazogène', 'gasifier'));
  name(
    [mm(FILTER_AT.x + FILTER.length / 2), mm(FILTER_AT.y + FILTER.height)],
    4,
    -16,
    l('filtre, 4,9 m²', 'filter, 4.9 m²'),
  );
  name([mm(COOLER.at.x + 0.1), mm(coolerTop)], 4, -12, l('refroidisseur, 5,8 m²', 'cooler, 5.8 m²'));
  name([mm(0.4), mm(cab.top)], 0, -9, l('galerie et cabine', 'rack and cab'));

  // levels, from the ground, across the drawing: the reported ones, and the third party's cab
  const right = mm(3.95);
  const level = (y: number, text: L, above: boolean): void => {
    v.line([-900, mm(y)], [right, mm(y)], { w: W.thin, color: INK_2, dash: 'center' });
    v.text([right + 50, mm(y)], text, { size: 2, baseline: above ? 'bottom' : 'top' });
  };
  level(
    TRACTOR.cabTop,
    l(`sommet de la cabine ${m2(TRACTOR.cabTop).fr}`, `top of the cab ${m2(TRACTOR.cabTop).en}`),
    true,
  );
  level(UNIT.top, l(`sommet du gazogène ${m2(UNIT.top).fr}`, `top of the gasifier ${m2(UNIT.top).en}`), false);
  level(
    UNIT.clearance,
    l(`pied du gazogène ${m2(UNIT.clearance).fr}`, `foot of the gasifier ${m2(UNIT.clearance).en}`),
    false,
  );
  // the driver's eye is a band, 2.25 to 2.40 m
  v.rect([-900, mm(2.25)], [right, mm(2.4)], { w: 0, fill: '#c9d8ea', opacity: 0.55 });
  v.text([right + 50, mm(2.4)], l('œil du conducteur 2,25 à 2,40 m', 'driver’s eye 2.25 to 2.40 m'), {
    size: 2,
    baseline: 'bottom',
  });
  v.dim([mm(rear.x), 0], [mm(front.x), 0], 10, { dir: 'h', label: m2(TRACTOR.wheelbase) });
  d.paper().text([128, 222], l('ÉCHELLE 1:25 · cotes en mètres', 'SCALE 1:25 · dimensions in metres'), {
    size: 2,
    color: INKS.loss,
  });
}

/** The same machine from above, at 1:40, the left of the tractor at the top: where the unit, the filter and the cooler stand across the width. */
function plan(d: Drawing): void {
  const v = d.view(300, 96, 0.025);
  const Z = (m: number): number => -mm(m);
  heading(d, 298, 26, l('EN PLAN, 1:40', 'IN PLAN, 1:40'));
  const track = TRACTOR.rear.tread;
  for (const z of [-track / 2, track / 2])
    v.rect([mm(-0.18), Z(z) - mm(TRACTOR.rear.width) / 2], [mm(0.18), Z(z) + mm(TRACTOR.rear.width) / 2], {
      w: W.medium,
      fill: '#dcd8cc',
    });
  for (const z of [-TRACTOR.front.tread / 2, TRACTOR.front.tread / 2])
    v.rect(
      [mm(TRACTOR.front.x) - 380, Z(z) - mm(TRACTOR.front.width) / 2],
      [mm(TRACTOR.front.x) + 380, Z(z) + mm(TRACTOR.front.width) / 2],
      { w: W.medium, fill: '#dcd8cc' },
    );
  v.rect([mm(BODY.cab.x0), -mm(BODY.cab.halfW)], [mm(BODY.cab.x1), mm(BODY.cab.halfW)], {
    w: W.medium,
    fill: '#f4f1e8',
  });
  v.rect([mm(BODY.bonnet.x0), -mm(BODY.bonnet.halfW)], [mm(BODY.bonnet.x1), mm(BODY.bonnet.halfW)], {
    w: W.medium,
    fill: PAPER,
  });
  v.circle([mm(UNIT_AT.x), Z(UNIT_AT.z)], mm(UNIT.bunkerR), { w: W.thick, fill: FILL.hot });
  v.rect(
    [mm(FILTER_AT.x), Z(FILTER_AT.z) - mm(FILTER.width) / 2],
    [mm(FILTER_AT.x + FILTER.length), Z(FILTER_AT.z) + mm(FILTER.width) / 2],
    { w: W.thick, fill: FILL.band },
  );
  const half = mm(COOLER.cols * COOLER.pitch) / 2;
  v.rect([mm(COOLER.at.x), -half], [mm(COOLER.at.x + COOLER.rows * COOLER.pitch), half], {
    w: W.thick,
    fill: FILL.cold,
  });
  v.text([mm(UNIT_AT.x), Z(UNIT_AT.z) + 480], l('gazogène', 'gasifier'), {
    size: 2,
    anchor: 'middle',
    baseline: 'bottom',
  });
  v.text([mm(FILTER_AT.x + FILTER.length / 2), Z(FILTER_AT.z)], l('filtre', 'filter'), {
    size: 2,
    anchor: 'middle',
    baseline: 'middle',
  });
  v.text([mm(1.9), Z(-1.7)], l('côté gauche ↑', 'left side ↑'), {
    size: 2,
    anchor: 'middle',
    baseline: 'bottom',
    color: INK_2,
  });
}

export const generalArrangement: DrawingSheet = {
  id: 'general-arrangement',
  number: NUMBER,
  group: 'machine',
  title: l('Plan d’ensemble du tracteur', 'The tractor’s general arrangement'),
  description: l(
    'Le tracteur vu de la gauche à l’échelle 1:25, puis en plan, d’après la source unique des dimensions de la 3D : le gazogène sur sa console, le filtre, le refroidisseur, la galerie. Les hauteurs, les surfaces et les masses sont celles que donnent les sources, rien de plus : aucune pièce du foyer, aucun tuyau, aucun détail du gazogène, qui n’est dessiné que par son contour.',
    'The tractor seen from its left at 1:25, then in plan, from the 3D’s one source of dimensions: the gasifier on its console, the filter, the cooler, the rack. The heights, the areas and the masses are those the sources give, no more: no part of the hearth, no pipe, no detail of the gasifier, which is drawn as its outline only.',
  ),
  scene: 'tractor',
  parts: ['tractor-chassis', 'cab', 'gasifier-unit', 'left-consoles', 'gas-line-run'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le tracteur et son système', 'The tractor and its system'),
      subtitle: l('Plan d’ensemble, vue de gauche et en plan', 'General arrangement, left view and plan'),
      number: NUMBER,
      scale: '1:25',
    });
    elevation(d);
    plan(d);
    heading(d, 12, 231, l('CE QUE LES SOURCES DONNENT', 'WHAT THE SOURCES GIVE'));
    const cols = [
      { label: l('Grandeur', 'Quantity'), w: 58 },
      { label: l('Valeur', 'Value'), w: 44, align: 'end' as const, mono: true },
    ];
    grid(
      d,
      12,
      238,
      cols,
      [
        [
          l('Tracteur, pneus', 'Tractor, tyres'),
          l('Massey Ferguson 1100 · 18.4-38, 7.50-18', 'Massey Ferguson 1100 · 18.4-38, 7.50-18'),
        ],
        [l('Masse, version à gaz', 'Mass, gas version'), numL(5090, 0, ' kg', '')],
        [l('Système ajouté', 'System added'), numL(450, 0, ' kg', '')],
        [l('Soute du gazogène', 'Gasifier bunker'), numL(0.2, 1, ' m³', '')],
        [l('Plaquettes à pleine soute', 'Chips at a full bunker'), fig('bunkerKg')],
        [l('Œil moins sommet du gazogène', 'Eye less top of the gasifier'), fig('unitBelowEye')],
      ],
      { size: 1.8, pad: 0.6 },
    );
    grid(
      d,
      118,
      238,
      cols,
      [
        [l('Sommet, pied du gazogène', 'Top, foot of the gasifier'), pair(UNIT.top, UNIT.clearance)],
        [l('Filtre à toile', 'Fabric filter'), l('4,9 m² (2,5 d’abord)', '4.9 m² (2.5 at first)')],
        [l('Refroidisseur', 'Cooler'), numL(5.8, 1, ' m²', '')],
        [l('Empattement, cabine', 'Wheelbase, cab'), pair(TRACTOR.wheelbase, TRACTOR.cabTop)],
        [l('Longueur, largeur', 'Length, width'), pair(TRACTOR.length, TRACTOR.width)],
        [l('Garde au sol', 'Ground clearance'), m2(TRACTOR.clearance)],
      ],
      { size: 1.8, pad: 0.6 },
    );
    const y = note(
      d,
      298,
      136,
      112,
      l(
        'Les cotes du tracteur de base, l’empattement, la cabine, la longueur, la largeur et la garde au sol, viennent d’un site tiers : aucune notice de constructeur n’a été trouvée, et la largeur de 2,70 m ressemble à la voie maximale. Les hauteurs du gazogène et de l’œil, la masse du système, le filtre et le refroidisseur sont celles de l’institut. Le filtre, le refroidisseur, la galerie et la cabine sont dessinés d’après la figure et la photographie du rapport : leurs tailles sont des estimations. En plan, le gazogène se tient à gauche de l’axe : c’est ce qui met le poids sur un seul flanc.',
        'The base tractor’s dimensions, the wheelbase, the cab, the length, the width and the ground clearance, come from a third-party site: no maker’s brochure was found, and the width of 2.70 m looks like the maximum tread. The heights of the gasifier and of the eye, the system’s mass, the filter and the cooler are the institute’s. The filter, the cooler, the rack and the cab are drawn from the report’s figure and photograph: their sizes are estimates. In plan, the gasifier stands to the left of the axis: that is what puts the weight on one flank.',
      ),
      { size: 1.85 },
    );
    marksLegend(d, 298, y + 2, 104);
    return d;
  },
};
