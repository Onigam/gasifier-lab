// The dimension rows of the part sheets, ALL read from src/three/dims.ts (the single source of lengths, BRIEF §5): no number is typed in this file. They are appended to each sheet's specs by ../parts.ts. A row with no mark is a source's figure; † is derived,
// * is an estimate of the 3D (dims.ts says which, and the sheets' own texts say why). **Nothing of the hot parts is here** (research §A.2, R2): no throat, no nozzle, no firebox, no zone, no ring, no grate, no plenum, no hood, and the boxes the kit measures on those parts are
// left empty while they are selected (`GASIFIER_REFUSED`). `src/data/refusals.test.ts` holds that this file never reads `HOT`, `HEARTH` or `ZONES`.
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { GAUGE } from '../../three/dims';
import { sp } from '../part-helpers';
import { nEn, nFr } from '../units';

const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;

/** Metres, at most two decimals, no trailing zero, with its mark. */
const lenM = (mark: '*' | '†' | '', ...m: number[]): L =>
  l(
    `${m.map((x) => trim(nFr(x, 2), ',')).join(' × ')} m${mark}`,
    `${m.map((x) => trim(nEn(x, 2), '.')).join(' × ')} m${mark}`,
  );

export const DIM_SPECS: Record<string, Spec[]> = {
  // `fuel-casing` has no row: a diameter and a height of the bunker would give a size the lab withholds (research §A.2, R2). The sheet keeps the volume and the mass, which are reported.
  'water-gauge': [sp('Hauteur dessinée', 'Height as drawn', lenM('*', GAUGE.h))],
};
