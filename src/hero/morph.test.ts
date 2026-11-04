import { describe, expect, it } from "vitest";
import { rad, recycledIndex, wrap180 } from "../math";
import {
  CARD_COUNT, CARD_H, CARD_W, DEAL, RING, RING_OFFSET, RING_SLOTS,
  mixPose, ringDeal, ringIntroPose, ringSlotOf, stripMetrics, stripPose, type CardPose,
} from "./morph";

const slots = Array.from({ length: RING_SLOTS }, (_, i) => i);
/** A ring slot's angle once the ring has turned by `angle`. */
const slotAngle = (s: number, angle: number) => wrap180(s * (360 / RING_SLOTS) + angle);

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

describe("ringDeal", () => {
  it("puts every dealt card on one circle, facing the centre", () => {
    for (const s of slots) {
      const a = slotAngle(s, 17);
      const p = ringDeal(a, 1);
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(RING.radius, 6);
      expect(p.yaw).toBeCloseTo(a, 6);
      expect(p.appear).toBe(1);
    }
  });

  it("stacks every card at the front, hidden, before the deal", () => {
    for (const s of slots) {
      const p = ringDeal(slotAngle(s, 0), 0);
      expect(p.yaw).toBeCloseTo(-180);
      expect(p.x).toBeCloseTo(0);
      expect(p.appear).toBe(0);
    }
  });

  it("deals in order of angle, at a steady rate around the ring", () => {
    // The formation at which a card finishes is linear in how far round it sits.
    const finish = (around: number) => (around / 360) * (1 - DEAL) + DEAL;
    for (const around of [45, 90, 180, 270, 350]) {
      const angle = around - 180;
      expect(ringDeal(angle, finish(around) - 0.01).yaw).toBeLessThan(angle);
      expect(ringDeal(angle, finish(around)).yaw).toBeCloseTo(angle);
    }
  });

  it("deals both halves of the ring over equal distances", () => {
    // Mirrored cards end mirrored: the left half covers what the right half does.
    for (const a of [22.5, 45, 90, 135, 157.5]) {
      const right = ringDeal(-a, 1), left = ringDeal(a, 1);
      expect(left.x).toBeCloseTo(-right.x);
      expect(left.z).toBeCloseTo(right.z);
    }
  });

  it("never moves a card backwards during the deal", () => {
    for (const s of slots) {
      const a = slotAngle(s, 0);
      let last = -Infinity;
      for (let f = 0; f <= 1; f += 0.01) {
        const yaw = ringDeal(a, f).yaw;
        expect(yaw).toBeGreaterThanOrEqual(last - 1e-9);
        last = yaw;
      }
    }
  });
});

describe("ringIntroPose", () => {
  it("puts each card exactly where a 270px ring card would be", () => {
    // The ring was designed with 270 x 480 cards; the shared card is 180 x 320, scaled up to match.
    const ringW = RING.cardW, ringH = (RING.cardW / 9) * 16;
    for (const k of [-8, -3, 0, 2, 7]) {
      for (const formation of [0.2, 0.6, 1]) {
        const p = ringDeal(k * 22.5, formation);
        const ring = chain(T(RING_OFFSET.x, RING_OFFSET.y, 0), RZ(RING.roll), RX(RING.tilt), T(p.x, 0, p.z), RY(p.yaw), S(RING.scale));
        expectSameCorners(ring, ringW, ringH, unified(ringIntroPose(k, formation, 1).pose), CARD_W, CARD_H);
      }
    }
  });
});

describe("recycling", () => {
  it("keeps neighbouring cards on neighbouring projects at any angle", () => {
    const items = 9;
    for (const angle of [0, 33, 400, -777]) {
      const cards = slots
        .map((s) => ({ a: slotAngle(s, angle), item: recycledIndex(s, RING_SLOTS, s * 22.5 + angle, items) }))
        .sort((p, q) => p.a - q.a);
      for (let i = 1; i < cards.length; i++) {
        expect((cards[i].item - cards[i - 1].item + items) % items).toBe(1);
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
