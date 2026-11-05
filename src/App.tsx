import { useEffect, useMemo, useState } from "react";
import { Carousel } from "./Carousel";
import { DropRow } from "./DropRow";
import { OutLink } from "./OutLink";
import { PhoneShot } from "./PhoneShot";
import { RingHero } from "./RingHero";
import { featured, jobs, links, skills, type Featured } from "./data";
import { buildProjects, withPlainCovers, type Project } from "./ring/cards/projects";

const nav = [
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["about", "About"],
  ["skills", "Skills"],
  ["contact", "Contact"],
] as const;

/** Fades each `.reveal` element up the first time it scrolls into view. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in", "is-settled"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            // Clickable once the fade-in has finished.
            const el = e.target;
            window.setTimeout(() => el.classList.add("is-settled"), 750);
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** The id of the section currently under the nav bar. */
function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const ids = nav.map(([id]) => id);
    const update = () => {
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return active;
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <header className="section-head reveal">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </header>
  );
}

function Flow({ flow }: { flow: NonNullable<Featured["flow"]> }) {
  return (
    <figure className="flow">
      <ol style={{ ["--n" as string]: flow.steps.length }}>
        {flow.steps.map((s, i) => (
          <li key={s.title} style={{ ["--i" as string]: i }}>
            <span className="flow-num">{String(i + 1).padStart(2, "0")}</span>
            <strong>{s.title}</strong>
            <span className="flow-note">{s.note}</span>
          </li>
        ))}
      </ol>
      <figcaption>{flow.caption}</figcaption>
    </figure>
  );
}

type Ring = { project: Project; number: number };

