// Cover art for projects that have no screenshot worth showing. Each is a small
// SVG, turned into an image URL so it can be decoded before the deal starts.

const W = 540;
const H = 960;

const wrap = (defs: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs}</defs>${body}</svg>`;

const toUrl = (svg: string) => URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));

const quiz = () =>
  wrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdeaa1"/><stop offset="1" stop-color="#f3b52f"/></linearGradient>
     <linearGradient id="page" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#f6ecd2"/></linearGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <ellipse cx="270" cy="560" rx="210" ry="22" fill="#b7791f" opacity=".25"/>
     <path d="M270 300 C215 268 140 266 70 288 L70 540 C140 518 215 520 270 552 Z" fill="url(#page)"/>
     <path d="M270 300 C325 268 400 266 470 288 L470 540 C400 518 325 520 270 552 Z" fill="url(#page)"/>
     <path d="M270 300 L270 552" stroke="#d9c38f" stroke-width="3"/>
     <g stroke="#e2cf9c" stroke-width="5" stroke-linecap="round">
       ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M98 ${330 + i * 34} C150 ${318 + i * 34} 205 ${318 + i * 34} 245 ${334 + i * 34}"/><path d="M295 ${334 + i * 34} C335 ${318 + i * 34} 390 ${318 + i * 34} 442 ${330 + i * 34}"/>`).join("")}
     </g>
     <path d="M400 268 L400 350 L414 336 L428 350 L428 266" fill="#c2410c"/>
     <g fill="#fffaf0" opacity=".92">
       ${[46, 26, 26, 46, 92, 0, 0].map((h, i) => `<rect x="${118 + i * 46}" y="${810 - h * 1.6}" width="30" height="${h * 1.6}" rx="4"/>`).join("")}
     </g>
     <path d="M100 812 L440 812" stroke="#fffaf0" stroke-width="3" opacity=".9"/>`,
  );

const redlight = () =>
  wrap(
    `<radialGradient id="red" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff453a" stop-opacity=".55"/><stop offset="1" stop-color="#ff453a" stop-opacity="0"/></radialGradient>
     <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14151b"/><stop offset="1" stop-color="#07080b"/></linearGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <circle cx="270" cy="250" r="230" fill="url(#red)"/>
     <rect x="258" y="520" width="24" height="120" fill="#1f222b"/>
     <rect x="186" y="150" width="168" height="384" rx="40" fill="#1b1d25" stroke="#2c303b" stroke-width="3"/>
     <circle cx="270" cy="236" r="52" fill="#ff453a"/><circle cx="256" cy="222" r="16" fill="#ffb4ae" opacity=".55"/>
     <circle cx="270" cy="344" r="52" fill="#3b2a12"/>
     <circle cx="270" cy="452" r="52" fill="#11301e"/>
     <g fill="#ff453a">
       ${[52, 61, 74, 70, 88, 96, 92, 84, 77, 69, 58, 50].map((h, i) => `<rect x="${78 + i * 33}" y="${860 - h * 1.7}" width="22" height="${h * 1.7}" rx="3" opacity="${(0.35 + (h / 96) * 0.65).toFixed(2)}"/>`).join("")}
     </g>
     <path d="M70 864 L470 864" stroke="#3a3d48" stroke-width="2"/>`,
  );

const connectFour = () => {
  // The finished game from the README: Yellow wins along the bottom row.
  const board = ["-------", "-------", "-------", "---R---", "--RR---", "--RYYYY"];
  const x0 = 58, y0 = 300, cw = 60.6, ch = 60;
  const holes = board
    .flatMap((row, r) =>
      [...row].map((c, k) => {
        const fill = c === "R" ? "#ef4444" : c === "Y" ? "#facc15" : "#0a1840";
        return `<circle cx="${x0 + (k + 0.5) * cw}" cy="${y0 + 20 + (r + 0.5) * ch}" r="23" fill="${fill}"/>`;
      }),
    )
    .join("");
  return wrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10275f"/><stop offset="1" stop-color="#050b1f"/></linearGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <circle cx="${x0 + 6.5 * cw}" cy="220" r="23" fill="#facc15"/>
     <path d="M${x0 + 6.5 * cw} 160 L${x0 + 6.5 * cw} 186" stroke="#facc15" stroke-width="3" stroke-dasharray="4 6" opacity=".6"/>
     <rect x="38" y="300" width="464" height="400" rx="26" fill="#1d4ed8"/>
     ${holes}
     <rect x="${x0 + 3 * cw + 2}" y="${y0 + 20 + 5 * ch + 2}" width="${4 * cw - 4}" height="${ch - 4}" rx="28" fill="none" stroke="#fff" stroke-width="3.5"/>
     <path d="M60 700 L40 780 M480 700 L500 780" stroke="#1d4ed8" stroke-width="18" stroke-linecap="round"/>`,
  );
};

