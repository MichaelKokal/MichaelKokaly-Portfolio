import { describe, expect, it } from "vitest";
import { rad } from "../math";
import { CARD_H, CARD_W, reelPose, reelScene } from "../ring/reel-ring";
import { WHEEL_CARDS, WHEEL_CARD_H, WHEEL_CARD_W, dealPose } from "../wheel/deal-wheel";
import { mixPose, ringIntroPose, ringSlotOf, wheelRestPose, type CardPose } from "./morph";

// A tiny CSS transform model: 4x4 matrices, y pointing down, applied right to left.
type M = number[][];
const mul = (a: M, b: M): M => a.map((r) => b[0].map((_, j) => r.reduce((s, v, k) => s + v * b[k][j], 0)));
const T = (x: number, y: number, z: number): M => [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
const S = (s: number): M => [[s, 0, 0, 0], [0, s, 0, 0], [0, 0, s, 0], [0, 0, 0, 1]];
const RX = (d: number): M => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1]]; };
const RY = (d: number): M => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]]; };
const RZ = (d: number): M => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; };
const chain = (...ms: M[]) => ms.reduce(mul);
const apply = (m: M, [x, y]: number[]) => [0, 1, 2].map((r) => m[r][0] * x + m[r][1] * y + m[r][3]);
const corners = (w: number, h: number) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
const unified = (p: CardPose) => chain(T(p.x, p.y, p.z), RZ(p.roll), RX(p.tilt), RZ(p.spin), RY(p.yaw), S(p.scale));

function expectSameCorners(a: M, aw: number, ah: number, b: M, bw: number, bh: number) {
  const ca = corners(aw, ah).map((c) => apply(a, c));
  const cb = corners(bw, bh).map((c) => apply(b, c));
  ca.forEach((p, i) => p.forEach((v, j) => expect(v).toBeCloseTo(cb[i][j], 6)));
}

describe("ringIntroPose", () => {
  it("puts each card exactly where the ring hero drew it", () => {
    const scene = reelScene(0);
    for (const k of [-8, -3, 0, 2, 7]) {
      for (const formation of [0.2, 0.6, 1]) {
        const a = k * 22.5;
        const p = reelPose(a, formation, scene);
        const ring = chain(RZ(scene.roll), RX(scene.tilt), T(p.x, p.y, p.z), RY(p.yaw), S(p.scale));
        expectSameCorners(ring, CARD_W, CARD_H, unified(ringIntroPose(k, formation, 1).pose), WHEEL_CARD_W, WHEEL_CARD_H);
      }
    }
  });
});

describe("wheelRestPose", () => {
  it("puts each card exactly where the wheel hero drew it", () => {
    for (const i of [0, 3, 30]) {
      for (const spin of [0, 41]) {
        const d = dealPose(i, 1, 1, spin);
        const stage = chain(T(0, 50, 0), RX(12), S(1.14));
        const card = chain(T(0, d.pivot, d.depth), RZ(d.angle), T(0, d.reach, 0), RY(d.flip), S(d.scale));
        expectSameCorners(mul(stage, card), WHEEL_CARD_W, WHEEL_CARD_H, unified(wheelRestPose(i, spin, 1).pose), WHEEL_CARD_W, WHEEL_CARD_H);
      }
    }
  });
});

describe("ringSlotOf", () => {
  it("gives the ring's 16 slots to the 16 cards nearest the top of the wheel", () => {
    const slots = Array.from({ length: WHEEL_CARDS }, (_, i) => ringSlotOf(i)).filter((k) => k !== null);
    expect(slots.sort((a, b) => a! - b!)).toEqual([-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7]);
    expect(ringSlotOf(0)).toBe(0);
    expect(ringSlotOf(17)).toBeNull();
  });

  it("keeps ring neighbours as wheel neighbours, and every ring card lands in view", () => {
    for (let i = 0; i < WHEEL_CARDS; i++) {
      const k = ringSlotOf(i);
      if (k === null) continue;
      expect(wheelRestPose(i, 0, 1).visible).toBe(true);
      const next = ringSlotOf((i + 1) % WHEEL_CARDS);
      if (next !== null) expect(next).toBe(k - 1);
    }
  });
});

describe("mixPose", () => {
  it("starts on the ring and ends on the wheel", () => {
    const a = ringIntroPose(3, 1, 1).pose, b = wheelRestPose(31, 0, 1).pose;
    expect(mixPose(a, b, 0)).toEqual(a);
    const end = mixPose(a, b, 1);
    for (const key of Object.keys(b) as (keyof CardPose)[]) expect(end[key]).toBeCloseTo(b[key]);
  });
});
