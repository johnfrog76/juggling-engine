import {
  expand,
  orbitsOf,
  validate,
  airborneMean,
  sampleAt,
  apexScale,
  palmsUpFor,
  conventionalSpins,
  airborneAt,
  PROPS,
  GRAVITY,
} from "./engine";

// These tests exist because the deck makes factual claims on screen. If the
// engine drifts, the deck starts lying — and it is a deck about notation being
// accurate. Every number asserted here appears on a slide.

describe("validate — legality is a permutation of landing beats", () => {
  // Every pattern the deck actually shows. Verified 2026-08-12 against the
  // permutation test and, for 53, against a human throwing it with beanbags.
  it.each([
    ["3", [3], 3],
    ["53", [5, 3], 4],
    ["531", [5, 3, 1], 3],
    ["97531", [9, 7, 5, 3, 1], 5],
    ["744", [7, 4, 4], 5],
    ["4", [4], 4],
    ["5", [5], 5],
    ["7", [7], 7],
    ["13", [13], 13],
  ])("%s is legal and carries %i props", (_label, pattern, props) => {
    const v = validate(pattern as number[]);
    expect(v.legal).toBe(true);
    expect(v.props).toBe(props);
  });

  it("744 and 97531 are both five props — same inventory, different program", () => {
    expect(validate([7, 4, 4]).props).toBe(5);
    expect(validate([9, 7, 5, 3, 1]).props).toBe(5);
  });

  it("rejects 532 and names the beat that was claimed twice", () => {
    const v = validate([5, 3, 2]);
    expect(v.legal).toBe(false);
    expect(v.collisionAt).toBe(1);
  });

  it("rejects a pattern whose digits do not average to a whole number", () => {
    expect(validate([5, 3, 3]).legal).toBe(false);
  });
});

describe("crossing — digit parity, not prop count", () => {
  // The deck's slide 10. Both counter-examples are real: Lucas threw 13 rings
  // as non-crossing columns, and a four-prop cascade (53) crosses every throw.
  /**
   * Does any prop change side of the centreline over a full cycle?
   * Sampling two adjacent instants is not enough — with real dwell a prop can sit
   * in one hand for over a beat — so walk the whole cycle and watch each orbit.
   */
  const anyPropCrosses = (pattern: number[]) => {
    const steps = 120;
    const span = pattern.length * 4;
    const sides: Array<Set<number>> = [];
    for (let i = 0; i < steps; i++) {
      sampleAt(pattern, (i / steps) * span).forEach((p, idx) => {
        (sides[idx] ??= new Set()).add(Math.sign(p.x));
      });
    }
    return sides.some((s) => s.has(1) && s.has(-1));
  };

  it("4 is a fountain — four props, and nothing crosses", () => {
    expect(validate([4]).props).toBe(4);
    expect([4].every((d) => d % 2 === 0)).toBe(true);
    expect(anyPropCrosses([4])).toBe(false);
  });

  it("53 is a cascade — also four props, and props do cross", () => {
    expect(validate([5, 3]).props).toBe(4);
    expect([5, 3].every((d) => d % 2 === 1)).toBe(true);
    expect(anyPropCrosses([5, 3])).toBe(true);
  });

  it("3 crosses, 4 does not — the parity rule, rendered", () => {
    expect(anyPropCrosses([3])).toBe(true);
    expect(anyPropCrosses([4])).toBe(false);
  });
});

describe("airborne inventory — N minus 2H", () => {
  it.each([
    [3, 1, 1],
    [5, 1, 3],
    [7, 1, 5],
    [13, 1, 11],
  ])("%i props with %i juggler leaves %i airborne", (props, jugglers, expected) => {
    expect(airborneMean(props, jugglers)).toBe(expected);
  });

  it("nine clubs between two jugglers leaves five in the air", () => {
    // John's own gym number. Two bodies, four hands, nine clubs.
    expect(airborneMean(9, 2)).toBe(5);
  });

  it("oscillates between N−2 and N−1 rather than sitting flat", () => {
    // With real dwell the instantaneous count is not constant: at the moment of
    // a throw the previous prop has not landed. The deck SHOWS this ticking, and
    // that is truer than a flat number. This test is what pins DWELL_BEATS —
    // at the sibling deck's 0.4 the count sits at 4-5 and the N−2 claim is false.
    const counts = new Set<number>();
    for (let i = 0; i < 200; i++) counts.add(airborneAt([5], (i / 200) * 20));
    expect(counts.size).toBeGreaterThan(1);
    expect(Math.min(...counts)).toBe(3); // N−2
    expect(Math.max(...counts)).toBe(4); // N−1, mid-throw
  });

  it("holds N−2 for 3 and 7 as well", () => {
    const seen = (p: number[], span: number) => {
      const c = new Set<number>();
      for (let i = 0; i < 200; i++) c.add(airborneAt(p, (i / 200) * span));
      return [Math.min(...c), Math.max(...c)];
    };
    expect(seen([3], 12)).toEqual([1, 2]);
    expect(seen([7], 28)).toEqual([5, 6]);
  });
});

