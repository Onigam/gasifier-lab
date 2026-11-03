import {
  createNetwork,
  naturalFilm,
  FILM_VERTICAL,
  radiationConductance,
  setLinkConductance,
  stackDraft,
  stepNetwork,
  airRho,
  type RCNetwork,
} from '@onigam/lab-kit/sim/thermal';
import {
  ATMOSPHERE,
  burnLeak,
  dewPoint,
  dryMoles,
  gasify,
  heatingValue,
  mixtureEnergy,
  MOLAR_VOLUME,
  newGasResult,
  newHotZones,
  newMoles,
  sensibleHeat,
  stepRooms,
  stoichAirToGas,
  hotZones,
  type GasifyConditions,
  type GasMoles,
  type GasResult,
  type HotZones,
  type RoomFlows,
} from './gas';
import { DIESEL_LHV, DOOR_ACH, FAN_CO, LHV_DRY, MACHINES, MODEL, POST_GAS_CO, ROOM, type Machine } from './machine';
import {
  dieselAlone,
  newOperatingPoint,
  solveEngine,
  type GasFeed,
  type MotorOptions,
  type OperatingPoint,
} from './motor';
import { SERVICE, TRUCK_ROAD, type TruckLoad } from './reported';
import { condensation, coolerOut, filterDrop, GAS_CAPACITY, hearthDrop, pipeDrop } from './train';
import type { GasParams } from './types';

// One machine in time. The chemistry and the engine are quasi-steady, solved again when a condition changes and every few seconds as the temperatures move: nothing there has a time constant worth a step. What holds a past is small: three thermal
// masses in the kit's network (hearth, casing, filter box), the bunker, the filter's dust, the clock since a stop, and three pairs of rooms. A step costs well under a microsecond, an operating point a few tens.

export interface PlantOptions extends MotorOptions {
  /** Another engine and its gasifier's scale, for one comparison in `runs.ts`. */
  machine?: Machine;
  heatLossShare?: number;
  frozenT?: number;
  drainShare?: number;
  methane?: number;
  residueCarbon?: number;
  charCarbon?: number;
  lidLeakArea?: number;
}

const H = 0;
const C = 1;
const F = 2;
const LINK_CASING_AIR = 1;
const LINK_FILTER_AIR = 2;

/** Seconds between two solutions of the operating point, on the simulated clock. */
const RESOLVE_EVERY = 10;
/** Tar's plug-flow estimate: the gas's time in the flame zone, s. Research §2.10's « hundredths of a second », a middle. Internal: it is a speed and a size in disguise, and it never reaches the state (R2). */
const FLAME_ZONE_TIME = 0.05;
/** First-order rate of tar cracking, Boroson's form, from memory: k = 4.28e6·exp(−107.5 kJ/mol / RT), 1/s. An estimate of a mechanism. Read the paper before quoting a digit. */
const crackRate = (T: number): number => 4.28e6 * Math.exp(-107500 / (8.314 * (T + 273.15)));

/** Under this the bed gives no more gas: K47's start of pyrolysis, about 250 °C. A fire feeding itself through the leak, S3's « like a stove », is not in the model: it would run on past this. */
const LID_LEAK_MIN_T = 250;

/** Long jobs of the service table as minutes per working hour: middles. */
const LONG_JOBS_PER_HOUR = SERVICE.filter(
  (j) => j.job !== 'prep' && j.job !== 'fill' && !('withFill' in j) && !('withPrep' in j),
).reduce((sum, j) => sum + (j.takes[0] + j.takes[1]) / 2 / ((j.every[0] + j.every[1]) / 2), 0);
const PREP_MINUTES = (SERVICE[0]!.takes[0] + SERVICE[0]!.takes[1]) / 2;
const FILL_MINUTES = SERVICE[1]!.takes[1];

