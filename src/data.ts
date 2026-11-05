import type { DemoKind } from "./PhoneShot";

const GH = "https://github.com/MichaelKokal/";

export const links = {
  email: "mkokaly12@gmail.com",
  github: "https://github.com/MichaelKokal",
  linkedin: "https://www.linkedin.com/in/michael-kokaly",
  resume: "/Michael-Kokaly-Resume.pdf",
};

export type Step = { title: string; note: string };
export type Stat = { value: string; label: string };

export type Featured = {
  id: string;
  name: string;
  tag?: string;
  kind: string;
  when: string;
  headline: string;
  body: string[];
  stack: string[];
  flow?: { steps: Step[]; caption: string };
  stats?: Stat[];
  image?: string;
  demo?: DemoKind;
  repo: string;
  live?: string;
};

/** The strongest projects first. */
export const featured: Featured[] = [
  {
    id: "sky",
    name: "Chicago Sky Tracker",
    tag: "Live",
    kind: "Full-stack web app",
    when: "Oct 2026",
    headline: "Every plane over Chicago, on a map, as it flies.",
    body: [
      "A Spring Boot service signs in to the OpenSky API with OAuth 2.0 every 30 seconds and saves each aircraft position to PostgreSQL. A React and Leaflet map draws the planes live, with flight paths, an altitude profile, playback, airport boards and alerts for emergency squawk codes.",
      "The \"what flew over my house\" search uses a GiST geospatial index so it stays fast over hundreds of thousands of rows. A nightly job thins out old positions, and every push to main is tested and deployed to an Azure VM by GitHub Actions.",
    ],
    stack: ["Java", "Spring Boot", "PostgreSQL", "Flyway", "React", "Leaflet", "Azure", "GitHub Actions"],
    flow: {
      steps: [
        { title: "OpenSky", note: "OAuth, every 30 s" },
        { title: "Poller", note: "Spring Boot" },
        { title: "Postgres", note: "GiST index" },
        { title: "REST API", note: "flights, paths, search" },
        { title: "Map", note: "React + Leaflet" },
      ],
      caption: "How a plane's position gets from the sky to the screen.",
    },
    stats: [
      { value: "260K+", label: "Positions a day" },
      { value: "30 s", label: "Refresh" },
      { value: "~4×", label: "Less storage" },
      { value: "CI/CD", label: "Deploy on push" },
    ],
    image: "/covers/chicago-sky-tracker.webp",
    demo: "sky",
    repo: GH + "Chicago-Sky-Tracker",
    live: "https://chicago-sky-tracker.canadacentral.cloudapp.azure.com",
  },
  {
    id: "recall",
    name: "Recall",
    kind: "Database · Go",
    when: "Nov 2026",
    headline: "A Redis-compatible key-value server, built from scratch.",
    body: [
      "Recall speaks the Redis wire protocol (RESP) over TCP, so redis-cli and existing Redis clients work with it as-is. It supports pipelining, about 25 string, key and expiry commands, and the same sampled expiry sweep Redis uses.",
      "I profiled it with pprof and rebuilt the hot path: a parser that allocates nothing per request and a keyspace split into 256 locked shards. Pipelined writes got 2.8× faster. CI runs the race detector on every push.",
    ],
    stack: ["Go", "TCP", "RESP", "Concurrency", "pprof", "GitHub Actions"],
    flow: {
      steps: [
        { title: "Client", note: "redis-cli, any driver" },
        { title: "Parse", note: "zero-alloc RESP" },
        { title: "Shard", note: "1 of 256 locks" },
        { title: "Execute", note: "SET, GET, INCR…" },
        { title: "Expire", note: "sampled sweep" },
      ],
      caption: "How one command moves through Recall.",
    },
    stats: [
      { value: "1.37M", label: "SET/sec" },
      { value: "0.44 ms", label: "p50 latency" },
      { value: "2.8×", label: "Faster writes" },
      { value: "3.3×", label: "Faster INCR" },
    ],
    repo: GH + "Recall",
  },
  {
    id: "footprint",
    name: "Digital Footprint",
    tag: "Live",
    kind: "Full-stack web app",
    when: "Oct 2026",
    headline: "A 3D globe of the places you've been.",
    body: [
      "Sign in, drop a pin anywhere on a spinning globe, and attach the photos and videos from that trip. Visited countries fill in, a timeline lists every trip, and on phones the details slide up in a swipeable sheet.",
      "Data lives in Supabase. I wrote the PostgreSQL schema with row-level security so each person can only ever read their own memories and uploads.",
    ],
    stack: ["TypeScript", "React", "Three.js", "Supabase", "PostgreSQL", "Vercel"],
    flow: {
      steps: [
        { title: "Sign in", note: "Supabase Auth" },
        { title: "Pin", note: "place + lat/lng" },
        { title: "Upload", note: "photos, video" },
        { title: "Guard", note: "row-level security" },
        { title: "Globe", note: "three-globe" },
      ],
      caption: "From a trip to a pin on the globe.",
    },
    image: "/covers/digital-footprint.webp",
    demo: "globe",
    repo: GH + "Digital-Footprint",
    live: "https://digital-footprint-murex.vercel.app",
  },
  {
    id: "momentum",
    name: "MOMENTUM",
    tag: "Live",
    kind: "Daily tracker",
    when: "Nov 2026",
    headline: "Workouts, tasks, water and food in one daily log.",
    body: [
      "Search more than 13,000 foods from USDA FoodData Central to log calories and macros. A build script turns the raw USDA data into one small file the page loads, so the app needs no server.",
    ],
    stack: ["JavaScript", "HTML", "CSS", "USDA FoodData Central"],
    stats: [
      { value: "13K+", label: "USDA foods" },
      { value: "0", label: "Servers" },
    ],
    image: "/covers/momentum.webp",
    demo: "momentum",
    repo: GH + "MOMENTUM",
    live: "https://michaelkokal.github.io/MOMENTUM/",
  },
];

