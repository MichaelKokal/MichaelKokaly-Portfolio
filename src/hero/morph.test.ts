import { describe, expect, it } from "vitest";
import { rad } from "../math";
import { CARD_H as RING_CARD_H, CARD_W as RING_CARD_W, reelPose, reelScene } from "../ring/reel-ring";
import { CARD_COUNT, CARD_H, CARD_W, mixPose, ringIntroPose, ringSlotOf, stripMetrics, stripPose, type CardPose } from "./morph";

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
        expectSameCorners(ring, RING_CARD_W, RING_CARD_H, unified(ringIntroPose(k, formation, 1).pose), CARD_W, CARD_H);
      }
    }
  });
});

describe("ringSlotOf", () => {
  it("gives the ring's 16 slots to the 16 cards nearest the middle of the row", () => {
    const slots = Array.from({ length: CARD_COUNT }, (_, i) => ringSlotOf(i)).filter((k) => k !== null);
    expect(slots.sort((a, b) => a! - b!)).toEqual([-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7]);
    expect(ringSlotOf(0)).toBe(0);
    expect(ringSlotOf(17)).toBeNull();
  });

  it("keeps ring neighbours as neighbours in the row", () => {
    for (let i = 0; i < CARD_COUNT; i++) {
      const k = ringSlotOf(i);
      if (k === null) continue;
      const next = ringSlotOf((i + 1) % CARD_COUNT);
      if (next !== null) expect(next).toBe(k - 1);
    }
  });
});

describe("mixPose", () => {
  it("starts on the ring and ends in the row", () => {
    const a = ringIntroPose(3, 1, 1).pose, b = stripPose(31, 0, { w: 1440, h: 900, top: 92, bottom: 190 }).pose;
    expect(mixPose(a, b, 0)).toEqual(a);
    const end = mixPose(a, b, 1);
    for (const key of Object.keys(b) as (keyof CardPose)[]) expect(end[key]).toBeCloseTo(b[key]);
  });
});

describe("stripPose", () => {
  const l = { w: 1440, h: 900, top: 92, bottom: 150 };

  it("fills the space between the header and the headline", () => {
    const m = stripMetrics(l);
    expect(m.cardH).toBe(900 - 92 - 150);
    expect(m.y - m.cardH / 2).toBeCloseTo(92 - 450);
    expect(m.y + m.cardH / 2).toBeCloseTo(900 - 150 - 450);
  });

  it("lays cards out flat, one card width apart, card 0 in the middle", () => {
    const a = stripPose(0, 0, l), b = stripPose(1, 0, l), c = stripPose(33, 0, l);
    expect(a.pose.x).toBeCloseTo(0);
    expect(b.pose.x - a.pose.x).toBeCloseTo(a.pitch);
    expect(a.pose.x - c.pose.x).toBeCloseTo(a.pitch);
    for (const k of ["roll", "tilt", "spin", "yaw", "z"] as const) expect(a.pose[k]).toBe(0);
  });

  it("slides left to right as the spin goes down", () => {
    const step = 360 / CARD_COUNT;
    expect(stripPose(0, -step, l).pose.x).toBeCloseTo(stripPose(0, 0, l).pitch);
  });

  it("hides cards well off either side", () => {
    expect(stripPose(17, 0, l).visible).toBe(false);
    expect(stripPose(0, 0, l).inView).toBe(true);
  });
});
