import { useCallback, useRef, type CSSProperties } from "react";
import { ProjectCard } from "./ring/cards/ProjectCard";
import type { PreviewCtl } from "./ring/cards/preview";
import type { Project } from "./ring/cards/projects";

type Props = {
  project: Project;
  number: number;
  /** Card width in px. Cards keep the ring's 9:16 shape. */
  width: number;
  /** Play the card's own preview (terminal replay or screenshot drift) on hover. */
  preview?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** One of the ring's cards, standing on its own anywhere on the page. */
export function LooseCard({ project, number, width, preview = true, className = "", style }: Props) {
  const el = useRef<HTMLElement | null>(null);
  const ctl = useRef<PreviewCtl | null>(null);
  const onMount = useCallback((_: number, node: HTMLElement | null, c: PreviewCtl | null) => {
    el.current = node;
    ctl.current = c;
  }, []);
  const noop = useCallback(() => {}, []);

  const enter = () => {
    el.current?.setAttribute("data-hover", "");
    if (preview) ctl.current?.play();
  };
  const leave = () => {
    el.current?.removeAttribute("data-hover");
    ctl.current?.pause();
  };

  return (
    <div
      className={`loose ${className}`}
      style={{ ...style, "--s": width / 180 } as CSSProperties}
      onPointerEnter={(e) => e.pointerType === "mouse" && enter()}
      onPointerLeave={leave}
      onFocus={enter}
      onBlur={leave}
    >
      <ProjectCard project={project} number={number} slot={0} onMount={onMount} onFocusSlot={noop} />
    </div>
  );
}
