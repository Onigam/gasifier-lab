import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BODY, COOLER, ENGINE, FILTER, FILTER_AT, HEARTH, HOTPIPE, MIXER, TRACTOR, UNIT, UNIT_AT, ZONES } from './dims';
import { createFarmScene } from './farm/scene';
import { createGarageScene } from './garage/scene';
import { createGasifierScene } from './gasifier/scene';
import { createGasTrainScene } from './gastrain/scene';
import { buildCylinder, CYL, pinHeight } from './train/cylinder';
import { worldPort, visualTurns, VISUAL_CAP } from './tractor/tractor';
import { createTractorScene } from './tractor/scene';
import { buildUnit, cursorY, bedRadius } from './unit/unit';
import { meshBox, stateWith, view } from './test-utils';

// The machine, one function in every world: the shared pieces are the same size within 3 mm in the worlds that show them, every moving part reaches what drives it, every body rests on what carries it (docs/lab-quality.md §1 and §2).

const MM3 = 0.003;
const tractor = createTractorScene();
const train = createGasTrainScene();
const garage = createGarageScene();
const farm = createFarmScene();
const gasifier = createGasifierScene();
const s = stateWith();
for (const mod of [tractor, train, garage, farm, gasifier]) {
  mod.update(s, 1 / 60, view({ time: 1 }));
  mod.scene.updateMatrixWorld(true);
}
const near = (a: number, b: number, tol = MM3): boolean => Math.abs(a - b) <= tol;
/** The same box up to a turn of a quarter about the vertical (the garage parks the tractor across its room): the height and the two horizontal sizes, sorted. */
const sameSize = (a: THREE.Box3, b: THREE.Box3, tol = MM3): boolean => {
  const x = a.getSize(new THREE.Vector3());
  const y = b.getSize(new THREE.Vector3());
  const [a0, a1] = [x.x, x.z].sort((p, q) => p - q);
  const [b0, b1] = [y.x, y.z].sort((p, q) => p - q);
  return near(x.y, y.y, tol) && near(a0!, b0!, tol) && near(a1!, b1!, tol);
};

