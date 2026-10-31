import { describe, expect, it } from "vitest";
import { DEAL, REEL_SLOTS, farScreenY, reelAngle, reelPose, reelScene } from "./reel-ring";
import { recycledIndex } from "../math";

const slots = Array.from({ length: REEL_SLOTS }, (_, i) => i);

describe("reelAngle", () => {
  it("stays in -180..180 however far the ring turns", () => {
    for (const angle of [-1000, -180, 0, 0.3, 179.9, 720, 12345.6]) {
      for (const s of slots) {
        const a = reelAngle(s, angle);
        expect(a).toBeGreaterThanOrEqual(-180);
        expect(a).toBeLessThan(180);
      }
    }
  });

  it("spaces cards evenly", () => {
    expect(reelAngle(0, 0)).toBe(0);
    expect(reelAngle(1, 0)).toBeCloseTo(22.5);
    expect(reelAngle(8, 0)).toBe(-180);
  });
});

describe("reelPose", () => {
  it("puts every dealt card on one circle, facing the centre", () => {
    for (const e of [0, 0.4, 1]) {
      const scene = reelScene(e);
      for (const s of slots) {
        const a = reelAngle(s, 17);
        const p = reelPose(a, 1, scene);
        expect(Math.hypot(p.x, p.z)).toBeCloseTo(scene.radius, 6);
        expect(p.yaw).toBeCloseTo(a, 6);
        expect(p.appear).toBe(1);
      }
    }
  });

  it("stacks every card at the front, hidden, before the deal", () => {
    const scene = reelScene(0);
    for (const s of slots) {
      const p = reelPose(reelAngle(s, 0), 0, scene);
      expect(p.yaw).toBeCloseTo(-180);
      expect(p.x).toBeCloseTo(0);
      expect(p.appear).toBe(0);
    }
  });

  it("deals in order of angle, at a steady rate around the ring", () => {
    // The formation at which a card finishes is linear in how far round it sits.
    const finish = (around: number) => (around / 360) * (1 - DEAL) + DEAL;
    const scene = reelScene(0);
    for (const around of [45, 90, 180, 270, 350]) {
      const angle = around - 180;
      expect(reelPose(angle, finish(around) - 0.01, scene).yaw).toBeLessThan(angle);
      expect(reelPose(angle, finish(around), scene).yaw).toBeCloseTo(angle);
    }
  });

  it("deals both halves of the ring over equal distances", () => {
    // Mirrored cards end mirrored: the left half covers what the right half does.
    const scene = reelScene(0.5);
    for (const a of [22.5, 45, 90, 135, 157.5]) {
      const right = reelPose(-a, 1, scene);
      const left = reelPose(a, 1, scene);
      expect(left.x).toBeCloseTo(-right.x);
      expect(left.z).toBeCloseTo(right.z);
    }
  });

  it("never moves a card backwards during the deal", () => {
    const scene = reelScene(0);
    for (const s of slots) {
      const a = reelAngle(s, 0);
      let last = -Infinity;
      for (let f = 0; f <= 1; f += 0.01) {
        const yaw = reelPose(a, f, scene).yaw;
        expect(yaw).toBeGreaterThanOrEqual(last - 1e-9);
        last = yaw;
      }
    }
  });
});

describe("reelScene", () => {
  it("runs from the small tilted ring to the level carousel", () => {
    expect(reelScene(0)).toMatchObject({ radius: 460, perspective: 1000, tilt: -22, roll: -20, scale: 0.52 });
    const end = reelScene(1);
    expect(end).toMatchObject({ radius: 1800, perspective: 450, scale: 2.3 });
    expect(end.tilt).toBeCloseTo(0);
    expect(end.roll).toBeCloseTo(0);
  });

  it("keeps the back of the ring on a straight path", () => {
    expect(reelScene(0).anchor).toBeCloseTo(0);
    expect(reelScene(1).anchor).toBeCloseTo(0);
    const from = farScreenY(reelScene(0)), to = farScreenY(reelScene(1));
    for (const e of [0.25, 0.5, 0.75]) {
      const s = reelScene(e);
      expect(farScreenY(s) + s.anchor).toBeCloseTo(from + (to - from) * e);
    }
  });

  it("hides cards behind the camera only once the camera is inside", () => {
    for (const s of slots) {
      expect(reelPose(reelAngle(s, 0), 1, reelScene(0)).behindCamera).toBe(false);
    }
    const inside = reelScene(1);
    expect(reelPose(0, 1, inside).behindCamera).toBe(false);
    expect(reelPose(45, 1, inside).behindCamera).toBe(false);
    expect(reelPose(180, 1, inside).behindCamera).toBe(true);
    expect(reelPose(-135, 1, inside).behindCamera).toBe(true);
  });
});

describe("recycling", () => {
  it("keeps neighbouring cards on neighbouring projects at any angle", () => {
    const items = 9;
    for (const angle of [0, 33, 400, -777]) {
      const cards = slots
        .map((s) => ({ a: reelAngle(s, angle), item: recycledIndex(s, REEL_SLOTS, s * 22.5 + angle, items) }))
        .sort((p, q) => p.a - q.a);
      for (let i = 1; i < cards.length; i++) {
        expect((cards[i].item - cards[i - 1].item + items) % items).toBe(1);
      }
    }
  });
});