export class Plant {
  readonly m: Machine;
  readonly o: PlantOptions;
  readonly gas: GasResult = newGasResult();
  readonly zones: HotZones = newHotZones();
  readonly op: OperatingPoint = newOperatingPoint();
  private readonly fullOp: OperatingPoint = newOperatingPoint();
  /** What the engine is fed: the gas, after any leak. */
  fedCO = 0;
  fedH2 = 0;
  fedCH4 = 0;
  fedCO2 = 0;
  fedN2 = 0;
  fedH2OWet = 0;
  fedHeating = 0;
  fedAirToGas = 0;
  fedMixture = 0;
  fedYield = 0;
  leakRise = 0;
  private readonly leakMoles: GasMoles = newMoles();
  private readonly conditions: GasifyConditions;
  private readonly feed: GasFeed = { heating: 0, airToGas: 1, xCO: 0.2, mixT: 20 };

  // ---- the thermal masses
  readonly net: RCNetwork;

  // ---- what holds a past
  elapsed = 0;
  bunkerKg: number;
  filterHours = 0;
  stoppedFor = 0;
  stoppedOnce = false;
  fillCount = 0;
  workedSeconds = 0;
  chipsUsed = 0;
  dieselUsed = 0;
  ashUsed = 0;
  condensateL = 0;
  metres = 0;
  plumeTotal = 0;
  coLatched = false;
  vesselHours = 0;
  private sinceSolve = RESOLVE_EVERY;
  private dirty = true;
  private plumeFirst = 0;

  // ---- derived at the last solution
  chips = 0;
  outletT = 300;
  filterInT = 250;
  coolerOutT = 30;
  mixT = 25;
  filterWet = false;
  hearthDropPa = 0;
  filterDropPa = 0;
  pipeDropPa = 0;
  jacketKgS = 0;
  coolerKgS = 0;
  plumeFlow = 0;
  plumeCO = 0;
  crackedShare = 1;
  substitution = 0;
  fullPower = 0;
  diesel0 = 0;

  // ---- the rooms. The middle; the garage's span, by its ventilation; the room above's span, by the ventilation and the floor together
  readonly room = { first: 0, second: 0 };
  readonly garageHigh = { first: 0, second: 0 };
  readonly garageLow = { first: 0, second: 0 };
  readonly aboveHigh = { first: 0, second: 0 };
  readonly aboveLow = { first: 0, second: 0 };
  private readonly flows: RoomFlows = { volumeFirst: 50, volumeSecond: 60, airFirst: 0, airSecond: 0, exchange: 0 };

  constructor(
    readonly p: GasParams,
    options: PlantOptions = {},
  ) {
    this.m = options.machine ?? MACHINES[p.machine];
    this.o = options;
    this.conditions = {
      moistureWet: p.moistureWet / 100,
      lhvDry: LHV_DRY,
      heatLossShare: options.heatLossShare ?? MODEL.heatLossShare,
      outletT: 300,
      frozenT: options.frozenT ?? MODEL.frozenT,
      drainShare: options.drainShare ?? MODEL.drainShare,
      methane: options.methane ?? MODEL.methane,
      residueCarbon: options.residueCarbon ?? MODEL.residueCarbon,
    };
    this.bunkerKg = this.bunkerCapacity;
    this.filterHours = p.filterHours;
    const Ta = p.ambientT;
    this.net = createNetwork(
      [
        { T: Ta, capacity: MODEL.hearthCapacity },
        { T: Ta, capacity: MODEL.casingCapacity },
        { T: Ta, capacity: this.m.filterMass * MODEL.steelCp },
        { T: Ta, fixed: true },
      ],
      [
        { a: H, b: C, G: MODEL.hearthToCasing },
        { a: C, b: 3, G: 40 },
        { a: F, b: 3, G: MODEL.filterLossPerArea * this.m.filterArea },
      ],
    );
    this.settleWarm();
  }

  get bunkerCapacity(): number {
    return this.m.bunkerVolume * this.m.bulkDensity;
  }

  /** Mark a change of condition: the next step solves again. */
  touch(): void {
    this.dirty = true;
  }

  /** The speed of the machine's line for a load share, rpm. Reported points of K9 and K10, straight between. */
  speedForLoad(load: number): number {
    const m = this.m;
    const part = m.powerPart / m.powerMax;
    if (load <= part) return m.rpmIdle + ((m.rpmPart - m.rpmIdle) * Math.max(0, load)) / part;
    return m.rpmPart + ((m.rpmMax - m.rpmPart) * (Math.min(1, load) - part)) / (1 - part);
  }

