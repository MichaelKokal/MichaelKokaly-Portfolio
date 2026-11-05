import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { OutLink } from "./OutLink";
import { links } from "./data";
import { followOpacity, type Value } from "./ring/anim";
import { projectAssets, type Project } from "./ring/cards/projects";
import { PortfolioHero } from "./ring/hero/PortfolioHero";
import { Loader } from "./ring/loader/Loader";
import { useEntrance } from "./ring/loader/useEntrance";
import "./ring/ring.css";

const BRAND = "Michael Kokaly";

const nav = [
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["about", "About"],
  ["skills", "Skills"],
  ["contact", "Contact"],
] as const;

type Props = {
  projects: Project[] | null;
  /** Ring cards with a block further down the page scroll to it instead of opening GitHub. */
  featured: Set<string>;
  active: string;
};

/**
 * The top of the page is the ring from the first portfolio: the intro deals the
 * cards round a ring, then they open into the sliding row. Scrolling down tips
 * the row forward and fades the sunset into the paper of the page below.
 */
export function RingHero({ projects, featured, active }: Props) {
  const assets = useMemo(() => (projects ? projectAssets(projects) : null), [projects]);
  const entrance = useEntrance(assets);
  const { stage, home, expansion } = entrance;
  const wordmark = useRef<HTMLSpanElement>(null);
  const section = useRef<HTMLElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);

  const [language, setLanguage] = useState<string | null>(null);
  const languages = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of projects ?? []) count.set(p.lang, (count.get(p.lang) ?? 0) + 1);
    return [...count];
  }, [projects]);
  const total = projects?.length ?? 0;
  const shown = language ? (languages.find(([l]) => l === language)?.[1] ?? 0) : total;

  // Hold the page at the top until the intro is over.
  useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (stage === "done") return;
    window.scrollTo(0, 0);
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [stage]);

  // Scrolling out of the hero: 0 at the top, 1 once it has scrolled away.
  useEffect(() => {
    const el = section.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = el.offsetHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      el.style.setProperty("--out", p.toFixed(4));
      setSolid(window.scrollY > h - 70);
    };
    const on = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  // A featured card in the ring scrolls down to its project instead of opening GitHub.
  const toProject = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest(".pcard-demo")) return;
    const id = t.closest<HTMLElement>("[data-id]")?.dataset.id;
    if (!id || !featured.has(id)) return;
    e.preventDefault();
    e.stopPropagation();
    document.getElementById(`p-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className={`page ${home ? "is-home" : ""} ${stage === "done" ? "" : "is-entering"}`}>
      <header className={`header ${solid ? "is-solid" : ""}`} aria-hidden={!home}>
        {/* Hovering the name rolls it down and a second line drops in from above. */}
        <a href="#top" className="wordmark" style={{ opacity: home ? 1 : 0 }} tabIndex={home ? 0 : -1}>
          <span className="wordmark-roll">
            <span className="wordmark-line" aria-hidden="true">
              Open to SWE roles. Let&apos;s talk.
            </span>
            <span className="wordmark-line">
              <span ref={wordmark}>{BRAND}</span>
            </span>
          </span>
        </a>
        <nav className="nav" aria-label="Main">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={`nav-link nav-${id} ${active === id ? "is-active" : ""}`} tabIndex={home ? 0 : -1}>
              {label}
            </a>
          ))}
          <OutLink className="nav-link nav-resume" to={links.resume} tabIndex={home ? 0 : -1}>
            Resume
          </OutLink>
        </nav>
      </header>

      <section className="ring-hero" id="top" ref={section}>
        <main className="frame" onClickCapture={toProject}>
          <Sky expansion={expansion} />
          <div className="sky-fade" aria-hidden="true" />
          {projects && (
            <div className="ring-tilt">
              <PortfolioHero
                projects={projects}
                formation={entrance.formation}
                expansion={expansion}
                interactive={stage === "done"}
                paused={false}
                language={language}
                reduced={entrance.reduced}
                bar={bar}
              />
            </div>
          )}
          <section className="headline" aria-hidden={!home} ref={bar}>
            <div className="bar-title">
              <span className="bar-status">Open to SWE internships for Summer 2027</span>
              <h1>
                I build backends, APIs <em>and the apps on top of them.</em>
              </h1>
              <p>
                <span className="hl">Computer Science at UIC. Software Engineering Intern at Mylon Education</span>, where
                I&apos;m building an AI assistant that answers HR policy questions and cites its sources.
              </p>
            </div>
            <div className="bar-meta">
              <div className="bar-count" aria-live="polite">
                <strong key={shown}>{shown}</strong>
                <span>
                  {language ? `${language} ` : ""}
                  {shown === 1 ? "project" : "projects"}
                </span>
              </div>
              <div
                className="bar-langs"
                role="group"
                aria-label="Show projects by language"
                onWheel={(e) => {
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
                }}
              >
                {[["All", total] as const, ...languages].map(([l, n]) => {
                  const on = l === "All" ? language === null : language === l;
                  return (
                    <button
                      key={l}
                      className="lang-chip"
                      aria-pressed={on}
                      tabIndex={home ? 0 : -1}
                      onClick={() => setLanguage(l === "All" || on ? null : l)}
                    >
                      {l}
                      <span className="lang-count">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </section>

      {stage !== "done" && <Loader entrance={entrance} wordmark={wordmark} brand={BRAND} />}
    </div>
  );
}

// Paint grain for the sky, made once as a small plain image.
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

function Sky({ expansion }: { expansion: Value }) {
  const el = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => followOpacity(el.current!, expansion, [0, 0.35], [0, 1]), [expansion]);
  return <div ref={el} className="sky" style={{ "--grain": GRAIN } as CSSProperties} aria-hidden="true" />;
}
