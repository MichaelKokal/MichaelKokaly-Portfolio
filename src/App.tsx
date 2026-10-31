import { motion, useTransform, type MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import { buildProjects, projectAssets } from "./cards/projects";
import { Loader } from "./loader/Loader";
import { useEntrance } from "./loader/useEntrance";
import { PortfolioHero } from "./hero/PortfolioHero";

const BRAND = "Michael Kokaly";

export function App() {
  const projects = useMemo(buildProjects, []);
  const assets = useMemo(() => projectAssets(projects), [projects]);
  const entrance = useEntrance(assets);
  const { stage, home, expansion } = entrance;
  const wordmark = useRef<HTMLAnchorElement>(null);

  return (
    <div className={`page ${home ? "is-home" : ""} ${stage === "done" ? "" : "is-entering"}`}>
      <header className="header" aria-hidden={!home}>
        <a ref={wordmark} className="wordmark" href="https://github.com/MichaelKokal" style={{ opacity: home ? 1 : 0 }}>
          {BRAND}
        </a>
        <nav className="nav">
          <button className="nav-link" onClick={entrance.replay}>
            Replay intro
          </button>
          <a className="nav-link" href="https://github.com/MichaelKokal" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a className="nav-link nav-cta" href="/Michael-Kokaly-Resume.pdf" target="_blank" rel="noreferrer">
            Resume
          </a>
        </nav>
      </header>

      <main className="frame">
        <Sky expansion={expansion} />
        <PortfolioHero
          projects={projects}
          formation={entrance.formation}
          expansion={expansion}
          interactive={stage === "done"}
          reduced={entrance.reduced}
        />
        <Clouds expansion={expansion} />
        <section className="headline" aria-hidden={!home}>
          <h1>
            Things I've <em>built.</em>
          </h1>
          <p>
            {projects.length} projects, from C++ terminal games to a live map of every plane over Chicago. Drag, swipe or
            scroll to look around, and click any card to open it on GitHub.
          </p>
        </section>
      </main>

      {stage !== "done" && <Loader entrance={entrance} wordmark={wordmark} brand={BRAND} />}
    </div>
  );
}

function Sky({ expansion }: { expansion: MotionValue<number> }) {
  const opacity = useTransform(expansion, [0, 0.35], [0, 1]);
  return <motion.div className="sky" style={{ opacity }} aria-hidden="true" />;
}

// One fixed bank of puffs, seeded so it is the same on every load.
const PUFFS = (() => {
  let seed = 11;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const back: string[] = [], front: string[] = [];
  for (let x = -60; x < 1700; x += 70 + r() * 60) back.push(`<circle cx="${x.toFixed(0)}" cy="${(150 + r() * 70).toFixed(0)}" r="${(90 + r() * 80).toFixed(0)}"/>`);
  for (let x = -40; x < 1700; x += 60 + r() * 70) front.push(`<circle cx="${x.toFixed(0)}" cy="${(250 + r() * 70).toFixed(0)}" r="${(80 + r() * 70).toFixed(0)}"/>`);
  return { back: back.join(""), front: front.join("") };
})();

function Clouds({ expansion }: { expansion: MotionValue<number> }) {
  // The bank rises as the scene opens; the wheel comes up out of it.
  const y = useTransform(expansion, [0, 1], ["70%", "0%"], { ease: (t) => 1 - (1 - t) ** 3 });
  // Fully opaque: the wheel rises out of the clouds, never shows through them.
  const opacity = useTransform(expansion, [0, 0.2], [0, 1]);
  return (
    <motion.div className="clouds" style={{ y, opacity }} aria-hidden="true">
      <svg viewBox="0 0 1600 520" preserveAspectRatio="xMidYMin slice">
        <defs>
          <linearGradient id="cloud-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3e9ee" />
            <stop offset="1" stopColor="#dcd3e6" />
          </linearGradient>
          <linearGradient id="cloud-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".6" stopColor="#f7f1f2" />
            <stop offset="1" stopColor="#efe7ec" />
          </linearGradient>
        </defs>
        <g fill="url(#cloud-back)" dangerouslySetInnerHTML={{ __html: PUFFS.back + '<rect x="-100" y="200" width="1800" height="400"/>' }} />
        <g fill="url(#cloud-front)" dangerouslySetInnerHTML={{ __html: PUFFS.front + '<rect x="-100" y="300" width="1800" height="300"/>' }} />
      </svg>
    </motion.div>
  );
}
