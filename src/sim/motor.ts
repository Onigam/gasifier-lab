import { ATMOSPHERE } from './gas/species';
import { DIESEL_LHV, IDLE_EXHAUST_CO, MODEL, type Machine } from './machine';

// The engine: the power law of S1 §2.1.2 with the pilot as an energy flow, and friction, which the source's law leaves out. Modes are reported engines, chosen. No compression ratio, no timing, no pilot quantity is an input
// anywhere (R4): what those settings did is inside three estimated efficiencies, and a test holds that no parameter touches them.
//   P_brake = η_i·(η_burn·G·H + ṁ_d·LHV_d) − P_friction − P_throttle
// Charge at full throttle: G·(1 + r)·(T_mix/T₀) = (V·n/120)·η_v·(p₀ − Δp_train(G))/p₀.

export type EngineMode = 'dual' | 'diesel' | 'spark';

export interface MotorOptions {
  etaDual?: number;
  etaDiesel?: number;
  etaSpark?: number;
  volumetricEff?: number;
  peakPressure?: number;
  burnAtWork?: number;
}

/** Friction mean pressure, Pa: Chen and Flynn's form (from memory). Holds a usual engine's pumping too. */
export function frictionMep(rpm: number, stroke: number, peak: number = MODEL.peakPressure): number {
  const pistonSpeed = (2 * stroke * rpm) / 60;
  return 0.137e5 + peak / 200 + 0.162e5 * pistonSpeed;
}

/** W of a mean pressure on an engine, four strokes. */
export const mepPower = (mep: number, displacement: number, rpm: number): number => (mep * displacement * rpm) / 120;

/** m³/s swept, four strokes. */
export const sweptFlow = (displacement: number, rpm: number): number => (displacement * rpm) / 120;

/** The burnt share of idle: S3's 5–8 % CO in idling exhaust says how much of the gas's CO came through. A figure from other engines, read back as a burn. */
export function idleBurn(xCO: number, airToGas: number, exhaustCO: number = IDLE_EXHAUST_CO): number {
  const passed = (exhaustCO * (1 + airToGas)) / Math.max(1e-6, xCO);
  return Math.max(0.05, Math.min(1, 1 - passed));
}

/** Share of the gas that burns, by the share of the machine's test maximum asked for. */
export function burnShare(loadShare: number, idle: number, atWork: number = MODEL.burnAtWork): number {
  const s = Math.max(0, Math.min(1, loadShare / MODEL.burnKnee));
  return idle + (atWork - idle) * (1 - (1 - s) * (1 - s));
}

export interface OperatingPoint {
  mode: EngineMode;
  rpm: number;
  /** W at the shaft. */
  power: number;
  /** W asked; Infinity at full throttle. */
  asked: number;
  /** W the engine could give at this speed, full throttle. */
  powerWot: number;
  /** Asked more than it can give. */
  short: boolean;
  /** Dry gas, Nm³/s. */
  gas: number;
  /** Air with it, Nm³/s. */
  air: number;
  /** Diesel, kg/s. */
  diesel: number;
  /** Share of the gas burnt. */
  burn: number;
  /** CO in the exhaust, share. */
  exhaustCO: number;
  /** Exhaust, Nm³/s. */
  exhaust: number;
  /** Absolute pressure in the manifold, Pa. */
  manifold: number;
  /** W lost to friction and to the throttle. */
  friction: number;
  throttling: number;
  /** W of fuel going into the cylinders. */
  fuelIn: number;
  /** Depression of the gas train at this flow, Pa. */
  trainDrop: number;
}

export const newOperatingPoint = (): OperatingPoint => ({
  mode: 'dual',
  rpm: 0,
  power: 0,
  asked: 0,
  powerWot: 0,
  short: false,
  gas: 0,
  air: 0,
  diesel: 0,
  burn: 1,
  exhaustCO: 0,
  exhaust: 0,
  manifold: ATMOSPHERE,
  friction: 0,
  throttling: 0,
  fuelIn: 0,
  trainDrop: 0,
});

export interface GasFeed {
  /** J/Nm³ of dry gas. */
  heating: number;
  /** m³ of air per m³ of gas. */
  airToGas: number;
  /** CO in the dry gas, share. */
  xCO: number;
  /** Mixture's temperature at the valve, °C. */
  mixT: number;
}

const Tzero = 273.15;

/**
 * What the engine does at this speed and this asked power, with this gas behind this train. `asked` Infinity: full throttle. `trainDrop(G)` gives the depression at a dry-gas flow, Pa. It is called some 60 times at most, and only when the operating point changes.
 */
