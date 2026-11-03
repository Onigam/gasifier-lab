// A well-mixed room for a toxic gas: dC/dt = (S − (Q + P)·C)/V, S the toxic gas, P all that comes with it, written for a pair of rooms with an exchange between them. Pure, no lab's name. Well mixed is a choice, and the wrong one for a real room: S3 says a garage holds its carbon monoxide
// in layers with considerably higher concentrations. A model like this one cannot show that any room is acceptable. It reads a fraction, and knows no person.

export interface RoomPair {
  /** Volume share of the gas in the first and second room, 0 to 1. */
  first: number;
  second: number;
}

export interface RoomFlows {
  /** m³. */
  volumeFirst: number;
  volumeSecond: number;
  /** Outside air through each, m³/s. */
  airFirst: number;
  airSecond: number;
  /** Air both ways between them, m³/s. */
  exchange: number;
}

/**
 * One step, s, implicit in the losses so that it is stable at any step. `toxic` is the toxic gas entering the first room, m³/s; `carrier` is everything else that comes with it, m³/s: it pushes the same volume out. So a room
 * filled with nothing but the source tends to the source's share, never above it.
 */
export function stepRooms(r: RoomPair, f: RoomFlows, toxic: number, carrier: number, dt: number): void {
  const push = toxic + carrier;
  const a = (dt * (f.airFirst + push + f.exchange)) / f.volumeFirst;
  const b = (dt * f.exchange) / f.volumeFirst;
  const c = (dt * f.exchange) / f.volumeSecond;
  const d = (dt * (f.airSecond + f.exchange)) / f.volumeSecond;
  const rhs1 = r.first + (dt * toxic) / f.volumeFirst;
  const rhs2 = r.second;
  const det = (1 + a) * (1 + d) - b * c;
  r.first = ((1 + d) * rhs1 + b * rhs2) / det;
  r.second = (c * rhs1 + (1 + a) * rhs2) / det;
}

/** Parts per million of a volume share. */
export const toPpm = (share: number): number => share * 1e6;
