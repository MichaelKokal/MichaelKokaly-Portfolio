import { memo, useLayoutEffect, useRef } from "react";
import { mountPreview, type PreviewCtl } from "./preview";
import type { Project } from "./projects";

type Props = {
  project: Project;
  number: number;
  slot: number;
  onMount(slot: number, el: HTMLAnchorElement | null, ctl: PreviewCtl | null): void;
  onFocusSlot(slot: number): void;
};

/** One card. Its position is never set by React: the hero's animation loop owns that. */
export const ProjectCard = memo(function ProjectCard({ project, number, slot, onMount, onFocusSlot }: Props) {
  const el = useRef<HTMLAnchorElement>(null);
  const preview = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctl = mountPreview(preview.current!, project.preview);
    onMount(slot, el.current, ctl);
    return () => {
      ctl.destroy();
      onMount(slot, null, null);
    };
  }, [project, slot, onMount]);

  return (
    <a
      ref={el}
      className="pcard"
      data-slot={slot}
      href={project.repo}
      target="_blank"
      rel="noreferrer"
      draggable={false}
      aria-label={`${project.name}. ${project.blurb} Built with ${project.lang}, ${project.stack}. Opens on GitHub.`}
      onFocus={() => onFocusSlot(slot)}
      style={{ "--accent": project.accent } as React.CSSProperties}
    >
      <div className="pcard-face pcard-front">
        <img className="pcard-cover" src={project.cover} alt="" draggable={false} />
        <div className="preview" ref={preview} />
        <div className="pcard-shade" />
        <div className="pcard-top">
          <span className="pcard-lang">{project.lang}</span>
          {project.live ? <span className="pcard-live">Live</span> : null}
          <span className="pcard-num">{String(number).padStart(2, "0")}</span>
        </div>
        <div className="pcard-bottom">
          <h3 className="pcard-title">{project.name}</h3>
          <p className="pcard-blurb">{project.blurb}</p>
          <span className="pcard-cta">View on GitHub ↗</span>
        </div>
      </div>
      <div className="pcard-face pcard-back" aria-hidden="true">
        <span className="pcard-mono">MK</span>
      </div>
    </a>
  );
});
