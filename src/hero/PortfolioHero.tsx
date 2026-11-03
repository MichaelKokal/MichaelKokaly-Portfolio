import { useCallback, useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import { ProjectCard } from "../cards/ProjectCard";
import type { PreviewCtl } from "../cards/preview";
import type { Project } from "../cards/projects";
import { attachGestures, createWriter, hitSlot } from "../cards/runtime";
import { nearestAngle, recycledIndex } from "../math";
import { CARD_COUNT, mixPose, poseTransform, ringIntroPose, ringSlotOf, scenePerspective, stripMetrics, stripPose, type StripLayout } from "./morph";

type Props = {
  projects: Project[];
  /** Deals the cards around the ring. */
  formation: MotionValue<number>;
  /** Carries every card from the ring to its place in the row. */
  expansion: MotionValue<number>;
  interactive: boolean;
  reduced: boolean;
};

/** How fast the row slides to the right on its own, in px per second. */
const SPEED = 38;

const STEP = 360 / CARD_COUNT;
const cards = Array.from({ length: CARD_COUNT }, (_, i) => i);
const ringSlots = cards.map((i) => ringSlotOf(i));

/** The project that lands in the middle when the intro ends. */
const MIDDLE = "oriental";

/** The space the row keeps clear for the header and the bar below it. */
function rowLayout(w: number, h: number): StripLayout {
  // Phones need more room below, because the bar stacks onto more lines.
  const bottom = w < 720 ? 250 : Math.min(214, Math.max(180, h * 0.22));
  return { w, h, top: 92, bottom };
}

/** How big the intro ring can be in this frame. */
function ringFit(w: number, h: number) {
  return Math.max(0.45, Math.min(1, (h / 2 - 60) / 351, w / 820));
}

/**
 * The intro is the ring: cards are dealt round a small tilted ring while the
 * page loads. The reveal then carries each card to its place in a row of big,
 * flat cards that slides slowly to the right and answers to drag, swipe and
 * scroll.
 */
export function PortfolioHero({ projects, formation, expansion, interactive, reduced }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const n = projects.length;
  // Shift the whole list so MIDDLE sits on the middle card, keeping the order.
  const shift = Math.max(0, projects.findIndex((p) => p.id === MIDDLE));
  const shiftRef = useRef(shift);
  shiftRef.current = shift;
  const [reels, setReels] = useState(() => cards.map((i) => (recycledIndex(i, CARD_COUNT, i * STEP, n) + shift) % n));
  const reelsRef = useRef(reels);
  const els = useRef<(HTMLElement | null)[]>([]);
  const ctls = useRef<(PreviewCtl | null)[]>([]);
  const playing = useRef<boolean[]>([]);
  // The row's position, counted in the same degrees the intro ring uses: one
  // card step is 360 / CARD_COUNT.
  const target = useRef(0);
  const spin = useRef(0);
  const live = useRef(interactive);
  live.current = interactive;

  const onMount = useCallback((slot: number, el: HTMLElement | null, ctl: PreviewCtl | null) => {
    els.current[slot] = el;
    ctls.current[slot] = ctl;
    playing.current[slot] = false;
  }, []);

  // Tabbing to a card slides it to the middle.
  const onFocusSlot = useCallback((slot: number) => {
    target.current = nearestAngle(spin.current, slot * STEP);
  }, []);

  useEffect(() => {
    const el = root.current!;
    const write = createWriter();
    let size = { w: el.clientWidth, h: el.clientHeight };
    const ro = new ResizeObserver(([e]) => (size = { w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);

    let velocity = 0, frame = 0, hovered = -1, raf = 0, last = performance.now(), lastStart = 0;
    let pxToStep = STEP / 300;

    const { pointer, detach } = attachGestures(
      el,
      {
        drag: (dx) => {
          velocity = 0;
          target.current -= dx * pxToStep;
        },
        // Keep the flick's speed and let it decay, so it glides.
        release: (v) => (velocity = -v * pxToStep),
        wheel: (d) => (target.current += d * pxToStep),
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
      const fit = ringFit(size.w, size.h);
      const row = rowLayout(size.w, size.h);
      // One card width of drag moves the row one card.
      pxToStep = STEP / stripPose(0, 0, row).pitch;

      // The row slides slowly to the right on its own, easing in as the cards land.
      // It holds still under the pointer, so a moving card is easy to click.
      if (!reduced && !pointer.dragging && hovered < 0) target.current -= SPEED * pxToStep * m * dt;
      target.current += velocity * dt;
      velocity *= Math.exp(-dt * 3.2);
      // Exponential follow: the same feel at any frame rate.
      spin.current += (target.current - spin.current) * (1 - Math.exp(-dt * 5));

      write.style(el, "--persp", `${Math.round(scenePerspective(m))}px`);
      // Cards are laid out at their size in the row, and only ever scaled down from it.
      // While the intro plays the browser keeps each card's first drawing, so a card
      // laid out small and scaled up came out blurry until the row settled.
      const cardSize = Math.round(stripMetrics(row).scale * 1000) / 1000;
      write.style(el, "--card-size", String(cardSize));

      let swapped: number[] | null = null;
      for (const i of cards) {
        const card = els.current[i];
        if (!card) continue;
        // Where this card rests once the intro is over.
        const rest = stripPose(i, spin.current, row);
        const k = ringSlots[i];

        let visible: boolean, appear = 1, pose = rest.pose;
        if (m >= 1) {
          visible = rest.visible;
        } else if (k === null) {
          // Cards that sit the ring out join only once the rest are nearly settled.
          visible = rest.visible && m > 0.95;
        } else {
          const ring = ringIntroPose(k, form, fit);
          visible = ring.appear > 0;
          // Only the very first card fades in, from the white page. Every card after
          // it is dealt solid: cards fading on their own schedules overlapped as
          // light and dark stripes that flickered as they moved.
          appear = Math.min(1, form / 0.05);
          pose = mixPose(ring.pose, rest.pose, m);
        }

        // Hide, don't fade: hidden cards cost the compositor nothing.
        write.style(card, "visibility", visible ? "visible" : "hidden");
        if (visible) {
          write.style(card, "transform", poseTransform({ ...pose, scale: pose.scale / cardSize }));
          write.style(card, "--appear", String(Math.round(appear * 100) / 100));
        } else if (!rest.visible && (m >= 1 || k === null)) {
          // Off screen: safe to swap which project this card shows.
          const want = (recycledIndex(i, CARD_COUNT, i * STEP - spin.current, n) + shiftRef.current) % n;
          if (want !== reelsRef.current[i]) (swapped ??= [...reelsRef.current])[i] = want;
        }
        write.attr(card, "data-hover", i === hovered ? "" : null);

        // Previews wait until the row has settled, then start one at a time.
        // Starting several at once in the middle of the move made it stutter.
        const play = !reduced && visible && m >= 1 && rest.inView;
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
