import { describe, expect, it } from "vitest";
import { rad } from "../math";
import { CARD_H as RING_CARD_H, CARD_W as RING_CARD_W, reelPose } from "../ring/reel-ring";
import { CARD_COUNT, CARD_H, CARD_W, DECK_LAND, DECK_REST, MAX_RING, RING_OFFSET, mixPose, ringCount, ringIntroPose, ringScene, ringSlotOf, stripMetrics, stripPose, type CardPose } from "./morph";

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
  it("ends with each card exactly where the ring hero draws it", () => {
    for (const slots of [12, 16]) {
      const scene = ringScene(slots);
      for (const k of [-slots / 2, -3, 0, 2, slots / 2 - 1]) {
        const p = reelPose(k * (360 / slots), 1, scene);
        const ring = chain(T(RING_OFFSET.x, RING_OFFSET.y, 0), RZ(scene.roll), RX(scene.tilt), T(p.x, p.y, p.z), RY(p.yaw), S(p.scale));
        expectSameCorners(ring, RING_CARD_W, RING_CARD_H, unified(ringIntroPose(k, slots, 1, 1).pose), CARD_W, CARD_H);
      }
    }
  });

  it("keeps neighbouring cards as close as on the 16-card ring", () => {
    const gap = (slots: number) => (2 * Math.PI * ringScene(slots).radius) / slots;
    expect(gap(12)).toBeCloseTo(gap(16), 6);
  });

  const slots = 12;
  const ks = Array.from({ length: slots }, (_, i) => i - slots / 2);
  const rested = DECK_LAND + DECK_REST / 2;
  const at = (f: number) => ks.map((k) => ringIntroPose(k, slots, f, 1));
  const onDeck = (p: { pose: CardPose }) => p.pose.yaw === -180;

  it("stacks every card into a deck at the front of the ring", () => {
    const poses = at(rested);
    expect(poses.every((p) => p.visible && onDeck(p))).toBe(true);
    // The front of the ring is where the first card ends up for good.
    const front = ringIntroPose(-slots / 2, slots, 1, 1).pose;
    for (const p of poses) {
      expect(Math.abs(p.pose.x - front.x)).toBeLessThan(40);
      expect(Math.abs(p.pose.y - front.y)).toBeLessThan(40);
    }
    // Each card sits at its own depth, far enough apart not to flicker.
    const zs = poses.map((p) => p.pose.z).sort((a, b) => a - b);
    zs.slice(1).forEach((z, i) => expect(z - zs[i]).toBeGreaterThan(5));
  });

  it("builds the deck from the bottom up", () => {
    const shown = (f: number) => at(f).filter((p) => p.visible).length;
    expect(shown(0)).toBe(0);
    let last = 0;
    for (let f = 0.01; f <= DECK_LAND; f += 0.01) {
      expect(shown(f)).toBeGreaterThanOrEqual(last);
      last = shown(f);
    }
    expect(last).toBe(slots);
    // The first card down is the one furthest back.
    const first = ks.findIndex((k) => ringIntroPose(k, slots, 0.001, 1).visible);
    const zs = at(rested).map((p) => p.pose.z);
    expect(zs[first]).toBe(Math.min(...zs));
  });

  it("always deals the top card of the deck next", () => {
    // The front card is the top of the deck and stays at the front, so
    // watch the rest leave from behind it.
    const rest = (f: number) => at(f).map((p, i) => ({ ...p, i })).filter((p) => p.i !== 0 && onDeck(p));
    let prev = rest(rested);
    for (let f = DECK_LAND + DECK_REST; f <= 1; f += 0.005) {
      const now = rest(f);
      const left = prev.filter((p) => !now.some((q) => q.i === p.i));
      const stayed = Math.max(-Infinity, ...now.map((p) => p.pose.z));
      for (const p of left) expect(p.pose.z).toBeGreaterThan(stayed);
      prev = now;
    }
    expect(prev.length).toBe(0);
  });
});

describe("ringCount", () => {
  it("gives the ring one card per project, within limits", () => {
    expect(ringCount(12)).toBe(12);
    expect(ringCount(0)).toBe(1);
    expect(ringCount(100)).toBe(MAX_RING);
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
    const a = ringIntroPose(3, 16, 1, 1).pose, b = stripPose(31, 0, { w: 1440, h: 900, top: 92, bottom: 190 }).pose;
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
