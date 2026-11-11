import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  select as kitSelect,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import type { GasifierSim } from '../sim/engine';
import { zoneAt } from '../sim/journey';
import type { ChipGrade, DoorState } from '../sim/machine';
import type { EngineMode } from '../sim/motor';
import { PRESET_IDS, RANGES, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import type { TruckLoad } from '../sim/reported';
import { ALARM_TEXTS, ROOM_NOTE, TAG_NOTE } from '../sim/texts';
import type { GasParams, ScenarioId } from '../sim/types';
import {
  analyserReadouts,
  filterCurve,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  powerCurve,
  ppmOfLog,
  roomCurve,
  roomFacts,
  ROOM_DECADES,
  statusOf,
  tempCurve,
  type Band,
  type Readout,
} from './model';
import { num, say, st, sx, type PanelKey } from './strings';

// The simulation mode: the machine and its scenarios, the status, the figures, the working conditions, the filter and its faults, the journey of a chip with its analyser, the room and its box, the curves. All but the first lines are folded. Built only from the kit's widgets and charts.
// What a visitor changes is a condition of the run (a load, a moisture, a sieve, a fault, a place), never a size or a setting of the engine: the model has none (docs/physics.md §2). The journey's cursor, the room's volume and its door are views and conditions, not parts.

type ChartOpts = ConstructorParameters<typeof LineChart>[0];
type Flag =
  'fullPower' | 'engineOn' | 'filterAges' | 'filterWetFault' | 'airLeak' | 'vesselNeglected' | 'lidLeak' | 'fanSource';

interface Control {
  key: keyof GasParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle' | 'select';
  fmt?: (v: number) => string;
}

/** Minutes, then hours past two of them: the curves' time, from the start of the run. */
export const minutesText = (v: number): string =>
  v >= 120 ? `${num(v / 60, 1)} ${st('hours')}` : `${num(v)} ${st('minutes')}`;

/** A figure of the room as its span: never a bare figure. */
export const bandText = (b: Band): string => `${num(b.low, b.digits)} – ${num(b.high, b.digits)}`;

/** The alarms the simulation calls severe, read once. */
const SEVERE = new Set((Object.keys(ALARM_TEXTS) as (keyof typeof ALARM_TEXTS)[]).filter((k) => ALARM_TEXTS[k].severe));

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private lesson = h('div', {});
  private status = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private more = h('div', { class: 'loss-legend' });
  private analyser = h('div', { class: 'loss-legend' });
  private room = h('div', { class: 'loss-legend' });
  private rung = h('p', { class: 'hint' });
  private controls: Control[] = [];
  private truckField: HTMLElement | null = null;

  private powerChart: LineChart;
  private tempChart: LineChart;
  private filterChart: LineChart;
  private roomChart: LineChart;
  private powerOpts: ChartOpts;
  private tempOpts: ChartOpts;
  private filterOpts: ChartOpts;
  private roomOpts: ChartOpts;

  private lastReadouts = 0;
  private lastLive = 0;

  constructor(private ctx: AppContext<GasifierSim>) {
    this.powerOpts = {
      height: 120,
      series: [{ key: 'power', label: () => st('serPower'), color: SERIES_COLORS.load, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: minutesText,
    };
    this.powerChart = new LineChart(this.powerOpts);
    this.tempOpts = {
      height: 130,
      series: [
        { key: 'outlet', label: () => st('serOutlet'), color: SERIES_COLORS.dump, bold: true },
        { key: 'filter', label: () => st('serFilter'), color: SERIES_COLORS.hydro },
        { key: 'casing', label: () => st('serCasing'), color: SERIES_COLORS.pv, dash: true },
      ],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: minutesText,
    };
    this.tempChart = new LineChart(this.tempOpts);
    this.filterOpts = {
      height: 110,
      series: [{ key: 'drop', label: () => st('serDrop'), color: SERIES_COLORS.hydro, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: minutesText,
    };
    this.filterChart = new LineChart(this.filterOpts);
    // a logarithmic axis on the kit's linear one: the ticks fall on 1, 100, 10,000 and a million ppm (docs/kit-requests.md, 6), the span is three lines (7)
    this.roomOpts = {
      height: 150,
      series: [
        { key: 'garage', label: () => st('serGarage'), color: SERIES_COLORS.dump, bold: true },
        { key: 'low', label: () => st('serGarageLow'), color: SERIES_COLORS.dump, dash: true },
        { key: 'high', label: () => st('serGarageHigh'), color: SERIES_COLORS.dump, dash: true },
        { key: 'above', label: () => st('serAbove'), color: SERIES_COLORS.pv },
      ],
      yMin: 0,
      yMax: ROOM_DECADES,
      yFmt: (v) => num(ppmOfLog(v)),
      xFmt: minutesText,
    };
    this.roomChart = new LineChart(this.roomOpts);
  }

  /** Apply a change live; the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<GasParams>): void {
    this.ctx.sim.set(patch);
    this.renderStatus();
    this.renderReadouts();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    this.controls = [];

    const presetSelect = h(
      'select',
      {
        'aria-label': st('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value);
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, sx('preset', id))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, st('custom')),
    );
    this.presetSelect = presetSelect;

    const track = (key: keyof GasParams, el: HTMLElement, kind: Control['kind'], fmt?: (v: number) => string) => {
      this.controls.push({ key, el, kind, fmt });
      return el;
    };
    const slider = (key: PanelKey, field: RangedKey, fmt: (v: number) => string) => {
      const r = RANGES[field];
      return track(
        field,
        kitSlider(st(key), p[field], r.min, r.max, r.step, fmt, (v) => this.set({ [field]: v } as Partial<GasParams>)),
        'slider',
        fmt,
      );
    };
    const toggle = (key: PanelKey, field: Flag) =>
      track(
        field,
        kitToggle(st(key), p[field], (v) => this.set({ [field]: v } as Partial<GasParams>)),
        'toggle',
      );
    const pick = <T extends string | number>(key: PanelKey, field: keyof GasParams, options: [T, string][]) =>
      track(
        field,
        kitSelect<T>(st(key), p[field] as unknown as T, options, (v) => this.set({ [field]: v } as Partial<GasParams>)),
        'select',
      );
    const hint = (key: PanelKey) => h('p', { class: 'hint' }, st(key));
    const folded = (title: string, open: boolean, ...children: (HTMLElement | null)[]) => {
      const d = kitSection(title, ...children) as HTMLDetailsElement;
      d.open = open;
      return d;
    };
    const eyebrow = (key: PanelKey) => h('div', { class: 'eyebrow' }, st(key));

    const modes = (['dual', 'diesel', 'spark'] as EngineMode[]).map((m): [EngineMode, string] => [m, sx('mode', m)]);
    const grades = (['10-40', '15-40', '5-40', 'unsieved'] as ChipGrade[]).map((g): [ChipGrade, string] => [
      g,
      sx('grade', g),
    ]);
    const doors = (['shut', 'ajar', 'open'] as DoorState[]).map((d): [DoorState, string] => [d, sx('door', d)]);
    const trucks = (['empty', 'load-5t', 'load-8t'] as TruckLoad[]).map((t): [TruckLoad, string] => [
      t,
      sx('truck', t),
    ]);
    this.truckField = pick<TruckLoad>('truckLoad', 'truckLoad', trucks);
    this.truckField.hidden = p.machine !== 'scania-l8050';

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, st('simTitle')),
      hint('simIntro'),
      h('p', { class: 'hint' }, say(TAG_NOTE)),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': st('resetSim'),
            title: st('resetSim'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      eyebrow('scenarios'),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id) =>
          h(
            'button',
            {
              class: 'part-chip',
              onclick: () => {
                sim.applyScenario(id);
                this.render();
              },
            },
            sx('scenario', id),
          ),
        ),
      ),
      this.lesson,
      this.status,
      this.readouts,
      folded(st('moreTitle'), false, this.more),
      folded(
        st('secConditions'),
        true,
        slider('load', 'load', (v) => `${num(v)} ${st('loadUnit')}`),
        toggle('fullPower', 'fullPower'),
        pick<EngineMode>('engineMode', 'engineMode', modes),
        toggle('engineOn', 'engineOn'),
        slider('moisture', 'moistureWet', (v) => `${num(v)} %`),
        pick<ChipGrade>('chipGrade', 'chipGrade', grades),
        slider('ambient', 'ambientT', (v) => `${num(v)} °C`),
        this.truckField,
        hint('conditionsHint'),
        hint('speedHint'),
      ),
      folded(
        st('secFaults'),
        false,
        slider('filterHours', 'filterHours', (v) => `${num(v)} h`),
        toggle('filterAges', 'filterAges'),
        toggle('filterWetFault', 'filterWetFault'),
        toggle('airLeak', 'airLeak'),
        toggle('vesselNeglected', 'vesselNeglected'),
        hint('faultsHint'),
      ),
      folded(
        st('secJourney'),
        false,
        slider('journeyLabel', 'journey', (v) => sx('zone', zoneAt(v))),
        hint('journeyHint'),
        this.analyser,
        h(
          'button',
          { class: 'btn btn--primary', onclick: () => this.ctx.gotoScene('gasifier') },
          icon(ICONS.focus, 16),
          st('seeInGasifier'),
        ),
      ),
      folded(
        st('secRoom'),
        p.place === 'garage',
        hint('roomHint'),
        pick<'field' | 'garage'>('place', 'place', [
          ['field', st('placeField')],
          ['garage', st('placeGarage')],
        ]),
        pick<number>('garageVolume', 'garageVolume', [
          [50, `${num(50)} m³`],
          [1000, `${num(1000)} m³`],
        ]),
        pick<DoorState>('door', 'door', doors),
        slider('postGasVolume', 'postGasVolume', (v) => `${num(v, 1)} m³ *`),
        slider('postGasMinutes', 'postGasMinutes', (v) => minutesText(v)),
        toggle('lidLeak', 'lidLeak'),
        toggle('fanSource', 'fanSource'),
        this.room,
        this.rung,
        h('p', { class: 'hint' }, say(ROOM_NOTE)),
        hint('roomRangeNote'),
        eyebrow('chartRoom'),
        this.roomChart.el,
        hint('chartRoomHint'),
      ),
      folded(
        st('secCharts'),
        false,
        eyebrow('chartPower'),
        this.powerChart.el,
        eyebrow('chartTemps'),
        this.tempChart.el,
        eyebrow('chartFilter'),
        this.filterChart.el,
      ),
    );
    this.renderLesson();
    this.refresh();
  }

  /** Called every frame while the panel is open: figures at 5 Hz, the curves at 2 Hz. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastLive += dt;
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastLive > 0.5) {
      this.lastLive = 0;
      this.drawLive();
    }
  }

  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.drawLive();
  }

  // ------------------------------------------------------------------ figures

  /** The lesson of the scenario that began the run stays while the visitor tries things (`scenarioNow`). */
  private renderLesson(): void {
    const id: ScenarioId | null = this.ctx.sim.scenarioNow;
    if (id)
      fill(
        this.lesson,
        h('div', { class: 'callout callout--tip' }, h('b', {}, sx('scenario', id)), h('span', {}, sx('lesson', id))),
      );
    else fill(this.lesson, h('p', { class: 'hint' }, st('scenarioHint')));
  }

  private renderStatus(): void {
    const sim = this.ctx.sim;
    const s = sim.state;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    if (this.truckField) this.truckField.hidden = sim.params.machine !== 'scania-l8050';
    fill(
      this.status,
      h('p', { class: 'hint' }, st(statusOf(s))),
      ...s.alarms.map((key) =>
        SEVERE.has(key)
          ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, sx('alarm', key)))
          : h('div', { class: 'callout' }, h('span', {}, sx('alarm', key))),
      ),
    );
  }

  private box(r: Readout): HTMLElement {
    return h(
      'div',
      { class: 'readout' },
      h('span', {}, say(r.label)),
      h('b', {}, num(r.value, r.digits), h('small', {}, ` ${r.unit}${r.tag ? ` ${r.tag}` : ''}`)),
    );
  }

  private line(r: Readout): HTMLElement {
    return h(
      'span',
      {},
      `${say(r.label)} `,
      h('b', {}, num(r.value, r.digits)),
      h('small', {}, ` ${r.unit}${r.tag ? ` ${r.tag}` : ''}`),
    );
  }

  private renderReadouts(): void {
    const s = this.ctx.sim.state;
    fill(this.readouts, ...mainReadouts(s).map((r) => this.box(r)));
    fill(this.more, ...moreReadouts(s).map((r) => this.line(r)));
    fill(
      this.analyser,
      h('span', {}, `${st('anZone')} `, h('b', {}, sx('zone', s.analyser.zone))),
      ...analyserReadouts(s).map((r) => this.line(r)),
    );
    const f = roomFacts(s);
    const span = (key: PanelKey, b: Band | null) =>
      h(
        'span',
        {},
        `${st(key)} `,
        b ? h('b', {}, bandText(b), h('small', {}, ' ppm *')) : h('small', {}, st('roomEmpty')),
      );
    fill(
      this.room,
      span('roomCoGarage', f.garage),
      span('roomCoAbove', f.above),
      f.stopped ? h('span', {}, `${st('roomSince')} `, h('b', {}, num(f.sinceStop)), h('small', {}, ' min')) : null,
      f.stopped ? h('span', {}, `${st('roomPlume')} `, h('b', {}, num(f.plumeLpm)), h('small', {}, ' L/min *')) : null,
      f.stopped
        ? h('span', {}, `${st('roomPlumeCo')} `, h('b', {}, num(f.plumeCoLpm)), h('small', {}, ' L/min *'))
        : null,
    );
    fill(this.rung, f.rung ? `${st('roomLadder')} : ${say(f.rung.text)}` : null);
  }

  /** A scenario can move a slider or flip a switch by itself: the controls follow. */
  private followScript(): void {
    const p = this.ctx.sim.params;
    for (const c of this.controls) {
      const value = p[c.key];
      if (c.kind === 'select') {
        const sel = c.el.querySelector('select') as HTMLSelectElement | null;
        if (sel && sel.value !== String(value)) sel.value = String(value);
        continue;
      }
      const input = c.el.querySelector('input') as HTMLInputElement | null;
      if (!input) continue;
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number') {
        const step = Number(input.step) || 1e-9;
        const snapped = Number((Math.round(value / step) * step).toFixed(9));
        if (Math.abs(Number(input.value) - snapped) > 1e-9) input.value = String(snapped);
        const out = c.el.querySelector('output');
        if (out && c.fmt) out.textContent = c.fmt(snapped);
      }
    }
  }

  // ------------------------------------------------------------------ charts

  private drawLive(): void {
    const sc = this.ctx.sim.scope;
    const peak = (...series: number[][]) => Math.max(0, ...series.map((a) => (a.length ? Math.max(...a) : 0)));

    const pw = powerCurve(sc);
    this.powerOpts.yMax = niceCeil3(Math.max(10, peak(pw.ys.power!)) * 1.05);
    this.powerChart.setData(pw.xs, pw.ys);
    this.powerChart.draw();

    const tc = tempCurve(sc);
    this.tempOpts.yMax = niceCeil3(Math.max(100, peak(tc.ys.outlet!, tc.ys.filter!, tc.ys.casing!)) * 1.05);
    this.tempChart.setData(tc.xs, tc.ys);
    this.tempChart.draw();

    const fc = filterCurve(sc);
    this.filterOpts.yMax = niceCeil3(Math.max(30, peak(fc.ys.drop!)) * 1.05);
    this.filterChart.setData(fc.xs, fc.ys);
    this.filterChart.draw();

    const rc = roomCurve(sc);
    this.roomChart.setData(rc.xs, rc.ys);
    this.roomChart.draw();
  }
}