  /** The truck's power on the road, W: its diesel alone per 10 km (K35) through the diesel's efficiency and friction, at the assumed cruising speed. Reported consumption averages stops and hills, so this is an average too. */
  roadPower(load: TruckLoad): number {
    const m = this.m;
    const kgS = TRUCK_ROAD[load].diesel * (m.groundSpeed / 1e4);
    const eta = this.o.etaDiesel ?? MODEL.etaDiesel;
    const rpm = m.rpmMax;
    const fmep = dieselAlone(m, 0, rpm, this.o) * DIESEL_LHV * eta;
    return kgS * DIESEL_LHV * eta - fmep;
  }

  private trainDrop = (gas: number): number => {
    const p = this.p;
    const pipeT = 0.5 * (this.net.T[F]! + this.coolerOutT);
    return (
      hearthDrop(gas, this.m, p.chipGrade) +
      filterDrop(gas, this.m.filterArea, this.filterHours, this.filterWet || p.filterWetFault) +
      pipeDrop(gas, pipeT)
    );
  };

  /** The fill of a hot start: run the thermal masses to their working values, at this load, from cold. No source describes a start here, and this lab does not (R3): a run opens warm. */
  settleWarm(): void {
    this.dirty = true;
    this.solve();
    for (let i = 0; i < 80; i++) {
      this.stepThermal(120);
      this.solve();
    }
    this.sinceSolve = 0;
  }

  /** Solve the gas, the engine and the train at the present temperatures. */
  solve(): void {
    const p = this.p;
    const m = this.m;
    const c = this.conditions;
    const g = this.gas;
    c.moistureWet = Math.min(0.85, Math.max(0, p.moistureWet / 100));
    c.outletT = this.outletT;
    gasify(c, g);
    hotZones(c, g, this.o.charCarbon ?? MODEL.charCarbon, this.zones);
    this.applyLeak();

    const feed = this.feed;
    feed.heating = this.fedHeating;
    feed.airToGas = this.fedAirToGas;
    feed.xCO = this.fedCO;
    this.mixT = (this.coolerOutT + this.fedAirToGas * p.ambientT) / (1 + this.fedAirToGas);
    feed.mixT = this.mixT;

    const running = p.engineOn;
    const rpmFull = m.rpmFull;
    if (running) {
      let rpm: number;
      let asked: number;
      if (p.fullPower) {
        rpm = rpmFull;
        asked = p.engineMode === 'diesel' ? m.powerDiesel : Infinity;
      } else if (m.id === 'scania-l8050') {
        rpm = m.rpmMax;
        asked = this.roadPower(p.truckLoad);
      } else {
        const L = Math.max(0, Math.min(1, p.load / 100));
        rpm = this.speedForLoad(L);
        asked = L * m.powerMax;
      }
      solveEngine(m, p.engineMode, rpm, asked, feed, this.trainDrop, this.o, this.op);
    } else {
      const o = this.op;
      o.rpm = 0;
      o.power = 0;
      o.gas = 0;
      o.air = 0;
      o.diesel = 0;
      o.exhaust = 0;
      o.exhaustCO = 0;
      o.fuelIn = 0;
      o.friction = 0;
      o.throttling = 0;
      o.manifold = ATMOSPHERE;
      o.short = false;
      o.trainDrop = 0;
      o.asked = 0;
      o.mode = p.engineMode;
    }
    solveEngine(
      m,
      p.engineMode,
      rpmFull,
      p.engineMode === 'diesel' ? m.powerDiesel : Infinity,
      feed,
      this.trainDrop,
      this.o,
      this.fullOp,
    );
    this.fullPower = this.fullOp.power;

    const G = this.op.gas;
    const usesGas = running && p.engineMode !== 'diesel';
    this.chips = usesGas ? G / Math.max(1e-6, this.fedYield) : 0;
    const Cg = G * GAS_CAPACITY;
    const T = this.net.T;
    const Th = T[H]!;
    const Tc = T[C]!;
    if (usesGas && Cg > 0) {
      this.outletT = Tc + (Th - Tc) * Math.exp(-MODEL.outletUA / Cg) + this.leakRise;
      this.filterInT = p.ambientT + (this.outletT - p.ambientT) * Math.exp(-MODEL.pipeLoss / Cg);
      this.coolerOutT = coolerOut(G, T[F]!, p.ambientT, m);
    } else {
      this.outletT = Math.max(p.ambientT, Tc);
      this.filterInT = T[F]!;
      this.coolerOutT = p.ambientT;
    }
    this.hearthDropPa = hearthDrop(G, m, p.chipGrade);
    // the gas below its dew point wets the fabric: K62. Only while gas is flowing: a dead filter holds the state it had.
    if (usesGas) this.filterWet = T[F]! < dewPoint(this.fedH2OWet * ATMOSPHERE);
    this.filterDropPa = filterDrop(G, m.filterArea, this.filterHours, this.filterWet || p.filterWetFault);
    this.pipeDropPa = pipeDrop(G, 0.5 * (T[F]! + this.coolerOutT));
    this.jacketKgS = this.chips * g.drainedWater;
    this.coolerKgS = condensation(G, this.fedH2OWet, this.coolerOutT);
    this.crackedShare = 1 - Math.exp(-crackRate(this.oxidationT) * FLAME_ZONE_TIME);
    this.diesel0 = running && p.engineMode !== 'diesel' ? dieselAlone(m, this.op.power, this.op.rpm, this.o) : 0;
    // at idle the pilot alone exceeds what the bare engine would burn: nothing is replaced
    this.substitution = this.diesel0 > 0 ? Math.max(0, 1 - this.op.diesel / this.diesel0) : 0;
    this.updateRoomFlows();
    this.dirty = false;
    this.sinceSolve = 0;
  }

