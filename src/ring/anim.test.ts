import { describe, expect, it } from "vitest";
import { cubicBezier, value } from "./anim";

/** Brute force: sample the curve finely and read y at the closest x. */
function sampled(x1: number, y1: number, x2: number, y2: number, x: number) {
  let best = 0, err = Infinity;
  for (let i = 0; i <= 200000; i++) {
    const t = i / 200000, u = 1 - t;
    const bx = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3;
    if (Math.abs(bx - x) < err) {
      err = Math.abs(bx - x);
      best = 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3;
    }
  }
  return best;
}

describe("cubicBezier", () => {
  const curves: [number, number, number, number][] = [
    [0.5, 0, 0.15, 1], // the site's own ease
    [0.42, 0, 0.58, 1],
    [0, 0, 1, 1],
    [0.9, 0.1, 0.1, 0.9],
    [1, 0, 0, 1],
  ];

  it("matches the curve CSS draws", () => {
    for (const c of curves) {
      const ease = cubicBezier(...c);
      for (const x of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) expect(ease(x)).toBeCloseTo(sampled(...c, x), 4);
    }
  });

  it("starts at 0, ends at 1 and never runs backwards", () => {
    for (const c of curves) {
      const ease = cubicBezier(...c);
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
      let last = 0;
      for (let x = 0; x <= 1; x += 0.001) {
        const y = ease(x);
        expect(y).toBeGreaterThanOrEqual(last - 1e-6);
        last = y;
      }
    }
  });
});

describe("value", () => {
  it("tells subscribers about changes until they stop listening", () => {
    const v = value(0);
    const seen: number[] = [];
    const stop = v.on((x) => seen.push(x));
    v.set(0.5);
    v.set(0.5);
    v.set(1);
    stop();
    v.set(0);
    expect(seen).toEqual([0.5, 1]);
    expect(v.get()).toBe(0);
  });
});
