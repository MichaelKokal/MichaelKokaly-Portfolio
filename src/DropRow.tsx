import { useEffect, useRef, type MouseEvent } from "react";
import { LooseCard } from "./LooseCard";
import type { Project } from "./ring/cards/projects";

const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Where each card falls from: as if it just came loose from the ring above.
const FROM = [
  { x: 260, y: -520, rx: 58, rz: -26, s: 0.62 },
  { x: 90, y: -600, rx: 64, rz: -10, s: 0.58 },
  { x: -90, y: -580, rx: 62, rz: 12, s: 0.6 },
  { x: -260, y: -500, rx: 56, rz: 24, s: 0.64 },
];
// Where each card lands: a slight fan.
const TO = [
  { y: 20, rz: -6 },
  { y: 0, rz: -2 },
  { y: 0, rz: 2 },
  { y: 20, rz: 6 },
];

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * The four featured cards drop out of the ring and land in a row as the section
 * scrolls into view. The drop follows the scroll, so scrolling back up lifts them
 * back toward the ring. Clicking one scrolls to its project.
 */
export function DropRow({ projects, numbers }: { projects: Project[]; numbers: number[] }) {
  const row = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = row.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the row's top is at the bottom of the screen, 1 when it reaches 35% down.
      const p = still ? 1 : clamp01((vh - r.top) / (vh * 0.65));
      cards.current.forEach((c, i) => {
        if (!c) return;
        const k = ease(clamp01((p - i * 0.07) / 0.72));
        const f = FROM[i], t = TO[i];
        const x = f.x * (1 - k);
        const y = f.y + (t.y - f.y) * k;
        const rx = f.rx * (1 - k);
        const rz = f.rz + (t.rz - f.rz) * k;
        const s = f.s + (1 - f.s) * k;
        c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(3)})`;
        // Unseen for the first half of the fall, then fades in as it lands.
        c.style.opacity = String(clamp01((k - 0.45) / 0.4));
        // Only a card that has fully landed can be clicked.
        c.classList.toggle("is-landed", k >= 0.999);
      });
    };
    const on = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  const go = (id: string) => (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".pcard-demo")) return;
    e.preventDefault();
    e.stopPropagation();
    document.getElementById(`p-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="drop-row" ref={row}>
      {projects.map((p, i) => (
        <div key={p.id} className="drop-card" ref={(n) => void (cards.current[i] = n)} onClickCapture={go(p.id)}>
          <LooseCard project={p} number={numbers[i]} width={200} />
        </div>
      ))}
      <div className="drop-shadow" aria-hidden="true" />
    </div>
  );
}
