import type { LabSim } from '@onigam/lab-kit/ui';
import { newAnalyser, journey } from './journey';
import { ladderRung } from './ladder';
import {
  DIESEL_LHV,
  DRAWN_MACHINE,
  FILTER_AGE,
  FILTER_MAX_T,
  GAS_MIN,
  MOISTURE_FIELD_MAX,
  MOISTURE_NO_BURN,
  MOISTURE_UPPER,
  MODEL,
  type MachineId,
} from './machine';
import { sweptFlow } from './motor';
import { Plant, type PlantOptions } from './plant';
import {
  presetParams,
  RANGES,
  scenarioSetup,
  type RangedKey,
  type ScenarioSetup,
  type ScheduledEvent,
} from './presets';
import { tarMeasured } from './reported';
import { filterAgeFactor } from './train';
import type { AlarmKey, GasParams, GasState, PresetId, ScenarioId, Scope } from './types';

// GasifierSim: the machine as the kit's `LabSim`. One clock: the simulation moves on `dt × timeScale`, in fixed steps of a second, so that the same inputs give the same state on any machine (tested). The dots, the flames and the wheels are the 3D's, on `view.slowMo`, from the rates in the state. Deterministic: nothing is drawn at random, nothing reads a wall clock.
// There is no gesture of use here. A stop is a change of the state, because it is what the lab's last world is about; nothing lights, fans, fills or empties at a visitor's hand (R3).

/** Longest real step taken at once, s. */
const DT_MAX = 0.25;
/** The fixed step, s. */
export const STEP = 1;
/** Most steps in one frame. An hour per second at 60 fps takes 60. */
const MAX_STEPS = 1200;
const SCOPE_EVERY = 30;
const SCOPE_LENGTH = 1200;

/** Petrol's mixture, J/m³. Reported: K26. */
export const PETROL_MIXTURE = 3.8e6;
/** Dust after the fabric, mg/m³. Reported: K62. */
export const DUST_AFTER_FABRIC = 0.3;
/** The test maximum's gas, Nm³/h: research §2.10's 89, for the 3D's dots. */
const GAS_REFERENCE = 89;
/** France's limits, ppm. Reported: K65. */
export const CO_LIMIT_8H = 20;
export const CO_LIMIT_SHORT = 100;
/** The ladder's first symptom, ppm. Reported: K51. */
export const CO_FIRST_SYMPTOM = 200;

const TIME_KEYS: (keyof GasParams)[] = ['slowMo', 'timeScale', 'running', 'journey'];

