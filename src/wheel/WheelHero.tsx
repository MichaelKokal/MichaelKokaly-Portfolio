import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectCard } from "../cards/ProjectCard";
import type { PreviewCtl } from "../cards/preview";
import { attachGestures, createWriter, hitSlot } from "../cards/runtime";
import { nearestAngle, recycledIndex } from "../math";
import type { HeroProps } from "../ring/RingHero";
import { DRIFT, WHEEL_CARDS, dealPose, wheelScene, wheelTransform } from "./deal-wheel";

const STEP = 360 / WHEEL_CARDS;
const PLAY_WITHIN = 40;
const cards = Array.from({ length: WHEEL_CARDS }, (_, i) => i);
const DEG = 180 / Math.PI;

/** How big the scene can be in this frame, so the lifted wheel clears its top edge. */
function fit(w: number, h: number) {
  // The lifted top card reaches about 352px above the stage centre.
  const tall = (h / 2 - 80) / (352 * 1.14 - 50);
  return Math.max(0.45, Math.min(1, tall, w / 820));
}

export function WheelHero({ projects, formation, expansion, interactive, reduced }: HeroProps) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
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

  const onFocusSlot = useCallback((slot: number) => {
    const { kick } = wheelScene(expansion.get());
    target.current = nearestAngle(spin.current, slot * STEP + kick);
  }, [expansion]);

  useEffect(() => {
    const el = root.current!;
    const stageEl = stage.current!;
    const write = createWriter();
    let size = { w: el.clientWidth, h: el.clientHeight };
    const ro = new ResizeObserver(([e]) => (size = { w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);

    let velocity = 0, frame = 0, hovered = -1, raf = 0, last = performance.now();
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
      if (++frame % 3 === 0) hovered = live.current ? hitSlot(pointer) : -1;

      const deal = formation.get();
      const lift = expansion.get();
      const scale = fit(size.w, size.h) * (1 + 0.14 * lift);
      pxToDeg = DEG / (wheelScene(lift).radius * scale);

      // The wheel drifts left on its own, ramping in with the lift.
      if (!reduced && !pointer.dragging && hovered < 0) target.current += DRIFT * lift * dt;
      target.current += velocity * dt;
      velocity *= Math.exp(-dt * 3.2);
      // Exponential follow: the same feel at any frame rate.
      spin.current += (target.current - spin.current) * (1 - Math.exp(-dt * 9));

      write.style(
        stageEl,
        "transform",
        `translateY(${Math.round((60 - 10 * lift) * 100) / 100}px) rotateX(${Math.round(12 * lift * 100) / 100}deg) scale(${Math.round(scale * 1000) / 1000})`,
      );

      let swapped: number[] | null = null;
      for (const i of cards) {
        const card = els.current[i];
        if (!card) continue;
        const pose = dealPose(i, deal, lift, spin.current);
        // Hide, don't fade: the compositor skips hidden cards entirely.
        write.style(card, "visibility", pose.visible ? "visible" : "hidden");
        if (pose.visible) {
          write.style(card, "transform", wheelTransform(pose));
        } else if (pose.away >= 105) {
          const s = wheelScene(lift);
          const want = recycledIndex(i, WHEEL_CARDS, i * STEP - spin.current + s.kick, n);
          if (want !== reelsRef.current[i]) (swapped ??= [...reelsRef.current])[i] = want;
        }
        write.attr(card, "data-hover", i === hovered ? "" : null);

        const play = !reduced && pose.visible && lift > 0.6 && pose.away < PLAY_WITHIN;
        const ctl = ctls.current[i];
        if (ctl && play !== playing.current[i]) {
          playing.current[i] = play;
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
      ro.disconnect();
      detach();
    };
  }, [formation, expansion, reduced, n]);

  return (
    <div className="hero wheel-hero" ref={root}>
      <div className="wheel-scene">
        <div className="wheel-stage" ref={stage}>
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
