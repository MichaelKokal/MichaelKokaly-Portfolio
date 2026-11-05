import { stepClasses, useSteps, useTyped } from "./timeline";

const TIMES = [300, 1700, 2100, 2900, 3500];

/** Search for a place, fly to it, drop a pin and open the memory saved there. */
export function GlobeDemo({ image }: { image: string }) {
  const step = useSteps(TIMES);
  const typed = useTyped("Rio de Janeiro", 450, 65);

  return (
    <div className={`demo globe ${stepClasses(step)}`}>
      <div className="globe-world" style={{ backgroundImage: `url(${image})` }} />

      <div className="globe-search">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M11 11 L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>
          {typed || <em>Search places and trips</em>}
          <i className="caret" />
        </span>
      </div>
      <div className="globe-suggest">
        <b>Rio de Janeiro</b>
        <span>Brazil</span>
      </div>

      <div className="globe-pin">
        <span className="globe-ripple" />
        <span className="globe-head" />
        <span className="globe-stem" />
      </div>

      <div className="globe-card">
        <div className="globe-card-top">
          <div>
            <strong>Rio de Janeiro</strong>
            <span>Brazil · Jul 2026</span>
          </div>
          <span className="globe-count">4</span>
        </div>
        <div className="globe-photos">
          <span className="ph ph1" />
          <span className="ph ph2" />
          <span className="ph ph3" />
          <span className="ph ph4">
            <i />
          </span>
        </div>
        <span className="globe-meta">3 photos · 1 video</span>
      </div>
    </div>
  );
}
