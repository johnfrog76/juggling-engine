import { parseSync, formatSync, validateSync, syncOrbits, sampleSyncAt, syncArcPathsOf, BOX } from "./sync";

// Sync is a SECOND timing mode, not a variation on the first, so it gets its
// own tests. The claim being defended: if it renders, the maths says it is a
// valid pattern — same guarantee the vanilla path already makes.

describe("parsing sync notation", () => {
  it("parses the Box", () => {
    const b = parseSync("(4,2x)(2x,4)");
    expect(b).not.toBeNull();
    expect(b).toHaveLength(2);
    expect(b![0].left).toEqual({ value: 4, cross: false });
    expect(b![0].right).toEqual({ value: 2, cross: true });
    expect(b![1].left).toEqual({ value: 2, cross: true });
    expect(b![1].right).toEqual({ value: 4, cross: false });
  });

  it("round-trips", () => {
    for (const text of ["(4,2x)(2x,4)", "(4,4)", "(6,2x)(2x,6)", "(4,4)(4,0)"]) {
      expect(formatSync(parseSync(text)!)).toBe(text);
    }
  });

  it("tolerates whitespace and case", () => {
    expect(parseSync(" (4, 2X)(2x, 4) ")).toEqual(parseSync("(4,2x)(2x,4)"));
  });

  it("returns null for vanilla input, so callers can fall back", () => {
    expect(parseSync("531")).toBeNull();
    expect(parseSync("3")).toBeNull();
    expect(parseSync("")).toBeNull();
  });

  it("rejects malformed brackets", () => {
    expect(parseSync("(4,2x)(2x")).toBeNull();
    expect(parseSync("(4)")).toBeNull();
    expect(parseSync("(4,2x)junk")).toBeNull();
  });
});

describe("validating sync", () => {
  it("the Box is legal and carries three props", () => {
    const v = validateSync(BOX);
    expect(v.legal).toBe(true);
    expect(v.props).toBe(3);
  });

  it("(4,4) is legal and carries four props", () => {
    const v = validateSync(parseSync("(4,4)")!);
    expect(v.legal).toBe(true);
    expect(v.props).toBe(4);
  });

  it("rejects odd values, because sync has no odd beats", () => {
    const v = validateSync(parseSync("(3,3)")!);
    expect(v.legal).toBe(false);
    expect(v.reason).toMatch(/odd/);
  });

  it("rejects a collision and says which hand and beat", () => {
    // both hands throwing 4 non-crossing AND 4 crossing into the same slot
    const v = validateSync(parseSync("(4,4x)")!);
    expect(v.legal).toBe(false);
    expect(v.reason).toMatch(/land/);
  });

  it("rejects a non-integer prop count", () => {
    // (4,2) averages 3 and IS legal — my first attempt at this test was wrong.
    // (6,2) averages 4 but collides; (4,4)(4,2) averages 3.5, which does not.
    const v = validateSync(parseSync("(4,4)(4,2)")!);
    expect(v.legal).toBe(false);
    expect(v.reason).toMatch(/whole number/);
  });

  it("(4,2) is legal — three props, and it is a real pattern", () => {
    const v = validateSync(parseSync("(4,2)")!);
    expect(v.legal).toBe(true);
    expect(v.props).toBe(3);
  });
});

describe("orbits — every prop gets its own chain", () => {
  it("the Box resolves to three orbits", () => {
    const { orbits } = syncOrbits(BOX);
    expect(orbits).toHaveLength(3);
  });

  it("(4,4) resolves to four orbits", () => {
    const { orbits } = syncOrbits(parseSync("(4,4)")!);
    expect(orbits).toHaveLength(4);
  });

  it("orbit count matches prop count across legal sync patterns", () => {
    for (const text of ["(4,4)", "(4,2x)(2x,4)", "(6,6)", "(6,2x)(2x,6)", "(8,8)"]) {
      const beats = parseSync(text)!;
      const v = validateSync(beats);
      if (!v.legal) continue;
      expect(syncOrbits(beats).orbits.length).toBe(v.props);
    }
  });
});

describe("sampling the Box — the shape John described", () => {
  const trace = (steps = 48) => {
    const { cycleBeats } = syncOrbits(BOX);
    return Array.from({ length: steps }, (_, i) => sampleSyncAt(BOX, (i / steps) * cycleBeats));
  };

  it("returns one position per prop", () => {
    expect(sampleSyncAt(BOX, 0)).toHaveLength(3);
  });

  it("keeps every prop on stage with finite coordinates", () => {
    for (const frame of trace()) {
      for (const p of frame) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
        expect(Math.abs(p.x)).toBeLessThanOrEqual(70);
      }
    }
  });

  it("two props stay on their own side — the columns up the sides of the box", () => {
    const frames = trace(80);
    const sides = [0, 1, 2].map((i) => new Set(frames.map((f) => Math.sign(f[i].x)).filter((s) => s !== 0)));
    const stayers = sides.filter((s) => s.size === 1);
    expect(stayers.length).toBeGreaterThanOrEqual(2);
  });

  it("one prop crosses the middle — the ball that is always passed", () => {
    const frames = trace(80);
    const sides = [0, 1, 2].map((i) => new Set(frames.map((f) => Math.sign(f[i].x)).filter((s) => s !== 0)));
    const crossers = sides.filter((s) => s.size > 1);
    expect(crossers.length).toBeGreaterThanOrEqual(1);
  });

  it("the crossing prop stays LOW and the columns go high", () => {
    const frames = trace(80);
    const peak = [0, 1, 2].map((i) => Math.min(...frames.map((f) => f[i].y)));
    const sorted = [...peak].sort((a, b) => a - b);
    // y is negative upward: the two columns peak much higher than the shuttle
    expect(sorted[0]).toBeLessThan(sorted[2] - 20);
  });
});

describe("sync arcs are engine-owned too", () => {
  it("emits one path per prop for the Box", () => {
    const paths = syncArcPathsOf(BOX);
    expect(paths).toHaveLength(3);
    for (const p of paths) expect(p).not.toMatch(/NaN|Infinity/);
  });
});