function gammonBoard(o: { felt: string; frame: string; light: string; dark: string; ghost?: boolean }) {
  const top = 130, pw = 89, len = 170, left = 62, right = 478;
  let tri = "";
  for (let i = 0; i < 8; i++) {
    const y = top + i * pw;
    const c1 = i % 2 ? o.dark : o.light;
    const c2 = i % 2 ? o.light : o.dark;
    tri += `<path d="M${left} ${y} L${left + len} ${y + pw / 2} L${left} ${y + pw} Z" fill="${c1}"/>`;
    tri += `<path d="M${right} ${y} L${right - len} ${y + pw / 2} L${right} ${y + pw} Z" fill="${c2}"/>`;
  }
  const checker = (x: number, y: number, white: boolean) =>
    `<circle cx="${x}" cy="${y}" r="20" fill="${white ? "#f4efe6" : "#1a1a1a"}" stroke="${white ? "#c9bfae" : "#4a4a4a"}" stroke-width="3"/>`;
  let pieces = "";
  // Points 1 and 2 hold five X each, as in the README; O sits on 3 and 4.
  for (const p of [0, 1]) for (let k = 0; k < 5; k++) pieces += checker(left + 24 + k * 34, top + p * pw + pw / 2, true);
  for (const p of [2, 3]) pieces += checker(left + 24, top + p * pw + pw / 2, false);
  if (o.ghost) {
    // The undo: a ghost of where the checker was, and the way back.
    const gx = left + 24 + 4 * 34, gy = top + pw / 2;
    const nx = left + 24, ny = top + 5 * pw + pw / 2;
    pieces = pieces.replace(checker(gx, gy, true), "");
    pieces += `<circle cx="${gx}" cy="${gy}" r="20" fill="none" stroke="#f4efe6" stroke-width="3" stroke-dasharray="5 5"/>`;
    pieces += checker(nx, ny, true);
    pieces += `<path d="M${nx + 40} ${ny - 6} C ${nx + 240} ${ny - 60}, ${gx + 140} ${gy + 120}, ${gx + 36} ${gy + 18}" fill="none" stroke="#f4efe6" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>`;
    pieces += `<path d="M${gx + 30} ${gy + 4} L${gx + 34} ${gy + 26} L${gx + 54} ${gy + 16}" fill="none" stroke="#f4efe6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<rect x="46" y="112" width="448" height="748" rx="18" fill="${o.felt}" stroke="${o.frame}" stroke-width="8"/>
          <path d="M270 120 L270 852" stroke="${o.frame}" stroke-width="5" opacity=".6"/>${tri}${pieces}`;
}

const halfGammon = () =>
  wrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173f2b"/><stop offset="1" stop-color="#0a1d14"/></linearGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>${gammonBoard({ felt: "#1f5139", frame: "#c9a66b", light: "#e9d8b4", dark: "#9b3a32" })}`,
  );

const halfGammonUndone = () =>
  wrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241b4a"/><stop offset="1" stop-color="#0e0a22"/></linearGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>${gammonBoard({ felt: "#2e2560", frame: "#b9a6f5", light: "#ddd3ff", dark: "#6d4fd6", ghost: true })}`,
  );

const peg = () => {
  let holes = "";
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c <= r; c++) {
      const x = 270 + (c - r / 2) * 88, y = 360 + r * 88;
      holes += `<circle cx="${x}" cy="${y}" r="17" fill="#3a2211"/>`;
      if (r > 0) holes += `<circle cx="${x}" cy="${y - 5}" r="20" fill="url(#peg)"/><circle cx="${x - 6}" cy="${y - 12}" r="6" fill="#fff3d6" opacity=".7"/>`;
    }
  }
  return wrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d1b0d"/><stop offset="1" stop-color="#120a04"/></linearGradient>
     <radialGradient id="peg" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></radialGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <path d="M270 262 L486 742 L54 742 Z" fill="#8a5a2c" stroke="#a8743f" stroke-width="34" stroke-linejoin="round"/>
     ${holes}`,
  );
};

const houseOrArt = () => {
  // The tree from the README, one glowing asterisk per character.
  const rows = [1, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
  const cw = 22, ch = 32, y0 = 230;
  let glyphs = "";
  rows.forEach((n, r) => {
    for (let k = 0; k < n; k++) glyphs += `<use href="#s" x="${270 + (k - (n - 1) / 2) * cw}" y="${y0 + r * ch}"/>`;
  });
  const ty = y0 + rows.length * ch - 12;
  return wrap(
    `<symbol id="s" overflow="visible"><path d="M0 -8 L0 8 M-7 -4 L7 4 M-7 4 L7 -4" stroke="#4ade80" stroke-width="2.6" stroke-linecap="round"/></symbol>
     <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    `<rect width="${W}" height="${H}" fill="#06100a"/>
     <g filter="url(#glow)">${glyphs}
       <path d="M248 ${ty} L248 ${ty + 64} M292 ${ty} L292 ${ty + 64} M248 ${ty + 64} L292 ${ty + 64}" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/>
     </g>`,
  );
};

