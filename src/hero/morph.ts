import { lerp, mod, rad } from "../math";
import { CARD_W, REEL_SLOTS, reelPose, reelScene } from "../ring/reel-ring";
import { WHEEL_CARDS, WHEEL_CARD_W, dealPose } from "../wheel/deal-wheel";

/**
 * One card pose both layouts can be written in, so a card can travel from its
 * place on the ring to its place on the wheel:
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
export const WHEEL_PERSPECTIVE = 1800;
const WHEEL_TILT = 12;
const WHEEL_LIFT_Y = 50;
const WHEEL_GROW = 1.14;

/**
 * Which ring slot a wheel card plays during the intro, or null if it sits the
 * intro out. The 16 cards nearest the top of the wheel make the ring, in the
 * same order, so neighbours stay neighbours.
 */
export function ringSlotOf(i: number, count = WHEEL_CARDS): number | null {
  const offset = i <= count / 2 ? i : i - count; // signed distance from the top card
  const k = 0 - offset; // the ring counts the other way round (and 0, not -0)
  return k >= -REEL_SLOTS / 2 && k < REEL_SLOTS / 2 ? k : null;
}

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
    x: x2 * fit,
    y: y2 * fit,
    z: z1 * fit,
    roll: scene.roll,
    tilt: scene.tilt,
    spin: 0,
    yaw: p.yaw,
    // Ring cards are 270px wide; the shared card is laid out at the wheel's size.
    scale: p.scale * (CARD_W / WHEEL_CARD_W) * fit,
  };
  return { pose, appear: p.appear };
}

/** A card on the resting wheel. */
export function wheelRestPose(i: number, spin: number, fit: number) {
  const d = dealPose(i, 1, 1, spin);
  const th = rad(d.angle), ph = rad(WHEEL_TILT);
  const S = fit * WHEEL_GROW;
  // Pivot, rotate, push out...
  const lx = -d.reach * Math.sin(th);
  const ly = d.pivot + d.reach * Math.cos(th);
  const lz = d.depth;
  // ...then the scene's tip back, scale and lift.
  const pose: CardPose = {
    x: S * lx,
    y: WHEEL_LIFT_Y + S * (ly * Math.cos(ph) - lz * Math.sin(ph)),
    z: S * (ly * Math.sin(ph) + lz * Math.cos(ph)),
    roll: 0,
    tilt: WHEEL_TILT,
    spin: d.angle,
    yaw: d.flip,
    scale: S * d.scale,
  };
  return { pose, visible: d.visible, away: d.away };
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

export const scenePerspective = (m: number) => lerp(RING_PERSPECTIVE, WHEEL_PERSPECTIVE, m);

const f = (n: number) => Math.round(n * 100) / 100;

export function poseTransform(p: CardPose) {
  return (
    `translate3d(${f(p.x)}px,${f(p.y)}px,${f(p.z)}px)` +
    ` rotateZ(${f(p.roll)}deg) rotateX(${f(p.tilt)}deg) rotateZ(${f(p.spin)}deg) rotateY(${f(p.yaw)}deg)` +
    ` scale(${Math.round(p.scale * 1000) / 1000})`
  );
}
