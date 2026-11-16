import * as THREE from 'three';
import { contactShadow, group } from '@onigam/lab-kit/three';
import { COOLER, ENGINE, FILTER_AT, MIXER, TRACTOR, UNIT_AT } from '../dims';
import { smoothstep, TAU, v3 } from '../common';
import {
  buildAirValve,
  buildCooler,
  buildFanStack,
  buildFilter,
  buildGauge,
  buildHotPipe,
  buildMixer,
  buildStartingFan,
  buildStopValve,
  type CoolerPiece,
  type FanPiece,
  type FilterPiece,
  type GaugePiece,
  type MixerPiece,
  type Piece,
} from '../train/components';
import { LivePipe, type Port } from '../train/pipes';
import { buildUnit, type Unit } from '../unit/unit';
import { makeFlow, unitSections, type FlowSet } from '../flowpaths';
import { lineSections } from '../train/flow';
import { setField } from '../unit/field';
import { hose as hoseMat } from '../materials';
import type { GasParams, GasState } from '../../sim/types';
import { buildBody, type Body } from './body';
import { buildConsoles, type Consoles } from './consoles';
import {
  BELT,
  buildEngine,
  buildExhaust,
  buildGovernor,
  buildPump,
  buildShield,
  type EnginePiece,
  type ExhaustPiece,
  type GovernorPiece,
} from './engine';
import { PIPE } from '../dims';

// The whole machine, built once for every world that shows it: the tractor, the unit on its console, the gas train on the left and the front, the engine under the bonnet. One function from one set of dimensions, moved into place by its root and nothing
// else (docs/3d.md). `farm` and `garage` use it whole and unregistered but for the part that stands for it; `tractor` registers its thirteen parts; `gas-train` and `gasifier` draw the same pieces from the same builders. Frame T.

export interface TractorOptions {
  /** The unit as the section shows it (the `gasifier` world builds its own); here it is always whole. */
  params?: () => GasParams;
}

export interface Machine {
  root: THREE.Group;
  body: Body;
  engine: EnginePiece;
  exhaust: ExhaustPiece;
  pump: { group: THREE.Group };
  shield: { group: THREE.Group; w: number; h: number };
  governor: GovernorPiece;
  consoles: Consoles;
  unit: Unit;
  /** Every piece of the gas train, in its place on the tractor, in the group `line`. */
  line: THREE.Group;
  train: {
    hot: Piece;
    stop: Piece;
    stack: Piece;
    fan: FanPiece;
    air: Piece;
    filter: FilterPiece;
    cooler: CoolerPiece;
    mixer: MixerPiece;
    gauge: GaugePiece;
  };
  pipes: { fanToValve: LivePipe; filterToCooler: LivePipe; coolerToMixer: LivePipe; gaugeHose: LivePipe };
  /** The ports of the pieces, in T. */
  ports: Record<string, Port>;
  /** « Flux »: the dots of the unit (in its own frame) and of the line (in T). */
  flows: { unit: FlowSet; line: FlowSet };
  /** Advance what turns and flows, from the state. */
  update(
    state: GasState,
    dt: number,
    o: { slowMo: number; time: number; params?: GasParams; parked?: boolean; schematic?: boolean },
  ): void;
}

/** A piece's port as it stands in T, once its group is placed. */
export function worldPort(g: THREE.Object3D, p: Port): Port {
  g.updateMatrix();
  return {
    p: p.p.clone().applyMatrix4(g.matrix),
    dir: p.dir.clone().transformDirection(g.matrix),
    r: p.r,
  };
}

/** Visual turning rate of a fast thing, turns a second: the true rate is shown below a few turns a second, above it a slow turn and a blur disc. */
export const VISUAL_CAP = 1.2;
export const BLUR_FROM = 3;
export const blurOf = (turnsPerSecond: number): number => smoothstep(BLUR_FROM, BLUR_FROM * 2.5, turnsPerSecond);
export const visualTurns = (turnsPerSecond: number): number => Math.min(turnsPerSecond, VISUAL_CAP);

