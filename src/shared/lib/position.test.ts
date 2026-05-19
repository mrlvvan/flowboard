import { describe, it, expect } from "vitest";
import { positionBetween, initialPosition } from "./position";

describe("positionBetween", () => {
  it("returns a midpoint for no bounds", () => {
    const pos = positionBetween(undefined, undefined);
    expect(typeof pos).toBe("string");
    expect(pos.length).toBeGreaterThan(0);
  });

  it("returns a position before `next` when no prev", () => {
    const next = "n";
    const pos = positionBetween(undefined, next);
    expect(pos < next).toBe(true);
  });

  it("returns a position after `prev` when no next", () => {
    const prev = "n";
    const pos = positionBetween(prev, undefined);
    expect(pos > prev).toBe(true);
  });

  it("returns a position between prev and next", () => {
    const prev = "a";
    const next = "z";
    const pos = positionBetween(prev, next);
    expect(pos > prev).toBe(true);
    expect(pos < next).toBe(true);
  });

  it("supports many insertions in sequence without collision", () => {
    const positions: string[] = [];
    let last: string | undefined;
    for (let i = 0; i < 20; i++) {
      const pos = positionBetween(last, undefined);
      positions.push(pos);
      last = pos;
    }
    const sorted = [...positions].sort();
    expect(sorted).toEqual(positions);
    const unique = new Set(positions);
    expect(unique.size).toBe(20);
  });
});

describe("initialPosition", () => {
  it("produces increasing positions for sequential indices", () => {
    const p0 = initialPosition(0);
    const p1 = initialPosition(1);
    const p2 = initialPosition(2);
    expect(p1 > p0).toBe(true);
    expect(p2 > p1).toBe(true);
  });
});
