import {
  airtimeOf,
  apexPxOf,
  arcPathsOf,
  sampleAt,
  expand,
  toKeyframes,
  conventionalSpins,
  DWELL_BEATS,
  PASS_DWELL_BEATS,
} from "./engine";

// The motion contracts — every behaviour here was tuned against John's eye
// and broken at least once on the way. These tests are the reason each fix
// cannot silently regress.

describe("airtimeOf — dwell is modelled, and passes are not tosses", () => {
  it("gives tosses the shortened dwell so a 3 has a visible arc", () => {
    // Flat 1.4-beat dwell left a 3 with a 29px apex — smaller than a club.
    expect(airtimeOf(3)).toBeCloseTo(1.95, 5);
    // From 4 upward the fraction no longer bites; flat dwell applies.
    expect(airtimeOf(4)).toBeCloseTo(4 - DWELL_BEATS, 5);
    expect(airtimeOf(7)).toBeCloseTo(7 - DWELL_BEATS, 5);
    expect(airtimeOf(13)).toBeCloseTo(13 - DWELL_BEATS, 5);
  });

  it("keeps passes low — a 1 is a hand-across, a 2 is nearly a hold", () => {
    // The toss fraction once inflated the Box's 2x shuttle 4.7x above the
    // verified render. Passes take their own longer dwell, with a little
    // lift: "to me it visually has a bit of arc" (John).
    expect(airtimeOf(1)).toBeCloseTo(Math.max(1 - PASS_DWELL_BEATS, 0.55), 5);
    expect(airtimeOf(2)).toBeCloseTo(2 - PASS_DWELL_BEATS, 5);
    // A pass must never fly longer than the smallest real toss.
    expect(airtimeOf(2)).toBeLessThan(airtimeOf(3));
  });

  it("is monotonic — higher throws always fly longer", () => {
    for (let v = 1; v < 15; v++) {
      expect(airtimeOf(v + 1)).toBeGreaterThan(airtimeOf(v));
    }
  });
});

describe("held clubs keep the angle they landed on", () => {
  // Returning 0 for a held club made every interpolating consumer unwind the
  // completed turn backwards through the catch — "bleeding through" (John).
  const heldSample = () => {
    // [3] expands to three props on a 3-beat cycle; the prop thrown at beat 0
    // is airborne for airtimeOf(3)=1.95 beats and held from 1.95 to 3.
    const positions = sampleAt(expand([3]), 2.5, { prop: "clubs" });
    return positions.find((p) => !p.airborne);
  };

  it("holds a full multiple of 360, not zero", () => {
    const held = heldSample();
    expect(held).toBeDefined();
    const spins = conventionalSpins(3);
    expect(Math.abs(held!.spin)).toBe(360 * spins);
  });

  it("balls hold with no rotation at all", () => {
    const held = sampleAt(expand([3]), 2.5, { prop: "balls" }).find((p) => !p.airborne);
    expect(held).toBeDefined();
    expect(held!.spin).toBe(0);
  });
});

describe("toKeyframes — the emitted CSS can always be interpolated", () => {
  const angles = (css: string) => {
    const block = css.split("@keyframes")[1] ?? "";
    return [...block.matchAll(/rotate\((-?[\d.]+)deg\)/g)].map((m) => +m[1]);
  };
  const stops = (css: string) => {
    const block = css.split("@keyframes")[1] ?? "";
    return [...block.matchAll(/[\d.]+% \{/g)].length;
  };

  it("every stop carries a rotate, even a zero one", () => {
    // A falsy check once dropped rotate() at spin 0, leaving stops with
    // structurally different transforms — CSS snaps instead of interpolating.
    for (const pattern of [[3], [5, 3], [7]]) {
      const css = toKeyframes("t", pattern, { prop: "clubs" }).css;
      expect(angles(css).length).toBe(stops(css));
    }
  });

  it("never asks the interpolator to cover more than half a turn", () => {
    // The unwrap: a completed 720 used to drop to 0 at the catch and the
    // browser spun the club all the way back. Unwrapped, consecutive stops
    // stay well under 180 degrees apart.
    for (const pattern of [[3], [5, 3], [7]]) {
      const a = angles(toKeyframes("t", pattern, { prop: "clubs" }).css);
      for (let i = 1; i < a.length; i++) {
        expect(Math.abs(a[i] - a[i - 1])).toBeLessThan(180);
      }
    }
  });

  it("clubs sample densely, balls do not pay for it", () => {
    expect(stops(toKeyframes("t", [7], { prop: "clubs" }).css)).toBeGreaterThan(
      stops(toKeyframes("t", [7], { prop: "balls" }).css),
    );
  });
});

describe("the engine owns apex and arcs — presentation never re-derives them", () => {
  it("apexPxOf reports the tallest throw's height", () => {
    // 11.5 px per airtime-beat² was hand-copied into three renderers before
    // this existed; a re-timing would have left them silently disagreeing.
    expect(apexPxOf([3])).toBeCloseTo(11.5 * Math.pow(airtimeOf(3), 2), 3);
    expect(apexPxOf([7])).toBeGreaterThan(apexPxOf([5]));
    // Mars: same throw, weaker pull, 2.64x the apex.
    expect(apexPxOf([3], "mars") / apexPxOf([3])).toBeCloseTo(9.81 / 3.71, 2);
  });

  it("arcPathsOf emits one finite SVG path per prop", () => {
    const paths = arcPathsOf([5, 3, 1]);
    expect(paths).toHaveLength(3);
    for (const p of paths) {
      expect(p.startsWith("M ")).toBe(true);
      expect(p).not.toMatch(/NaN|Infinity/);
    }
  });
});
