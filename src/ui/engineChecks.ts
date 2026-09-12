import { validate, airborneMean, expand, orbitsOf, sampleAt } from "../engine";
import { parseSync, formatSync, validateSync, syncOrbits, sampleSyncAt, BOX } from "../sync";

/**
 * The engine's guarantees, checked IN THE BROWSER.
 *
 * The repo's Jest suite is the real one and it is what CI runs. This is a
 * second, smaller harness that exists for a different reason: the tests are
 * arguably the most interesting thing here, and a visitor should be able to
 * watch the guarantee being proved rather than take a badge's word for it.
 *
 * So these are not mocks or a canned result. Every check below calls the same
 * exported functions the deck and the explorer call, and the numbers on screen
 * are computed at the moment you press Run. If somebody breaks the engine and
 * deploys it, this page goes red on its own.
 *
 * Kept deliberately free of any test framework: plain functions returning
 * pass/fail counts, so nothing needs bundling that would not otherwise ship.
 */

export interface CheckResult {
  name: string;
  passed: number;
  total: number;
  /** First failure, if any — enough to see what went wrong without a console. */
  detail?: string;
}

type Assert = (ok: boolean, detail: string) => void;

function group(name: string, body: (t: Assert) => void): CheckResult {
  let passed = 0;
  let total = 0;
  let detail: string | undefined;
  const t: Assert = (ok, d) => {
    total++;
    if (ok) passed++;
    else if (!detail) detail = d;
  };
  try {
    body(t);
  } catch (e) {
    total++;
    detail = detail ?? `threw: ${(e as Error).message}`;
  }
  return { name, passed, total, detail };
}

/** Every legal vanilla pattern up to a given period. Used by two checks. */
function* allPatterns(maxPeriod: number, maxThrow = 9) {
  for (let period = 1; period <= maxPeriod; period++) {
    const digits = new Array(period).fill(0);
    const rec = function* (i: number): Generator<number[]> {
      if (i === period) {
        yield [...digits];
        return;
      }
      for (let v = 0; v <= maxThrow; v++) {
        digits[i] = v;
        yield* rec(i + 1);
      }
    };
    yield* rec(0);
  }
}

export const CHECKS: (() => CheckResult)[] = [
  () =>
    group("Notation", (t) => {
      t(validate([3]).legal, "3 should be legal");
      t(validate([5, 3, 1]).legal, "531 should be legal");
      t(validate([9, 7, 5, 3, 1]).legal, "97531 should be legal");
      t(!validate([5, 3, 2]).legal, "532 does not average to a whole number");
      t(!validate([4, 3]).legal, "43 collides");
    }),

  () =>
    group("Props = average", (t) => {
      t(validate([3]).props === 3, "3 is three balls");
      t(validate([5]).props === 5, "5 is five balls");
      t(validate([5, 3, 1]).props === 3, "531 is three balls");
      t(validate([7, 4, 4]).props === 5, "744 is five balls");
      t(validate([9, 7, 5, 3, 1]).props === 5, "97531 is five balls");
    }),

  () =>
    group("N − 2H airborne", (t) => {
      t(airborneMean(3) === 1, "three balls, one in the air");
      t(airborneMean(5) === 3, "five balls, three in the air");
      t(airborneMean(7) === 5, "seven balls, five in the air");
      t(airborneMean(13) === 11, "thirteen rings, eleven in the air");
    }),

  () =>
    group("Every prop gets an orbit", (t) => {
      for (const p of [[3], [4], [5], [7], [5, 3, 1], [4, 4, 1], [9, 7, 5, 3, 1], [13]]) {
        const v = validate(p);
        const { orbits } = orbitsOf(expand(p));
        t(orbits.length === v.props, `${p.join("")} should resolve to ${v.props} orbits, got ${orbits.length}`);
      }
    }),

  () =>
    group("Legal ⇒ it renders", (t) => {
      // The headline guarantee, brute-forced: every legal vanilla pattern up to
      // period four must produce finite coordinates for every prop.
      let checked = 0;
      for (const p of allPatterns(4)) {
        const v = validate(p);
        if (!v.legal || v.props === 0) continue;
        checked++;
        const pos = sampleAt(expand(p), 1.3);
        const ok = pos.length === v.props && pos.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y));
        t(ok, `${p.join("")} failed to render`);
      }
      t(checked > 600, `expected 600+ legal patterns, found ${checked}`);
    }),

  () =>
    group("Sync notation", (t) => {
      const box = parseSync("(4,2x)(2x,4)");
      t(box !== null, "the Box should parse");
      t(formatSync(box!) === "(4,2x)(2x,4)", "the Box should round-trip");
      t(validateSync(box!).legal, "the Box should be legal");
      t(validateSync(box!).props === 3, "the Box is three props");
      t(parseSync("531") === null, "vanilla input should fall through");
      t(!validateSync(parseSync("(3,3)")!).legal, "odd sync throws are malformed");
    }),

  () =>
    group("The Box runs", (t) => {
      const { orbits, cycleBeats } = syncOrbits(BOX);
      t(orbits.length === 3, `the Box should have three orbits, got ${orbits.length}`);
      const frames = Array.from({ length: 40 }, (_, i) => sampleSyncAt(BOX, (i / 40) * cycleBeats));
      t(
        frames.every((f) => f.length === 3 && f.every((q) => Number.isFinite(q.x))),
        "every frame should place three props",
      );
      // one prop crosses the middle, two stay on their own side
      const sides = [0, 1, 2].map((i) => new Set(frames.map((f) => Math.sign(f[i].x)).filter((s) => s !== 0)));
      t(sides.filter((s) => s.size === 1).length >= 2, "two props should hold their own side");
      t(sides.filter((s) => s.size > 1).length >= 1, "one prop should shuttle across");
    }),

  () =>
    group("Gravity is a parameter", (t) => {
      const earth = sampleAt(expand([5]), 1.2, { planet: "earth" });
      const mars = sampleAt(expand([5]), 1.2, { planet: "mars" });
      const peak = (ps: { y: number }[]) => Math.min(...ps.map((q) => q.y));
      t(peak(mars) < peak(earth), "the same pattern should fly higher on Mars");
      t(earth.length === mars.length, "prop count should not depend on gravity");
    }),
];

export function runAll(): CheckResult[] {
  return CHECKS.map((c) => c());
}
