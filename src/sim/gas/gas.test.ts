import { describe, expect, it } from 'vitest';
import {
  ATMOSPHERE,
  burnLeak,
  chemicalEnergy,
  dewPoint,
  gasify,
  heatingValue,
  hotZones,
  K_WE_TABLE,
  LATENT,
  LHV_CARBON,
  LHV_MOL,
  LHV_NM3,
  mixtureEnergy,
  MOLAR_MASS,
  MOLAR_VOLUME,
  N2_PER_O2,
  saturationPressure,
  sensibleHeat,
  solveAtOxygen,
  stepRooms,
  stoichAirToGas,
  temperatureOf,
  toPpm,
  waterGasK,
  WOOD_H,
  WOOD_MOLAR_MASS,
  WOOD_O,
  WOOD_STOICH_O2,
  newMoles,
  type GasifyConditions,
} from '.';

// The local gas module against closed forms and its own balances. A lab's figures are in figures.test.ts.

const base: GasifyConditions = {
  moistureWet: 0.08,
  lhvDry: 18.8e6,
  heatLossShare: 0.15,
  outletT: 250,
  frozenT: 700,
  drainShare: 0,
  methane: 2.8,
  residueCarbon: 2.3,
};

describe('what the gases hold', () => {
  it('Table 2.1 agrees with itself: per mole over per Nm³ is one molar volume', () => {
    for (const k of ['CO', 'H2', 'CH4'] as const) {
      expect(LHV_MOL[k] / LHV_NM3[k] / MOLAR_VOLUME).toBeCloseTo(1, 2);
    }
  });
  it('FAO §2.2’s heats of reaction come back from its heating values', () => {
    // (a) C + CO₂ → 2CO, +164.9 ; (b) C + H₂O → CO + H₂, +122.6 ; (c) CO₂ + H₂ → CO + H₂O, +42.3 kJ/kmol as printed
    expect((2 * LHV_MOL.CO - LHV_CARBON) / 1000).toBeCloseTo(165.4, 0);
    expect((LHV_MOL.CO + LHV_MOL.H2 - LHV_CARBON) / 1000).toBeCloseTo(123.1, 0);
    expect((LHV_MOL.CO - LHV_MOL.H2) / 1000).toBeCloseTo(42.4, 0);
  });
  it('heating value, air and mixture of a known gas', () => {
    expect(heatingValue(1, 0, 0)).toBe(12.655e6);
    expect(stoichAirToGas(1, 0, 0)).toBeCloseTo(0.5 / 0.21, 6);
    expect(mixtureEnergy(0, 0, 1)).toBeCloseTo(35.825e6 / (1 + 2 / 0.21), 0);
  });
  it('the dew point and the saturation pressure are inverse, and read the steam table', () => {
    expect(dewPoint(saturationPressure(60))).toBeCloseTo(60, 6);
    expect(saturationPressure(100) / 1000).toBeCloseTo(101.3, -1);
    expect(dewPoint(0)).toBe(-Infinity);
  });
  it('sensible heat and temperature are inverse', () => {
    const n = { ...newMoles(), N2: 1, CO2: 0.3, H2O: 0.2, CO: 0.4, H2: 0.3, CH4: 0.05 };
    for (const T of [100, 500, 1400]) expect(temperatureOf(n, sensibleHeat(n, T))).toBeCloseTo(T, 1);
  });
});

describe('the water-gas equilibrium', () => {
  it('reads FAO Table 2.2 on its rows, and holds at its ends', () => {
    for (const [T, k] of K_WE_TABLE) expect(waterGasK(T)).toBe(k);
    expect(waterGasK(650)).toBeCloseTo(0.5, 6);
    expect(waterGasK(300)).toBe(0.38);
    expect(waterGasK(1500)).toBe(1.6);
  });
  it('solveAtOxygen satisfies the constant and the atom counts', () => {
    const n = newMoles();
    expect(solveAtOxygen(30, 50, 40, 0.62, n)).toBe(true);
    expect((n.CO * n.H2O) / (n.CO2 * n.H2)).toBeCloseTo(0.62, 8);
    expect(n.CO + n.CO2).toBeCloseTo(30, 8);
    expect(n.CO + 2 * n.CO2 + n.H2O).toBeCloseTo(40, 8);
    expect(2 * n.H2 + 2 * n.H2O).toBeCloseTo(50, 8);
    // K = 1 is the linear case of the quadratic
    expect(solveAtOxygen(30, 50, 40, 1, n)).toBe(true);
    expect((n.CO * n.H2O) / (n.CO2 * n.H2)).toBeCloseTo(1, 8);
    // too little oxygen to carry the carbon
    expect(solveAtOxygen(30, 50, 20, 0.62, n)).toBe(false);
  });
});

