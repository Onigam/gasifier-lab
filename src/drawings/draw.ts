// Drawing helpers shared by the sheets: text wrapping, notes, tables, the legend of the marks, labels with their mark, Everything draws through the kit's View. Adapted from the solar heater's src/drawings/draw.ts. A number on a sheet goes through `mL`, `mmL` or `fig`, so that it is read from src/three/dims.ts or src/data/figures.ts with its mark.
import {
  COLORS,
  INK,
  INK_2,
  W,
  type Drawing,
  type Pt,
  type Stroke,
  type Text,
  type View,
} from '@onigam/lab-kit/drawings';
import { getLang, l, tr, type L } from '@onigam/lab-kit/i18n';
import { heatRgb, heatStops } from '@onigam/lab-kit/sim/thermal';
import { FIG, type Fig, type FigName } from '../data/figures';
import { figText } from '../data/part-helpers';
import { nEn, nEnTrim, nFr, nFrTrim } from '../data/units';

export const PAPER = COLORS.paper;
export const HEAD_FILL = '#efe6d3';
export const RED = COLORS.red;
export const FILL = {
  steel: '#e6e4de',
  hot: '#f0c9a8',
  cold: '#c8dcea',
  gas: '#dce8f2',
  wood: '#ead9bd',
  char: '#6b5f55',
  ash: '#d4cfc4',
  earth: '#ece4d2',
  green: '#d9e6c8',
  pipe: '#e7e3d8',
  band: '#f3e7d2',
  room: '#f7f3ea',
  loss: '#cfcbc0',
} as const;
/** The colours of the sheets that carry one meaning each: the hot gas, the cold air, the losses, the shaft's work. */
export const INKS = {
  hot: '#c8501e',
  cool: '#5a7fa8',
  loss: '#8b8678',
  work: '#3a7a3a',
  diesel: '#a8742a',
  room: '#3a6ea5',
} as const;

/** A model length in metres, as the sheets draw it: model millimetres. */
export const mm = (m: number): number => m * 1000;

export type Mark = '' | '†' | '*';

const trimFr = (s: string): string => (s.includes(',') ? s.replace(/0+$/, '').replace(/,$/, '') : s);
const trimEn = (s: string): string => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);

/** A length in metres, printed in metres: at most `digits` decimals, no trailing zero, with its mark. */
export const mL = (m: number, mark: Mark, digits = 2): L =>
  l(`${trimFr(nFr(m, digits))} m${mark}`, `${trimEn(nEn(m, digits))} m${mark}`);

/** A length in metres, printed in millimetres, with its mark. One decimal only when it matters. */
export const mmL = (m: number, mark: Mark, prefix = ''): L => {
  const d = Math.abs(m * 1000 - Math.round(m * 1000)) < 0.05 ? 0 : 1;
  return l(`${prefix}${nFr(m * 1000, d)} mm${mark}`, `${prefix}${nEn(m * 1000, d)} mm${mark}`);
};

/** A number and its unit, with its mark. */
export const numL = (v: number, digits: number, unit: string | readonly [string, string], mark: Mark): L => {
  const [uf, ue] = typeof unit === 'string' ? [unit, unit] : unit;
  return l(`${nFr(v, digits)}${uf}${mark}`.replace('-', '−'), `${nEn(v, digits)}${ue}${mark}`.replace('-', '−'));
};

/** A figure of src/data/figures.ts, with its unit and mark, the way the texts print it. */
export function fig(name: FigName): L {
  const f = FIG[name] as Fig;
  return l(figText(f, 'fr'), figText(f, 'en'));
}

/** Texts joined, each resolved in its language. */
export const cat = (...parts: (L | string)[]): L =>
  l(
    parts.map((p) => (typeof p === 'string' ? p : p.fr)).join(''),
    parts.map((p) => (typeof p === 'string' ? p : p.en)).join(''),
  );

// ------------------------------------------------------------------------------------------------ text

/** Width estimate of a text of the given cap height, in paper mm (a little pessimistic: sheets must not overflow). */
export function estW(s: string, size: number, mono = false, bold = false): number {
  return s.length * size * (mono ? 0.86 : bold ? 0.82 : 0.74);
}

