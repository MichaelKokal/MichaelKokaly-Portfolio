import { clamp01, lerp, mod, outCubic, rad, span, wrap180 } from "../math";
import { DEAL, CARD_W as RING_CARD_W, REEL_SLOTS, reelPose, reelScene, type Scene } from "../ring/reel-ring";

/** How many cards there are. Fewer projects than this just repeat. */
export const CARD_COUNT = 34;
/** Cards are laid out at this size (9:16) and scaled to fit the row. */
export const CARD_W = 180;
export const CARD_H = 320;

/**
 * One card pose both the ring and the row can be written in, so a card can
 * travel from its place on the ring to its place in the row:
 *   translate3d(x, y, z) rotateZ(roll) rotateX(tilt) rotateZ(spin) rotateY(yaw) scale(scale)
 */
export type CardPose = {
  x: number;
  y: number;
  z: number;
  roll: number;
  tilt: number;
  spin: number;
  yaw: number;
  scale: number;
};

export const RING_PERSPECTIVE = 1000;
export const ROW_PERSPECTIVE = 1800;

/** The intro deck and ring hold one card per project, up to this many. */
export const MAX_RING = 20;

/** How many cards make the deck and the ring for this many projects. */
export const ringCount = (projects: number) => Math.max(1, Math.min(projects, MAX_RING));

/**
 * Which ring slot a card plays during the intro, or null if it sits the intro
 * out. The `slots` cards nearest the middle of the row make the ring, in the
 * same order, so neighbours stay neighbours.
 */
export function ringSlotOf(i: number, slots = REEL_SLOTS, count = CARD_COUNT): number | null {
  const offset = i <= count / 2 ? i : i - count; // signed distance from the middle card
  const k = 0 - offset; // the ring counts the other way round (and 0, not -0)
  return k >= -slots / 2 && k < slots / 2 ? k : null;
}

/**
 * Where the intro ring sits, from the middle of the screen. Its front card comes
 * toward the camera and lands low and right, so the ring is lifted and nudged left
 * to keep it on screen and clear of the loading counter.
 */
export const RING_OFFSET = { x: 0, y: -100 };

/*
 * The intro in three parts, counted in shares of the formation: the cards land
 * on a deck one at a time, the full deck rests, then cards come off the top and
 * are dealt round the ring.
 */
export const DECK_LAND = 0.3;
export const DECK_REST = 0.08;
/** Share of the formation one card takes to drop onto the deck. */
const DROP = 0.08;
/** Share of a card's deal spent coming off the deck and onto the ring. */
const LIFT = 0.35;
/** Each card sits this many px higher than the one under it, so the deck shows its thickness. */
const DECK_STEP = 4;
/** And this far in front of it. Any closer and overlapping cards flicker through each other. */
const DECK_DEPTH = 6;
const DECK_SCALE = 0.85;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** A card resting on the deck, back up. Level 0 is the top card. */
export function deckPose(level: number, slots: number, fit: number): CardPose {
  const under = slots - 1 - level; // cards below this one
  // A small fixed wobble per card, so the deck looks stacked by hand.
  const wobble = ((level * 0.618034) % 1) * 2 - 1;
  return {
    x: (RING_OFFSET.x + wobble * 4) * fit,
    y: (RING_OFFSET.y - under * DECK_STEP) * fit,
    z: under * DECK_DEPTH,
    roll: wobble * 3,
    tilt: 0,
    spin: 0,
    yaw: -180, // back toward the camera, the same way it starts its swing round the ring
    scale: DECK_SCALE * fit,
  };
}

/** A card standing at `angle` on the small tilted ring, in screen terms. */
function ringPoint(angle: number, scene: Scene, fit: number): CardPose {
  const p = reelPose(angle, 1, scene);
  const t = rad(scene.tilt), r = rad(scene.roll);
  // The ring's tilt, then the dutch-angle roll, applied to the card's position.
  const y1 = -p.z * Math.sin(t);
  const z1 = p.z * Math.cos(t);
  const x2 = p.x * Math.cos(r) - y1 * Math.sin(r);
  const y2 = p.x * Math.sin(r) + y1 * Math.cos(r);
  return {
    x: (x2 + RING_OFFSET.x) * fit,
    y: (y2 + RING_OFFSET.y) * fit,
    z: z1 * fit,
    roll: scene.roll,
    tilt: scene.tilt,
    spin: 0,
    yaw: p.yaw,
    // Ring cards are 270px wide; the shared card is laid out smaller.
    scale: p.scale * (RING_CARD_W / CARD_W) * fit,
  };
}