function ProjectBlock({ p, index, ring }: { p: Featured; index: number; ring?: Ring }) {
  return (
    <article className={`project reveal has-image ${index % 2 ? "is-flipped" : ""}`} id={`p-${p.id}`}>
      <div className="project-main">
        <div className="project-meta">
          <span className="project-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="project-name">{p.name}</span>
          {p.tag && <span className="chip chip-live">{p.tag}</span>}
          <span className="dot" aria-hidden>·</span>
          <span>{p.kind}</span>
          <span className="dot" aria-hidden>·</span>
          <span>{p.when}</span>
        </div>
        <h3>{p.headline}</h3>
        {p.body.map((t, i) => (
          <p key={i} className="project-body">
            {t}
          </p>
        ))}
        {p.stats && (
          <dl className="stats">
            {p.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <ul className="tags" aria-label="Built with">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="project-links">
          <OutLink to={p.repo} className="text-link">
            Code ↗
          </OutLink>
          {p.live && (
            <OutLink to={p.live} className="text-link">
              Live site ↗
            </OutLink>
          )}
        </div>
      </div>
      <div className="project-side">
        {ring ? <PhoneShot project={ring.project} number={ring.number} demo={p.demo} image={p.image} /> : <div className="shot" />}
        {p.flow && <Flow flow={p.flow} />}
      </div>
    </article>
  );
}

export function App() {
  useReveal();
  const active = useActiveSection();

  // Every project from the ring, with drawn covers turned into plain images once.
  const drawn = useMemo(buildProjects, []);
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => {
    let live = true;
    withPlainCovers(drawn).then((p) => live && setProjects(p));
    return () => {
      live = false;
    };
  }, [drawn]);

  // Each project's ring card and number, by id.
  const ring = useMemo(() => {
    const m = new Map<string, Ring>();
    (projects ?? []).forEach((p, i) => m.set(p.id, { project: p, number: i + 1 }));
    return m;
  }, [projects]);
  const featuredIds = useMemo(() => new Set(featured.map((f) => f.id)), []);
  const top = featured.map((f) => ring.get(f.id)).filter((r): r is Ring => !!r);
  const rest = (projects ?? []).filter((p) => !featuredIds.has(p.id)).map((p) => ring.get(p.id)!);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>

      <RingHero projects={projects} featured={featuredIds} active={active} />

      <main id="content">
        <section className="section" id="projects">
          <div className="wrap">
            <SectionHead
              eyebrow="Featured projects"
              title="Pulled out of the ring."
              sub="Four projects, strongest first. Each one has its code on GitHub, and three are live. Click a card to jump to it."
            />
            {top.length === 4 && <DropRow projects={top.map((r) => r.project)} numbers={top.map((r) => r.number)} />}
            <div className="projects">
              {featured.map((p, i) => (
                <ProjectBlock key={p.id} p={p} index={i} ring={ring.get(p.id)} />
              ))}
            </div>

            <div className="more-head reveal">
              <h3 className="more-title">The rest of the ring</h3>
              <p>Smaller builds, from a Palestinian Arabic speaking coach to C++ terminal games. Drag to browse, hover to watch, click to open on GitHub.</p>
            </div>
            {rest.length > 0 && <Carousel projects={rest.map((r) => r.project)} numbers={rest.map((r) => r.number)} />}
          </div>
        </section>

        <section className="section alt" id="experience">
          <div className="wrap">
            <SectionHead eyebrow="Experience" title="Where I've worked." />
            <ol className="timeline">
              {jobs.map((j) => (
                <li key={j.company} className="job reveal">
                  <div className="job-when">
                    <span>{j.when}</span>
                    <span className="job-where">{j.where}</span>
                    {j.now && <span className="chip chip-live">Now</span>}
                  </div>
                  <div className="job-body">
                    <p className="job-company">{j.company}</p>
                    <h3>{j.role}</h3>
                    <ul>
                      {j.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" id="about">
          <div className="wrap">
            <SectionHead eyebrow="About" title="I like knowing what's under the hood." />
            <div className="about">
              <div className="about-text reveal">
                <p>
                  I'm a <span className="hl">Computer Science</span> student in the{" "}
                  <span className="hl">Honors College</span> at the{" "}
                  <span className="hl">University of Illinois Chicago</span>. I like
                  building the whole thing: the database, the service in front of it, and the page people actually use.
                  When something is slow I'd rather profile it than guess.
                </p>
                <p>
                  Away from the keyboard I dance and coach on a Dabke team, play piano, lift, and play a lot of ping pong
                  and chess. I speak English and Arabic fluently and some Spanish.
                </p>
              </div>
              <aside className="card edu reveal">
                <p className="eyebrow">Education</p>
                <h3>University of Illinois Chicago</h3>
                <p>B.S. Computer Science, Honors College</p>
                <dl className="edu-facts">
                  <div>
                    <dt>Graduating</dt>
                    <dd>May 2028</dd>
                  </div>
                  <div>
                    <dt>GPA</dt>
                    <dd>3.83</dd>
                  </div>
                </dl>
                <p className="edu-course">
                  Data Structures &amp; Algorithms · Software Design · Systems Programming · Computer Architecture ·
                  Object-Oriented Design
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="section alt" id="skills">
          <div className="wrap">
            <SectionHead eyebrow="Skills" title="What I work with." />
            <div className="skills">
              {skills.map(([group, items]) => (
                <div key={group} className="card skill reveal">
                  <h3>{group}</h3>
                  <ul>
                    {items.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="wrap">
            <div className="mk-card reveal" aria-hidden="true">MK</div>
            <p className="eyebrow reveal">Contact</p>
            <h2 className="contact-title reveal">Let's build something together.</h2>
            <p className="section-sub reveal">
              I'm looking for software engineering internships. If you have a role, a project or a question, my inbox
              is open.
            </p>
            <a className="contact-email reveal" href={`mailto:${links.email}`}>
              {links.email}
            </a>
            <div className="ctas reveal">
              <OutLink to={links.linkedin} className="btn btn-ghost">
                LinkedIn
              </OutLink>
              <OutLink to={links.github} className="btn btn-ghost">
                GitHub
              </OutLink>
              <OutLink to={links.resume} className="btn btn-ghost">
                Resume
              </OutLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <p>© {new Date().getFullYear()} Michael Kokaly</p>
          <nav aria-label="Footer">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
