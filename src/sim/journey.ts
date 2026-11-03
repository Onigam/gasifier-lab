import { MODEL } from './machine';
import type { Analyser, ZoneId } from './types';
import type { GasMoles } from './gas/species';

// « The journey of a chip »: a cursor from the top of the bunker to under the grate, and what surrounds the chip there. The order of the zones is reported (K47, S1 §2.5). Their shares on the cursor are NOT to scale, on purpose: a height here would be the hot parts' sizes in disguise (R2). The chip's temperature, water and mass are smooth
// estimates between the model's end points, as is the gas between one zone and the next. The end points are the model's: the gas after the oxidation zone and the gas leaving. The research offered first-order kinetics for the reduction zone, with rates it could not read: they would add nothing a visitor can see, so this interpolates, and says so.

/** Cursor's edges of the zones. Not to scale. */
export const ZONE_EDGES: readonly (readonly [ZoneId, number])[] = [
  ['drying', 0.3],
  ['pyrolysis', 0.55],
  ['oxidation', 0.7],
  ['reduction', 0.95],
  ['ash', 1],
];

export const zoneAt = (s: number): ZoneId => {
  for (const [z, edge] of ZONE_EDGES) if (s < edge) return z;
  return 'ash';
};

export const newAnalyser = (): Analyser => ({
  zone: 'drying',
  chipT: 20,
  chipWater: 1,
  chipMass: 1,
  gasT: 20,
  xCO: 0,
  xH2: 0,
  xCH4: 0,
  xCO2: 0,
  xH2O: 0,
  xN2: 0,
  xO2: 0,
  tarShare: 0,
});

/** The gas in the drying zone and leaving pyrolysis, wet volume shares. Estimate: the books give wide bands for pyrolysis's gas, and no one measured this bunker. */
const DRYING = { CO: 0.02, H2: 0, CH4: 0, CO2: 0.05, H2O: 0.88, N2: 0.05 };
const PYROLYSIS = { CO: 0.15, H2: 0.05, CH4: 0.05, CO2: 0.2, H2O: 0.5, N2: 0.05 };
/** Most oxygen read in the flame zone, share. Estimate: the air coming in, thinned at once. */
const FLAME_O2 = 0.08;
/** Char left of the dry mass entering the fire (research: usual for wood), and residue at the end (K21). */
const CHAR_MASS = 0.2;
const RESIDUE_MASS = 0.035;

const smooth = (u: number): number => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * (3 - 2 * x);
};

const wetShare = (n: GasMoles): number => n.CO + n.H2 + n.CH4 + n.CO2 + n.H2O + n.N2;

export interface JourneyInput {
  ambientT: number;
  hearthT: number;
  oxidationT: number;
  outletT: number;
  /** Is the fire alive: air coming in. */
  alive: boolean;
  crackedShare: number;
  afterOxidation: GasMoles;
  final: GasMoles;
}

