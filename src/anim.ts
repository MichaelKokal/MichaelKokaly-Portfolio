import { clamp01, lerp } from "./math";

/** A number that the entrance animates and the scene reads every frame. */
export type Value = {
  get(): number;
  set(v: number): void;
  /** Calls `fn` on every change. Returns a function that stops it. */
  on(fn: (v: number) => void): () => void;
};

export function value(initial = 0): Value {
  let v = initial;
  const subs = new Set<(v: number) => void>();
  return {
    get: () => v,
    set(next) {
      if (next === v) return;
      v = next;
      subs.forEach((fn) => fn(v));
    },
    on(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

export type Ease = (t: number) => number;

/** The same curve as CSS cubic-bezier(x1, y1, x2, y2). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  // Each axis is a cubic in t with its ends at 0 and 1.
  const ax = 1 + 3 * x1 - 3 * x2, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
  const ay = 1 + 3 * y1 - 3 * y2, by = 3 * y2 - 6 * y1, cy = 3 * y1;
  const xAt = (t: number) => ((ax * t + bx) * t + cx) * t;
  const yAt = (t: number) => ((ay * t + by) * t + cy) * t;
  const slope = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Newton's method is fast where the curve is steep; halving is the safe fallback.
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = xAt(t) - x;
      if (Math.abs(d) < 1e-7) return yAt(t);
      const s = slope(t);
      if (Math.abs(s) < 1e-6) break;
      t -= d / s;
      if (t < 0 || t > 1) break;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const d = xAt(t) - x;
      if (Math.abs(d) < 1e-7) break;
      if (d < 0) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return yAt(t);
  };
}

export type Playback = { stop(): void };

/** Animates `v` to `to` over `duration` seconds, one step per frame. */
export function tween(v: Value, to: number, o: { duration: number; ease?: Ease; onComplete?(): void }): Playback {
  const from = v.get();
  const ease = o.ease ?? ((t: number) => t);
  let start = -1;
  let raf = requestAnimationFrame(function frame(now) {
    if (start < 0) start = now;
    const p = Math.min(1, (now - start) / (o.duration * 1000));
    v.set(lerp(from, to, ease(p)));
    if (p < 1) raf = requestAnimationFrame(frame);
    else o.onComplete?.();
  });
  return { stop: () => cancelAnimationFrame(raf) };
}

/**
 * Keeps an element's opacity in step with `v`: `v` running from `range[0]` to
 * `range[1]` takes the opacity from `opacity[0]` to `opacity[1]`, clamped.
 * Returns a function that stops it.
 */
export function followOpacity(el: HTMLElement, v: Value, range: [number, number], opacity: [number, number]) {
  let last = "";
  const apply = (x: number) => {
    const o = String(Math.round(lerp(opacity[0], opacity[1], clamp01((x - range[0]) / (range[1] - range[0]))) * 1000) / 1000);
    if (o !== last) el.style.opacity = last = o;
  };
  apply(v.get());
  return v.on(apply);
}
