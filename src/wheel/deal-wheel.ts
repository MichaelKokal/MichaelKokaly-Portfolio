import { outCubic, span, wrap180 } from "../math";

export const WHEEL_CARDS = 34;
/** Cards are laid out at their resting size, so text is crisp once the wheel settles. */
export const WHEEL_CARD_W = 180;
export const WHEEL_CARD_H = 320;
/** Cards further than this from the top are never on screen. */
export const VISIBLE_DEG = 105;
/** The wheel's own drift, degrees per second, to the left. */
export const DRIFT = 7;

export function wheelScene(lift: number) {
  return {
    // Bigger cards need a bigger wheel, and a bigger wheel needs a lower pivot to stay in frame.
    radius: 580 + 430 * lift,
    pivot: 500 + 314 * lift,
    // 1 + .35 * lift, relative to the resting size.
    grow: (1 + 0.35 * lift) / 1.35,
    // Left: the same way the wheel drifts afterwards.
    kick: -28 * lift,
  };
}

export type WheelPose = {
  home: number;
  away: number;
  p: number;
  visible: boolean;
  pivot: number;
  depth: number;
  angle: number;
  reach: number;
  flip: number;
  scale: number;
};

export function dealPose(i: number, deal: number, lift: number, spin: number, count = WHEEL_CARDS): WheelPose {
  const s = wheelScene(lift);
  const step = 360 / count;
  // 0 is straight up; -180..180 either side.
  const home = wrap180(i * step - spin + s.kick);
  const away = Math.abs(home);
  // 0 at the top, 1 at the edges: the top card is dealt first, then both sides at once.
  const order = Math.min(away, 100) / 100;
  const p = outCubic(span(deal, order * 0.6, order * 0.6 + 0.4));
  return {
    home,
    away,
    p,
    visible: p > 0 && away < VISIBLE_DEG,
    pivot: s.pivot,
    depth: -away * 0.5, // the card nearest the top sits in front of both neighbours
    angle: home + (1 - p) * 70, // starts 70° right of home, sweeps left into place
    reach: -s.radius * p + (1 - p) * 140, // out to the rim, up from below the screen
    flip: (1 - p) * 180, // face up as it lands
    scale: (0.7 + 0.3 * p) * s.grow,
  };
}

const f = (n: number) => Math.round(n * 100) / 100;

/** Go to the pivot, rotate around it, push out along the rotated axis. */
export function wheelTransform(pose: WheelPose) {
  return (
    `translate3d(0,${f(pose.pivot)}px,${f(pose.depth)}px)` +
    ` rotateZ(${f(pose.angle)}deg)` +
    ` translate3d(0,${f(pose.reach)}px,0)` +
    ` rotateY(${f(pose.flip)}deg)` +
    ` scale(${Math.round(pose.scale * 1000) / 1000})`
  );
}