export function journey(s: number, j: JourneyInput, a: Analyser): Analyser {
  const c = Math.max(0, Math.min(1, s));
  a.zone = zoneAt(c);
  const ox = j.afterOxidation;
  const fin = j.final;
  const oxTotal = Math.max(1e-9, wetShare(ox));
  const finTotal = Math.max(1e-9, wetShare(fin));
  // the gas at this zone's top and bottom, wet volume shares: no object, this runs every frame
  let fCO = DRYING.CO;
  let fH2 = DRYING.H2;
  let fCH4 = DRYING.CH4;
  let fCO2 = DRYING.CO2;
  let fH2O = DRYING.H2O;
  let fN2 = DRYING.N2;
  let tCO = fCO;
  let tH2 = fH2;
  let tCH4 = fCH4;
  let tCO2 = fCO2;
  let tH2O = fH2O;
  let tN2 = fN2;
  let w = 0;
  a.xO2 = 0;
  a.tarShare = 0;
  a.chipWater = 0;
  if (a.zone === 'drying') {
    const u = c / 0.3;
    a.chipT = j.ambientT + (100 - j.ambientT) * smooth(u);
    a.chipWater = 1 - smooth(u);
    a.chipMass = 1;
  } else if (a.zone === 'pyrolysis') {
    const u = (c - 0.3) / 0.25;
    a.chipT = 100 + (MODEL.pyrolysisEndT - 100) * smooth(u);
    a.chipMass = 1 - (1 - CHAR_MASS) * smooth(u);
    a.tarShare = smooth(u);
    tCO = PYROLYSIS.CO;
    tH2 = PYROLYSIS.H2;
    tCH4 = PYROLYSIS.CH4;
    tCO2 = PYROLYSIS.CO2;
    tH2O = PYROLYSIS.H2O;
    tN2 = PYROLYSIS.N2;
    w = smooth(u);
  } else if (a.zone === 'oxidation') {
    const u = (c - 0.55) / 0.15;
    a.chipT = MODEL.pyrolysisEndT + (j.oxidationT - MODEL.pyrolysisEndT) * smooth(u);
    a.chipMass = CHAR_MASS;
    a.tarShare = 1 - j.crackedShare * smooth(u);
    a.xO2 = j.alive ? FLAME_O2 * Math.sin(Math.PI * Math.max(0, Math.min(1, u))) : 0;
    fCO = PYROLYSIS.CO;
    fH2 = PYROLYSIS.H2;
    fCH4 = PYROLYSIS.CH4;
    fCO2 = PYROLYSIS.CO2;
    fH2O = PYROLYSIS.H2O;
    fN2 = PYROLYSIS.N2;
    tCO = ox.CO / oxTotal;
    tH2 = ox.H2 / oxTotal;
    tCH4 = ox.CH4 / oxTotal;
    tCO2 = ox.CO2 / oxTotal;
    tH2O = ox.H2O / oxTotal;
    tN2 = ox.N2 / oxTotal;
    w = smooth(u);
  } else {
    // reduction, then the ash pit, which holds the leaving gas
    const inAsh = a.zone === 'ash';
    const u = inAsh ? 1 : (c - 0.7) / 0.25;
    // the approach to the leaving gas is fastest at the top, where it is hottest: a shape, no rate
    const fast = (1 - Math.exp(-4 * u)) / (1 - Math.exp(-4));
    a.chipT = inAsh
      ? j.hearthT + (j.outletT - j.hearthT) * smooth((c - 0.95) / 0.05)
      : j.oxidationT + (j.hearthT - j.oxidationT) * fast;
    a.chipMass = CHAR_MASS + (RESIDUE_MASS - CHAR_MASS) * fast;
    a.tarShare = 1 - j.crackedShare;
    fCO = ox.CO / oxTotal;
    fH2 = ox.H2 / oxTotal;
    fCH4 = ox.CH4 / oxTotal;
    fCO2 = ox.CO2 / oxTotal;
    fH2O = ox.H2O / oxTotal;
    fN2 = ox.N2 / oxTotal;
    tCO = fin.CO / finTotal;
    tH2 = fin.H2 / finTotal;
    tCH4 = fin.CH4 / finTotal;
    tCO2 = fin.CO2 / finTotal;
    tH2O = fin.H2O / finTotal;
    tN2 = fin.N2 / finTotal;
    w = fast;
  }
  a.gasT = a.chipT;
  const keep = 1 - a.xO2;
  a.xCO = keep * (fCO + (tCO - fCO) * w);
  a.xH2 = keep * (fH2 + (tH2 - fH2) * w);
  a.xCH4 = keep * (fCH4 + (tCH4 - fCH4) * w);
  a.xCO2 = keep * (fCO2 + (tCO2 - fCO2) * w);
  a.xH2O = keep * (fH2O + (tH2O - fH2O) * w);
  a.xN2 = keep * (fN2 + (tN2 - fN2) * w);
  return a;
}
