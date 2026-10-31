import { useCallback, useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import { ProjectCard } from "../cards/ProjectCard";
import type { PreviewCtl } from "../cards/preview";
import type { Project } from "../cards/projects";
import { attachGestures, createWriter, hitSlot } from "../cards/runtime";
import { nearestAngle, recycledIndex } from "../math";
import { REEL_SLOTS, reelAngle, reelPose, reelScene } from "./reel-ring";

export type HeroProps = {
  projects: Project[];
  formation: MotionValue<number>;
  expansion: MotionValue<number>;
  interactive: boolean;
  reduced: boolean;
};

const STEP = 360 / REEL_SLOTS;
const SPIN = 18; // degrees per second: 0.3 per frame at 60fps
const PLAY_WITHIN = 78;
const DRAG = 0.15; // degrees per px
const slots = Array.from({ length: REEL_SLOTS }, (_, i) => i);
const f2 = (n: number) => Math.round(n * 100) / 100;

export function RingHero({ projects, formation, expansion, interactive, reduced }: HeroProps) {
  const root = useRef<HTMLDivElement>(null);
  const n = projects.length;
  // 16 DOM cards show any number of projects by swapping on the back of the ring.
  const [reels, setReels] = useState(() => slots.map((s) => recycledIndex(s, REEL_SLOTS, s * STEP, n)));
  const reelsRef = useRef(reels);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const ctls = useRef<(PreviewCtl | null)[]>([]);
  const playing = useRef<boolean[]>([]);
  const target = useRef(0);
  const angle = useRef(0);
  const live = useRef(interactive);
  live.current = interactive;

  const onMount = useCallback((slot: number, el: HTMLAnchorElement | null, ctl: PreviewCtl | null) => {
    cards.current[slot] = el;
    ctls.current[slot] = ctl;
    playing.current[slot] = false;
  }, []);

  // Tabbing to a card turns the ring to bring it to the far centre.
  const onFocusSlot = useCallback((slot: number) => {
    target.current = nearestAngle(angle.current, -slot * STEP);
  }, []);

  useEffect(() => {
    const el = root.current!;
    const write = createWriter();
    let vel = 0, frame = 0, hovered = -1, raf = 0, last = performance.now();

    const { pointer, detach } = attachGestures(
      el,
      {
        drag: (dx) => (target.current -= dx * DRAG),
        release: (v) => (target.current -= v * DRAG * 0.25),
        wheel: (d) => (target.current += d * 0.06),
      },
      () => live.current,
    );

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Read layout before writing anything this frame, and only every third frame.
      if (++frame % 3 === 0) hovered = live.current ? hitSlot(pointer) : -1;

      const form = formation.get();
      const e = expansion.get();
      if (!reduced && hovered < 0 && !pointer.dragging) target.current += SPIN * e * dt;

      // The visible angle chases the target through a spring, so it never snaps.
      vel += ((target.current - angle.current) * 40 - vel * 12) * dt;
      angle.current += vel * dt;

      const scene = reelScene(e);
      // Shared values go on the ring once, not on every card.
      write.style(el, "--persp", `${f2(scene.perspective)}px`);
      write.style(el, "--tilt", `${f2(scene.tilt)}deg`);
      write.style(el, "--roll", `${f2(scene.roll)}deg`);
      write.style(el, "--anchor", `${f2(scene.anchor)}px`);

      let swapped: number[] | null = null;
      for (const slot of slots) {
        const card = cards.current[slot];
        if (!card) continue;
        const unwrapped = slot * STEP + angle.current;
        const a = reelAngle(slot, angle.current);
        const pose = reelPose(a, form, scene);
        const hidden = pose.behindCamera || pose.appear <= 0;

        write.style(card, "visibility", hidden ? "hidden" : "visible");
        if (hidden) {
          // Out of sight: safe to swap which project this slot holds.
          const want = recycledIndex(slot, REEL_SLOTS, unwrapped, n);
          if (want !== reelsRef.current[slot]) (swapped ??= [...reelsRef.current])[slot] = want;
        } else {
          write.style(
            card,
            "transform",
            `translate3d(${f2(pose.x)}px,0,${f2(pose.z)}px) rotateY(${f2(pose.yaw)}deg) scale(${Math.round(pose.scale * 1000) / 1000})`,
          );
          write.style(card, "--appear", String(f2(pose.appear)));
        }
        write.attr(card, "data-hover", slot === hovered ? "" : null);

        const play = !reduced && !hidden && e > 0.6 && Math.abs(a) < PLAY_WITHIN;
        const ctl = ctls.current[slot];
        if (ctl && play !== playing.current[slot]) {
          playing.current[slot] = play;
          if (play) ctl.play();
          else ctl.pause();
        }
      }
      if (swapped) {
        reelsRef.current = swapped;
        setReels(swapped);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      detach();
    };
  }, [formation, expansion, reduced, n]);

  return (
    <div className="hero ring-hero" ref={root}>
      <div className="ring-stage">
        <div className="ring">
          {slots.map((slot) => (
            <ProjectCard
              key={slot}
              slot={slot}
              project={projects[reels[slot]]}
              number={reels[slot] + 1}
              onMount={onMount}
              onFocusSlot={onFocusSlot}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
