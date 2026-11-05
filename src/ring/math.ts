export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mod = (v: number, m: number) => ((v % m) + m) % m;
export const rad = (deg: number) => (deg * Math.PI) / 180;

/** Wrap any angle into -180..180. */
export const wrap180 = (deg: number) => mod(deg + 180, 360) - 180;

/** The angle equal to `target` (mod 360) that is closest to `current`. */
export const nearestAngle = (current: number, target: number) =>
  current + wrap180(target - current);

/**
 * Which item a recycled slot should hold. `unwrapped` is the slot's angle before
 * wrapping into -180..180. Every time a slot laps the circle it moves `slots`
 * places along the item list, so neighbours on the circle always hold
 * neighbouring items, whatever the number of items.
 */
export function recycledIndex(slot: number, slots: number, unwrapped: number, items: number) {
  const lap = Math.floor((unwrapped + 180) / 360);
  return mod(slot - slots * lap, items);
}