describe('the four balances and the energy, at any fuel', () => {
  const cases: GasifyConditions[] = [
    base,
    { ...base, moistureWet: 0 },
    { ...base, moistureWet: 0.3, drainShare: 0.7 },
    { ...base, moistureWet: 0.5, heatLossShare: 0.05 },
    { ...base, heatLossShare: 0.25, frozenT: 1000, outletT: 400 },
  ];
  it('elements close to rounding', () => {
    for (const c of cases) {
      const g = gasify(c);
      const n = g.moles;
      const nW = 1 / WOOD_MOLAR_MASS;
      const waterKg = c.moistureWet / (1 - c.moistureWet);
      const waterFire = (waterKg * (1 - c.drainShare)) / MOLAR_MASS.H2O;
      expect(n.CO + n.CO2 + n.CH4 + c.residueCarbon).toBeCloseTo(nW, 8);
      expect(2 * n.H2 + 2 * n.H2O + 4 * n.CH4).toBeCloseTo(WOOD_H * nW + 2 * waterFire, 8);
      expect(n.CO + 2 * n.CO2 + n.H2O).toBeCloseTo(WOOD_O * nW + waterFire + 2 * g.oxygen, 8);
      expect(n.N2).toBeCloseTo(N2_PER_O2 * g.oxygen, 8);
    }
  });
  it('the equilibrium holds at the frozen temperature', () => {
    for (const c of cases) {
      const n = gasify(c).moles;
      expect((n.CO * n.H2O) / (n.CO2 * n.H2)).toBeCloseTo(waterGasK(c.frozenT), 6);
    }
  });
  it('energy closes: chemical + sensible + casing + residue = the fuel as fired', () => {
    for (const c of cases) {
      const g = gasify(c);
      const lhvIn = c.lhvDry - (LATENT * c.moistureWet) / (1 - c.moistureWet);
      const out =
        chemicalEnergy(g.moles) +
        sensibleHeat(g.moles, c.outletT) +
        lhvIn * c.heatLossShare +
        c.residueCarbon * LHV_CARBON;
      expect(out / lhvIn).toBeCloseTo(1, 6);
      expect(g.coldGasEff).toBeLessThan(1);
    }
  });
  it('the gas never holds more energy than the wood; more loss, more air, poorer gas', () => {
    const a = gasify({ ...base, heatLossShare: 0.05 });
    const b = gasify({ ...base, heatLossShare: 0.25 });
    expect(a.oxygen).toBeLessThan(b.oxygen);
    expect(a.heatingValue).toBeGreaterThan(b.heatingValue);
    expect(a.coldGasEff).toBeGreaterThan(b.coldGasEff);
    expect(a.coldGasEff).toBeLessThan(1);
  });
  it('a fire short of air: about a third of what burning it all would take', () => {
    const g = gasify(base);
    expect(g.equivalenceRatio).toBeGreaterThan(0.2);
    expect(g.equivalenceRatio).toBeLessThan(0.5);
    expect(WOOD_STOICH_O2).toBeCloseTo(1.05, 6);
  });
  describe('reads FAO’s own calculated curves, by eye off the printed figures, to about two points', () => {
    const near = (c: Partial<GasifyConditions>, co: number, h2: number, co2: number, n2?: number) => {
      const g = gasify({ ...base, residueCarbon: 0, drainShare: 0, ...c });
      expect(Math.abs(g.xCO * 100 - co)).toBeLessThan(2.5);
      expect(Math.abs(g.xH2 * 100 - h2)).toBeLessThan(2.5);
      expect(Math.abs(g.xCO2 * 100 - co2)).toBeLessThan(2);
      if (n2 !== undefined) expect(Math.abs(g.xN2 * 100 - n2)).toBeLessThan(2);
    };
    // the figures do not say the other condition: Fig. 2.5 reads as no sensible heat at all, Fig. 2.6 as 10 % of losses, Fig. 2.4 (15 % by its caption) as an exit near 150 °C. They are read so; no parameter of the machine comes from here
    it('Fig. 2.5, losses by conduction and radiation', () => {
      near({ moistureWet: 0, heatLossShare: 0, outletT: 25 }, 37, 25.5, 3.5, 33);
      near({ moistureWet: 0, heatLossShare: 0.2, outletT: 25 }, 21.5, 16, 11.5, 49.5);
    });
    it('Fig. 2.6, the exit temperature', () => {
      near({ moistureWet: 0, heatLossShare: 0.1, outletT: 25 }, 29.5, 20.7, 7, 41);
      near({ moistureWet: 0, heatLossShare: 0.1, outletT: 500 }, 22.5, 16.5, 10.5, 49);
    });
    it('Fig. 2.4, the moisture: CO falls, CO₂ climbs, hydrogen peaks', () => {
      const at = { heatLossShare: 0.15, outletT: 150 };
      near({ ...at, moistureWet: 0 }, 24.5, 18, 9.5);
      near({ ...at, moistureWet: 0.2 }, 17.5, 21, 15.5);
      near({ ...at, moistureWet: 0.4 }, 13, 21.8, 18.7);
      near({ ...at, moistureWet: 0.6 }, 5.5, 18, 21.5);
    });
  });
  it('the reduction cools the gas: its heat is positive, the flame stands above the reduction’s end', () => {
    const g = gasify(base);
    const z = hotZones(base, g, 14);
    expect(z.reductionHeat).toBeGreaterThan(0);
    expect(z.oxidationEndT).toBeGreaterThan(z.reductionEndT);
  });
  it('a leak burns gas and adds nitrogen, and its heat is what the fuel lost', () => {
    const n = { ...gasify(base).moles };
    const before = chemicalEnergy(n);
    const heat = burnLeak(n, 0.05);
    expect(chemicalEnergy(n)).toBeCloseTo(before - heat, 3);
    expect(heat).toBeGreaterThan(0);
  });
});

