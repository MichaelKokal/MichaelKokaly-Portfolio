import { useEffect, useRef } from "react";
import { LooseCard } from "./LooseCard";
import { attachGestures } from "./ring/cards/runtime";
import type { Project } from "./ring/cards/projects";

const W = 210;
const PITCH = 170;

/**
 * The rest of the ring as a small carousel: drag or swipe it (or scroll sideways),
 * and it glides to a stop with the nearest card in the middle. Clicking a card
 * opens it on GitHub; hovering plays its preview.
 */
export function Carousel({ projects, numbers }: { projects: Project[]; numbers: number[] }) {
  const root = useRef<HTMLDivElement>(null);
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const n = projects.length;

  useEffect(() => {
    const el = root.current!;
    let pos = (n - 1) / 2; // in cards; the middle card starts in front
    let target = pos, velocity = 0, raf = 0, last = performance.now();
    const clamp = (v: number) => Math.min(n - 1, Math.max(0, v));
    const { pointer, detach } = attachGestures(
      el,
      {
        drag: (dx) => {
          velocity = 0;
          target = clamp(target - dx / PITCH);
          pos = target;
        },
        release: (v) => (velocity = -v / PITCH),
        wheel: (d) => (target = clamp(target + d / PITCH)),
      },
      () => true,
    );

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pointer.dragging) {
        if (Math.abs(velocity) > 0.05) {
          target = clamp(target + velocity * dt);
          velocity *= Math.exp(-dt * 4);
        } else {
          velocity = 0;
          target += (Math.round(target) - target) * (1 - Math.exp(-dt * 6));
        }
      }
      pos += (target - pos) * (1 - Math.exp(-dt * 10));
      slots.current.forEach((s, i) => {
        if (!s) return;
        const d = i - pos;
        const a = Math.max(-3.2, Math.min(3.2, d));
        const x = a * PITCH + (d - a) * 40;
        const z = -Math.abs(a) * 90;
        const ry = -a * 22;
        s.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        s.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
        s.style.opacity = String(Math.max(0, 1 - Math.max(0, Math.abs(d) - 2.6) * 0.8));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      detach();
    };
  }, [n]);

  return (
    <div className="carousel" ref={root}>
      <div className="carousel-stage">
        {projects.map((p, i) => (
          <div key={p.id} className="carousel-slot" ref={(el) => void (slots.current[i] = el)}>
            <LooseCard project={p} number={numbers[i]} width={W} />
          </div>
        ))}
      </div>
    </div>
  );
}
