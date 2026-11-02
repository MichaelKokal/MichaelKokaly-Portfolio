import { motion, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { About } from "./about/About";
import { buildProjects, projectAssets, withPlainCovers, type Project } from "./cards/projects";
import { Loader } from "./loader/Loader";
import { useEntrance } from "./loader/useEntrance";
import { PortfolioHero } from "./hero/PortfolioHero";

const BRAND = "Michael Kokaly";

export function App() {
  const drawn = useMemo(buildProjects, []);
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => {
    let live = true;
    withPlainCovers(drawn).then((p) => live && setProjects(p));
    return () => {
      live = false;
    };
  }, [drawn]);
  const assets = useMemo(() => (projects ? projectAssets(projects) : null), [projects]);
  const entrance = useEntrance(assets);
  const { stage, home, expansion } = entrance;
  const wordmark = useRef<HTMLSpanElement>(null);
  const aboutLink = useRef<HTMLAnchorElement>(null);

  // The About me panel follows #about, so the link can be shared and Back closes it.
  const [about, setAbout] = useState(() => location.hash === "#about");
  useEffect(() => {
    const sync = () => setAbout(location.hash === "#about");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const closeAbout = useCallback(() => {
    if (location.hash === "#about") history.replaceState(null, "", location.pathname + location.search);
    setAbout(false);
    aboutLink.current?.focus();
  }, []);

  return (
    <div className={`page ${home ? "is-home" : ""} ${stage === "done" ? "" : "is-entering"}`}>
      <header className="header" aria-hidden={!home}>
        {/* Hovering the name rolls it down and a second line drops in from above. */}
        <span className="wordmark" style={{ opacity: home ? 1 : 0 }}>
          <span className="wordmark-roll">
            <span className="wordmark-line" aria-hidden="true">
              Open to SWE roles. Let&apos;s talk.
            </span>
            <span className="wordmark-line">
              <span ref={wordmark}>{BRAND}</span>
            </span>
          </span>
        </span>
        <nav className="nav">
          <a className="nav-link" href="https://github.com/MichaelKokal" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a className="nav-link" href="https://www.linkedin.com/in/michael-kokaly" target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
          <a className="nav-link" href="/Michael-Kokaly-Resume.pdf" target="_blank" rel="noreferrer">
            Resume ↗
          </a>
        </nav>
      </header>

      <main className="frame">
        <Sky expansion={expansion} />
        {projects && (
          <PortfolioHero
            projects={projects}
            formation={entrance.formation}
            expansion={expansion}
            interactive={stage === "done"}
            reduced={entrance.reduced}
          />
        )}
        <section className="headline headline-bar" aria-hidden={!home}>
          <div className="bar-title">
            <h1>
              Things{" "}
              <a ref={aboutLink} className="bar-about" href="#about" tabIndex={home ? 0 : -1}>
                I&apos;ve
              </a>{" "}
              <em>built.</em>
            </h1>
            <p>Full-stack web apps, data tools and games I&apos;ve built as a Computer Science student at UIC. Click any card to dive deeper.</p>
          </div>
          <div className="bar-meta">
            <div className="bar-count">
              <strong>{drawn.length}</strong>
              <span>projects</span>
            </div>
            <ul className="bar-langs" aria-label="Languages">
              {[...new Set(drawn.map((p) => p.lang))].map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <span className="bar-hint">
              <span aria-hidden="true">←</span> Drag to explore <span aria-hidden="true">→</span>
            </span>
          </div>
        </section>
      </main>

      <About open={about && stage === "done"} onClose={closeAbout} />
      {stage !== "done" && <Loader entrance={entrance} wordmark={wordmark} brand={BRAND} />}
    </div>
  );
}

// Paint grain for the sky, made once as a small plain image. Drawing it with an
// SVG noise filter was slow the first time the sky appeared.
const GRAIN = (() => {
  try {
    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const px = ctx.createImageData(size, size);
    for (let i = 0; i < px.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      px.data[i] = px.data[i + 1] = px.data[i + 2] = v;
      px.data[i + 3] = Math.random() * 9;
    }
    ctx.putImageData(px, 0, 0);
    return `url(${canvas.toDataURL()})`;
  } catch {
    return "none";
  }
})();

function Sky({ expansion }: { expansion: MotionValue<number> }) {
  const opacity = useTransform(expansion, [0, 0.35], [0, 1]);
  return <motion.div className="sky" style={{ opacity, "--grain": GRAIN } as never} aria-hidden="true" />;
}

