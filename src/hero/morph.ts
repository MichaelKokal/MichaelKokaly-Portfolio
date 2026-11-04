import { clamp01, lerp, mod, rad, wrap180 } from "../math";

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

const RING_PERSPECTIVE = 1000;
const ROW_PERSPECTIVE = 1800;

/* ---------- The intro ring ---------- */

/** How many cards make the intro ring. */
export const RING_SLOTS = 16;
/** The ring, tilted back and rolled to a dutch angle. Its cards are drawn 270px wide. */
export const RING = { radius: 460, tilt: -22, roll: -20, scale: 0.52, cardW: 270 };
/** Share of the formation each card spends moving. The rest is stagger. */
export const DEAL = 0.3;
/** How deep the waiting stack is, front card to back. */
const STACK_DEPTH = 80;

/**
 * Where the intro ring sits, from the middle of the screen. Its front card comes
 * toward the camera and lands low and right, so the ring is lifted and nudged left
 * to keep it on screen and clear of the loading counter.
 */
export const RING_OFFSET = { x: 0, y: -100 };

const TILT_SIN = Math.sin(rad(RING.tilt)), TILT_COS = Math.cos(rad(RING.tilt));
const ROLL_SIN = Math.sin(rad(RING.roll)), ROLL_COS = Math.cos(rad(RING.roll));

/**
 * Which ring slot a card plays during the intro, or null if it sits the intro
 * out. The 16 cards nearest the middle of the row make the ring, in the same
 * order, so neighbours stay neighbours.
 */
export function ringSlotOf(i: number, count = CARD_COUNT): number | null {
  const offset = i <= count / 2 ? i : i - count; // signed distance from the middle card
  const k = 0 - offset; // the ring counts the other way round (and 0, not -0)
  return k >= -RING_SLOTS / 2 && k < RING_SLOTS / 2 ? k : null;
}

/**
 * The deal, on the flat ring before its tilt. `angle` is the card's place on the
 * ring: 0 is the far centre, ±180 is nearest the camera. Undealt cards wait at
 * -180 (the front) and swing round to their place, each in its own slice of the
 * formation.
 */
export function ringDeal(angle: number, formation: number) {
  const around = mod(angle + 180, 360);
  const order = around / 360;
  const t = clamp01((formation - order * (1 - DEAL)) / DEAL);
  const dealt = 1 - (1 - t) ** 3;
  const yaw = -180 + around * dealt;
  const r = rad(yaw);
  // Waiting cards sit just inside each other so the stack reads as one card.
  // About 5px apart: any closer and the browser cannot tell which overlapping
  // card is in front, so their monograms flicker through each other.
  const radius = RING.radius - (1 - dealt) * order * STACK_DEPTH;
  return { x: -Math.sin(r) * radius, z: -Math.cos(r) * radius, yaw, appear: Math.min(1, t * 2.5) };
}

/** A card on the small tilted ring of the intro. */
export function ringIntroPose(k: number, formation: number, fit: number) {
  const p = ringDeal(wrap180(k * (360 / RING_SLOTS)), formation);
  // The ring's tilt, then the dutch-angle roll, applied to the card's position.
  const y1 = -p.z * TILT_SIN;
  const z1 = p.z * TILT_COS;
  const x2 = p.x * ROLL_COS - y1 * ROLL_SIN;
  const y2 = p.x * ROLL_SIN + y1 * ROLL_COS;
  const pose: CardPose = {
    x: (x2 + RING_OFFSET.x) * fit,
    y: (y2 + RING_OFFSET.y) * fit,
    z: z1 * fit,
    roll: RING.roll,
    tilt: RING.tilt,
    spin: 0,
    yaw: p.yaw,
    // The shared card is laid out smaller than a ring card.
    scale: RING.scale * (RING.cardW / CARD_W) * fit,
  };
  return { pose, appear: p.appear };
}

/* ---------- The row ---------- */

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