  private applyLeak(): void {
    const p = this.p;
    const g = this.gas;
    const n = g.moles;
    if (!p.airLeak || p.engineMode === 'diesel') {
      this.fedCO = g.xCO;
      this.fedH2 = g.xH2;
      this.fedCH4 = g.xCH4;
      this.fedCO2 = g.xCO2;
      this.fedN2 = g.xN2;
      this.fedH2OWet = g.xH2OWet;
      this.fedHeating = g.heatingValue;
      this.fedAirToGas = g.airToGas;
      this.fedMixture = g.mixtureEnergy;
      this.fedYield = g.yieldWet;
      this.leakRise = 0;
      return;
    }
    const l = this.leakMoles;
    l.CO = n.CO;
    l.H2 = n.H2;
    l.CH4 = n.CH4;
    l.CO2 = n.CO2;
    l.H2O = n.H2O;
    l.N2 = n.N2;
    const heat = burnLeak(l, MODEL.leakAirShare);
    const dry = dryMoles(l);
    this.fedCO = l.CO / dry;
    this.fedH2 = l.H2 / dry;
    this.fedCH4 = l.CH4 / dry;
    this.fedCO2 = l.CO2 / dry;
    this.fedN2 = l.N2 / dry;
    this.fedH2OWet = l.H2O / (dry + l.H2O);
    this.fedHeating = heatingValue(this.fedCO, this.fedH2, this.fedCH4);
    this.fedAirToGas = stoichAirToGas(this.fedCO, this.fedH2, this.fedCH4);
    this.fedMixture = mixtureEnergy(this.fedCO, this.fedH2, this.fedCH4);
    this.fedYield = dry * MOLAR_VOLUME * g.wetFraction;
    this.leakRise = heat / Math.max(1, sensibleHeat(l, 300) / 275);
  }

  // ---- temperatures, °C, for the state and the journey

  get hearthT(): number {
    return this.net.T[H]!;
  }

  get casingT(): number {
    return this.net.T[C]!;
  }

  get filterT(): number {
    return this.net.T[F]!;
  }