describe('one machine, the same in every world (within 3 mm)', () => {
  it('the unit is the same size on the tractor, in the farm, in the garage and on the train’s stand', () => {
    const boxes = [tractor.machine.unit.root, farm.machine.unit.root, garage.machine.unit.root].map((o) =>
      meshBox(o, (m) => !!m.userData.noShadow),
    );
    const ref = boxes[0]!;
    for (const b of boxes)
      expect(
        sameSize(ref, b),
        `${b.getSize(new THREE.Vector3()).toArray()} vs ${ref.getSize(new THREE.Vector3()).toArray()}`,
      ).toBe(true);
    // the unit's height is the reported one
    expect(ref.getSize(new THREE.Vector3()).y).toBeGreaterThan(UNIT.height - 0.01);
    expect(ref.getSize(new THREE.Vector3()).y).toBeLessThan(UNIT.height + 0.01);
  });

  it('each part of the train is the same size on the tractor and in the gas-train world', () => {
    const pairs: [string, THREE.Object3D][] = [
      ['filter-box', tractor.machine.train.filter.box],
      ['filter-bags', tractor.machine.train.filter.bags],
      ['gas-cooler', tractor.machine.train.cooler.cooler],
      ['cooler-condensate-vessel', tractor.machine.train.cooler.vessel],
      ['gas-air-mixer', tractor.machine.train.mixer.mixer],
      ['gas-throttle', tractor.machine.train.mixer.gasThrottle],
      ['secondary-air-throttle', tractor.machine.train.mixer.airThrottle],
      ['hot-gas-pipe', tractor.machine.train.hot.group],
      ['stop-valve', tractor.machine.train.stop.group],
      ['fan-stack', tractor.machine.train.stack.group],
      ['starting-fan', tractor.machine.train.fan.group],
      ['primary-air-valve', tractor.machine.train.air.group],
      ['water-gauge', tractor.machine.train.gauge.group],
      ['exhaust-pipe', tractor.machine.exhaust.group],
    ];
    for (const [id, obj] of pairs) {
      const a = meshBox(obj, (m) => !!m.userData.noShadow);
      const b = meshBox(train.pieces[id]!, (m) => !!m.userData.noShadow);
      expect(
        sameSize(a, b),
        `${id}: ${a.getSize(new THREE.Vector3()).toArray()} vs ${b.getSize(new THREE.Vector3()).toArray()}`,
      ).toBe(true);
    }
  });

  it('the line from the unit to the filter is laid out the same on the tractor and on the train: the same offsets', () => {
    const tr = tractor.machine;
    const unitT = tr.unit.root.position;
    const hotT = tr.train.hot.group.position.clone().sub(unitT);
    const filterT = tr.train.filter.group.position.clone().sub(unitT);
    const fanT = tr.train.fan.group.position.clone().sub(unitT);
    const unitG = train.pieces['hot-gas-pipe']!.position.clone().sub(train.scene.getObjectByName('unit')!.position);
    const filterG = train.pieces['filter-box']!.position.clone().sub(train.scene.getObjectByName('unit')!.position);
    const fanG = train.pieces['starting-fan']!.position.clone().sub(train.scene.getObjectByName('unit')!.position);
    expect(hotT.distanceTo(unitG)).toBeLessThan(MM3);
    expect(filterT.distanceTo(filterG)).toBeLessThan(MM3);
    expect(fanT.distanceTo(fanG)).toBeLessThan(MM3);
  });

  it('the section is the same unit cut: every part has the same height and width, and the same far edge', () => {
    const whole = buildUnit({ cut: false });
    const input = {
      bunkerShare: s.bunkerShare,
      engineOn: s.engineOn,
      gasFlowShare: s.gasFlowShare,
      grateMoving: s.grateMoving,
      lidPush: 0,
      ashShare: Math.min(1, s.ashKg / 4),
      jarShare: Math.min(1, s.condensateL * 0.08),
      time: 1,
      slowMo: 1,
      dt: 1 / 60,
    };
    whole.update(input);
    whole.root.updateMatrixWorld(true);
    const cut = gasifier.unit;
    for (const [id, g] of cut.parts) {
      const a = meshBox(
        whole.parts.get(id)!,
        (m) => !!m.userData.noShadow || m.geometry.type === 'InstancedBufferGeometry',
      );
      // the section stands on its frame at the console's height: back to the unit's own frame
      const b = meshBox(g, (m) => !!m.userData.noShadow).translate(cut.root.position.clone().negate());
      // the cut keeps the far half (z ≥ 0): inside the whole's box, and the same height for the parts that are the shells and the hearth
      expect(b.min.y, id).toBeGreaterThanOrEqual(a.min.y - 0.004);
      expect(b.max.y, id).toBeLessThanOrEqual(a.max.y + 0.004);
      expect(b.max.z, id).toBeLessThanOrEqual(a.max.z + 0.004);
      expect(b.max.x, id).toBeLessThanOrEqual(a.max.x + 0.004);
      expect(b.min.x, id).toBeGreaterThanOrEqual(a.min.x - 0.004);
      if (
        [
          'outer-casing',
          'fuel-casing',
          'fuel-baffle',
          'condensate-sleeve',
          'fire-box',
          'throat-ring',
          'air-nozzles',
          'spring-lid',
          'gas-outlet',
          'air-intake',
        ].includes(id)
      )
        expect(
          near(a.min.y, b.min.y, 0.004) && near(a.max.y, b.max.y, 0.004),
          `${id} height ${a.min.y}..${a.max.y} vs ${b.min.y}..${b.max.y}`,
        ).toBe(true);
    }
  });
});

describe('the unit in section keeps one half', () => {
  it('nothing of a solid lies on the near side of the cut (the bed’s end faces included)', () => {
    const u = buildUnit({ cut: true });
    u.root.updateMatrixWorld(true);
    for (const [id, g] of u.parts) {
      const b = meshBox(g, (m) => !!m.userData.noShadow);
      // what is centred on the plane (a rod, a coil of the spring, the latch) is drawn whole: at most its radius, 3 cm, on the near side
      expect(b.min.z, id).toBeGreaterThan(-0.03);
    }
  });
});