describe("gravity", () => {
  it("Mars apex is about 2.64x Earth for the same throw", () => {
    expect(apexScale("mars")).toBeCloseTo(GRAVITY.earth / GRAVITY.mars, 5);
    expect(apexScale("mars")).toBeCloseTo(2.64, 1);
  });

  it("Earth is the unit", () => {
    expect(apexScale("earth")).toBe(1);
  });

  it("the same pattern flies higher on Mars", () => {
    const peak = (planet: "earth" | "mars") =>
      Math.min(...Array.from({ length: 40 }, (_, i) => sampleAt([5], (i / 40) * 2, { planet })[0].y));
    expect(peak("mars")).toBeLessThan(peak("earth")); // y is negative upward
  });
});

describe("props — what each one adds that the notation cannot record", () => {
  it("palm orientation is one boolean: only balls sit in an open hand", () => {
    expect(palmsUpFor("balls")).toBe(true);
    expect(palmsUpFor("rings")).toBe(false);
    expect(palmsUpFor("clubs")).toBe(false);
  });

  it("rings are the only prop with a constrained presentation", () => {
    expect(PROPS.rings.goodView).toBe("side");
    expect(PROPS.balls.goodView).toBe("front");
    expect(PROPS.clubs.goodView).toBe("either");
  });

  it("only clubs rotate", () => {
    const spinOf = (prop: "balls" | "rings" | "clubs") =>
      sampleAt([5], 0.3, { prop }).map((p) => p.spin);
    expect(spinOf("balls").every((s) => s === 0)).toBe(true);
    expect(spinOf("rings").every((s) => s === 0)).toBe(true);
    expect(spinOf("clubs").some((s) => s !== 0)).toBe(true);
  });

  it("conventional spins rise with the throw — art direction, not derivation", () => {
    expect(conventionalSpins(3)).toBe(1);
    expect(conventionalSpins(5)).toBe(2);
    expect(conventionalSpins(7)).toBe(3);
  });
});

describe("expand — every prop must get its own orbit", () => {
  // REGRESSION: the repetition cap was 16, so `[17]` fell out of the loop still
  // folded into ONE orbit and seventeen rings rendered as a single ring. It
  // failed silently, which is why this test exists.
  it.each([[3], [5], [7], [9], [11], [13], [15], [17], [19]])(
    "%i props expand to %i orbits",
    (n) => {
      const e = expand([n]);
      expect(orbitsOf(e).orbits.length).toBe(n);
    },
  );

  it("never folds a legal pattern into a single orbit", () => {
    for (let n = 3; n <= 20; n++) {
      expect(orbitsOf(expand([n])).orbits.length).toBeGreaterThan(1);
    }
  });
});

describe("the whole vanilla space — every legal pattern must render", () => {
  // The engine's promise is "type any siteswap and see it", so prove it across
  // the space rather than across a handful of favourites. Brute-forces every
  // pattern up to period 4 and asserts that each LEGAL one gets the right
  // number of orbits and finite positions.
  const enumerate = (): number[][] => {
    const out: number[][] = [];
    for (let a = 0; a < 10; a++) out.push([a]);
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) out.push([a, b]);
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) for (let c = 0; c < 10; c++) out.push([a, b, c]);
    for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) for (let c = 0; c < 8; c++) for (let d = 0; d < 8; d++) out.push([a, b, c, d]);
    return out;
  };

  it("renders every legal pattern up to period 4", () => {
    const legal = enumerate().filter((p) => validate(p).legal);
    expect(legal.length).toBeGreaterThan(600); // 670 at time of writing

    const failures: string[] = [];
    for (const p of legal) {
      const v = validate(p);
      const e = expand(p);
      const orbits = orbitsOf(e).orbits.length;
      const pos = sampleAt(e, 1.3);
      if (orbits !== v.props) failures.push(`${p.join("")}: ${orbits} orbits for ${v.props} props`);
      else if (pos.length !== orbits) failures.push(`${p.join("")}: ${pos.length} positions for ${orbits} orbits`);
      else if (!pos.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y))) failures.push(`${p.join("")}: non-finite position`);
    }
    expect(failures).toEqual([]);
  });

  it("handles two-digit throws (10 and above)", () => {
    for (const p of [[10], [11], [13], [11, 1], [13, 1]]) {
      const v = validate(p);
      if (!v.legal) continue;
      expect(orbitsOf(expand(p)).orbits.length).toBe(v.props);
    }
  });
});

describe("sampling", () => {
  it("returns one position per prop", () => {
    expect(sampleAt([5, 3, 1], 0)).toHaveLength(3);
    expect(sampleAt([9, 7, 5, 3, 1], 0)).toHaveLength(5);
  });

  it("is periodic — the cycle closes", () => {
    const a = sampleAt([5, 3, 1], 0);
    const b = sampleAt([5, 3, 1], 6); // lcm(3,2) = 6 beats
    a.forEach((p, i) => {
      expect(p.x).toBeCloseTo(b[i].x, 3);
      expect(p.y).toBeCloseTo(b[i].y, 3);
    });
  });

  it("keeps every prop on stage — no NaN, no runaway", () => {
    for (let t = 0; t < 12; t += 0.13) {
      for (const p of sampleAt([9, 7, 5, 3, 1], t)) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
        expect(Math.abs(p.x)).toBeLessThan(400);
      }
    }
  });
});
