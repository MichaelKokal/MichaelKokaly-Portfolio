import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { followOpacity } from "../anim";
import { EXPANSION_EASE, HOME_AT_S, type Entrance } from "./useEntrance";

type Props = { entrance: Entrance; wordmark: RefObject<HTMLElement | null>; brand: string };

/** The white loading page. The cards rise over it; it fades while they move. */
export function Loader({ entrance, wordmark, brand }: Props) {
  const { stage, progress, expansion, home } = entrance;
  const backdrop = useRef<HTMLDivElement>(null);
  const brandEl = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => followOpacity(backdrop.current!, expansion, [0, 0.55], [1, 0]), [expansion]);

  // The brand word flies into the header wordmark's real position and size.
  useEffect(() => {
    if (stage !== "revealing" || !brandEl.current || !wordmark.current) return;
    const from = brandEl.current.getBoundingClientRect();
    const to = wordmark.current.getBoundingClientRect();
    const fly = brandEl.current.animate(
      [{ transform: "none" }, { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.height / from.height})` }],
      { duration: HOME_AT_S * 1000, easing: `cubic-bezier(${EXPANSION_EASE.join(", ")})`, fill: "forwards" },
    );
    return () => fly.cancel();
  }, [stage, wordmark]);

  const pct = Math.round(progress * 100);
  return (
    <>
      <div ref={backdrop} className="loader-backdrop" />
      <div className={`loader-ui ${stage === "loading" ? "" : "is-leaving"}`}>
        <span ref={brandEl} className="loader-brand" style={{ opacity: home ? 0 : 1 }}>
          {brand}
        </span>
        <div className="loader-progress" role="progressbar" aria-label="Loading projects" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <Scramble text={pct >= 100 ? "Projects Loaded" : "Loading Projects"} />
          <Counter value={pct} />
        </div>
        <button className="loader-skip" onClick={entrance.skip}>
          Skip intro <kbd>Esc</kbd>
        </button>
      </div>
    </>
  );
}

/** Each digit is its own column that rolls to its value. */
function Counter({ value }: { value: number }) {
  const digits = String(value).padStart(3, "0").split("").map(Number);
  return (
    <div className="counter" aria-hidden="true">
      {digits.map((d, i) => (
        <span key={i} className={`digit ${i === 0 && value < 100 ? "is-dim" : ""}`}>
          <span className="digit-col" style={{ transform: `translateY(${-d * 10}%)` }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
      <span className="counter-pct">%</span>
    </div>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+";

/** A caption that scrambles, then settles left to right. */
function Scramble({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const settled = Math.floor((now - t0) / 45);
      setShown(
        text
          .split("")
          .map((c, i) => (c === " " || i < settled ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(""),
      );
      if (settled < text.length) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return (
    <span className="scramble" aria-hidden="true">
      {shown}
    </span>
  );
}
