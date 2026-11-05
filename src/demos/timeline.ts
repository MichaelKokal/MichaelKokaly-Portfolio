import { useEffect, useState } from "react";

/** How many of the given moments (in ms since mount) have passed. */
export function useSteps(times: number[]) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ids = times.map((t, i) => window.setTimeout(() => setStep(i + 1), t));
    return () => ids.forEach(clearTimeout);
  }, [times]);
  return step;
}

/** The text typed so far, one character every `every` ms starting at `start`. */
export function useTyped(text: string, start: number, every = 70) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let id = 0;
    const t = window.setTimeout(() => {
      id = window.setInterval(() => setN((c) => Math.min(text.length, c + 1)), every);
    }, start);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [text, start, every]);
  return text.slice(0, n);
}

/** A number that eases from `from` to `to` over `dur` ms once `on` is true. */
export function useCount(from: number, to: number, on: boolean, dur = 1200) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      setV(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, on, dur]);
  return v;
}

/** The class list for a demo root: s1 s2 … for every step reached. */
export function stepClasses(step: number) {
  return Array.from({ length: step }, (_, i) => `s${i + 1}`).join(" ");
}
