import { stepClasses, useCount, useSteps, useTyped } from "./timeline";

const R = 40;
const C = 2 * Math.PI * R;
const TIMES = [700, 1900, 2500, 3200, 4300, 4900, 5600];

/** Finish a workout, drink a glass of water, log a banana, see the day add up. */
export function MomentumDemo() {
  const step = useSteps(TIMES);
  const food = useTyped("banana", 3500, 90);
  const kcal = useCount(562, 667, step >= 7, 900);

  const done = step >= 1 ? 5 : 4;
  const pct = Math.round((done / 6) * 100);
  const scroll = step >= 7 ? 0 : step >= 4 ? 470 : step >= 2 ? 300 : 0;

  return (
    <div className={`demo mo ${stepClasses(step)}`}>
      <div className="mo-scroll" style={{ transform: `translateY(${-scroll}px)` }}>
        <header className="mo-head">
          <b>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <path
                d="M2 15 L8 9 L11 12 L17 5 M12 5 H17 V10"
                fill="none"
                stroke="#3253f0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            MOMENTUM
          </b>
          <span>
            <i /> Saved in this browser
          </span>
        </header>

        <section className="mo-card">
          <span className="mo-today">TODAY</span>
          <h4>TUESDAY, NOVEMBER 3</h4>
          <p className="mo-line">
            Workouts <b key={`w${step >= 1}`}>{step >= 1 ? "3/3" : "2/3"}</b> Tasks <b>2/3</b> Water{" "}
            <b key={`h${step >= 3}`}>{step >= 3 ? "7 of 8" : "6 of 8"}</b>
          </p>
          <p className="mo-line">
            Calories <b>{Math.round(kcal)} kcal</b> Protein <b key={`p${step >= 7}`}>{step >= 7 ? "67.7" : "66.4"} g</b>
          </p>
          <div className="mo-ring">
            <svg viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r={R} className="mo-track" />
              <circle cx="50" cy="50" r={R} className="mo-fill" strokeDasharray={C} strokeDashoffset={C * (1 - done / 6)} />
            </svg>
            <div>
              <b key={pct}>
                {pct}
                <small>%</small>
              </b>
              <span>{done} of 6 done</span>
            </div>
          </div>
        </section>

        <section className="mo-card">
          <div className="mo-title">
            <span className="mo-icon orange">
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                <path d="M3 7 V13 M6 5 V15 M14 5 V15 M17 7 V13 M6 10 H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <h5>WORKOUTS</h5>
            <span className="mo-n orange">
              <b key={`n${step >= 1}`}>{step >= 1 ? 3 : 2}</b>/3
            </span>
          </div>
          <div className="mo-bar">
            <span style={{ width: step >= 1 ? "100%" : "66.6%" }} />
          </div>
          {(
            [
              ["Bench press", "4×8", true],
              ["Run", "5 km", true],
              ["Plank", "3×1 min", step >= 1],
            ] as const
          ).map(([name, sub, on]) => (
            <div key={name} className={`mo-row ${on ? "on" : ""}`}>
              <span className="mo-box">
                <svg viewBox="0 0 16 16" aria-hidden>
                  <path d="M3.5 8.5 L6.5 11.5 L12.5 5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
                </svg>
              </span>
              <div>
                <b>{name}</b>
                <span>{sub}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="mo-card">
          <div className="mo-title">
            <span className="mo-icon blue">
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                <path d="M10 3 C 13 7 15 10 15 12.5 A 5 5 0 0 1 5 12.5 C 5 10 7 7 10 3 Z" fill="currentColor" />
              </svg>
            </span>
            <h5>WATER</h5>
            <span className="mo-n blue">
              <b key={`g${step >= 3}`}>{step >= 3 ? 7 : 6}</b>/8
            </span>
          </div>
          <div className="mo-glasses">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className={i < 6 || (i === 6 && step >= 3) ? "full" : ""}>
                <i />
              </span>
            ))}
          </div>
        </section>

        <section className="mo-card">
          <div className="mo-title">
            <span className="mo-icon green">
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                <path d="M10 17 C 4 17 3 11 5 8 C 7 5 9 6 10 7 C 11 6 13 5 15 8 C 17 11 16 17 10 17 Z M10 7 C 10 5 11 3 13 3" fill="currentColor" stroke="currentColor" strokeWidth="1" />
              </svg>
            </span>
            <h5>FOOD</h5>
            <span className="mo-n green">
              <b key={`f${step >= 6}`}>{step >= 6 ? 4 : 3}</b> items
            </span>
          </div>
          <div className="mo-input">
            {food || <em>Search 13,000+ foods</em>}
            {step >= 4 && step < 6 && <i className="caret" />}
          </div>
          <div className="mo-result">
            <div>
              <b>Banana, raw</b>
              <span>1 medium · 118 g</span>
            </div>
            <span className="mo-kcal">105 kcal</span>
            <span className="mo-add">+</span>
          </div>
          <div className="mo-logged">
            <span>Greek yogurt</span>
            <span>Chicken breast</span>
            <span>Rice</span>
            <span className="new">Banana</span>
          </div>
        </section>
      </div>
    </div>
  );
}