/** Greedy word wrap into lines no wider than `maxW`. */
export function wrap(s: string, maxW: number, size: number, mono = false, bold = false): string[] {
  const out: string[] = [];
  for (const par of s.split('\n')) {
    let line = '';
    for (const word of par.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && estW(next, size, mono, bold) > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

export interface ParaOpts {
  size?: number;
  lineH?: number;
  color?: string;
  bold?: boolean;
  mono?: boolean;
}

/** Wrapped paragraph in paper space. Returns the y below it. */
export function note(d: Drawing, x: number, y: number, w: number, text: Text, o: ParaOpts = {}): number {
  const size = o.size ?? 1.9;
  const lh = o.lineH ?? size * 1.62;
  const lines = wrap(tr(text), w, size, o.mono, o.bold);
  const p = d.paper();
  lines.forEach((ln, i) =>
    p.text([x, y + i * lh], ln, {
      size,
      baseline: 'top',
      color: o.color,
      weight: o.bold ? 'bold' : 'normal',
      mono: o.mono,
    }),
  );
  return y + lines.length * lh + size * 0.55;
}

/** A small bold heading in paper space (a view or a block title). Returns the y below it. */
export function heading(
  d: Drawing,
  x: number,
  y: number,
  text: Text,
  o: { size?: number; color?: string } = {},
): number {
  const size = o.size ?? 2.4;
  d.paper().text([x, y], text, { size, weight: 'bold', baseline: 'top', color: o.color });
  return y + size * 1.9;
}

// ------------------------------------------------------------------------------------------------ tables

export interface Cell {
  t: Text;
  bold?: boolean;
  mono?: boolean;
  color?: string;
}
export interface Col {
  label: Text;
  w: number;
  align?: 'start' | 'middle' | 'end';
  mono?: boolean;
}

/** Table with word-wrapped cells. Returns its height. */
export function grid(
  d: Drawing,
  x: number,
  y: number,
  cols: Col[],
  rows: (Cell | Text)[][],
  o: { size?: number; pad?: number; lineH?: number } = {},
): number {
  const p = d.paper();
  const size = o.size ?? 1.8;
  const lh = o.lineH ?? size * 1.55;
  const pad = o.pad ?? 0.7;
  const total = cols.reduce((a, c) => a + c.w, 0);
  const cell = (c: Cell | Text): Cell =>
    typeof c === 'string' || 'fr' in (c as object) ? { t: c as Text } : (c as Cell);
  const lay = (t: Text, c: Col, ce: Cell): string[] => wrap(tr(t), c.w - 2.8, size, ce.mono ?? c.mono, ce.bold);
  const headLines = cols.map((c) => lay(c.label, c, { t: c.label, bold: true }));
  const headH = Math.max(...headLines.map((x2) => x2.length)) * lh + pad * 2;
  const body = rows.map((r) => r.map((c, i) => ({ ce: cell(c), lines: lay(cell(c).t, cols[i]!, cell(c)) })));
  const heights = body.map((r) => Math.max(...r.map((c) => c.lines.length)) * lh + pad * 2);
  const h = headH + heights.reduce((a, b) => a + b, 0);
  p.rect([x, y], [x + total, y + h], { w: W.medium, fill: PAPER });
  p.rect([x, y], [x + total, y + headH], { w: W.thin, fill: HEAD_FILL });
  const put = (lines: string[], cx: number, cy: number, c: Col, ce: Cell): void => {
    const align = c.align ?? 'start';
    const tx = align === 'start' ? cx + 1.3 : align === 'end' ? cx + c.w - 1.3 : cx + c.w / 2;
    lines.forEach((ln, i) =>
      p.text([tx, cy + pad + i * lh + lh * 0.1], ln, {
        size,
        anchor: align,
        baseline: 'top',
        mono: ce.mono ?? c.mono,
        weight: ce.bold ? 'bold' : 'normal',
        color: ce.color,
      }),
    );
  };
  let cx = x;
  cols.forEach((c, i) => {
    if (i) p.line([cx, y], [cx, y + h], { w: W.thin });
    put(headLines[i]!, cx, y, c, { t: c.label, bold: true });
    cx += c.w;
  });
  let ry = y + headH;
  body.forEach((r, ri) => {
    p.line([x, ry], [x + total, ry], { w: W.thin });
    let rx = x;
    r.forEach((c, ci) => {
      put(c.lines, rx, ry, cols[ci]!, c.ce);
      rx += cols[ci]!.w;
    });
    ry += heights[ri]!;
  });
  return h;
}

// ------------------------------------------------------------------------------------------------ boxes, legends

/** The legend of the marks that follow every figure on the sheets. Returns the y below it. */
export function marksLegend(d: Drawing, x: number, y: number, w: number): number {
  const p = d.paper();
  const rows: [string, L][] = [
    ['123', l('donné par une source', 'given by a source')],
    [
      '123†',
      l(
        'calculé : chiffres publiés, ou modèle là où on a mesuré',
        'computed: published figures, or the model where a plant was measured',
      ),
    ],
    [
      '123*',
      l(
        'estimé faute de source, ou modèle là où rien n’a été mesuré',
        'estimated for want of a source, or the model where nothing was measured',
      ),
    ],
  ];
  const lh = 3.3;
  const lines = rows.map(([, t]) => wrap(tr(t), w - 14, 1.75));
  const h = 2.6 + lines.reduce((a, ln) => a + ln.length * lh, 0) + 0.8;
  p.rect([x, y], [x + w, y + h], { w: W.thin, color: INK_2, fill: PAPER });
  let yy = y + 2.6;
  rows.forEach(([m], i) => {
    p.text([x + 1.5, yy], m, { size: 1.75, baseline: 'middle', mono: true, weight: 'bold' });
    lines[i]!.forEach((ln, j) => p.text([x + 11, yy + j * lh], ln, { size: 1.75, baseline: 'middle' }));
    yy += lines[i]!.length * lh;
  });
  return y + h + 1.5;
}

/** A numbered balloon in paper space. */
export function balloon(d: Drawing, x: number, y: number, n: number | string): void {
  const p = d.paper();
  p.circle([x, y], 2.5, { w: W.thin, fill: PAPER });
  p.text([x, y], String(n), { size: 1.9, weight: 'bold', anchor: 'middle', baseline: 'middle' });
}

/** A labelled box of a diagram, in paper space. */
export function box(
  d: Drawing,
  x: number,
  y: number,
  w: number,
  h: number,
  title: Text,
  o: { fill?: string; size?: number; sub?: Text; color?: string } = {},
): void {
  const p = d.paper();
  p.rect([x, y], [x + w, y + h], { w: W.medium, fill: o.fill ?? PAPER, color: o.color });
  const size = o.size ?? 1.9;
  const lines = wrap(tr(title), w - 2.4, size, false, true);
  const subLines = o.sub ? wrap(tr(o.sub), w - 2.4, size * 0.92) : [];
  const lh = size * 1.45;
  const total = (lines.length + subLines.length) * lh;
  let yy = y + h / 2 - total / 2 + lh / 2;
  for (const ln of lines) {
    p.text([x + w / 2, yy], ln, { size, weight: 'bold', anchor: 'middle', baseline: 'middle' });
    yy += lh;
  }
  for (const ln of subLines) {
    p.text([x + w / 2, yy], ln, { size: size * 0.92, anchor: 'middle', baseline: 'middle', mono: true });
    yy += lh;
  }
}

// ------------------------------------------------------------------------------------------------ arrows, a chart

/** An arrow from a to b ending in the kit's arrow marker (model or paper units, as the view says). */
export function arrow(
  v: View,
  a: Pt,
  b: Pt,
  color: string = INK,
  w: number = W.medium,
  dash?: Stroke['dash'],
): SVGElement {
  const e = v.line(a, b, { w, color, dash });
  e.setAttribute('marker-end', 'url(#arrow)');
  return e;
}

/** The red tag of what the simulation gives: a box with its own words. */
export function modelTag(d: Drawing, x: number, y: number, w: number): void {
  const p = d.paper();
  p.rect([x, y], [x + w, y + 5.2], { w: W.medium, color: RED, fill: COLORS.paper });
  p.text([x + w / 2, y + 2.7], l('RÉSULTAT DU MODÈLE · pas une mesure', 'MODEL RESULT · not a measurement'), {
    size: 1.75,
    weight: 'bold',
    color: RED,
    anchor: 'middle',
    baseline: 'middle',
  });
}

export interface ChartSeries {
  x: ArrayLike<number>;
  y: ArrayLike<number>;
  color: string;
  label: Text;
  w?: number;
  dash?: Stroke['dash'];
}

export interface ChartOpts {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xTicks: number[];
  yTicks: number[];
  xLabel: Text;
  yLabel: Text;
  /** Spans of x to tint, with their fill. */
  spans?: { from: number; to: number; fill: string }[];
  /** Horizontal bands of y to tint (the report's band). */
  bands?: { from: number; to: number; fill: string; label?: Text }[];
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  /** Where the legend's first line stands, paper mm from the chart's left edge. */
  legendAt?: number;
  /** Paper mm from the chart's top edge to the legend's first line (3 by default). */
  legendTop?: number;
}

/** A tick's label in the reader's language: 1 200 and 0,5 in French, 1,200 and 0.5 in English. */
export function tickText(v: number): string {
  return getLang() === 'fr' ? nFrTrim(v) : nEnTrim(v);
}

/** A chart in paper space, from `x, y` (its top left) to `x + w, y + h`. Returns the mapping from data to paper. */
export function chart(
  d: Drawing,
  x: number,
  y: number,
  w: number,
  h: number,
  series: ChartSeries[],
  o: ChartOpts,
): (px: number, py: number) => Pt {
  const p = d.paper();
  const mx = (v: number): number => x + ((v - o.xMin) / (o.xMax - o.xMin)) * w;
  const my = (v: number): number => y + h - ((v - o.yMin) / (o.yMax - o.yMin)) * h;
  p.rect([x, y], [x + w, y + h], { w: W.thin, fill: PAPER });
  for (const s of o.spans ?? [])
    p.rect([mx(s.from), y + 0.1], [mx(s.to), y + h - 0.1], { w: 0, color: s.fill, fill: s.fill, opacity: 0.7 });
  for (const b of o.bands ?? []) {
    p.rect([x + 0.1, my(b.to)], [x + w - 0.1, my(b.from)], { w: 0, color: b.fill, fill: b.fill, opacity: 0.8 });
    if (b.label)
      p.text([x + w - 1.5, my(b.to) + 0.8], b.label, { size: 1.7, anchor: 'end', baseline: 'top', color: INK_2 });
  }
  for (const t of o.yTicks) {
    p.line([x, my(t)], [x + w, my(t)], { w: W.thin, color: '#d8d2c4' });
    p.text([x - 1.2, my(t)], o.yFormat ? o.yFormat(t) : tickText(t), {
      size: 1.8,
      anchor: 'end',
      baseline: 'middle',
      mono: true,
    });
  }
  for (const t of o.xTicks.filter((v) => v >= o.xMin && v <= o.xMax)) {
    p.line([mx(t), y], [mx(t), y + h], { w: W.thin, color: '#d8d2c4' });
    p.text([mx(t), y + h + 1.2], o.xFormat ? o.xFormat(t) : tickText(t), {
      size: 1.8,
      anchor: 'middle',
      baseline: 'top',
      mono: true,
    });
  }
  for (const s of series) {
    const pts: Pt[] = [];
    for (let i = 0; i < s.x.length; i++) pts.push([mx(s.x[i]!), my(Math.max(o.yMin, Math.min(o.yMax, s.y[i]!)))]);
    p.polyline(pts, { w: s.w ?? W.medium, color: s.color, dash: s.dash });
  }
  p.rect([x, y], [x + w, y + h], { w: W.medium });
  p.text([x + w / 2, y + h + 4.6], o.xLabel, { size: 1.9, anchor: 'middle', baseline: 'top' });
  p.text([x, y - 1.6], o.yLabel, { size: 1.9, baseline: 'bottom', weight: 'bold' });
  let ly = y + (o.legendTop ?? 3);
  const lx = x + (o.legendAt ?? 3);
  for (const s of series) {
    p.line([lx, ly], [lx + 5, ly], { w: W.thick, color: s.color, dash: s.dash });
    p.text([lx + 6.5, ly], s.label, { size: 1.8, baseline: 'middle', halo: true });
    ly += 3.6;
  }
  return (px, py) => [mx(px), my(py)];
}

// ------------------------------------------------------------------------------------------------ the false colours

const STOPS = heatStops(20, 1400);
/** The lab's false colour of a temperature, 20 to 1,400 °C, as a hex string: the same ramp as the 3D (linear to sRGB). */
export function heatHex(T: number): string {
  const c = heatRgb(STOPS, T);
  const f = (x: number): string =>
    Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055))
      .toString(16)
      .padStart(2, '0');
  return `#${f(c[0])}${f(c[1])}${f(c[2])}`;
}