const orientalStudio = () => {
  // A song's waveform with its beats marked, the maqsoum pattern under it, and the keyboard.
  const bars = Array.from({ length: 64 }, (_, i) => {
    const h = 30 + 90 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.23)) + (i % 8 === 0 ? 40 : 0);
    return `<rect x="${52 + i * 7}" y="${330 - h / 2}" width="4" height="${h}" rx="2" fill="#fb7185" opacity=".8"/>`;
  }).join("");
  const beats = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${52 + i * 56} 220 L${52 + i * 56} 440" stroke="#f5c76a" stroke-width="2" stroke-dasharray="3 7" opacity=".55"/>`).join("");
  const steps = [..."D.T...T.D...T..."].map((c, i) => {
    const x = 66 + i * 27;
    if (c === "D") return `<circle cx="${x}" cy="560" r="14" fill="#fb7185"/>`;
    if (c === "T") return `<circle cx="${x}" cy="560" r="8" fill="#f5c76a"/>`;
    return `<circle cx="${x}" cy="560" r="3" fill="#6b5a8e"/>`;
  }).join("");
  const kw = 31;
  let keys = "";
  for (let k = 0; k < 14; k++) keys += `<rect x="${53 + k * kw}" y="680" width="${kw - 3}" height="170" rx="4" fill="#f4eee4"/>`;
  for (let k = 0; k < 13; k++) if (![2, 6].includes(k % 7)) keys += `<rect x="${53 + k * kw + kw * 0.62}" y="680" width="${kw * 0.68}" height="104" rx="3" fill="#1a1033"/>`;
  return wrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22143f"/><stop offset="1" stop-color="#0b0619"/></linearGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     ${beats}${bars}
     <rect x="44" y="528" width="452" height="64" rx="32" fill="#2b1d4d"/>
     ${steps}
     <rect x="40" y="660" width="460" height="204" rx="14" fill="#2b1d4d"/>
     ${keys}`,
  );
};

const recall = () => {
  // The keyspace as its 256 shards, a few busy at once, over the before/after throughput bars.
  const cell = 26, gap = 3, x0 = 40, y0 = 150;
  let shards = "";
  for (let i = 0; i < 256; i++) {
    let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    const heat = ((h ^ (h >>> 16)) >>> 0) % 100;
    const x = x0 + (i % 16) * (cell + gap), y = y0 + Math.floor(i / 16) * (cell + gap);
    const fill = heat > 82 ? "#e879f9" : heat > 55 ? "#7e3a8a" : "#2a1838";
    shards += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="5" fill="${fill}"/>`;
  }
  // SET and INCR: requests/sec before and after the rewrite, in thousands.
  const pairs = [[452, 1287], [379, 1253]];
  const bars = pairs.map(([before, after], i) => {
    const x = 112 + i * 200, base = 880, scale = 190 / 1287;
    return `<rect x="${x}" y="${base - before * scale}" width="56" height="${before * scale}" rx="6" fill="#4b3a57"/>
       <rect x="${x + 66}" y="${base - after * scale}" width="56" height="${after * scale}" rx="6" fill="#e879f9"/>`;
  }).join("");
  return wrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0f26"/><stop offset="1" stop-color="#08040c"/></linearGradient>
     <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e879f9" stop-opacity=".28"/><stop offset="1" stop-color="#e879f9" stop-opacity="0"/></radialGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <circle cx="270" cy="380" r="300" fill="url(#glow)"/>
     ${shards}
     ${bars}
     <path d="M50 884 L490 884" stroke="#4b3a57" stroke-width="2"/>`,
  );
};

const COVERS = {
  recall,
  orientalStudio,
  quiz,
  redlight,
  connectFour,
  halfGammon,
  halfGammonUndone,
  peg,
  houseOrArt,
};

export function coverUrl(name: keyof typeof COVERS) {
  return toUrl(COVERS[name]());
}

/**
 * Turn a drawn (vector) cover into a plain image. A vector image is redrawn from
 * scratch every time its card changes size, and during the reveal every card
 * changes size on every frame, which made the move from ring to row stutter.
 * A plain image is drawn once and then only scaled.
 */
export async function rasterizeCover(url: string): Promise<string> {
  if (!url.startsWith("blob:")) return url;
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.getContext("2d")!.drawImage(img, 0, 0, W, H);
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.92));
    return blob ? URL.createObjectURL(blob) : url;
  } catch {
    return url;
  }
}