  /** The flame's lift over the hearth, K: from the balance, and only with air coming in. */
  get oxidationT(): number {
    const z = this.zones;
    const lift = this.p.engineOn && this.p.engineMode !== 'diesel' ? z.oxidationEndT - z.reductionEndT : 0;
    return this.hearthT + lift;
  }

  // ---- the plume after a stop

  /** Gas leaving the unit, Nm³/s. Estimate, wholly: an exponential holding the volume asked, with half the stated time as its constant, and no end. Plus a lid that does not seal (S3), drawn by the hot column while there is fuel. */
  private plumeNow(): number {
    if (this.p.engineOn || this.p.engineMode === 'diesel') return 0;
    const tau = Math.max(30, (this.p.postGasMinutes * 60) / 2);
    let q = (this.p.postGasVolume / tau) * Math.exp(-this.stoppedFor / tau);
    if (this.p.lidLeak) q += this.lidLeakFlow();
    return q;
  }

  /** A hot column's draught through a leak: an orifice on the kit's stack draft. The bed's own air keeps it going. The leak's size is an estimate, and no source gives one. */
  lidLeakFlow(): number {
    const Th = this.hearthT;
    if (Th < LID_LEAK_MIN_T || this.bunkerKg <= 0) return 0;
    const dp = stackDraft(ROOM.lidLeakHeight, Th, this.p.ambientT);
    if (dp <= 0) return 0;
    const rho = airRho(Th);
    return (this.o.lidLeakArea ?? ROOM.lidLeakArea) * 0.6 * Math.sqrt((2 * dp) / rho) * (273.15 / (Th + 273.15));
  }

  private updateRoomFlows(): void {
    const f = this.flows;
    const p = this.p;
    f.volumeFirst = p.garageVolume;
    f.volumeSecond = ROOM.aboveVolume;
  }

  // ---- time

  private stepThermal(dt: number): void {
    const p = this.p;
    const net = this.net;
    const T = net.T;
    const Q = net.Q;
    const G = this.op.gas;
    const running = p.engineOn && p.engineMode !== 'diesel' && G > 0;
    const Cg = G * GAS_CAPACITY;
    if (running) {
      // the hearth sees the gas at its own temperature, where a Nm³ holds more heat per kelvin than at the cooler's
      const Tb = this.zones.reductionEndT;
      const Chot = (this.chips * this.gas.wetFraction * sensibleHeat(this.gas.moles, Tb)) / Math.max(1, Tb - 25);
      Q[H] = Chot * (Tb - T[H]!);
      Q[C] = MODEL.gasToCasing * (0.5 * (T[H]! + this.outletT) - T[C]!);
      Q[F] = Cg * (this.filterInT - T[F]!);
    } else {
      // burning like a stove, as S3 has it: a share of the fuel's energy goes on heating the bed
      const burning = !p.engineOn && p.lidLeak && this.bunkerKg > 0 ? this.lidLeakFlow() : 0;
      Q[H] =
        burning > 0 ? (burning / Math.max(1e-3, this.gas.yieldWet)) * this.gas.lhvWet * (1 - this.gas.coldGasEff) : 0;
      Q[C] = 0;
      Q[F] = 0;
    }
    T[3] = p.ambientT;
    const Tc = T[C]!;
    const dT = Math.abs(Tc - p.ambientT);
    const A = MODEL.casingArea;
    setLinkConductance(
      net,
      LINK_CASING_AIR,
      radiationConductance(MODEL.casingEmissivity, A, Tc, p.ambientT) + naturalFilm(dT, FILM_VERTICAL) * A,
    );
    setLinkConductance(net, LINK_FILTER_AIR, MODEL.filterLossPerArea * this.m.filterArea);
    stepNetwork(net, dt);
  }

