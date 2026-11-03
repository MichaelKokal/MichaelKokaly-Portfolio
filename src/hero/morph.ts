import { lerp, mod, rad, wrap180 } from "../math";
import { CARD_W as RING_CARD_W, REEL_SLOTS, reelPose, reelScene } from "../ring/reel-ring";

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

/**
 * Which ring slot a card plays during the intro, or null if it sits the intro
 * out. The 16 cards nearest the middle of the row make the ring, in the same
 * order, so neighbours stay neighbours.
 */
export function ringSlotOf(i: number, count = CARD_COUNT): number | null {
  const offset = i <= count / 2 ? i : i - count; // signed distance from the middle card
  const k = 0 - offset; // the ring counts the other way round (and 0, not -0)
  return k >= -REEL_SLOTS / 2 && k < REEL_SLOTS / 2 ? k : null;
}

/**
 * Where the intro ring sits, from the middle of the screen. Its front card comes
 * toward the camera and lands low and right, so the ring is lifted and nudged left
 * to keep it on screen and clear of the loading counter.
 */
export const RING_OFFSET = { x: -70, y: -110 };

/** A card on the small tilted ring of the intro. */
export function ringIntroPose(k: number, formation: number, fit: number) {
  const scene = reelScene(0);
  const a = mod(k * (360 / REEL_SLOTS) + 180, 360) - 180;
  const p = reelPose(a, formation, scene);
  const t = rad(scene.tilt), r = rad(scene.roll);
  // The ring's tilt, then the dutch-angle roll, applied to the card's position.
  const y1 = -p.z * Math.sin(t);
  const z1 = p.z * Math.cos(t);
  const x2 = p.x * Math.cos(r) - y1 * Math.sin(r);
  const y2 = p.x * Math.sin(r) + y1 * Math.cos(r);
  const pose: CardPose = {
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
  return { pose, appear: p.appear };
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
