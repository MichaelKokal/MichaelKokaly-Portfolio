import { coverUrl } from "./covers";

/**
 * A terminal replay. A line containing "§" prints everything before it at once
 * and types the rest, like someone answering a prompt.
 */
export type Script = string[];

export type PreviewSpec =
  | { kind: "terminal"; script: Script }
  | { kind: "pan"; images: string[] }
  | { kind: "drift"; image: string }
  | { kind: "globe" }
  | { kind: "video"; src: string };

export type Project = {
  id: string;
  name: string;
  blurb: string;
  lang: string;
  stack: string;
  repo: string;
  live?: string;
  cover: string;
  accent: string;
  preview: PreviewSpec;
};

const GH = "https://github.com/MichaelKokal/";

function connectFour(): Script {
  const board = Array.from({ length: 6 }, () => Array(7).fill("-"));
  // The game from the README: Yellow takes the bottom row.
  const moves = [3, 4, 3, 5, 4, 6, 4, 7];
  const out: Script = [];
  moves.forEach((col, i) => {
    const red = i % 2 === 0;
    out.push(`It is ${red ? "Red" : "Yellow"}'s turn.`, "In which column would you like to move (-1 to exit)?", `§${col}`);
    const row = board.map((r) => r[col - 1]).lastIndexOf("-");
    board[row][col - 1] = red ? "R" : "Y";
    out.push(...board.map((r) => r.join(" ")), "=============", "1 2 3 4 5 6 7", "");
  });
  out.push("Yellow wins!", "");
  return out;
}

function gammonBoard(x: number[], o: number[]) {
  const height = Math.max(...x, ...o, 1);
  const rows: string[] = [];
  for (let h = height; h >= 1; h--) {
    let line = "  ";
    for (let p = 0; p < 16; p++) line += (x[p] >= h ? "X" : o[p] >= h ? "O" : " ").padEnd(3);
    rows.push(line.trimEnd());
  }
  rows.push("  " + Array.from({ length: 16 }, (_, p) => String(p + 1).padEnd(3)).join("").trimEnd());
  return rows;
}

function halfGammon(undo: boolean): Script {
  const x = Array(16).fill(0), o = Array(16).fill(0);
  x[0] = 5; x[1] = 5; o[2] = 1; o[3] = 1;
  const prompt = undo ? "What position would you like to move (Q to quit, U to undo)? §" : "What position would you like to move (-1 to quit)? §";
  const out: Script = ["Enter seed: §42", "", ...gammonBoard(x, o), ""];
  const history: [number[], number[]][] = [];
  const turns: [number, string][] = undo
    ? [[3, "1"], [5, "2"], [2, "U"], [4, "2"], [6, "4"]]
    : [[3, "1"], [5, "2"], [2, "4"], [6, "7"]];
  for (const [roll, move] of turns) {
    out.push(`Roll is ${roll}`, prompt + move);
    if (move === "U") {
      const [px, po] = history.pop()!;
      x.splice(0, 16, ...px); o.splice(0, 16, ...po);
      out.push("Undid the last move.", "");
    } else {
      history.push([[...x], [...o]]);
      const from = Number(move) - 1, to = Math.min(15, from + roll);
      x[from]--;
      if (o[to] === 1) { o[to] = 0; out.push("Bumped an O checker!"); }
      x[to]++;
      out.push("");
    }
    out.push(...gammonBoard(x, o), "");
  }
  return out;
}

function pegGame(): Script {
  // Holes A..O, top to bottom. A starts empty.
  const pegs: Record<string, boolean> = {};
  "ABCDEFGHIJKLMNO".split("").forEach((c) => (pegs[c] = c !== "A"));
  const rows = ["A", "BC", "DEF", "GHIJ", "KLMNO"];
  const draw = () => rows.map((r, i) => " ".repeat(4 - i) + r.split("").map((c) => (pegs[c] ? "T" : ".")).join(" "));
  const out: Script = ["Jump pegs until only one is left.", "", ...draw(), ""];
  for (const move of ["DBA", "FED", "MIF", "GHI", "NIE"]) {
    const [from, over, to] = move.split("");
    out.push(`Enter your move: §${move}`);
    pegs[from] = false; pegs[over] = false; pegs[to] = true;
    out.push("", ...draw(), "");
  }
  return out;
}

function houseOrArt(): Script {
  const tree = [1, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21].map((n) => " ".repeat((21 - n) / 2) + "*".repeat(n));
  tree.push("        |   |", "        |___|");
  const house = (floors: number) => [
    "    /\\", "   /  \\", "  /    \\", " /______\\",
    ...Array.from({ length: floors }, () => [" |[]  []|", " |______|"]).flat(),
  ];
  return [
    "Enter 1 for a house or 2 for art: §2", "", ...tree, "",
    "Enter 1 for a house or 2 for art: §1", "How many floors? §3", "", ...house(3), "",
  ];
}

