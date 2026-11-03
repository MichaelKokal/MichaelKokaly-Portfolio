import { describe, expect, it } from "vitest";
import { rad } from "../math";
import { CARD_H as RING_CARD_H, CARD_W as RING_CARD_W, reelPose, reelScene } from "../ring/reel-ring";
import { CARD_COUNT, CARD_H, CARD_W, DECK_LAND, DECK_REST, MAX_RING, RING_OFFSET, deckPose, mixPose, ringCount, ringIntroPose, ringSlotOf, stripMetrics, stripPose, type CardPose } from "./morph";

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
    const scene = reelScene(0);
    for (const slots of [12, 16]) {
      for (const k of [-slots / 2, -3, 0, 2, slots / 2 - 1]) {
        const a = k * (360 / slots);
        const p = reelPose(a, 1, scene);
        const ring = chain(T(RING_OFFSET.x, RING_OFFSET.y, 0), RZ(scene.roll), RX(scene.tilt), T(p.x, p.y, p.z), RY(p.yaw), S(p.scale));
        expectSameCorners(ring, RING_CARD_W, RING_CARD_H, unified(ringIntroPose(k, slots, 1, 1).pose), CARD_W, CARD_H);
      }
    }
  });

  const slots = 12;
  const ks = Array.from({ length: slots }, (_, i) => i - slots / 2);
  const rested = DECK_LAND + DECK_REST / 2;

  it("stacks one card per slot into a deck before dealing", () => {
    const poses = ks.map((k) => ringIntroPose(k, slots, rested, 1));
    expect(poses.every((p) => p.visible)).toBe(true);
    // Every card sits at its own height in the deck, each in front of the one below.
    const zs = poses.map((p) => p.pose.z).sort((a, b) => a - b);
    zs.slice(1).forEach((z, i) => expect(z - zs[i]).toBeGreaterThanOrEqual(5));
    // Each matches one level of the deck.
    const levels = Array.from({ length: slots }, (_, l) => deckPose(l, slots, 1));
    for (const p of poses) expect(levels.some((d) => d.z === p.pose.z && d.y === p.pose.y)).toBe(true);
  });

  it("builds the deck from the bottom up", () => {
    const shown = (f: number) => ks.filter((k) => ringIntroPose(k, slots, f, 1).visible).length;
    expect(shown(0)).toBe(0);
    let last = 0;
    for (let f = 0.01; f <= DECK_LAND; f += 0.01) {
      expect(shown(f)).toBeGreaterThanOrEqual(last);
      last = shown(f);
    }
    expect(last).toBe(slots);
    // The first card down is the bottom one, furthest back.
    const first = ks.find((k) => ringIntroPose(k, slots, 0.001, 1).visible)!;
    expect(ringIntroPose(first, slots, rested, 1).pose.z).toBe(0);
  });

  it("always deals the top card of the deck next", () => {
    const top = deckPose(0, slots, 1);
    for (let f = DECK_LAND + DECK_REST; f < 1; f += 0.02) {
      const onDeck = ks.map((k) => ringIntroPose(k, slots, f, 1).pose).filter((p) => p.yaw === -180 && p.tilt === 0);
      // Whatever is left is the bottom of the deck: its highest card is the top one remaining.
      const remaining = onDeck.length;
      if (remaining === 0) continue;
      const highest = Math.max(...onDeck.map((p) => p.z));
      expect(highest).toBe(deckPose(slots - remaining, slots, 1).z);
      expect(highest).toBeLessThanOrEqual(top.z);
    }
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