  /** One fixed step, s. */
  step(dt: number): void {
    const p = this.p;
    if (this.dirty || this.sinceSolve >= RESOLVE_EVERY) this.solve();
    this.sinceSolve += dt;
    this.elapsed += dt;
    this.stepThermal(dt);

    if (p.engineOn) {
      this.stoppedFor = 0;
      this.plumeFlow = 0;
      this.plumeCO = 0;
      this.plumeFirst = 0;
      this.plumeTotal = 0;
      this.workedSeconds += dt;
      const used = this.chips * dt;
      this.bunkerKg -= used;
      this.chipsUsed += used;
      this.dieselUsed += this.op.diesel * dt;
      this.ashUsed += (used * 0.035 * this.gas.wetFraction) / 0.92;
      this.condensateL += (this.jacketKgS + this.coolerKgS) * dt;
      this.metres += this.m.groundSpeed * dt;
      if (p.filterAges && this.op.gas > 0) this.filterHours += dt / 3600;
      this.vesselHours += this.op.gas > 0 ? dt / 3600 : 0;
      if (this.bunkerKg <= 0) {
        this.bunkerKg += this.bunkerCapacity;
        this.fillCount++;
        // the vessel was emptied at the fuel stop (S1 Table 3.17, note 1), when it was due
        if (!p.vesselNeglected && this.vesselHours >= 2) this.vesselHours = 0;
        this.dirty = true;
      }
    } else {
      this.stoppedOnce = true;
      this.stoppedFor += dt;
      const q = this.plumeNow();
      this.plumeFlow = q;
      this.plumeCO = q * POST_GAS_CO;
      this.plumeTotal += q * dt;
      if (this.plumeFirst === 0) this.plumeFirst = q;
      if (p.lidLeak && this.lidLeakFlow() > 0) {
        this.bunkerKg = Math.max(0, this.bunkerKg - (q / Math.max(1e-3, this.gas.yieldWet)) * dt);
      }
    }
    this.stepRooms(dt);
  }

  /** The plume against its first moment, 0 to 1. */
  get plumeShare(): number {
    return this.plumeFirst > 0 ? Math.min(1, this.plumeFlow / this.plumeFirst) : 0;
  }

  /** What enters the garage now, m³/s: carbon monoxide, and everything that comes with it. */
  private stepRooms(dt: number): void {
    const p = this.p;
    if (p.place !== 'garage') return;
    let toxic = 0;
    let carrier = 0;
    if (p.engineOn) {
      toxic += this.op.exhaust * this.op.exhaustCO;
      carrier += this.op.exhaust * (1 - this.op.exhaustCO);
    } else {
      toxic += this.plumeCO;
      carrier += this.plumeFlow - this.plumeCO;
    }
    if (p.fanSource) {
      toxic += FAN_CO;
      carrier += FAN_CO * (1 / POST_GAS_CO - 1);
    }
    const ach = DOOR_ACH[p.door];
    const f = this.flows;
    const V = p.garageVolume;
    const Va = ROOM.aboveVolume;
    f.airSecond = (ROOM.aboveAch * Va) / 3600;
    f.exchange = (ROOM.floorExchange[1] * Va) / 3600;
    f.airFirst = (ach[1] * V) / 3600;
    stepRooms(this.room, f, toxic, carrier, dt);
    f.airFirst = (ach[0] * V) / 3600;
    stepRooms(this.garageHigh, f, toxic, carrier, dt);
    f.airFirst = (ach[2] * V) / 3600;
    stepRooms(this.garageLow, f, toxic, carrier, dt);
    f.airFirst = (ach[0] * V) / 3600;
    f.exchange = (ROOM.floorExchange[2] * Va) / 3600;
    stepRooms(this.aboveHigh, f, toxic, carrier, dt);
    f.airFirst = (ach[2] * V) / 3600;
    f.exchange = (ROOM.floorExchange[0] * Va) / 3600;
    stepRooms(this.aboveLow, f, toxic, carrier, dt);
    if (this.room.first > 1e-6) this.coLatched = true;
  }

  /** Service, min, on the table's middles: a day's preparation for each started 8 h, the fills as they fell, the long jobs at their rate. Durations only (R3). */
  serviceMinutes(): number {
    const h = this.workedSeconds / 3600;
    if (h <= 0) return 0;
    return Math.ceil(h / 8) * PREP_MINUTES + this.fillCount * FILL_MINUTES + h * LONG_JOBS_PER_HOUR;
  }
}