describe('every moving part reaches what drives it', () => {
  it('the pipes’ ends are the ports of the pieces they join, on the tractor and on the train', () => {
    const m = tractor.machine;
    for (const [pipe, a, b] of [
      [m.pipes.filterToCooler, m.ports.filterOut!, m.ports.coolerIn!],
      [m.pipes.coolerToMixer, m.ports.coolerOut!, m.ports.mixerGas!],
      [m.pipes.fanToValve, m.ports.fanOut!, m.ports.airIn!],
      [m.pipes.gaugeHose, m.ports.gaugeTap!, m.ports.mixerTap!],
    ] as const) {
      expect(pipe.points[0]!.distanceTo(a.p), 'start').toBeLessThan(0.001);
      expect(pipe.points[pipe.points.length - 1]!.distanceTo(b.p), 'end').toBeLessThan(0.001);
    }
  });

  it('the hot pipe sits on the unit’s outlet flange, the stop valve between the tee and the filter, the stack on the tee', () => {
    const m = tractor.machine;
    const outlet = m.unit.ports.outlet.clone().add(new THREE.Vector3(UNIT_AT.x, UNIT_AT.y, UNIT_AT.z));
    expect(m.train.hot.group.position.distanceTo(outlet)).toBeLessThan(0.001);
    const hotRun = worldPort(m.train.hot.group, m.train.hot.ports.run!);
    const valveIn = worldPort(m.train.stop.group, m.train.stop.ports.in!);
    const valveOut = worldPort(m.train.stop.group, m.train.stop.ports.out!);
    const filterIn = worldPort(m.train.filter.group, m.train.filter.ports.in!);
    expect(hotRun.p.distanceTo(valveIn.p)).toBeLessThan(0.001);
    expect(valveOut.p.distanceTo(filterIn.p)).toBeLessThan(0.001);
    const stack = worldPort(m.train.hot.group, m.train.hot.ports.stack!);
    expect(m.train.stack.group.position.distanceTo(stack.p)).toBeLessThan(0.001);
    // the tee is at the riser's top
    expect(hotRun.p.y).toBeCloseTo(UNIT_AT.y + 0.44 + HOTPIPE.riser, 3);
    // the inlet is level and in line with the tee's run
    expect(filterIn.p.y).toBeCloseTo(hotRun.p.y, 3);
    expect(filterIn.p.z).toBeCloseTo(hotRun.p.z, 3);
  });

  it('the air valve on the unit’s intake, the fan on the shelf of the console, a pipe between them', () => {
    const m = tractor.machine;
    const intake = m.unit.ports.intake.clone().add(new THREE.Vector3(UNIT_AT.x, UNIT_AT.y, UNIT_AT.z));
    const valveOut = worldPort(m.train.air.group, m.train.air.ports.out!);
    expect(valveOut.p.distanceTo(intake)).toBeLessThan(0.001);
    // the fan's foot plate is on the shelf's top
    const fan = meshBox(m.train.fan.group, (x) => !!x.userData.noShadow);
    expect(fan.min.y).toBeCloseTo(m.consoles.padTop, 2);
  });

  it('the cooler’s arms reach the front bolster, the cooler stands in front of the radiator', () => {
    const c = meshBox(tractor.machine.train.cooler.cooler);
    expect(c.min.x).toBeLessThan(BODY.bolster.x1 + 0.01);
    expect(c.min.x).toBeGreaterThan(BODY.bolster.x0);
    // the front of the radiator (the grille) is behind the cooler's face
    expect(COOLER.at.x).toBeGreaterThan(BODY.grilleX);
  });

  it('the governor’s rod and the mixer’s lever: the gas throttle’s lever is inside the governor’s reach', () => {
    const lever = tractor.machine.train.mixer.gasLever.getWorldPosition(new THREE.Vector3());
    const gov = tractor.machine.governor.group.position;
    expect(lever.distanceTo(gov)).toBeLessThan(1.2);
  });

  it('the grate and the linkage turn together: the shaft is one rod through the casing', () => {
    const u = buildUnit({ cut: false });
    const rock = u.parts.get('grate')!.getObjectByName('grate-rock')!;
    const link = u.parts.get('grate-linkage')!.getObjectByName('link-rock')!;
    u.update({
      bunkerShare: 0.5,
      engineOn: true,
      gasFlowShare: 1,
      grateMoving: true,
      lidPush: 0,
      ashShare: 0,
      jarShare: 0,
      time: 1,
      slowMo: 1,
      dt: 0.3,
    });
    expect(rock.rotation.x).toBe(link.rotation.x);
    expect(Math.abs(rock.rotation.x)).toBeGreaterThan(0.01);
    // the two parts lie on one axis: the same y and z of their pivots
    u.root.updateMatrixWorld(true);
    const a = rock.getWorldPosition(new THREE.Vector3());
    const b = link.getWorldPosition(new THREE.Vector3());
    expect(a.distanceTo(b)).toBeLessThan(1e-6);
    expect(a.y).toBeCloseTo(HEARTH.grateY - HEARTH.grate.barH - 0.006, 6);
  });

  it('the lid rises on its spring and the spring follows it, the rod stays through the yoke', () => {
    const u = buildUnit({ cut: false });
    const lid = u.parts.get('spring-lid')!;
    const lift = lid.getObjectByName('lid-lift')!;
    const y0 = lift.position.y;
    u.update({
      bunkerShare: 0.5,
      engineOn: false,
      gasFlowShare: 0,
      grateMoving: false,
      lidPush: 1,
      ashShare: 0,
      jarShare: 0,
      time: 1,
      slowMo: 1,
      dt: 0.1,
    });
    expect(lift.position.y - y0).toBeGreaterThan(0.005);
    expect(lift.position.y - y0).toBeLessThan(0.02);
    // the rod's top stays below the yoke's top bar
    const rod = meshBox(lift);
    expect(rod.max.y).toBeLessThan(UNIT.height);
  });

  it('the drain’s hose runs from the nipple to the jar’s cap, and the jar stands on the console’s shelf', () => {
    const drain = tractor.machine.unit.parts.get('condensate-drain')!;
    const box = meshBox(drain, (m) => !!m.userData.noShadow);
    // the hose and the jar: from above the joint down to the floor of the unit
    expect(box.max.y).toBeGreaterThan(UNIT_AT.y + UNIT.jointY - 0.1);
    expect(box.min.y).toBeCloseTo(UNIT_AT.y, 2);
  });
});