describe('the rooms', () => {
  const V = 50;
  const flows = (air: number) => ({ volumeFirst: V, volumeSecond: 60, airFirst: air, airSecond: 0, exchange: 0 });
  it('no air: the toxic gas just adds up, less what its own volume pushes out', () => {
    const r = { first: 0, second: 0 };
    for (let i = 0; i < 60; i++) stepRooms(r, flows(0), 0.2 / 60, 0, 1);
    // 200 L in 50 m³: 4,000 ppm, research §2.10
    expect(toPpm(r.first)).toBeCloseTo(4000, -2);
  });
  it('one room against the closed form of a steady source', () => {
    const Q = 0.01;
    const S = 1e-3;
    const r = { first: 0, second: 0 };
    const t = 3000;
    for (let i = 0; i < t; i++) stepRooms(r, flows(Q), S, 0, 1);
    const k = (Q + S) / V;
    const exact = (S / (Q + S)) * (1 - Math.exp(-k * t));
    expect(r.first / exact).toBeCloseTo(1, 2);
  });
  it('a room filled with nothing but the source tends to the source’s share, never above', () => {
    const r = { first: 0, second: 0 };
    for (let i = 0; i < 200000; i++) stepRooms(r, flows(0), 0.25, 0.75, 1);
    expect(r.first).toBeCloseTo(0.25, 6);
  });
  it('the second room follows through the exchange and holds no more than the first while filling', () => {
    const r = { first: 0, second: 0 };
    const f = { volumeFirst: 50, volumeSecond: 60, airFirst: 0, airSecond: 0.001, exchange: 0.005 };
    for (let i = 0; i < 600; i++) stepRooms(r, f, 0.001, 0, 1);
    expect(r.second).toBeGreaterThan(0);
    expect(r.second).toBeLessThan(r.first);
  });
  it('is stable at any step', () => {
    const r = { first: 0.01, second: 0 };
    stepRooms(r, { volumeFirst: 50, volumeSecond: 60, airFirst: 1, airSecond: 1, exchange: 1 }, 0, 0, 1e6);
    expect(r.first).toBeGreaterThanOrEqual(0);
    expect(r.second).toBeGreaterThanOrEqual(0);
    expect(r.first).toBeLessThan(0.01);
  });
  it('an atmosphere: the module’s constant', () => {
    expect(ATMOSPHERE).toBe(101325);
  });
});
