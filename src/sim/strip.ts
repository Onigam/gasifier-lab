import { ALARM_TEXTS, type Pair } from './texts';
import type { GasState } from './types';

// What the strip shows: pure data, the lead's `src/lab.ts` translates the pairs. A value's tag is the state's own: † where this machine was measured, * where not, * always in the room. The kit shows six values at 1,280 px and four at 1,020 (biodigester's kit request): the first six here are the ones to keep, so this is not research §5.5's order.

export interface StripRow {
  key: string;
  label: Pair;
  value: string;
  unit: string;
  tag: '†' | '*' | '';
}

const room = (s: GasState): StripRow[] => [
  {
    key: 'garageCo',
    label: ['CO, garage', 'CO, garage'],
    value: s.garageCoPpm.toFixed(0),
    unit: 'ppm',
    tag: s.roomTag,
  },
  {
    key: 'roomAboveCo',
    label: ['CO, pièce au-dessus', 'CO, room above'],
    value: s.roomAboveCoPpm.toFixed(0),
    unit: 'ppm',
    tag: s.roomTag,
  },
  {
    key: 'sinceStop',
    label: ['Depuis l’arrêt', 'Since the stop'],
    value: s.minutesSinceStop.toFixed(0),
    unit: 'min',
    tag: '',
  },
  { key: 'plume', label: ['Gaz sortant', 'Gas leaving'], value: s.plumeLpm.toFixed(0), unit: 'L/min', tag: s.roomTag },
  {
    key: 'plumeCo',
    label: ['dont CO', 'of which CO'],
    value: s.plumeCoLpm.toFixed(0),
    unit: 'L/min',
    tag: s.roomTag,
  },
  { key: 'casing', label: ['Enveloppe', 'Casing'], value: s.casingT.toFixed(0), unit: '°C', tag: s.roomTag },
];

const work = (s: GasState): StripRow[] => {
  const t = s.figureTag;
  return [
    { key: 'power', label: ['Puissance', 'Power'], value: s.powerKw.toFixed(0), unit: 'kW', tag: t },
    { key: 'chips', label: ['Plaquettes', 'Chips'], value: s.chipsKgH.toFixed(0), unit: 'kg/h', tag: t },
    { key: 'diesel', label: ['Gazole', 'Diesel'], value: s.dieselKgH.toFixed(1), unit: 'kg/h', tag: t },
    { key: 'gas', label: ['Gaz', 'Gas'], value: s.gasMJ.toFixed(1), unit: 'MJ/Nm³', tag: t },
    { key: 'co', label: ['CO', 'CO'], value: (s.gasCO * 100).toFixed(0), unit: '%', tag: t },
    {
      key: 'totalEff',
      label: ['Rendement total', 'Total efficiency'],
      value: (s.totalEff * 100).toFixed(0),
      unit: '%',
      tag: t,
    },
    { key: 'outlet', label: ['Sortie du gaz', 'Gas outlet'], value: s.outletT.toFixed(0), unit: '°C', tag: '*' },
    { key: 'filter', label: ['Filtre', 'Filter'], value: s.filterDropMmWg.toFixed(0), unit: 'mm H₂O', tag: t },
    { key: 'rpm', label: ['Régime', 'Speed'], value: s.engineRpm.toFixed(0), unit: 'rpm', tag: '' },
  ];
};

export const stripValues = (s: GasState): StripRow[] => (s.place === 'garage' ? room(s) : work(s));

const pad = (n: number): string => String(n).padStart(2, '0');

/** The clock of the strip: hours and minutes of the run. The speed is the kit's `×`. */
export const stripClock = (s: GasState): { time: string; sub: Pair } => {
  const h = Math.floor(s.hour);
  const m = Math.floor((s.hour - h) * 60);
  const stopped = !s.engineOn;
  return {
    time: `${pad(h)}:${pad(m)}`,
    sub: stopped ? ['moteur arrêté', 'engine stopped'] : ['moteur tournant', 'engine running'],
  };
};

export const stripAlarms = (s: GasState): { key: string; label: Pair; severe: boolean }[] =>
  s.alarms.map((key) => ({ key, label: ALARM_TEXTS[key].text, severe: ALARM_TEXTS[key].severe }));
