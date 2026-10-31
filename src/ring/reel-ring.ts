import { clamp01, lerp, mod, rad } from "../math";

export const REEL_SLOTS = 16;
export const CARD_W = 270;
export const CARD_H = 480;
/** Share of the formation each card spends moving. The rest is stagger. */
export const DEAL = 0.3;
/** How deep the waiting stack is, front card to back. */
export const STACK_DEPTH = 80;

/** A card's angle on the ring. 0 is the far centre, ±180 is nearest the camera. */
export function reelAngle(slot: number, angle: number, slots = REEL_SLOTS) {
  return mod(slot * (360 / slots) + angle + 180, 360) - 180;
}

export type Scene = {
  radius: number;
  perspective: number;
  tilt: number;
  roll: number;
  scale: number;
  /** Screen-space offset that keeps the back of the ring on one smooth path. */
  anchor: number;
};

const START = { radius: 460, perspective: 1000, tilt: -22, roll: -20, scale: 0.52 };
const END = { radius: 1800, tilt: 0, roll: 0, scale: 2.3 };

function rawScene(expansion: number, camera: number) {
  const e = clamp01(expansion);
  return {
    radius: lerp(START.radius, END.radius, e),
    perspective: lerp(START.perspective, camera, e),
    tilt: lerp(START.tilt, END.tilt, e),
    roll: lerp(START.roll, END.roll, e),
    // Squared: cards stay small for the first half, then swell as the camera drops in.
    scale: lerp(START.scale, END.scale, e * e),
  };
}

/** Where the far centre of the ring lands on screen, vertically. */
export function farScreenY(s: { radius: number; perspective: number; tilt: number }) {
  const t = rad(s.tilt);
  const y = s.radius * Math.sin(t);
  const z = -s.radius * Math.cos(t);
  return (y * s.perspective) / (s.perspective - z);
}

export function reelScene(expansion: number, camera = 450): Scene {
  const s = rawScene(expansion, camera);
  // As the tilt flattens, the far side would drift up and back down. Pin it to a
  // straight line between its start and end positions instead.
  const from = farScreenY(rawScene(0, camera));
  const to = farScreenY(rawScene(1, camera));
  const anchor = lerp(from, to, clamp01(expansion)) - farScreenY(s);
  return { ...s, anchor };
}

export type Pose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  appear: number;
  behindCamera: boolean;
};

/**
 * The whole animation. Undealt cards wait at -180 (the front) and swing round
 * to their real angle, each in its own slice of the formation.
 */
export function reelPose(angle: number, formation: number, scene: Scene): Pose {
  const around = mod(angle + 180, 360);
  const order = around / 360;
  const t = clamp01((formation - order * (1 - DEAL)) / DEAL);
  const dealt = 1 - (1 - t) ** 3;
  const placed = -180 + around * dealt;
  const r = rad(placed);
  // Waiting cards sit just inside each other so the stack reads as one card.
  // About 5px apart: any closer and the browser cannot tell which overlapping
  // card is in front, so their monograms flicker through each other.
  const radius = scene.radius - (1 - dealt) * order * STACK_DEPTH;
  const x = -Math.sin(r) * radius;
  const z = -Math.cos(r) * radius;
  // Depth toward the camera after the ring's tilt, plus the card's own half width
  // where it turns side-on.
  const reach = z * Math.cos(rad(scene.tilt)) + Math.abs(Math.sin(r)) * (CARD_W / 2) * scene.scale;
  return {
    x,
    y: 0,
    z,
    yaw: placed,
    scale: scene.scale,
    appear: Math.min(1, t * 2.5),
    behindCamera: reach > scene.perspective - 40,
  };
}