describe('every body rests on its support (docs/lab-quality.md §1)', () => {
  it('each wheel’s lowest point is the ground, within 3 mm', () => {
    for (const w of [...tractor.machine.body.wheels.rear, ...tractor.machine.body.wheels.front]) {
      const b = meshBox(w.root);
      expect(Math.abs(b.min.y), w.root.name).toBeLessThan(MM3);
    }
    // and the rear tyres are the 18.4-38's: 1.76 m round, 0.467 wide
    const r = meshBox(tractor.machine.body.wheels.rear[0]!.root).getSize(new THREE.Vector3());
    expect(r.y).toBeGreaterThan(2 * TRACTOR.rear.R - 0.01);
    expect(r.z).toBeGreaterThan(TRACTOR.rear.width - 0.02);
  });

  it('nothing of the machine is lower than the ground, nothing but the wheels is below the clearance but the console’s gussets', () => {
    const m = tractor.machine;
    m.root.updateMatrixWorld(true);
    // the sump is the lowest of the body (the clearance); the front axle and its king-pins hang lower, by a hub's height
    expect(meshBox(m.engine.engine, (x) => !!x.userData.noShadow).min.y).toBeGreaterThan(TRACTOR.clearance - 0.012);
    expect(meshBox(m.body.cab).min.y).toBeGreaterThan(BODY.floorY - 0.02);
    expect(meshBox(m.body.chassis, (x) => !!x.userData.noShadow).min.y).toBeGreaterThan(0.29);
  });

  it('the unit’s base stands on the console’s pad, the filter box on its beams, the fan on the shelf', () => {
    const m = tractor.machine;
    const unit = meshBox(m.unit.parts.get('outer-casing')!);
    expect(Math.abs(unit.min.y - m.consoles.padTop)).toBeLessThan(MM3);
    const pad = meshBox(m.consoles.group);
    expect(pad.max.y).toBeGreaterThan(m.consoles.padTop - 0.001);
    const filter = meshBox(m.train.filter.box);
    expect(Math.abs(filter.min.y - m.consoles.beamTop)).toBeLessThan(MM3);
    expect(Math.abs(filter.min.y - FILTER_AT.y)).toBeLessThan(MM3);
  });

  it('the gauge on the bonnet and the mixer on its riser stand on the bonnet’s top', () => {
    const top = BODY.bonnet.top + 0.012;
    expect(Math.abs(meshBox(tractor.machine.train.gauge.group).min.y - top)).toBeLessThan(0.02);
    expect(Math.abs(meshBox(tractor.machine.train.mixer.mixer).min.y - top)).toBeLessThan(0.02);
    expect(MIXER.at.y).toBeCloseTo(top, 3);
  });

  it('on the train world every piece stands on the floor or on a frame that does', () => {
    for (const [id, o] of Object.entries(train.pieces)) {
      const b = meshBox(o, (m) => !!m.userData.noShadow);
      expect(b.min.y, id).toBeGreaterThan(-0.005);
    }
    // the filter box's foot meets its stand's top
    const filter = meshBox(train.pieces['filter-box']!);
    expect(Math.abs(filter.min.y - FILTER_AT.y)).toBeLessThan(MM3);
  });

  it('the cylinder stands on its plate, and the plate on the floor', () => {
    const b = meshBox(train.pieces['cylinder-cutaway']!, (m) => !!m.userData.noShadow);
    expect(b.min.y).toBeCloseTo(0.25 - 0.2, 2);
  });
});