export function buildMachine(): Machine {
  const root = group('machine');
  const body = buildBody();
  const engine = buildEngine();
  const exhaust = buildExhaust(1.1);
  const pump = buildPump();
  const shield = buildShield();
  const governor = buildGovernor();
  const consoles = buildConsoles();
  const unit = buildUnit({ cut: false });

  const line = group('gas-line-run');
  line.userData.partId = 'gas-line-run';
  const hot = buildHotPipe();
  const stop = buildStopValve();
  const stack = buildFanStack();
  const fan = buildStartingFan();
  const air = buildAirValve();
  const filter = buildFilter();
  const cooler = buildCooler();
  const mixer = buildMixer();
  const gauge = buildGauge();

  // ---- the unit on its console
  unit.root.position.set(UNIT_AT.x, UNIT_AT.y, UNIT_AT.z);

  // ---- the gas train, from the unit's outlet along the way of the gas
  const outlet = unit.ports.outlet.clone().add(v3(UNIT_AT.x, UNIT_AT.y, UNIT_AT.z));
  hot.group.position.copy(outlet);
  const hotRun = worldPort(hot.group, hot.ports.run!);
  stop.group.position.copy(hotRun.p).add(v3(0.048, 0, 0));
  const hotStack = worldPort(hot.group, hot.ports.stack!);
  stack.group.position.copy(hotStack.p);
  filter.group.position.set(FILTER_AT.x, FILTER_AT.y, FILTER_AT.z);
  cooler.group.position.set(COOLER.at.x, COOLER.at.y, 0);
  mixer.group.position.set(MIXER.at.x, MIXER.at.y, MIXER.at.z);
  // the primary air: the valve on the unit's intake, the fan on a shelf of the console, a pipe between
  const intake = unit.ports.intake.clone().add(v3(UNIT_AT.x, UNIT_AT.y, UNIT_AT.z));
  air.group.position.copy(intake).add(v3(-0.033, 0, 0));
  fan.group.position.set(1.38, UNIT_AT.y, -1.16);
  gauge.group.position.set(1.45, 1.592, 0.18);
  gauge.group.rotation.y = Math.PI;
  // the exhaust, from the manifold on the right
  exhaust.group.position.set(2.78, 1.2, ENGINE.block.halfW + 0.05);

  // the engine's other changes
  pump.group.position.set(2.2, 1.0, -0.29);
  shield.group.position.set(2.0, 1.22, -0.435);
  shield.group.rotation.y = 0;
  // behind the fan's blades (they sweep x of the fan ± 5 mm) and clear of the block's flank, so that the belt to the fan shaft's pulley has room
  governor.group.position.set(ENGINE.fan.x - 0.05, 1.12, -0.29);

  // ---- the pipes
  const portsT: Record<string, Port> = {
    fanOut: worldPort(fan.group, fan.ports.out!),
    airIn: worldPort(air.group, air.ports.in!),
    filterOut: worldPort(filter.group, filter.ports.out!),
    coolerIn: worldPort(cooler.group, cooler.ports.in!),
    coolerOut: worldPort(cooler.group, cooler.ports.out!),
    mixerGas: worldPort(mixer.group, mixer.ports.gas!),
    mixerTap: worldPort(mixer.group, mixer.ports.tap!),
    gaugeTap: worldPort(gauge.group, gauge.ports.tap!),
  };
  const fanToValve = new LivePipe(0.0275, 0.08, 0.07, undefined, undefined, ['y', 'x', 'z']);
  fanToValve.set(portsT.fanOut!, portsT.airIn!);
  const filterToCooler = new LivePipe(PIPE.R, 0.08, PIPE.bend, undefined, undefined, ['x', 'z', 'y']);
  filterToCooler.set(portsT.filterOut!, portsT.coolerIn!);
  const coolerToMixer = new LivePipe(PIPE.R, 0.08, PIPE.bend, undefined, undefined, ['y', 'x', 'z']);
  coolerToMixer.set(portsT.coolerOut!, portsT.mixerGas!);
  const gaugeHose = new LivePipe(0.0045, 0.05, 0.03, hoseMat(), hoseMat(), ['y', 'x', 'z'], false);
  gaugeHose.set(portsT.gaugeTap!, portsT.mixerTap!);

  line.add(
    hot.group,
    stop.group,
    stack.group,
    fan.group,
    air.group,
    filter.group,
    cooler.group,
    mixer.group,
    gauge.group,
  );
  line.add(fanToValve.root, filterToCooler.root, coolerToMixer.root, gaugeHose.root);

  const lineFlow = makeFlow(
    lineSections({
      hot: hot.group,
      valve: stop.group,
      filter: filter.group,
      cooler: cooler.group,
      mixer: mixer.group,
      fan: fan.group,
      air: air.group,
      filterToCooler,
      coolerToMixer,
      fanToValve,
    }),
    1500,
    0.045,
  );
  line.add(lineFlow.dots.object);
  const unitFlow = makeFlow(unitSections(unit.nozzles, false), 500, 0.03);
  unit.root.add(unitFlow.dots.object);
  root.add(body.chassis, body.bonnet, body.cab, body.rack, body.headlights, body.rear, body.front);
  root.add(engine.engine, exhaust.group, pump.group, shield.group, governor.group, consoles.group, unit.root, line);
  void TRACTOR;

  // where each tyre meets the ground: a soft dark patch, longer than the tyre's contact is wide (the ground a body rests on is darker beside it); the kit's multiplied decal, which the film's occlusion pass would draw anyway and the visitor's picture does not have.
  // Not part of any part: it stays on the floor and follows the wheel along its axle when the machine comes apart. It is drawn only where there is a floor to darken (it is multiplied over it).
  const contact = group('tyre-contacts');
  const patches = [...body.wheels.rear, ...body.wheels.front].map((w) => {
    const rear = w.radius === TRACTOR.rear.R;
    const d = contactShadow(
      rear ? 0.62 : 0.4,
      rear ? TRACTOR.rear.width + 0.06 : TRACTOR.front.width + 0.06,
      rear ? 0.34 : 0.22,
      0.6,
    );
    d.position.set(w.root.position.x, 0.003, w.root.position.z);
    contact.add(d);
    return { d, w };
  });
  root.add(contact);

  // the extra governor's V-belt: from the fan shaft's pulley, wherever the engine stands now, to the governor's own
  const beltA = new THREE.Vector3();
  const beltB = new THREE.Vector3();
  const driveBelt = (): void => {
    engine.engine.updateWorldMatrix(true, false);
    governor.group.updateWorldMatrix(true, false);
    // the belt's centre line rides half its thickness out from the groove's bottom
    const rim = BELT.groove + BELT.t / 2;
    const a = governor.group.worldToLocal(engine.engine.localToWorld(beltA.copy(engine.beltPulley.at)));
    governor.belt.set(a, engine.beltPulley.r + rim, beltB.copy(governor.pulley.at), governor.pulley.r + rim);
  };
  driveBelt();

  let fanPhase = 0;
  let govPhase = 0;
  let pulleyPhase = 0;
  let impellerPhase = 0;
  const update: Machine['update'] = (s, dt, o) => {
    const slow = o.slowMo;
    setField(s);
    driveBelt();
    // the wheels roll at the ground speed the model gives, under the visual cap by construction (a third of a turn a second at the rear)
    const v = s.engineOn && !o.parked ? s.groundSpeedMs : 0;
    for (const w of body.wheels.rear) w.spin.rotation.z -= (v * dt * slow) / w.radius;
    for (const w of body.wheels.front) w.spin.rotation.z -= (v * dt * slow) / w.radius;
    // the fan and the pulleys: true speed is 25 to 40 turns a second, so a slow turn and a blur disc
    const rps = (s.engineOn ? s.engineRpm : 0) / 60;
    const fanRps = rps * 1.15;
    fanPhase += visualTurns(fanRps) * TAU * dt * slow;
    engine.fan.rotation.x = fanPhase;
    const bl = blurOf(fanRps);
    (engine.fanBlur.material as THREE.MeshBasicMaterial).opacity = 0.42 * bl;
    pulleyPhase += visualTurns(rps) * TAU * dt * slow;
    for (const p of engine.pulleys) p.rotation.x = pulleyPhase;
    govPhase += visualTurns(rps * 1.4) * TAU * dt * slow;
    governor.spin.rotation.x = govPhase;
    (governor.blur.material as THREE.MeshBasicMaterial).opacity = 0.4 * blurOf(rps * 1.4);
    // the exhaust's flap lifts while the engine runs
    exhaust.flap.rotation.z = s.engineOn ? 0.9 : 0.0;
    // the starting fan: it runs only as a source of the model's, the fan's own switch (no gesture is shown)
    const fanOn = o.params?.fanSource === true;
    if (fanOn) impellerPhase += visualTurns(48) * TAU * dt * slow;
    fan.impeller.rotation.z = impellerPhase;
    (fan.blur.material as THREE.MeshBasicMaterial).opacity = fanOn ? 0.5 : 0;
    // the levers of the throttles follow the load
    const load = Math.min(1, Math.max(0, s.powerKw / 51));
    mixer.gasLever.rotation.y = -0.1 - load * 0.7;
    mixer.airLever.rotation.y = 0.1 + load * 0.35;
    // the filter's cloth takes the colour of its dust and wet, its tray the dust that has fallen
    const dust = Math.min(1, s.filterHours / 60 + (s.filterDropMmWg - 150) / 700);
    const c = new THREE.Color(0xd6d2c4).lerp(new THREE.Color(0x6b665e), Math.max(0, dust));
    if (s.filterWet) c.lerp(new THREE.Color(0x3c4448), 0.55);
    filter.clothMat.color.copy(c);
    filter.clothMat.roughness = s.filterWet ? 0.35 : 1;
    filter.trayDust.scale.y = 0.001 + 0.05 * Math.max(0, Math.min(1, dust));
    // the condensate vessel of the cooler fills as the model's interval runs
    cooler.vesselWater.scale.y = 0.01 + (COOLER.vessel.h - 0.012) * Math.min(1, s.coolerVesselShare);
    // the water gauge: one level up and the other down by half of the model's drop each, on a scale of millimetres of water
    const half = s.filterDropMmWg / 1000 / 2;
    gauge.left.scale.y = Math.max(0.002, gauge.mid - 0.02 - half);
    gauge.right.scale.y = Math.max(0.002, gauge.mid - 0.02 + half);
    // the unit
    for (const { d, w } of patches) d.position.z = w.root.position.z;
    lineFlow.update(s, dt, { slowMo: slow, visible: o.schematic === true });
    unitFlow.update(s, dt, { slowMo: slow, visible: o.schematic === true });
    unit.update({
      bunkerShare: s.bunkerShare,
      engineOn: s.engineOn,
      gasFlowShare: s.gasFlowShare,
      grateMoving: s.grateMoving,
      lidPush: s.pressureSign === 'pressure' ? Math.min(1, s.plumeShare) : 0,
      ashShare: Math.min(1, s.ashKg / 4),
      jarShare: Math.min(1, s.condensateL * 0.08),
      time: o.time,
      slowMo: slow,
      dt,
    });
  };

  return {
    root,
    body,
    engine,
    exhaust,
    pump,
    shield,
    governor,
    consoles,
    unit,
    line,
    train: { hot, stop, stack, fan, air, filter, cooler, mixer, gauge },
    pipes: { fanToValve, filterToCooler, coolerToMixer, gaugeHose },
    ports: portsT,
    flows: { unit: unitFlow, line: lineFlow },
    update,
  };
}