/**
 * A card during the intro: dropping onto the deck, resting on it, or coming
 * off the top and swinging round to slot `k` of a ring of `slots` cards.
 * Cards leave the deck in the order they go round the ring, starting at the
 * front, so the top card is always the next one dealt.
 */
export function ringIntroPose(k: number, slots: number, formation: number, fit: number) {
  const scene = reelScene(0);
  const step = 360 / slots;
  const around = mod(k * step + 180, 360); // degrees from the front of the ring
  const level = Math.round(around / step) % slots;
  const deck = deckPose(level, slots, fit);

  // The bottom card lands first.
  const landAt = ((slots - 1 - level) / slots) * (DECK_LAND - DROP);
  const visible = formation > landAt;
  // Only the very first card fades in, from the white page. Every card after it
  // arrives solid: a card fading in over the dark deck showed as a white flash.
  const fade = level === slots - 1 ? span(formation, 0, 0.05) : 1;

  const deal = span(formation, DECK_LAND + DECK_REST, 1);
  const t = clamp01((deal - (level / slots) * (1 - DEAL)) / DEAL);
  if (t <= 0) {
    const land = outCubic(span(formation, landAt, landAt + DROP));
    const from = { ...deck, y: deck.y - 50 * fit, scale: deck.scale * 1.08, roll: deck.roll + 5 };
    return { pose: mixPose(from, deck, land), visible, fade };
  }
  const placed = -180 + around * outCubic(t);
  const pose = mixPose(deck, ringPoint(placed, scene, fit), smooth(span(t, 0, LIFT)));
  return { pose, visible, fade };
}

export type StripLayout = {
  /** Frame size in px. */
  w: number;
  h: number;
  /** Space kept clear above (name and links) and below (the bar). */
  top: number;
  bottom: number;
};

/** The card size and spacing for a flat row that fills the space it is given. */
export function stripMetrics(l: StripLayout) {
  // As tall as the space allows, but never wider than most of the screen.
  const cardH = Math.max(200, Math.min(l.h - l.top - l.bottom, ((l.w * 0.78) / CARD_W) * CARD_H));
  const scale = cardH / CARD_H;
  const cardW = CARD_W * scale;
  const pitch = cardW * 1.1;
  const y = (l.top + (l.h - l.bottom)) / 2 - l.h / 2;
  return { cardW, cardH, scale, pitch, y };
}

/**
 * A card in the flat row. The row is a circle of cards unrolled: its position
 * is counted in degrees, one card step being 360 / CARD_COUNT, so cards that
 * leave one side come back on the other and can swap projects off screen.
 */
export function stripPose(i: number, spin: number, l: StripLayout) {
  const m = stripMetrics(l);
  const home = wrap180(i * (360 / CARD_COUNT) - spin);
  const x = (home / (360 / CARD_COUNT)) * m.pitch;
  const pose: CardPose = { x, y: m.y, z: 0, roll: 0, tilt: 0, spin: 0, yaw: 0, scale: m.scale };
  return {
    pose,
    visible: Math.abs(x) < l.w / 2 + m.cardW * 0.6,
    /** Fully on screen. */
    inView: Math.abs(x) + m.cardW / 2 < l.w / 2,
    pitch: m.pitch,
  };
}

export function mixPose(a: CardPose, b: CardPose, m: number): CardPose {
  return {
    x: lerp(a.x, b.x, m),
    y: lerp(a.y, b.y, m),
    z: lerp(a.z, b.z, m),
    roll: lerp(a.roll, b.roll, m),
    tilt: lerp(a.tilt, b.tilt, m),
    spin: lerp(a.spin, b.spin, m),
    yaw: lerp(a.yaw, b.yaw, m),
    scale: lerp(a.scale, b.scale, m),
  };
}

export const scenePerspective = (m: number) => lerp(RING_PERSPECTIVE, ROW_PERSPECTIVE, m);

const f = (n: number) => Math.round(n * 100) / 100;

export function poseTransform(p: CardPose) {
  return (
    `translate3d(${f(p.x)}px,${f(p.y)}px,${f(p.z)}px)` +
    ` rotateZ(${f(p.roll)}deg) rotateX(${f(p.tilt)}deg) rotateZ(${f(p.spin)}deg) rotateY(${f(p.yaw)}deg)` +
    ` scale(${Math.round(p.scale * 1000) / 1000})`
  );
}
