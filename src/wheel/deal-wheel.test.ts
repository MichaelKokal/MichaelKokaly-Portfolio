import { describe, expect, it } from "vitest";
import { VISIBLE_DEG, WHEEL_CARDS, dealPose, wheelScene, wheelTransform } from "./deal-wheel";

const cards = Array.from({ length: WHEEL_CARDS }, (_, i) => i);

describe("dealPose", () => {
  it("lands every card on the rim, face up, at its home angle", () => {
    for (const lift of [0, 0.5, 1]) {
      const s = wheelScene(lift);
      for (const i of cards) {
        const p = dealPose(i, 1, lift, 0);
        expect(p.p).toBe(1);
        expect(p.angle).toBeCloseTo(p.home);
        expect(p.reach).toBeCloseTo(-s.radius);
        expect(p.flip).toBeCloseTo(0);
      }
    }
  });

  it("rests at full size once lifted", () => {
    expect(dealPose(0, 1, 1, 0).scale).toBeCloseTo(1);
    expect(dealPose(0, 1, 0, 0).scale).toBeCloseTo(1 / 1.35);
  });

  it("deals the top card first and both sides at the same time", () => {
    const at = 0.2;
    expect(dealPose(0, at, 0, 0).p).toBeGreaterThan(dealPose(3, at, 0, 0).p);
    for (const k of [1, 4, 8, 12]) {
      expect(dealPose(k, at, 0, 0).p).toBeCloseTo(dealPose(WHEEL_CARDS - k, at, 0, 0).p);
    }
  });

  it("moves every card the same way: left, from 70° right of home", () => {
    for (const i of cards) {
      let last = Infinity;
      for (let d = 0; d <= 1; d += 0.02) {
        const pose = dealPose(i, d, 0, 0);
        if (pose.p === 0) expect(pose.angle).toBeCloseTo(pose.home + 70);
        expect(pose.angle).toBeLessThanOrEqual(last + 1e-9);
        last = pose.angle;
      }
    }
  });

  it("turns the opening kick the same way the wheel drifts", () => {
    // Drift increases spin, which lowers every home angle. The kick must too.
    const before = dealPose(0, 1, 0, 0).home;
    expect(dealPose(0, 1, 1, 0).home).toBeLessThan(before);
    expect(dealPose(0, 1, 0, 5).home).toBeLessThan(before);
  });

  it("puts the top card in front of its neighbours", () => {
    const top = dealPose(0, 1, 1, -28);
    for (const i of cards) expect(dealPose(i, 1, 1, -28).depth).toBeLessThanOrEqual(top.depth);
  });

  it("hides the far side of the wheel", () => {
    for (const i of cards) {
      const p = dealPose(i, 1, 1, 13);
      expect(p.visible).toBe(p.away < VISIBLE_DEG);
    }
    expect(dealPose(0, 0, 0, 0).visible).toBe(false);
  });
});

describe("wheelTransform", () => {
  it("writes the steps in order: pivot, rotate, push out, flip, scale", () => {
    const t = wheelTransform(dealPose(0, 1, 0, 0));
    expect(t).toBe("translate3d(0,500px,0px) rotateZ(0deg) translate3d(0,-580px,0) rotateY(0deg) scale(0.741)");
  });
});
