import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import type { GasifierSim } from '../sim/engine';
import { SPEEDS } from '../sim/presets';
import { roomRows, stripAlarms as alarmsOf, stripClock as clockOf, workRows, type StripRow } from '../sim/strip';
import { num, PANEL_ONLY, say, STRIP_ALARMS } from './strings';

// What the bottom strip shows: src/sim/strip.ts says what, this says it in the language of the moment. A value's mark follows its unit until the kit's `StripValue` has a tag of its own (docs/kit-requests.md, 4).
// The strip does not know which world is open (docs/kit-requests.md, 5): `onFrame` of src/lab.ts tells it, and the garage's world shows the room's figures, not the work's.

let scene = '';

/** Called every frame by `onFrame`: the world the visitor is in. */
export function setActiveScene(id: string): void {
  scene = id;
}

export const activeScene = (): string => scene;

/** A figure the room has not got yet is a dash, never a nought: no carbon monoxide has been in the box until the model says so, and nothing leaves the unit, nor has any time passed since a stop, while the engine runs. */
function empty(row: StripRow, sim: GasifierSim): boolean {
  const s = sim.state;
  switch (row.key) {
    case 'garageCo':
    case 'roomAboveCo':
      return !s.coLatched && Number(row.value) === 0;
    case 'sinceStop':
    case 'plume':
    case 'plumeCo':
      return s.engineOn;
    default:
      return false;
  }
}

/** The garage's strip shows its first two figures, the carbon monoxide of the two rooms: the kit's strip gives the alarms what its values leave, and the four alarms a visitor reaches (the engine's gas, a rung of the ladder, the room above, the lid's leak) need about 610 px at 1280 in French, which four values leave 467 of and three 558 (measured on the page, `docs/qa.md`, second pass). The panel keeps all the figures and every alarm. */
export const GARAGE_VALUES = 2;

export function rowsFor(sim: GasifierSim, inScene = scene): StripRow[] {
  const s = sim.state;
  return s.place === 'garage' || inScene === 'garage' ? roomRows(s).slice(0, GARAGE_VALUES) : workRows(s);
}

/** A figure the way the language writes it (1 855 and 2,2 in French, 1,855 and 2.2 in English). */
const figure = (text: string): string => {
  const n = Number(text);
  return Number.isFinite(n) ? num(n, text.split('.')[1]?.length ?? 0) : text;
};

export function stripValues(sim: GasifierSim): StripValue[] {
  return rowsFor(sim).map((row) => {
    const none = empty(row, sim);
    return {
      label: say(row.label),
      value: none ? '—' : figure(row.value),
      unit: none ? '' : `${row.unit}${row.unit && row.tag ? ' ' : ''}${row.tag}`,
    };
  });
}

export function stripClock(sim: GasifierSim): { time: string; sub: string } {
  const { time, sub } = clockOf(sim.state);
  return { time, sub: say(sub) };
}

export function stripAlarms(sim: GasifierSim): StripAlarm[] {
  return alarmsOf(sim.state)
    .filter((a) => !(PANEL_ONLY as readonly string[]).includes(a.key))
    .map((a) => ({
      key: a.key,
      label: say(STRIP_ALARMS[a.key as keyof typeof STRIP_ALARMS]),
      severe: a.severe,
    }));
}

export const STRIP_SPEEDS = SPEEDS;
