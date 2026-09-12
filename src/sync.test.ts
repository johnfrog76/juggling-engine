import { parseSync, formatSync, validateSync, syncOrbits, sampleSyncAt, syncArcPathsOf, BOX } from "./sync";
import { conventionalSpins, sampleAt, orbitsOf, expand } from "./engine";

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

describe("both samplers throw from the same hands", () => {
  // sync.ts used to redeclare HAND_X and APEX_PER_BEAT2_EARTH as its own local
  // copies of 64 and 11.5. They agreed, so nothing was visibly wrong — until
  // either was re-timed, at which point the two samplers would have quietly
  // disagreed about where hands are and how tall a beat is. It now imports
  // them, and this test is what makes that structural rather than a habit.

  // Asserting against the imported constant would be a TAUTOLOGY — sync reads
  // HAND_X from the engine, so both sides of such an assertion move together
  // and the test passes no matter what the constant becomes. (Verified: a
  // 64→70 mutation sailed straight through the first version of this.)
  //
  // The invariant worth defending compares the two SAMPLERS. A sync 4 and a
  // vanilla 4 are the same throw from the same hand; whatever the constants
  // are, these two must agree about where it leaves and how high it goes.

  const extremes = (sample: (t: number) => { x: number; y: number }[], cycle: number) => {
    const frames = Array.from({ length: 96 }, (_, i) => sample((i / 96) * cycle)).flat();
    return {
      reach: frames.reduce((m, p) => Math.max(m, Math.abs(p.x)), 0),
      apex: Math.abs(frames.reduce((m, p) => Math.min(m, p.y), 0)),
    };
  };

  it("a sync 4 and a vanilla 4 release from the same hand position", () => {
    const beats = parseSync("(4,4)")!;
    const s = extremes((t) => sampleSyncAt(beats, t), syncOrbits(beats).cycleBeats);
    const v = extremes((t) => sampleAt([4], t), orbitsOf(expand([4])).cycleBeats);
    // Both are straight columns — no crossing — so the widest x is the hand.
    expect(s.reach).toBeCloseTo(v.reach, 5);
  });

  it("a sync 4 and a vanilla 4 fly to the same height", () => {
    const beats = parseSync("(4,4)")!;
    const s = extremes((t) => sampleSyncAt(beats, t), syncOrbits(beats).cycleBeats);
    const v = extremes((t) => sampleAt([4], t), orbitsOf(expand([4])).cycleBeats);
    expect(s.apex).toBeCloseTo(v.apex, 0);
  });
});

describe("the sync spin table diverges from vanilla ON PURPOSE", () => {
  // A sync 4 gets ONE flip here; a vanilla 4 gets TWO from conventionalSpins.
  //
  // That is not an oversight waiting to be tidied. The Box was verified BY EYE
  // against the real pattern with these numbers, so unifying the tables changes
  // art a juggler has already approved. The divergence is historical rather
  // than principled — but "principled" is not the bar for approved art, and the
  // decision to change it belongs to someone watching a Box run, not to a
  // cleanup pass reading two functions side by side.
  //
  // So this test exists to FAIL if anyone unifies them, and to say why in the
  // failure. Delete it deliberately, with a juggler looking.
  const spinAfterQuarterFlight = (value: number) => {
    const beats = parseSync(`(${value},${value})`)!;
    const { cycleBeats } = syncOrbits(beats);
    // Sample across the cycle and take the largest rotation any prop reaches;
    // spin accumulates over a flight, so the peak reports the full flip count.
    const peak = Array.from({ length: 64 }, (_, i) =>
      sampleSyncAt(beats, (i / 64) * cycleBeats, { prop: "clubs" }),
    )
      .flat()
      .reduce((m, p) => Math.max(m, Math.abs(p.spin)), 0);
    return peak;
  };

  it("a sync 4 turns about once, where a vanilla 4 turns twice", () => {
    // ~360 (one flip), not ~720 — sampling never lands exactly on the apex of
    // the flight, so assert the band rather than the endpoint.
    const peak = spinAfterQuarterFlight(4);
    expect(peak).toBeGreaterThan(180);
    expect(peak).toBeLessThan(540);
    expect(conventionalSpins(4)).toBe(2); // vanilla's answer, deliberately different
  });

  it("a sync 2 does not flip at all — a shuttle is not a toss", () => {
    expect(spinAfterQuarterFlight(2)).toBeCloseTo(0);
  });

  it("balls never rotate in sync either", () => {
    // toBeCloseTo, not toBe: a left-hand throw multiplies its zero spin by −1
    // and JavaScript hands back −0, which Object.is says is not 0.
    const frames = Array.from({ length: 32 }, (_, i) => sampleSyncAt(BOX, i / 4, { prop: "balls" }));
    for (const f of frames) for (const p of f) expect(p.spin).toBeCloseTo(0);
  });
});

describe("sync arcs are engine-owned too", () => {
  it("emits one path per prop for the Box", () => {
    const paths = syncArcPathsOf(BOX);
    expect(paths).toHaveLength(3);
    for (const p of paths) expect(p).not.toMatch(/NaN|Infinity/);
  });
});
