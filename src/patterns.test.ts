import { labelOf, parsePattern, bigThrowTip, asCurrent } from "./patterns";

// The input surface — everything John UAT'd by walking into it. Each of these
// encodes a morning's confusion so it can never come back silently.

describe("labelOf — one pattern, one label", () => {
  it("writes throws above 9 as letters, the siteswap standard", () => {
    expect(labelOf({ kind: "vanilla", digits: [13] })).toBe("d");
    expect(labelOf({ kind: "vanilla", digits: [10] })).toBe("a");
    expect(labelOf({ kind: "vanilla", digits: [15] })).toBe("f");
  });

  it("never collides: [13] and [1,3] are different patterns with different labels", () => {
    // This collision was live: both printed "13", so typing thirteen rendered
    // the two-ball pattern while the THIRTEEN catalogue row lit up as selected.
    const thirteen = labelOf({ kind: "vanilla", digits: [13] });
    const oneThree = labelOf({ kind: "vanilla", digits: [1, 3] });
    expect(thirteen).not.toBe(oneThree);
    expect(oneThree).toBe("13");
  });

  it("round-trips through the parser", () => {
    for (const digits of [[13], [10, 6], [9, 7, 5, 3, 1], [3]]) {
      const label = labelOf({ kind: "vanilla", digits });
      expect(parsePattern(label)).toEqual(digits);
    }
  });
});

describe("parsePattern — the ways in, and the ceiling", () => {
  it("reads bare digits one at a time", () => {
    expect(parsePattern("531")).toEqual([5, 3, 1]);
    expect(parsePattern("13")).toEqual([1, 3]);
  });

  it("reads a-f as 10-15", () => {
    expect(parsePattern("a")).toEqual([10]);
    expect(parsePattern("d")).toEqual([13]);
    expect(parsePattern("f")).toEqual([15]);
    expect(parsePattern("d97531")).toEqual([13, 9, 7, 5, 3, 1]);
  });

  it("reads separated lists", () => {
    expect(parsePattern("6 3 3")).toEqual([6, 3, 3]);
    expect(parsePattern("6,3,3")).toEqual([6, 3, 3]);
    expect(parsePattern("15,")).toEqual([15]);
  });

  it("caps every path at 15 — the calibrated ceiling", () => {
    // The separated path used to accept up to 99 and would render a fifty-ball
    // fountain. The range is siteswap's alphabet, two past Lucas's attested 13.
    expect(parsePattern("16,")).toBeNull();
    expect(parsePattern("50,")).toBeNull();
    expect(parsePattern("100")).toEqual([1, 0, 0]); // digits, not a count
  });

  it("rejects what it cannot read", () => {
    expect(parsePattern("")).toBeNull();
    expect(parsePattern("g")).toBeNull();
    expect(parsePattern("3x")).toBeNull();
  });
});

describe("bigThrowTip — the 10-to-15 trap narrates itself", () => {
  it("teaches the letter when the digits form a real pattern", () => {
    // "13" legally IS the two-ball 1,3 — digits win, tip teaches d.
    expect(bigThrowTip("13")).toContain('type "d"');
    expect(bigThrowTip("15")).toContain('type "f"');
  });

  it("narrates the count-reading when the digits are illegal", () => {
    // "10" is not a pattern as digits, so the explorer runs ten props.
    expect(bigThrowTip("10")).toMatch(/^Running a single throw of 10/);
    expect(bigThrowTip("12")).toContain('"c"');
    expect(bigThrowTip("14")).toContain('"e"');
  });

  it("stays silent outside the trap", () => {
    expect(bigThrowTip("9")).toBeNull();
    expect(bigThrowTip("16")).toBeNull();
    expect(bigThrowTip("531")).toBeNull();
    expect(bigThrowTip("")).toBeNull();
  });
});

describe("asCurrent — the tagged union dispatches", () => {
  it("routes sync strings to sync", () => {
    expect(asCurrent("(4,2x)(2x,4)").kind).toBe("sync");
  });

  it("routes digit arrays to vanilla", () => {
    expect(asCurrent([5, 3, 1])).toEqual({ kind: "vanilla", digits: [5, 3, 1] });
  });
});