describe('the cylinder, cut open, turns the way an engine does', () => {
  const c = buildCylinder();
  it('the rod keeps its length, the piston never reaches the head, the crown at the top is the clearance below it', () => {
    const rc = ENGINE.stroke / 2;
    for (let th = 0; th < 720; th += 15) {
      const phi = (th * Math.PI) / 180;
      c.setCycle(th, 1, true);
      const py = pinHeight(phi);
      const cpx = rc * Math.sin(phi);
      const cpy = rc * Math.cos(phi);
      expect(Math.hypot(cpx, cpy - py)).toBeCloseTo(CYL.rod, 6);
      expect(py + 0.062).toBeLessThan(CYL.yHead);
    }
    expect(pinHeight(0) + 0.062).toBeCloseTo(CYL.yCrownTdc, 6);
    expect(CYL.yHead - CYL.yCrownTdc).toBeCloseTo(CYL.clearance, 9);
  });
  it('the valves open in their strokes and are shut at the top of the compression', () => {
    c.setCycle(100, 1, true);
    const g = c.cylinder;
    const iv = g.getObjectByName('intake-valve')!;
    const ev = g.getObjectByName('exhaust-valve')!;
    expect(iv.position.y).toBeLessThan(CYL.yHead - 0.003);
    expect(ev.position.y).toBeCloseTo(CYL.yHead, 6);
    c.setCycle(360, 1, true);
    expect(iv.position.y).toBeCloseTo(CYL.yHead, 6);
    expect(ev.position.y).toBeCloseTo(CYL.yHead, 6);
    c.setCycle(600, 1, true);
    expect(ev.position.y).toBeLessThan(CYL.yHead - 0.003);
  });
  it('the cylinder is cut: nothing of it lies on the near side of the plane', () => {
    c.setCycle(0, 0, false);
    // the pilot's jet is fluid in the plane, drawn whole (cones, a flash): the solids are cut
    const b = meshBox(
      c.cylinder,
      (m) => !!m.userData.noShadow || m.geometry.type === 'SphereGeometry' || m.geometry.type === 'ConeGeometry',
    );
    expect(b.min.z).toBeGreaterThan(-0.002);
  });
  it('the pilot’s spray and flash show only around the top of the compression', () => {
    c.setCycle(100, 1, true);
    const spray = c.cylinder.getObjectByName('spray')!;
    const op = (): number => ((spray.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity;
    expect(op()).toBe(0);
    c.setCycle(356, 1, true);
    expect(op()).toBeGreaterThan(0.1);
    c.setCycle(356, 1, false);
    expect(op()).toBe(0);
  });
});

describe('what turns runs at a speed the eye reads (no wagon wheel)', () => {
  it('a thing that turns fast turns at most 1.2 turns a second, and shows its blur disc over 3', () => {
    expect(VISUAL_CAP).toBeLessThanOrEqual(1.2);
    for (const rps of [0.1, 0.5, 1, 3, 10, 31, 60]) expect(visualTurns(rps)).toBeLessThanOrEqual(VISUAL_CAP + 1e-9);
    expect(visualTurns(0.4)).toBe(0.4);
  });
  it('the wheels roll at the ground speed: at 2 m/s the rear turns 0.36 a second, the front 0.8', () => {
    const rear = 2 / (2 * Math.PI * TRACTOR.rear.R);
    const front = 2 / (2 * Math.PI * TRACTOR.front.R);
    expect(rear).toBeLessThan(0.5);
    expect(front).toBeLessThan(1.0);
    // one step of the machine turns a wheel by v·dt/R and the rear and front by their own radius
    const t = createTractorScene();
    const st = stateWith();
    const w0 = t.machine.body.wheels.rear[0]!.spin.rotation.z;
    const f0 = t.machine.body.wheels.front[0]!.spin.rotation.z;
    t.machine.update(st, 1, { slowMo: 1, time: 1 });
    expect(w0 - t.machine.body.wheels.rear[0]!.spin.rotation.z).toBeCloseTo(st.groundSpeedMs / TRACTOR.rear.R, 6);
    expect(f0 - t.machine.body.wheels.front[0]!.spin.rotation.z).toBeCloseTo(st.groundSpeedMs / TRACTOR.front.R, 6);
  });
  it('the cylinder’s crank is capped: at the engine’s true speed it turns at most 1.4 a second', () => {
    expect(visualTurns((1855 / 60) * 0.06)).toBeLessThanOrEqual(1.4);
  });
});

describe('the journey’s cursor and the zones, to scale', () => {
  it('the cursor goes down through the zones in order, each in its own height, to the pit', () => {
    let last = Infinity;
    for (let c = 0; c <= 1.0001; c += 0.02) {
      const y = cursorY(c);
      expect(y).toBeLessThanOrEqual(last + 1e-9);
      last = y;
    }
    expect(cursorY(0.3)).toBeCloseTo(ZONES.drying.y0, 3);
    expect(cursorY(0.55)).toBeCloseTo(ZONES.pyrolysis.y0, 3);
    expect(cursorY(0.7)).toBeCloseTo(ZONES.oxidation.y0, 3);
    expect(cursorY(0.95)).toBeCloseTo(HEARTH.grateY, 3);
  });
  it('the bed fills the throat’s ring and the box: its radius is the throat at the throat and the box inside it', () => {
    expect(bedRadius(HEARTH.throatY)).toBeCloseTo(HEARTH.throatR, 3);
    expect(bedRadius(HEARTH.grateY)).toBeLessThanOrEqual(HEARTH.boxR);
    expect(bedRadius(ZONES.drying.y0 + 0.1)).toBeLessThan(UNIT.bunkerR);
  });
  it('the chips’ level rides the bunker’s share, from the top of the drying zone to under the lid', () => {
    const u = buildUnit({ cut: false });
    u.update({
      bunkerShare: 1,
      engineOn: true,
      gasFlowShare: 1,
      grateMoving: false,
      lidPush: 0,
      ashShare: 0,
      jarShare: 0,
      time: 0,
      slowMo: 1,
      dt: 0,
    });
    const top = u.level();
    u.update({
      bunkerShare: 0.2,
      engineOn: true,
      gasFlowShare: 1,
      grateMoving: false,
      lidPush: 0,
      ashShare: 0,
      jarShare: 0,
      time: 0,
      slowMo: 1,
      dt: 0,
    });
    const low = u.level();
    expect(top).toBeGreaterThan(low);
    expect(top).toBeLessThan(UNIT.rimTop);
    expect(low).toBeGreaterThanOrEqual(ZONES.drying.y1 - 1e-9);
  });
});

describe('the filter and the cooler are what the figures say', () => {
  it('thirteen bags fit the box, the tube bank fits its header', () => {
    const f = tractor.machine.train.filter;
    const bags = meshBox(f.bags, (m) => !!m.userData.noShadow);
    const box = meshBox(f.box);
    expect(bags.max.x - bags.min.x).toBeLessThan(FILTER.length);
    expect(bags.min.y).toBeGreaterThan(box.min.y);
    expect(bags.max.y).toBeLessThan(box.max.y);
    const c = meshBox(tractor.machine.train.cooler.cooler);
    expect(c.getSize(new THREE.Vector3()).z).toBeGreaterThan(COOLER.cols * COOLER.pitch);
  });
});
