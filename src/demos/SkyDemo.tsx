import { stepClasses, useCount, useSteps } from "./timeline";

const ALT = { low: "#f97316", mid: "#facc15", high: "#4ade80", higher: "#38bdf8", top: "#a78bfa" };
const TIMES = [700, 1300];

// Planes crossing the map: [path, color, seconds, delay].
const traffic: [string, string, number, number][] = [
  ["M -30 90 L 390 40", ALT.top, 16, -3],
  ["M 390 210 L -30 260", ALT.higher, 14, -9],
  ["M 60 -30 L 160 680", ALT.high, 18, -5],
  ["M 300 680 L 180 -30", ALT.mid, 15, -11],
  ["M -30 380 L 390 330", ALT.mid, 13, -2],
  ["M 120 340 L 390 300", ALT.low, 11, -6],
  ["M 390 120 L 40 -30", ALT.high, 12, -4],
  ["M 240 -30 L 330 400", ALT.top, 19, -13],
  ["M -30 420 L 116 340", ALT.low, 10, -7],
];

const PICKED = "M 118 336 C 100 292 84 250 62 204 S 12 100 -40 30";

function Plane({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
      <path
        d="M2 10 L8 9 L5.5 3 L8 3 L12.5 9 L16.5 9 Q19 10 16.5 11 L12.5 11 L8 17 L5.5 17 L8 11 Z"
        fill={color}
        stroke="#111"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Live traffic over Chicago; one departure from O'Hare gets picked and tracked. */
export function SkyDemo() {
  const step = useSteps(TIMES);
  const alt = useCount(4200, 32000, step >= 2, 2600);
  const spd = useCount(210, 486, step >= 2, 2600);

  return (
    <div className={`demo sky ${stepClasses(step)}`}>
      <svg className="sky-map" viewBox="0 0 360 640" aria-hidden>
        <rect width="360" height="640" fill="#3a3a3d" />
        <path d="M 250 0 C 262 120 300 220 288 330 C 280 420 300 520 318 640 L 360 640 L 360 0 Z" fill="#222225" />
        <g stroke="#4b4b50" strokeWidth="1.4" fill="none">
          <path d="M 0 340 L 280 322" />
          <path d="M 140 0 L 150 640" />
          <path d="M 0 180 C 120 190 200 220 285 270" />
          <path d="M 40 640 L 210 300 L 255 0" />
        </g>
        <g fill="#2c2c2f">
          <path d="M 60 80 q 14 -8 22 6 q -4 14 -18 8 z" />
          <path d="M 30 150 q 10 -6 16 4 q -2 10 -14 6 z" />
        </g>
        <g className="sky-labels">
          <text x="196" y="92">Waukegan</text>
          <text x="18" y="132">Crystal Lake</text>
          <text x="210" y="232">Evanston</text>
          <text x="188" y="264">Skokie</text>
          <text x="226" y="318">Chicago</text>
          <text x="84" y="358">O'Hare</text>
        </g>
        <defs>
          <linearGradient id="sky-trail" gradientUnits="userSpaceOnUse" x1="118" y1="336" x2="-40" y2="30">
            <stop offset="0" stopColor={ALT.low} />
            <stop offset="0.4" stopColor={ALT.mid} />
            <stop offset="0.75" stopColor={ALT.high} />
            <stop offset="1" stopColor={ALT.higher} />
          </linearGradient>
        </defs>
        <path className="sky-trail" d={PICKED} pathLength={1} stroke="url(#sky-trail)" />
      </svg>

      {traffic.map(([path, color, dur, delay], i) => (
        <div
          key={i}
          className="sky-plane"
          style={{ offsetPath: `path("${path}")`, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
        >
          <Plane color={color} />
        </div>
      ))}
      <div className="sky-plane picked" style={{ offsetPath: `path("${PICKED}")` }}>
        <span className="sky-ring" />
        <Plane color={ALT.higher} />
      </div>

      <div className="sky-sheet">
        {step < 2 ? (
          <div className="sky-sheet-in" key="list">
            <strong className="sky-title">Chicago Sky Tracker</strong>
            <span className="sky-live">
              <i /> 99 aircraft in the air right now
            </span>
            <div className="sky-tabs">
              <span className="on">Live</span>
              <span>Over my house</span>
              <span>Stats</span>
            </div>
          </div>
        ) : (
          <div className="sky-sheet-in" key="flight">
            <div className="sky-flight-top">
              <strong className="sky-title">UAL1423</strong>
              <span className="sky-chip">Climbing</span>
            </div>
            <span className="sky-route">United · ORD → DEN</span>
            <div className="sky-stats">
              <div>
                <b>{(Math.round(alt / 100) * 100).toLocaleString("en-US")}</b>
                <span>ft</span>
              </div>
              <div>
                <b>{Math.round(spd)}</b>
                <span>kt</span>
              </div>
              <div>
                <b>284°</b>
                <span>heading</span>
              </div>
            </div>
            <svg className="sky-profile" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="sky-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="sky-area" d="M0 68 C 60 64 90 40 140 26 S 240 10 300 8 L 300 70 L 0 70 Z" fill="url(#sky-fill)" />
              <path className="sky-line" d="M0 68 C 60 64 90 40 140 26 S 240 10 300 8" pathLength={1} />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
