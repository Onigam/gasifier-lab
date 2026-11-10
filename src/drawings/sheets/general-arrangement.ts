import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { TRACTOR, UNIT } from '../../three/dims';

// One A3 sheet drawn from the same dimensions as the 3D model (src/three/dims.ts), in millimetres, model Y pointing up. A first outline of the machine from its reported heights: the tractor's box and the unit's top, read from dims.ts.

const mm = (m: number) => Math.round(m * 1000);

export const generalArrangement: DrawingSheet = {
  id: 'general-arrangement',
  number: 'PL-D01',
  group: 'device',
  title: l('Plan d’ensemble', 'General arrangement'),
  description: l(
    'Vue de côté du tracteur : sa boîte, et la hauteur du gazogène.',
    'Side view of the tractor: its box, and the height of the gasifier.',
  ),
  scene: 'device',
  parts: ['base'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Tracteur à gaz de bois — plan d’ensemble', 'Wood-gas tractor — general arrangement'),
      subtitle: l('Vue de côté', 'Side view'),
      number: 'PL-D01',
      scale: '1:20',
    });
    const v = d.view(60, 232, 0.05);
    v.rect([0, 0], [mm(TRACTOR.length), mm(TRACTOR.cabTop)], { w: W.medium, fill: COLORS.paper });
    v.line([0, mm(UNIT.top)], [mm(TRACTOR.length), mm(UNIT.top)], { w: W.thin, dash: 'hidden' });
    v.dim([0, 0], [mm(TRACTOR.length), 0], -12, { dir: 'h' });
    v.dim([mm(TRACTOR.length), 0], [mm(TRACTOR.length), mm(UNIT.top)], 14, { dir: 'v' });
    return d;
  },
};