const newState = (): GasState => ({
  simTime: 0,
  hour: 0,
  minutesSinceStop: 0,
  stoppedOnce: false,
  engineOn: true,
  engineMode: 'dual',
  engineRpm: 0,
  powerKw: 0,
  powerAskedKw: 0,
  powerWotKw: 0,
  powerShort: false,
  dieselRatedKw: 0,
  fullPowerKw: 0,
  deratingVsDiesel: 0,
  mixtureMJ: 0,
  petrolMixtureMJ: PETROL_MIXTURE / 1e6,
  deratingVsPetrol: 0,
  airToGas: 0,
  chargeShare: 0,
  burnShare: 1,
  exhaustCO: 0,
  frictionKw: 0,
  throttlingKw: 0,
  chipsKgH: 0,
  dieselKgH: 0,
  gasNm3H: 0,
  airNm3H: 0,
  gasFlowShare: 0,
  dieselSubstitution: 0,
  chipsPerDiesel: 0,
  groundSpeedMs: 0,
  gasMJ: 0,
  gasCO: 0,
  gasH2: 0,
  gasCH4: 0,
  gasCO2: 0,
  gasN2: 0,
  gasH2O: 0,
  gasCoPpm: 0,
  coldGasEff: 0,
  equivalenceRatio: 0,
  gasYield: 0,
  airPerKg: 0,
  dewPointC: 0,
  woodKw: 0,
  dieselKw: 0,
  gasKw: 0,
  gasifierLossKw: 0,
  lossHotGasKw: 0,
  lossResidueKw: 0,
  lossCasingKw: 0,
  shaftKw: 0,
  engineLossKw: 0,
  totalLossKw: 0,
  totalEff: 0,
  dieselShare: 0,
  zoneDryingT: 0,
  zonePyrolysisT: 0,
  zoneOxidationT: 0,
  zoneReductionT: 0,
  outletT: 0,
  casingT: 0,
  reductionKw: 0,
  tarCrackedShare: 0,
  tarG: 0,
  bunkerShare: 1,
  bunkerKg: 0,
  bunkerMinutesLeft: 0,
  chipFallCmMin: 0,
  chipFallHours: 0,
  grateMoving: false,
  fillCount: 0,
  analyser: newAnalyser(),
  hearthDropMbar: 0,
  filterDropMbar: 0,
  filterDropMmWg: 0,
  pipeDropMbar: 0,
  trainDropMbar: 0,
  filterInT: 0,
  filterT: 0,
  filterWet: false,
  filterHours: 0,
  filterAgeKm: 0,
  coolerOutT: 0,
  mixT: 0,
  dustMg: DUST_AFTER_FABRIC,
  condensateJacketLph: 0,
  condensateCoolerLph: 0,
  coolerVesselShare: 0,
  ashKgH: 0,
  workedHours: 0,
  serviceMinutes: 0,
  serviceMinPerHour: 0,
  chipsUsedKg: 0,
  dieselUsedKg: 0,
  ashKg: 0,
  condensateL: 0,
  kmDriven: 0,
  chipsPer10Km: 0,
  dieselPer10Km: 0,
  gaugeMbar: 0,
  pressureSign: 'suction',
  plumeLpm: 0,
  plumeCoLpm: 0,
  plumeShare: 0,
  plumeTotalM3: 0,
  plumeVisible: false,
  place: 'field',
  door: 'shut',
  garageVolume: 50,
  garageCoPpm: 0,
  garageCoPpmLow: 0,
  garageCoPpmHigh: 0,
  roomAboveCoPpm: 0,
  roomAboveCoPpmLow: 0,
  roomAboveCoPpmHigh: 0,
  ladderRung: -1,
  coLatched: false,
  figureTag: '†',
  roomTag: '*',
  onDrawnMachine: true,
  alarms: [],
});

export class GasifierSim implements LabSim {
  readonly params: GasParams;
  readonly state: GasState = newState();
  readonly scope: Scope = {
    t: [],
    powerKw: [],
    chipsKgH: [],
    gasMJ: [],
    gasCO: [],
    filterDropMbar: [],
    outletT: [],
    filterT: [],
    casingT: [],
    garageCoPpm: [],
    garageCoPpmLow: [],
    garageCoPpmHigh: [],
    roomAboveCoPpm: [],
    plumeLpm: [],
  };
  private plant!: Plant;
  private listeners = new Set<() => void>();
  private events: ScheduledEvent[] = [];
  private nextEvent = 0;
  private lastKind: 'preset' | 'scenario' = 'preset';
  private lastId: PresetId | ScenarioId = DRAWN_MACHINE;
  private pending = 0;
  private sinceScope = 0;

  constructor(private readonly options: PlantOptions = {}) {
    this.params = presetParams(DRAWN_MACHINE);
    this.applyPreset(DRAWN_MACHINE);
  }