export type Small = { name: string; blurb: string; lang: string; repo: string };

export const more: Small[] = [
  { name: "RedLight Camera Analytics", blurb: "Chicago red light camera records, parsed and charted in the terminal.", lang: "C++", repo: GH + "RedLight-Camera-Analytics" },
  { name: "Who Are You Between the Pages?", blurb: "A personality quiz that matches you to a character from three novels.", lang: "JavaScript", repo: GH + "Who-Are-You-Between-the-Pages" },
  { name: "HalfGammon Undone", blurb: "Half-Gammon with an undo button, built on a hand-made linked list stack.", lang: "C++", repo: GH + "HalfGammon-Undone" },
  { name: "Connect Four", blurb: "Two-player Connect Four that checks for a win in every direction.", lang: "C++", repo: GH + "Connect-Four" },
  { name: "Half-Gammon", blurb: "A smaller Backgammon with bumping, re-entry and bearing off on 16 spaces.", lang: "C++", repo: GH + "Half-Gammon" },
  { name: "Peg Game", blurb: "The triangle peg puzzle. Jump pegs until only one is left.", lang: "C++", repo: GH + "Peg-Game" },
];

export type Job = { when: string; where: string; company: string; role: string; now?: boolean; points: string[] };

export const jobs: Job[] = [
  {
    when: "May 2026 – Present",
    where: "Remote",
    company: "Mylon Education",
    role: "Software Engineering Intern",
    now: true,
    points: [
      "Building an AI assistant (Python, FastAPI, LlamaIndex) that answers staff questions about university HR policies and cites the exact document and page.",
      "Built the retrieval pipeline end to end: PDF, DOCX and HTML ingestion, chunking, embeddings, and semantic search with pgvector in PostgreSQL.",
      "Kept each school's data separate with JWT authentication and Postgres row-level security.",
      "Wrote the technical spec and 6 architecture decision records the team adopted as its build plan.",
    ],
  },
  {
    when: "Jun 2026 – Aug 2026",
    where: "Bridgeview, IL",
    company: "SYSERCO",
    role: "Energy Systems Intern",
    points: [
      "Rotated through 8 departments, from engineering and panel building to sales and estimating, following projects from bid to install.",
      "Shadowed engineers through control panel design, fabrication and field startup of building control systems.",
    ],
  },
  {
    when: "May 2021 – Nov 2026",
    where: "Elmhurst, IL",
    company: "Elmhurst Park District",
    role: "Guest Services Manager",
    points: [
      "Led and trained a team of 10–15 at a facility serving 400+ visitors a day.",
      "Cut guest wait times by 25% by reworking staff rotations and concession workflows.",
    ],
  },
];

export const skills: [string, string[]][] = [
  ["Languages", ["Java", "Python", "TypeScript", "Go", "SQL", "C++", "C", "HTML/CSS"]],
  ["Backend", ["Spring Boot", "FastAPI", "Node", "Express", "REST APIs", "OAuth 2.0", "JWT"]],
  ["Frontend", ["React", "Vite", "Leaflet", "Three.js"]],
  ["Data & AI", ["PostgreSQL", "pgvector", "Supabase", "LlamaIndex", "Flyway"]],
  ["Cloud & DevOps", ["Azure", "Vercel", "GitHub Actions", "Linux", "Caddy", "Git"]],
];