export function solveEngine(
  m: Machine,
  mode: EngineMode,
  rpm: number,
  asked: number,
  feed: GasFeed,
  trainDrop: (gas: number) => number,
  o: MotorOptions = {},
  out: OperatingPoint = newOperatingPoint(),
): OperatingPoint {
  const etaV = o.volumetricEff ?? MODEL.volumetricEff;
  const friction = mepPower(frictionMep(rpm, m.stroke, o.peakPressure), m.displacement, rpm);
  out.mode = mode;
  out.rpm = rpm;
  out.asked = asked;
  out.friction = friction;
  const swept = sweptFlow(m.displacement, rpm);

  if (mode === 'diesel') {
    const eta = o.etaDiesel ?? MODEL.etaDiesel;
    const wot = maxDieselPower(m, rpm);
    const power = Math.min(asked, wot);
    const fuel = (power + friction) / eta;
    out.power = power;
    out.powerWot = wot;
    out.short = asked > wot && Number.isFinite(asked);
    out.gas = 0;
    out.air = (swept * etaV * Tzero) / (Tzero + feed.mixT);
    out.diesel = fuel / DIESEL_LHV;
    out.burn = 1;
    out.exhaustCO = 0;
    out.exhaust = out.air;
    out.manifold = ATMOSPHERE;
    out.throttling = 0;
    out.fuelIn = fuel;
    out.trainDrop = 0;
    return out;
  }

  const eta = mode === 'spark' ? (o.etaSpark ?? MODEL.etaSpark) : (o.etaDual ?? MODEL.etaDual);
  const diesel = mode === 'dual' ? m.pilotPerRev * (rpm / 60) : 0;
  const pilot = diesel * DIESEL_LHV;
  const r = feed.airToGas;
  const toNormal = Tzero / (Tzero + feed.mixT);
  const fullCharge = swept * etaV * toNormal; // Nm³/s at p₀
  const loadShare = Number.isFinite(asked) ? Math.max(0, asked) / m.powerMax : 1;
  const idle = idleBurn(feed.xCO, r);
  const burn = burnShare(loadShare, idle, o.burnAtWork);

  const manifoldAt = (G: number): number => (ATMOSPHERE * (G * (1 + r))) / fullCharge;
  const powerAt = (G: number): number => {
    const p = manifoldAt(G);
    const throttling = mepPower(Math.max(0, ATMOSPHERE - p), m.displacement, rpm);
    return eta * (burn * G * feed.heating + pilot) - friction - throttling;
  };

  // full throttle: the most gas the cylinder can draw through the train
  let lo = 0;
  let hi = fullCharge / (1 + r);
  for (let i = 0; i < 40; i++) {
    const G = 0.5 * (lo + hi);
    if (manifoldAt(G) < ATMOSPHERE - trainDrop(G)) lo = G;
    else hi = G;
  }
  const Gwot = 0.5 * (lo + hi);
  const wot = powerAt(Gwot);

  let G = Gwot;
  if (Number.isFinite(asked) && wot > asked) {
    // less gas: the gas power meets the asked, at the throttle's price
    let a = 0;
    let b = Gwot;
    for (let i = 0; i < 40; i++) {
      const x = 0.5 * (a + b);
      if (powerAt(x) < asked) a = x;
      else b = x;
    }
    G = 0.5 * (a + b);
  }
  const p = manifoldAt(G);
  out.gas = G;
  out.air = G * r;
  out.diesel = diesel;
  out.burn = burn;
  out.power = powerAt(G);
  out.powerWot = wot;
  out.short = Number.isFinite(asked) && wot < asked;
  out.manifold = p;
  out.throttling = mepPower(Math.max(0, ATMOSPHERE - p), m.displacement, rpm);
  out.fuelIn = G * feed.heating + pilot;
  out.exhaust = G * (1 + r);
  out.exhaustCO = (feed.xCO * G * (1 - burn)) / Math.max(1e-9, out.exhaust);
  out.trainDrop = trainDrop(G);
  return out;
}

/** Straight diesel's limit at a speed: the machine's reported power at its reported speed, the same mean pressure elsewhere. The smoke limit decides it, and the model has no smoke. */
export function maxDieselPower(m: Machine, rpm: number): number {
  return (m.powerDiesel * rpm) / m.rpmFull;
}

/** Diesel alone, kg/s, for a power at a speed: what the pilot and the gas replaced. */
export function dieselAlone(m: Machine, power: number, rpm: number, o: MotorOptions = {}): number {
  const friction = mepPower(frictionMep(rpm, m.stroke, o.peakPressure), m.displacement, rpm);
  return (power + friction) / (o.etaDiesel ?? MODEL.etaDiesel) / DIESEL_LHV;
}
