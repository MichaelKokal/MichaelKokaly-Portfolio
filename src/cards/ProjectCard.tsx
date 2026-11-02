import { memo, useLayoutEffect, useRef } from "react";
import { mountPreview, type PreviewCtl } from "./preview";
import type { Project } from "./projects";

type Props = {
  project: Project;
  number: number;
  slot: number;
  onMount(slot: number, el: HTMLElement | null, ctl: PreviewCtl | null): void;
  onFocusSlot(slot: number): void;
};

/**
 * One card. Its position is never set by React: the hero's animation loop owns that.
 * The whole front opens the repo through a link laid over it. A live project also
 * gets a Live demo button on top of that link, since a link can't hold another link.
 */
export const ProjectCard = memo(function ProjectCard({ project, number, slot, onMount, onFocusSlot }: Props) {
  const el = useRef<HTMLDivElement>(null);
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
    <div
      ref={el}
      className="pcard"
      data-slot={slot}
      onFocus={() => onFocusSlot(slot)}
      style={{ "--accent": project.accent } as React.CSSProperties}
    >
      <div className="pcard-face pcard-front">
        {/* First, so Tab reaches the card before its Live demo button. */}
        <a
          className="pcard-link"
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          draggable={false}
          aria-label={`${project.name}. ${project.blurb} Built with ${project.lang}, ${project.stack}. Opens on GitHub.`}
        />
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
          <div className="pcard-actions">
            <span className="pcard-cta">View on GitHub ↗</span>
            {project.live ? (
              <a
                className="pcard-cta pcard-demo"
                href={project.live}
                target="_blank"
                rel="noreferrer"
                draggable={false}
                aria-label={`${project.name} live demo`}
              >
                Live demo ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="pcard-face pcard-back" aria-hidden="true">
        <span className="pcard-mono">MK</span>
      </div>
    </div>
  );
});
