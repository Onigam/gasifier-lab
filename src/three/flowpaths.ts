import * as THREE from 'three';
import { heatRgb, heatStops } from '@onigam/lab-kit/sim/thermal';
import { FlowDots } from './flows';
import { COOLER, FILTER, HEARTH, UNIT, ZONES, FITTINGS } from './dims';
import { v3 } from './common';
import type { GasState } from '../sim/types';

// « Flux »: what moves through the machine, as dots. Their speed is not the gas's: at the true speed in the pipe (about 10 m/s) a dot would be a streak, so the dots go at a tenth of it, never above 1.5 m/s and never below a crawl, in the order of the true
// speeds (fast in a pipe, slow through the cloth). They stand still, in their places, while the engine is stopped. Their colour is the gas's temperature on the lab's ramp, 20 to 400 °C. The air is the cold colour. Docs/3d.md.

const STOPS = heatStops(20, 400);
const hex = (T: number): number => {
  const c = heatRgb(STOPS, T);
  // linear to sRGB for the dots' vertex colours
  const f = (x: number) => Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
  return (f(c[0]) << 16) | (f(c[1]) << 8) | f(c[2]);
};

/** The dots' speed for a true speed, m/s. */
export const visualSpeed = (trueMs: number): number => Math.min(1.5, Math.max(0.06, trueMs * 0.1));

/** True speed of a gas in a section of area `a` m² at `T` °C: the model's normal flow, hot. */
export const trueSpeed = (s: Pick<GasState, 'gasNm3H'>, a: number, T: number): number =>
  ((s.gasNm3H / 3600) * ((T + 273.15) / 273.15)) / Math.max(1e-5, a);

export interface Section {
  id: string;
  points: () => THREE.Vector3[];
  /** Area of the section, m²; for the filter and the cooler the face the gas goes through. */
  area: number;
  /** The gas's temperature there, from the state. */
  temp: (s: GasState) => number;
  /** 'air' sections are the cold air in; their flow is the model's air. */
  air?: boolean;
  /** Share shown when running: a thin flow has few dots. */
  share?: (s: GasState) => number;
}

export interface FlowSet {
  dots: FlowDots;
  update(s: GasState, dt: number, o: { slowMo: number; visible: boolean }): void;
}

/** Dots on the sections: one path each, rebuilt from `points()` every frame (cheap: a few dozen points). */
export function makeFlow(sections: Section[], max = 1800, size = 0.05): FlowSet {
  const dots = new FlowDots(max, size);
  const idx: number[] = [];
  for (const sct of sections) {
    const pts = sct.points();
    idx.push(dots.add({ points: pts, color: 0xdd8844, spacing: 0.1 }));
  }
  return {
    dots,
    update(s, dt, o) {
      dots.object.visible = o.visible;
      if (!o.visible) return;
      for (let i = 0; i < sections.length; i++) {
        const sct = sections[i]!;
        const T = sct.temp(s);
        const pts = sct.points();
        if (pts.length >= 2) dots.setPoints(idx[i]!, pts);
        const running = s.engineOn;
        const v = sct.air ? s.airNm3H / 3600 / Math.max(1e-5, sct.area) : trueSpeed(s, sct.area, T);
        dots.set(idx[i]!, running ? visualSpeed(v) : 0, running ? (sct.share ? sct.share(s) : 1) : 1);
        dots.recolor(idx[i]!, sct.air ? 0x9cc7ee : hex(T));
      }
      dots.step(dt * o.slowMo);
    },
  };
}

// ============================================================================================= the unit's own paths, in U

const R_ANN = 0.25;

/** The gas through the unit: down through the throat and the bed, through the grate, out under the box, up the jacket to the outlet; the air in at the intake and round the plenum to each nozzle; the vapours of the drying to the sleeve. In U, just behind the section's plane so that the cut shows them. */
export function unitSections(nozzleTips: { tip: THREE.Vector3; root: THREE.Vector3 }[], cut: boolean): Section[] {
  const z = cut ? 0.025 : 0;
  const ty = HEARTH.throatY;
  const out: Section[] = [];
  const gasPts = (): THREE.Vector3[] => [
    v3(0.0, HEARTH.nozzleY + 0.05, z),
    v3(0.0, ty + 0.02, z),
    v3(0.0, ty - 0.1, z),
    v3(0.0, HEARTH.grateY + 0.02, z),
    v3(0.0, HEARTH.grateY - 0.1, z),
    v3(R_ANN * 0.55, HEARTH.grateY - 0.1, z),
    v3(R_ANN, HEARTH.grateY - 0.06, z),
    v3(R_ANN, FITTINGS.outletY - 0.04, z),
    v3(0.31, FITTINGS.outletY, z),
    v3(0.4, FITTINGS.outletY, z),
  ];
  out.push({
    id: 'unit-gas',
    points: gasPts,
    area: Math.PI * HEARTH.throatR * HEARTH.throatR + 0.02,
    temp: (s) => s.zoneReductionT,
    share: () => 1,
  });
  // the air: one path to each of the nozzles on the far half
  nozzleTips.forEach((n, i) => {
    if (cut && n.tip.z < 0) return;
    const a = Math.atan2(n.root.z, n.root.x);
    const pts = (): THREE.Vector3[] => {
      const arc: THREE.Vector3[] = [];
      const r = HEARTH.plenum.r0 - HEARTH.boxWall - 0.016;
      const y = FITTINGS.intakeY;
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const ang = Math.PI + (a - Math.PI) * t;
        arc.push(v3(Math.cos(ang) * r, y, Math.sin(ang) * r + (cut ? 0 : 0)));
      }
      return [
        v3(-0.4, y, 0),
        v3(-0.3, y, 0),
        ...arc,
        v3(n.root.x, n.root.y, n.root.z),
        v3(n.tip.x, n.tip.y, n.tip.z),
        v3(n.tip.x * 0.4, ZONES.oxidation.y0 + 0.07, n.tip.z * 0.4),
      ];
    };
    out.push({ id: `unit-air-${i}`, points: pts, area: 0.0016, temp: () => 20, air: true, share: () => 0.5 });
  });
  // the water and the tars leaving the wood, through the sleeve to the cold wall and down the gutter to the drain
  const vap = (): THREE.Vector3[] => [
    v3(0.18, ZONES.drying.y0 + 0.08, z),
    v3(0.25, ZONES.drying.y0 + 0.14, z),
    v3(UNIT.sleeve.R + 0.004, ZONES.drying.y0 + 0.16, z),
    v3(0.292, ZONES.drying.y0 + 0.14, z),
    v3(0.292, UNIT.jointY + 0.05, z),
    v3(0.31, UNIT.jointY + 0.02, z),
    v3(0.36, UNIT.jointY - 0.02, z),
  ];
  out.push({
    id: 'unit-vapour',
    points: vap,
    area: 0.04,
    temp: (s) => Math.min(120, s.zoneDryingT),
    share: (s) => Math.min(1, 0.25 + s.condensateJacketLph / 4),
  });
  return out;
}

export { COOLER, FILTER };
