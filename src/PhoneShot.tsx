import { useEffect, useRef, useState, type ReactNode } from "react";
import { GlobeDemo } from "./demos/GlobeDemo";
import { MomentumDemo } from "./demos/MomentumDemo";
import { SkyDemo } from "./demos/SkyDemo";
import { LooseCard } from "./LooseCard";
import type { Project } from "./ring/cards/projects";
import "./demos/demos.css";

export type DemoKind = "sky" | "globe" | "momentum";

const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

/** Card width; the demos are drawn on a 360×640 screen and scaled to fit it. */
const CARD_W = 225;

function demoFor(kind: DemoKind, image: string): ReactNode {
  if (kind === "sky") return <SkyDemo />;
  if (kind === "globe") return <GlobeDemo image={image} />;
  return <MomentumDemo />;
}

type Props = { project: Project; number: number; demo?: DemoKind; image?: string };

/**
 * A project's own ring card, standing in its block. Hovering lifts it and plays a
 * short demo of the app on the card's face. A card without a demo plays its ring
 * preview instead (Recall's terminal). On touch screens it plays in view.
 */
export function PhoneShot({ project, number, demo, image }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const hide = useRef(0);
  const [run, setRun] = useState(0); // bumping this restarts the demo from the top
  const [mode, setMode] = useState<"off" | "on" | "out">("off");

  const start = () => {
    if (still) return;
    clearTimeout(hide.current);
    if (mode !== "on") setRun((r) => r + 1);
    setMode("on");
  };
  const stop = () => {
    if (mode !== "on") return;
    setMode("out");
    hide.current = window.setTimeout(() => setMode("off"), 300);
  };

  useEffect(() => () => clearTimeout(hide.current), []);

  useEffect(() => {
    if (!touch || still || !demo || !box.current) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.6 });
    io.observe(box.current);
    return () => io.disconnect();
  });

  const move = (e: React.PointerEvent) => {
    if (still || e.pointerType !== "mouse") return;
    const el = box.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
    });
  };

  return (
    <div
      className={`shot ${mode === "on" ? "is-playing" : ""}`}
      ref={box}
      onPointerEnter={(e) => e.pointerType === "mouse" && start()}
      onPointerMove={move}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        cancelAnimationFrame(frame.current);
        box.current!.style.removeProperty("--rx");
        box.current!.style.removeProperty("--ry");
        stop();
      }}
    >
      <div className="phone" style={{ ["--demo-scale" as string]: CARD_W / 360 }}>
        <LooseCard project={project} number={number} width={CARD_W} preview={!demo} />
        {demo && mode !== "off" && (
          <div className={`screen ${mode === "out" ? "out" : ""}`} key={run} aria-hidden>
            {demoFor(demo, image ?? project.cover)}
          </div>
        )}
      </div>
      <span className="play-hint" aria-hidden>
        <i /> Hover to see it run
      </span>
    </div>
  );
}
