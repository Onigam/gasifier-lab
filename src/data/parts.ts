import type { PartInfo } from '@onigam/lab-kit/content';
import { DIM_SPECS } from './parts/dim-specs';
import { FARM_PARTS } from './parts/farm';
import { GARAGE_PARTS } from './parts/garage';
import { GAS_TRAIN_PARTS } from './parts/gastrain';
import { GASIFIER_PARTS } from './parts/gasifier';
import { TRACTOR_PARTS } from './parts/tractor';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the order of src/three/part-ids.ts: `farm` 10, `tractor` 13, `gasifier` 20, `gas-train` 17, `garage` 7, 67 in all. The ids are the contract with the 3D role:
// data.test.ts holds them against that list. The dimension rows of a sheet are read from src/three/dims.ts in ./parts/dim-specs.ts and appended here, so that no length is typed twice; none of them is a size of the hot parts (research §A.2, R2).
export const PARTS: PartInfo[] = [
  ...FARM_PARTS,
  ...TRACTOR_PARTS,
  ...GASIFIER_PARTS,
  ...GAS_TRAIN_PARTS,
  ...GARAGE_PARTS,
].map((p) => ({
  ...p,
  specs: [...p.specs, ...(DIM_SPECS[p.id] ?? [])],
}));
