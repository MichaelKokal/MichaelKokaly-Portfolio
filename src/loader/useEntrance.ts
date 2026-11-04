import { useCallback, useEffect, useRef, useState } from "react";
import { cubicBezier, tween, value, type Playback } from "../anim";
import { prefersReducedMotion } from "../cards/runtime";

export type Stage = "loading" | "revealing" | "done";

export const FORMATION_S = 2.6;
export const EXPANSION_S = 1.9;
export const EXPANSION_EASE: [number, number, number, number] = [0.5, 0, 0.15, 1];
const expansionEase = cubicBezier(...EXPANSION_EASE);
/** Header, frame and headline start this far into the reveal, not after it. */
export const HOME_AT_S = 1.05;

const decoded = new Map<string, Promise<void>>();

function load(src: string): Promise<void> {
  let p = decoded.get(src);
  if (!p) {
    const img = new Image();
    img.src = src;
    p = img.decode().catch(() => {});
    decoded.set(src, p);
  }
  return p;
}

/**
 * The entrance: formation deals the cards while real assets load, expansion
 * opens the scene once both are done. The hero reads these two numbers.
 * `assets` is null until the covers are ready to load; the loader waits at 0 until then.
 */
export function useEntrance(assets: { covers: string[]; previews: string[] } | null) {
  const [formation] = useState(() => value(0));
  const [expansion] = useState(() => value(0));
  const [reduced] = useState(prefersReducedMotion);
  const [stage, setStage] = useState<Stage>(reduced ? "done" : "loading");
  const [home, setHome] = useState(reduced);
  const [progress, setProgress] = useState(0);
  const run = useRef(0);
  const running = useRef<Playback[]>([]);
  const homeTimer = useRef(0);

  const stop = () => {
    running.current.forEach((c) => c.stop());
    running.current = [];
    clearTimeout(homeTimer.current);
  };

  const finish = useCallback(() => {
    run.current++;
    stop();
    formation.set(1);
    expansion.set(1);
    setStage("done");
    setHome(true);
  }, [formation, expansion]);

  const start = useCallback(() => {
    const id = ++run.current;
    const live = () => id === run.current;
    stop();
    if (reduced) {
      finish();
      return;
    }
    if (!assets) return;

    const all = [...assets.covers, ...assets.previews];
    const total = all.length + 1; // + fonts
    let count = 0;
    const tick = () => live() && setProgress(++count / total);
    const fonts = document.fonts.ready.then(tick);
    const covers = Promise.all([fonts, ...assets.covers.map((s) => load(s).then(tick))]);
    const ready = Promise.all([covers, ...assets.previews.map((s) => load(s).then(tick))]);

    formation.set(0);
    expansion.set(0);
    setProgress(0);
    setStage("loading");
    setHome(false);

    let formed = false, loaded = false;
    const reveal = () => {
      if (!live() || !formed || !loaded) return;
      setStage("revealing");
      running.current.push(
        tween(expansion, 1, { duration: EXPANSION_S, ease: expansionEase, onComplete: () => live() && setStage("done") }),
      );
      homeTimer.current = window.setTimeout(() => live() && setHome(true), HOME_AT_S * 1000);
    };
    // Decode every cover before the deal starts, so no card arrives blank.
    // A very slow connection still gets its deal after 2s.
    const timeout = new Promise((r) => setTimeout(r, 2000));
    Promise.race([covers, timeout]).then(() => {
      if (!live()) return;
      running.current.push(
        tween(formation, 1, {
          duration: FORMATION_S,
          onComplete: () => {
            formed = true;
            reveal();
          },
        }),
      );
    });
    ready.then(() => {
      loaded = true;
      reveal();
    });
  }, [assets, reduced, formation, expansion, finish]);

  useEffect(() => {
    start();
    return () => {
      run.current++;
      stop();
    };
  }, [start]);

  // Escape and Tab end the entrance instantly.
  useEffect(() => {
    if (stage === "done") return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Tab") finish();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [stage, finish]);

  return { formation, expansion, stage, home, progress, reduced, skip: finish };
}

export type Entrance = ReturnType<typeof useEntrance>;
