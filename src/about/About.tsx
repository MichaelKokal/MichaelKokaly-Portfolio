import { useEffect, useRef } from "react";
import { OutLink } from "../OutLink";

type Props = { open: boolean; onClose(): void };

const facts = [
  ["Currently", "SWE Intern at Mylon Education, building an AI assistant that answers university HR policy questions and cites its sources."],
  ["What I build", "Backend services, REST APIs, and the React frontends on top of them."],
  ["How I ship", "Tested and deployed through CI, on everything from Azure servers to Vercel."],
  ["Open to", "Backend and full-stack software engineering roles."],
  ["I also speak", "Arabic (fluent) and Spanish (basic)."],
  ["Outside the loop", "Dancing and coaching on a Dabke dance team, playing piano, and ping pong."],
];

/** The About me panel. It slides up over the cards and closes with Escape, the close button or a click outside. */
export function About({ open, onClose }: Props) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onClose]);

  return (
    <div className={`about ${open ? "is-open" : ""}`} aria-hidden={!open} onClick={onClose}>
      <section
        className="about-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={close} className="about-close" onClick={onClose} aria-label="Close About me" tabIndex={open ? 0 : -1}>
          ×
        </button>
        <p className="about-eyebrow">Computer Science · UIC · Class of 2028 · 3.83 GPA</p>
        <h2 id="about-title">
          About <em>me.</em>
        </h2>
        <p className="about-lede">
          I build full-stack apps from the database up. I like knowing what&apos;s under the hood, so I usually end up building the whole engine.
        </p>
        <dl className="about-facts">
          {facts.map(([label, text]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <div className="about-links">
          <OutLink to="https://github.com/MichaelKokal" tabIndex={open ? 0 : -1}>
            GitHub ↗
          </OutLink>
          <OutLink to="https://www.linkedin.com/in/michael-kokaly" tabIndex={open ? 0 : -1}>
            LinkedIn ↗
          </OutLink>
          <OutLink to="/Michael-Kokaly-Resume.pdf" tabIndex={open ? 0 : -1}>
            Resume ↗
          </OutLink>
        </div>
      </section>
    </div>
  );
}