  // ------------------------------------------------------------------ the LabSim contract

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters (clamped to their range). Anything but the time controls turns the preset into 'custom'. */
  set(patch: Partial<GasParams>): void {
    const p = this.params as unknown as Record<string, unknown>;
    let physical = false;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const k = key as keyof GasParams;
      if (k === 'machine') {
        this.applyPreset(value as MachineId);
        continue;
      }
      if (key in RANGES) {
        const r = RANGES[key as RangedKey];
        p[key] = Math.min(r.max, Math.max(r.min, Number(value)));
      } else if (key === 'slowMo' || key === 'timeScale') {
        p[key] = Math.max(0, Number(value));
      } else {
        p[key] = value;
      }
      if (!TIME_KEYS.includes(k) && k !== 'preset') physical = true;
      if (k === 'filterHours') this.plant.filterHours = this.params.filterHours;
    }
    if (physical && patch.preset === undefined) this.params.preset = 'custom';
    this.plant.touch();
    this.plant.solve();
    this.refreshState();
    this.emit();
  }

  applyPreset(id: string): void {
    this.lastKind = 'preset';
    this.lastId = id as PresetId;
    this.load({ params: presetParams(id as PresetId), events: [] });
  }

  applyScenario(id: string): void {
    this.lastKind = 'scenario';
    this.lastId = id as ScenarioId;
    this.load(scenarioSetup(id as ScenarioId));
  }

  /** The scenario running, if it came from one: its lesson stays in the panel while the visitor tries things. */
  get scenarioNow(): ScenarioId | null {
    return this.lastKind === 'scenario' ? (this.lastId as ScenarioId) : null;
  }

  /** Start again from the last preset or scenario. */
  reset(): void {
    if (this.lastKind === 'preset') this.applyPreset(this.lastId);
    else this.applyScenario(this.lastId);
  }

  private load(s: ScenarioSetup): void {
    const keep = { slowMo: this.params.slowMo, running: this.params.running };
    Object.assign(this.params, s.params, keep);
    this.events = [...s.events].sort((a, b) => a.t - b.t);
    this.nextEvent = 0;
    this.pending = 0;
    this.sinceScope = 0;
    for (const k of Object.keys(this.scope) as (keyof Scope)[]) this.scope[k].length = 0;
    // a run opens warm, as if the machine had worked: this lab has no start (R3). A run that opens stopped is warmed running, then stopped.
    const stopped = !this.params.engineOn;
    if (stopped) this.params.engineOn = true;
    this.plant = new Plant(this.params, this.options);
    if (stopped) {
      this.params.engineOn = false;
      this.plant.touch();
      this.plant.solve();
    }
    this.fireEvents();
    this.refreshState();
    this.sample();
    this.emit();
  }

  // ------------------------------------------------------------------ time

  step(dtReal: number): void {
    if (!this.params.running) return;
    const dt = Math.min(Math.max(dtReal, 0), DT_MAX);
    if (dt === 0) return;
    this.pending += dt * this.params.timeScale;
    let n = 0;
    while (this.pending >= STEP && n < MAX_STEPS) {
      this.plant.step(STEP);
      this.pending -= STEP;
      this.sinceScope += STEP;
      this.fireEvents();
      if (this.sinceScope >= SCOPE_EVERY) {
        this.sinceScope -= SCOPE_EVERY;
        this.refreshState();
        this.sample();
      }
      n++;
    }
    if (this.pending >= STEP) this.pending = 0;
    this.refreshState();
  }

  private fireEvents(): void {
    const t = this.plant.elapsed;
    while (this.nextEvent < this.events.length && t >= this.events[this.nextEvent]!.t) {
      const e = this.events[this.nextEvent]!;
      this.nextEvent++;
      const preset = this.params.preset;
      this.set(e.patch);
      this.params.preset = preset;
    }
  }

  /** The plant, for a test and the panel's charts. */
  get plantNow(): Plant {
    return this.plant;
  }

  // ------------------------------------------------------------------ the state

  private refreshState(): void {
    const s = this.state;
    const p = this.params;
    const pl = this.plant;
    const m = pl.m;
    const op = pl.op;
    const g = pl.gas;
    const z = pl.zones;
    const running = p.engineOn;
    const onGas = running && p.engineMode !== 'diesel' && op.gas > 0;

    s.simTime = pl.elapsed;
    s.hour = pl.elapsed / 3600;
    s.minutesSinceStop = running ? 0 : pl.stoppedFor / 60;
    s.stoppedOnce = pl.stoppedOnce;

    s.engineOn = running;
    s.engineMode = p.engineMode;
    s.engineRpm = op.rpm;
    s.powerKw = op.power / 1000;
    s.powerAskedKw = Number.isFinite(op.asked) ? op.asked / 1000 : null;
    s.powerWotKw = op.powerWot / 1000;
    s.powerShort = op.short;
    s.dieselRatedKw = m.powerDiesel / 1000;
    s.fullPowerKw = pl.fullPower / 1000;
    s.deratingVsDiesel = 1 - pl.fullPower / m.powerDiesel;
    s.mixtureMJ = pl.fedMixture / 1e6;
    s.deratingVsPetrol = 1 - pl.fedMixture / PETROL_MIXTURE;
    s.airToGas = pl.fedAirToGas;
    s.chargeShare = op.rpm > 0 ? op.exhaust / sweptFlow(m.displacement, op.rpm) : 0;
    s.burnShare = op.burn;
    s.exhaustCO = op.exhaustCO;
    s.frictionKw = op.friction / 1000;
    s.throttlingKw = op.throttling / 1000;

    s.chipsKgH = pl.chips * 3600;
    s.dieselKgH = op.diesel * 3600;
    s.gasNm3H = op.gas * 3600;
    s.airNm3H = op.air * 3600;
    s.gasFlowShare = s.gasNm3H / GAS_REFERENCE;
    s.dieselSubstitution = pl.substitution;
    const saved = pl.diesel0 - op.diesel;
    s.chipsPerDiesel = saved > 0 ? pl.chips / saved : 0;
    s.groundSpeedMs =
      running && p.place === 'field' && (p.load > 0 || p.fullPower || m.id === 'scania-l8050') ? m.groundSpeed : 0;

    s.gasMJ = pl.fedHeating / 1e6;
    s.gasCO = pl.fedCO;
    s.gasH2 = pl.fedH2;
    s.gasCH4 = pl.fedCH4;
    s.gasCO2 = pl.fedCO2;
    s.gasN2 = pl.fedN2;
    s.gasH2O = pl.fedH2OWet;
    s.gasCoPpm = pl.fedCO * 1e6;
    s.coldGasEff = g.lhvWet > 0 ? (pl.fedHeating * pl.fedYield) / g.lhvWet : 0;
    s.equivalenceRatio = g.equivalenceRatio;
    s.gasYield = pl.fedYield;
    s.airPerKg = g.airPerKgWet;
    s.dewPointC = g.dewPointC;

    const wood = pl.chips * g.lhvWet;
    const diesel = op.diesel * DIESEL_LHV;
    const gasW = op.gas * pl.fedHeating;
    s.woodKw = wood / 1000;
    s.dieselKw = diesel / 1000;
    s.gasKw = gasW / 1000;
    s.gasifierLossKw = (wood - gasW) / 1000;
    s.lossHotGasKw = (pl.chips * g.lossSensible) / 1000;
    s.lossResidueKw = (pl.chips * g.lossResidue) / 1000;
    s.lossCasingKw = (pl.chips * g.lossCasing) / 1000;
    s.shaftKw = s.powerKw;
    s.engineLossKw = Math.max(0, op.fuelIn - op.power) / 1000;
    s.totalLossKw = s.woodKw + s.dieselKw - s.powerKw;
    s.totalEff = wood + diesel > 0 ? op.power / (wood + diesel) : 0;
    s.dieselShare = wood + diesel > 0 ? diesel / (wood + diesel) : 0;

    const Th = pl.hearthT;
    s.zoneReductionT = Th;
    s.zoneOxidationT = pl.oxidationT;
    s.zonePyrolysisT =
      p.ambientT + (Th - p.ambientT) * ((MODEL.pyrolysisEndT - p.ambientT) / Math.max(1, z.reductionEndT - p.ambientT));
    s.zoneDryingT = Math.min(100, p.ambientT + 0.12 * (Th - p.ambientT));
    s.outletT = pl.outletT;
    s.casingT = pl.casingT;
    s.reductionKw = (pl.chips * g.wetFraction * z.reductionHeat) / 1000;
    s.tarCrackedShare = onGas ? pl.crackedShare : 0;
    s.tarG = onGas ? tarMeasured(p.fullPower ? 1 : p.load / 100) : 0;
    const cap = pl.bunkerCapacity;
    s.bunkerKg = pl.bunkerKg;
    s.bunkerShare = pl.bunkerKg / cap;
    s.bunkerMinutesLeft = pl.chips > 0 ? pl.bunkerKg / pl.chips / 60 : 0;
    const section = (Math.PI * m.bunkerDiameter * m.bunkerDiameter) / 4;
    s.chipFallCmMin = (pl.chips / (m.bulkDensity * section)) * 6000;
    s.chipFallHours = s.chipFallCmMin > 0 ? (m.bunkerHeight * 100) / s.chipFallCmMin / 60 : 0;
    s.grateMoving = onGas;
    s.fillCount = pl.fillCount;
    journey(
      p.journey,
      {
        ambientT: p.ambientT,
        hearthT: Th,
        oxidationT: pl.oxidationT,
        outletT: pl.outletT,
        alive: onGas,
        crackedShare: pl.crackedShare,
        afterOxidation: z.afterOxidation,
        final: g.moles,
      },
      s.analyser,
    );

    s.hearthDropMbar = pl.hearthDropPa / 100;
    s.filterDropMbar = pl.filterDropPa / 100;
    s.filterDropMmWg = pl.filterDropPa / 9.80665;
    s.pipeDropMbar = pl.pipeDropPa / 100;
    s.trainDropMbar = (pl.hearthDropPa + pl.filterDropPa + pl.pipeDropPa) / 100;
    s.filterInT = pl.filterInT;
    s.filterT = pl.filterT;
    s.filterWet = pl.filterWet || p.filterWetFault;
    s.filterHours = pl.filterHours;
    s.filterAgeKm = pl.filterHours * FILTER_AGE.kmPerHour;
    s.coolerOutT = pl.coolerOutT;
    s.mixT = pl.mixT;
    s.condensateJacketLph = pl.jacketKgS * 3600;
    s.condensateCoolerLph = pl.coolerKgS * 3600;
    s.coolerVesselShare = pl.vesselHours / MODEL.coolerVesselHours;
    s.ashKgH = pl.chips * 3600 * 0.035 * (g.wetFraction / 0.92);

    s.workedHours = pl.workedSeconds / 3600;
    s.serviceMinutes = pl.serviceMinutes();
    s.serviceMinPerHour = s.workedHours > 0 ? s.serviceMinutes / s.workedHours : 0;
    s.chipsUsedKg = pl.chipsUsed;
    s.dieselUsedKg = pl.dieselUsed;
    s.ashKg = pl.ashUsed;
    s.condensateL = pl.condensateL;
    s.kmDriven = pl.metres / 1000;
    const per10 = m.groundSpeed > 0 ? 1e4 / m.groundSpeed : 0;
    s.chipsPer10Km = m.id === 'scania-l8050' ? pl.chips * per10 : 0;
    s.dieselPer10Km = m.id === 'scania-l8050' ? op.diesel * per10 : 0;

    if (onGas) {
      s.gaugeMbar = -s.hearthDropMbar;
      s.pressureSign = 'suction';
    } else if (!running && pl.plumeFlow > 0) {
      s.gaugeMbar = null;
      s.pressureSign = 'pressure';
    } else {
      s.gaugeMbar = 0;
      s.pressureSign = 'none';
    }
    s.plumeLpm = pl.plumeFlow * 60000;
    s.plumeCoLpm = pl.plumeCO * 60000;
    s.plumeShare = pl.plumeShare;
    s.plumeTotalM3 = pl.plumeTotal;
    s.plumeVisible = !running && pl.plumeFlow > 0;
    s.place = p.place;
    s.door = p.door;
    s.garageVolume = p.garageVolume;
    s.garageCoPpm = pl.room.first * 1e6;
    s.garageCoPpmLow = pl.garageLow.first * 1e6;
    s.garageCoPpmHigh = pl.garageHigh.first * 1e6;
    s.roomAboveCoPpm = pl.room.second * 1e6;
    s.roomAboveCoPpmLow = pl.aboveLow.second * 1e6;
    s.roomAboveCoPpmHigh = pl.aboveHigh.second * 1e6;
    s.ladderRung = ladderRung(s.garageCoPpm);
    s.coLatched = pl.coLatched;

    const measured =
      m.id === DRAWN_MACHINE &&
      p.engineMode === 'dual' &&
      p.moistureWet / 100 <= MOISTURE_FIELD_MAX &&
      !p.airLeak &&
      !s.filterWet;
    s.figureTag = measured ? '†' : '*';
    s.onDrawnMachine = m.id === DRAWN_MACHINE;
    s.alarms = this.alarms();
  }

  private alarms(): AlarmKey[] {
    const s = this.state;
    const p = this.params;
    const a: AlarmKey[] = [];
    const onGas = s.engineOn && p.engineMode !== 'diesel';
    if (s.engineOn && s.powerShort) a.push('engineShort');
    if (onGas && s.gasMJ * 1e6 < GAS_MIN) a.push('gasTooPoor');
    const w = p.moistureWet / 100;
    if (w > MOISTURE_NO_BURN) a.push('moistureNoBurn');
    else if (w > MOISTURE_UPPER) a.push('moistureAboveLimit');
    if (onGas && s.filterWet) a.push('filterWet');
    if (onGas && s.filterT > FILTER_MAX_T) a.push('filterHot');
    if (filterAgeFactor(s.filterHours) >= 1.9) a.push('filterAged');
    if (onGas && p.airLeak) a.push('airLeak');
    if (s.coolerVesselShare > 1 && p.vesselNeglected) a.push('vesselOverfull');
    if (!s.engineOn && p.engineMode !== 'diesel') a.push('gasOutAfterStop');
    if (!s.engineOn && p.lidLeak) a.push('lidLeak');
    if (p.fanSource) a.push('fanOut');
    if (s.place === 'garage' && s.engineOn) a.push('exhaustIndoors');
    if (s.place === 'garage') {
      const c = s.garageCoPpm;
      if (c >= CO_FIRST_SYMPTOM) a.push('coLadder');
      else if (c >= CO_LIMIT_SHORT) a.push('coShortLimit');
      else if (c >= CO_LIMIT_8H) a.push('coWorkLimit');
      if (s.roomAboveCoPpm >= CO_LIMIT_8H) a.push('coRoomAbove');
      if (p.door !== 'shut' && c > 0) a.push('coDoorOpen');
      // no all-clear: once it has been in the room, this stays, however low the box reads
      if (s.coLatched && c < CO_LIMIT_8H) a.push('coNoAllClear');
    }
    return a;
  }

  private sample(): void {
    const sc = this.scope;
    const s = this.state;
    sc.t.push(s.simTime / 60);
    sc.powerKw.push(s.powerKw);
    sc.chipsKgH.push(s.chipsKgH);
    sc.gasMJ.push(s.gasMJ);
    sc.gasCO.push(s.gasCO * 100);
    sc.filterDropMbar.push(s.filterDropMbar);
    sc.outletT.push(s.outletT);
    sc.filterT.push(s.filterT);
    sc.casingT.push(s.casingT);
    sc.garageCoPpm.push(s.garageCoPpm);
    sc.garageCoPpmLow.push(s.garageCoPpmLow);
    sc.garageCoPpmHigh.push(s.garageCoPpmHigh);
    sc.roomAboveCoPpm.push(s.roomAboveCoPpm);
    sc.plumeLpm.push(s.plumeLpm);
    if (sc.t.length > SCOPE_LENGTH) for (const k of Object.keys(sc) as (keyof Scope)[]) sc[k].shift();
  }
}
