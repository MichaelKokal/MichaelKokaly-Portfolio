import { useCallback, useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import { ProjectCard } from "../cards/ProjectCard";
import type { PreviewCtl } from "../cards/preview";
import type { Project } from "../cards/projects";
import { attachGestures, createWriter, hitSlot } from "../cards/runtime";
import { nearestAngle, recycledIndex } from "../math";
import { DRIFT, VISIBLE_DEG, WHEEL_CARDS, wheelScene } from "../wheel/deal-wheel";
import { mixPose, poseTransform, ringIntroPose, ringSlotOf, scenePerspective, wheelRestPose } from "./morph";

type Props = {
  projects: Project[];
  /** Deals the cards around the ring. */
  formation: MotionValue<number>;
  /** Carries every card from the ring to its place on the wheel. */
  expansion: MotionValue<number>;
  interactive: boolean;
  reduced: boolean;
};

const STEP = 360 / WHEEL_CARDS;
const PLAY_WITHIN = 40;
const DEG = 180 / Math.PI;
const cards = Array.from({ length: WHEEL_CARDS }, (_, i) => i);
const ringSlots = cards.map((i) => ringSlotOf(i));

/** How big the scene can be in this frame, so the wheel clears its top edge. */
function fit(w: number, h: number) {
  // The resting top card reaches about 352px above the stage centre.
  const tall = (h / 2 - 80) / (352 * 1.14 - 50);
  return Math.max(0.45, Math.min(1, tall, w / 820));
}

/**
 * The intro is the ring: cards are dealt round a small tilted ring while the
 * page loads. The reveal then carries each card to its place on the wheel,
 * which keeps turning slowly and answers to drag, swipe and scroll.
 */
export function PortfolioHero({ projects, formation, expansion, interactive, reduced }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const n = projects.length;
  const [reels, setReels] = useState(() => cards.map((i) => recycledIndex(i, WHEEL_CARDS, i * STEP, n)));
  const reelsRef = useRef(reels);
  const els = useRef<(HTMLAnchorElement | null)[]>([]);
  const ctls = useRef<(PreviewCtl | null)[]>([]);
  const playing = useRef<boolean[]>([]);
  const target = useRef(0);
  const spin = useRef(0);
  const live = useRef(interactive);
  live.current = interactive;

  const onMount = useCallback((slot: number, el: HTMLAnchorElement | null, ctl: PreviewCtl | null) => {
    els.current[slot] = el;
    ctls.current[slot] = ctl;
    playing.current[slot] = false;
  }, []);

  // Tabbing to a card turns the wheel to bring it to the top.
  const onFocusSlot = useCallback((slot: number) => {
    target.current = nearestAngle(spin.current, slot * STEP + wheelScene(1).kick);
  }, []);

  useEffect(() => {
    const el = root.current!;
    const write = createWriter();
    let size = { w: el.clientWidth, h: el.clientHeight };
    const ro = new ResizeObserver(([e]) => (size = { w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);

    let velocity = 0, frame = 0, hovered = -1, raf = 0, last = performance.now(), lastStart = 0;
    let pxToDeg = DEG / 1010;

    const { pointer, detach } = attachGestures(
      el,
      {
        drag: (dx) => {
          velocity = 0;
          target.current -= dx * pxToDeg;
        },
        // Keep the flick's speed and let it decay, so it glides.
        release: (v) => (velocity = -v * pxToDeg),
        wheel: (d) => (target.current += d * 0.04),
      },
      () => live.current,
    );

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Read layout before this frame's writes, and only every third frame.
      if (++frame % 3 === 0) hovered = live.current ? hitSlot(pointer) : -1;

      const form = formation.get();
      const m = expansion.get();
      const scale = fit(size.w, size.h);
      pxToDeg = DEG / (wheelScene(1).radius * scale * 1.14);

      // The wheel drifts left on its own, ramping in as the cards arrive.
      if (!reduced && !pointer.dragging && hovered < 0) target.current += DRIFT * m * dt;
      target.current += velocity * dt;
      velocity *= Math.exp(-dt * 3.2);
      // Exponential follow: the same feel at any frame rate.
      spin.current += (target.current - spin.current) * (1 - Math.exp(-dt * 9));

      write.style(el, "--persp", `${Math.round(scenePerspective(m))}px`);

      let swapped: number[] | null = null;
      for (const i of cards) {
        const card = els.current[i];
        if (!card) continue;
        const wheel = wheelRestPose(i, spin.current, scale);
        const k = ringSlots[i];

        let visible: boolean, appear = 1, pose = wheel.pose;
        if (m >= 1) {
          visible = wheel.visible;
        } else if (k === null) {
          // Cards that sit the ring out join only once the wheel is nearly settled.
          visible = wheel.visible && m > 0.95;
        } else {
          const ring = ringIntroPose(k, form, scale);
          visible = ring.appear > 0;
          // Only the very first card fades in, from the white page. Every card after
          // it is dealt solid: cards fading on their own schedules overlapped as
          // light and dark stripes that flickered as they moved.
          appear = Math.min(1, form / 0.05);
          pose = mixPose(ring.pose, wheel.pose, m);
        }

        // Hide, don't fade: hidden cards cost the compositor nothing.
        write.style(card, "visibility", visible ? "visible" : "hidden");
        if (visible) {
          write.style(card, "transform", poseTransform(pose));
          write.style(card, "--appear", String(Math.round(appear * 100) / 100));
        } else if (wheel.away >= VISIBLE_DEG && (m >= 1 || k === null)) {
          // Out of sight at the bottom of the wheel: safe to swap its project.
          const want = recycledIndex(i, WHEEL_CARDS, i * STEP - spin.current + wheelScene(1).kick, n);
          if (want !== reelsRef.current[i]) (swapped ??= [...reelsRef.current])[i] = want;
        }
        write.attr(card, "data-hover", i === hovered ? "" : null);

        // Previews wait until the wheel has settled, then start one at a time.
        // Starting seven at once in the middle of the move made it stutter.
        const play = !reduced && visible && m >= 1 && wheel.away < PLAY_WITHIN;
        const ctl = ctls.current[i];
        if (ctl && play !== playing.current[i] && !(play && now - lastStart < 150)) {
          playing.current[i] = play;
          if (play) {
            ctl.play();
            lastStart = now;
          } else ctl.pause();
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
      ro.disconnect();
      detach();
    };
  }, [formation, expansion, reduced, n]);

  return (
    <div className="hero" ref={root}>
      <div className="scene">
        <div className="stage">
          {cards.map((i) => (
            <ProjectCard
              key={i}
              slot={i}
              project={projects[reels[i]]}
              number={reels[i] + 1}
              onMount={onMount}
              onFocusSlot={onFocusSlot}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