function redlight(): Script {
  const menu = ["Select a menu option:", "  1. Data overview", "  2. Results by neighborhood", "  3. Chart by month", "  4. Search for cameras", "  5. Exit", "Your choice:"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const stars = [8, 7, 9, 10, 12, 13, 14, 15, 12, 11, 9, 8];
  return [
    "Enter file to use:", "§redlight_camera_data.csv", "",
    ...menu, "§1", "",
    "Read file with 12453 records.", "There are 157 cameras.", "A total of 3842901 violations.",
    "The most violations in one day were 542 on 0815-2021 at WESTERN & 79TH", "",
    ...menu, "§3", "",
    ...months.map((m, i) => m.padEnd(10) + "*".repeat(stars[i])), "",
  ];
}

export function buildProjects(): Project[] {
  return [
    {
      id: "sky",
      name: "Chicago Sky Tracker",
      blurb: "Every aircraft over Chicago, live, with flight history, overhead search and stats.",
      lang: "Java",
      stack: "Spring Boot · PostgreSQL · React",
      repo: GH + "Chicago-Sky-Tracker",
      live: "https://chicago-sky-tracker.canadacentral.cloudapp.azure.com",
      cover: "/covers/chicago-sky-tracker.png",
      accent: "#38bdf8",
      preview: { kind: "drift", image: "/covers/chicago-sky-tracker.png" },
    },
    {
      id: "footprint",
      name: "Digital Footprint",
      blurb: "A 3D globe where you pin photos and videos to the places they happened.",
      lang: "TypeScript",
      stack: "React · Supabase · three-globe",
      repo: GH + "Digital-Footprint",
      live: "https://digital-footprint-murex.vercel.app",
      cover: coverUrl("footprint"),
      accent: "#fb923c",
      preview: { kind: "globe" },
    },
    {
      id: "quiz",
      name: "Who Are You Between the Pages?",
      blurb: "A personality quiz that matches you to a character from three novels.",
      lang: "JavaScript",
      stack: "HTML · CSS · Chart.js",
      repo: GH + "Who-Are-You-Between-the-Pages",
      cover: coverUrl("quiz"),
      accent: "#f5b82e",
      preview: { kind: "pan", images: ["/covers/quiz-1.png", "/covers/quiz-2.png"] },
    },
    {
      id: "redlight",
      name: "RedLight Camera Analytics",
      blurb: "Real Chicago red light camera records, parsed and charted in the terminal.",
      lang: "C++",
      stack: "CSV parsing · OOP",
      repo: GH + "RedLight-Camera-Analytics",
      cover: coverUrl("redlight"),
      accent: "#ff453a",
      preview: { kind: "terminal", script: redlight() },
    },
    {
      id: "connect4",
      name: "Connect Four",
      blurb: "Two-player Connect Four that spots a win in every direction.",
      lang: "C++",
      stack: "2D arrays",
      repo: GH + "Connect-Four",
      cover: coverUrl("connectFour"),
      accent: "#facc15",
      preview: { kind: "terminal", script: connectFour() },
    },
    {
      id: "undone",
      name: "HalfGammon Undone",
      blurb: "Half-Gammon with an undo button, built on a hand-made linked list stack.",
      lang: "C++",
      stack: "Linked lists · Mersenne Twister",
      repo: GH + "HalfGammon-Undone",
      cover: coverUrl("halfGammonUndone"),
      accent: "#a78bfa",
      preview: { kind: "terminal", script: halfGammon(true) },
    },
    {
      id: "halfgammon",
      name: "Half-Gammon",
      blurb: "A smaller Backgammon: bumping, re-entry and bearing off on 16 spaces.",
      lang: "C++",
      stack: "Mersenne Twister",
      repo: GH + "Half-Gammon",
      cover: coverUrl("halfGammon"),
      accent: "#e9d8b4",
      preview: { kind: "terminal", script: halfGammon(false) },
    },
    {
      id: "peg",
      name: "Peg Game",
      blurb: "The triangle peg puzzle. Jump pegs until only one is left.",
      lang: "C++",
      stack: "Move validation",
      repo: GH + "Peg-Game",
      cover: coverUrl("peg"),
      accent: "#f59e0b",
      preview: { kind: "terminal", script: pegGame() },
    },
    {
      id: "house",
      name: "Display House or Art",
      blurb: "Draws a house as tall as you ask for, or a piece of original ASCII art.",
      lang: "C++",
      stack: "Loops · iomanip",
      repo: GH + "Display-House-or-Art",
      cover: coverUrl("houseOrArt"),
      accent: "#4ade80",
      preview: { kind: "terminal", script: houseOrArt() },
    },
  ];
}

/** Every image a card can show, for the loader to fetch and decode. */
export function projectAssets(projects: Project[]) {
  const covers = [...new Set(projects.map((p) => p.cover))];
  const previews = new Set<string>();
  for (const p of projects) {
    if (p.preview.kind === "pan") p.preview.images.forEach((i) => previews.add(i));
    if (p.preview.kind === "drift") previews.add(p.preview.image);
    if (p.preview.kind === "video") previews.add(p.preview.src);
  }
  return { covers, previews: [...previews].filter((p) => !covers.includes(p)) };
}
