import {
  airtimeOf,
  apexScale,
  APEX_PER_BEAT2_EARTH,
  HAND_X,
  type Planet,
  type Prop,
  type PropPosition,
} from "./engine";

// ── Synchronous siteswap ─────────────────────────────────────────────────────
//
// Vanilla siteswap assumes the hands ALTERNATE: beat 0 right, beat 1 left, and
// so on forever. Synchronous siteswap — "sync" — assumes they throw TOGETHER.
// Every beat carries two throws, one per hand, written as a bracketed pair:
//
//     (4,2x)(2x,4)
//      │ │   └── right hand's throw on beat 2
//      │ └────── right hand's throw on beat 0
//      └──────── left hand's throw on beat 0
//
// Two rules that fall out of throwing together:
//
//   1. ALL VALUES ARE EVEN. With both hands throwing on the same beat, only
//      even beats exist — there is no "beat 1" for an odd throw to land on. A
//      sync pattern containing an odd digit is malformed.
//
//   2. `x` MEANS CROSSING. In vanilla, parity decides whether a throw changes
//      hands. That trick is gone here (everything is even), so sync marks it
//      explicitly: `4` returns to the throwing hand, `4x` crosses to the other.
//
// That is the whole extension. It is a SECOND TIMING MODE rather than a patch
// to the first, which is why it lives in its own file: the vanilla path is
// proven across 670 patterns and gains nothing from being made conditional.
//
// WHY IT WAS WORTH BUILDING (John, and it is a better argument than
// completeness): the BOX — `(4,2x)(2x,4)` — is how a juggler switches shower
// direction. Two column throws up the sides, one ball shuttling across the
// middle, and it is the hinge between shower-right and shower-left. The engine
// could already render both of those and not the move connecting them.

// PASSING HAS THE SAME PARITY SPLIT, and it is worth recording here because it
// is the same idea one level up (John, first-hand):
//
//   · SIX and EIGHT clubs between two jugglers — SYNCHRONISED. Both throw at
//     the same instant, so passes leave together and cross in flight.
//   · SEVEN and NINE — STAGGERED. The jugglers are offset by a beat and the
//     passes interleave.
//
// Even counts synchronise, odd counts stagger — the same parity rule that makes
// a solo even count a fountain and a solo odd count a cascade, showing up again
// between two bodies. In a nine-club pass every right-hand throw is a pass,
// thrown higher than the self-throws because it has further to travel on the
// same beat. (Clubs split 5 and 4, not evenly.)
//
// FEEDS DISTRIBUTE LOAD BY POSITION, not evenly (John, and it is the natural
// four-juggler pattern): the feeder passes on EVERY right-hand throw, the
// centre juggler every OTHER, and the ends every THIRD. The feeder is the
// bottleneck because it serves everyone — a two-handed single-threaded
// resource — which is why feeds have a practical size limit that rings do not.
//
// AND AT SCALE THE CLOCK GOES DISTRIBUTED. With four jugglers everyone can
// watch everyone. With fifty in a feed line, "the guys at the end time off the
// guy next to them" — nobody conducts, each juggler syncs locally with a
// neighbour, and timing propagates hop by hop. The failure mode is local drift:
// don't get caught napping.
//
// Passing notation itself is still NOT supported here — this is a note about
// what the physics does, not a claim that <4p3|3> parses.

export interface SyncThrow {
  /** How many beats later it lands. Always even. */
  value: number;
  /** `x` — does it change hands? */
  cross: boolean;
}

/** One beat of a sync pattern: what each hand throws, simultaneously. */
export interface SyncBeat {
  left: SyncThrow;
  right: SyncThrow;
}

export interface SyncValidity {
  legal: boolean;
  props: number;
  reason?: string;
}

// ── Parsing ─────────────────────────────────────────────────────────────────

/**
 * Parse `(4,2x)(2x,4)` into beats. Returns null if it is not sync notation at
 * all, so a caller can fall back to the vanilla parser.
 */
export function parseSync(text: string): SyncBeat[] | null {
  const cleaned = text.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleaned.startsWith("(")) return null;

  const groups = cleaned.match(/\([^)]*\)/g);
  if (!groups || groups.join("") !== cleaned) return null;

  const beats: SyncBeat[] = [];
  for (const g of groups) {
    const inner = g.slice(1, -1);
    const parts = inner.split(",");
    if (parts.length !== 2) return null;

    const one = (p: string): SyncThrow | null => {
      const m = p.match(/^([0-9a-f])(x?)$/);
      if (!m) return null;
      const ch = m[1];
      const value = ch >= "a" ? ch.charCodeAt(0) - 87 : Number(ch);
      return { value, cross: m[2] === "x" };
    };

    const left = one(parts[0]);
    const right = one(parts[1]);
    if (!left || !right) return null;
    beats.push({ left, right });
  }
  return beats.length ? beats : null;
}

/** Render beats back to text, so a round-trip is possible. */
export function formatSync(beats: SyncBeat[]): string {
  const one = (t: SyncThrow) => `${t.value > 9 ? String.fromCharCode(t.value + 87) : t.value}${t.cross ? "x" : ""}`;
  return beats.map((b) => `(${one(b.left)},${one(b.right)})`).join("");
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * A sync pattern is legal when every hand-beat slot is filled exactly once —
 * the same permutation rule as vanilla, but over (beat, hand) pairs rather than
 * bare beats, because two throws happen per beat.
 *
 * Sync beats advance by 2 (there are no odd beats), so a pattern of P bracket
 * groups occupies beats 0, 2, 4 … 2(P−1) and wraps at 2P.
 */
export function validateSync(beats: SyncBeat[]): SyncValidity {
  const span = beats.length * 2;

  let sum = 0;
  for (const b of beats) {
    for (const t of [b.left, b.right]) {
      if (t.value % 2 !== 0) {
        return { legal: false, props: 0, reason: `${t.value} is odd — sync throws must be even` };
      }
      sum += t.value;
    }
  }

  // props = average over ALL throws, and there are two per beat
  const props = sum / (beats.length * 2);
  if (!Number.isInteger(props)) {
    return { legal: false, props, reason: "the throws do not average to a whole number of props" };
  }

  // every (landing beat, landing hand) slot claimed exactly once
  const claimed = new Set<string>();
  for (let i = 0; i < beats.length; i++) {
    const beat = i * 2;
    for (const hand of ["left", "right"] as const) {
      const t = beats[i][hand];
      if (t.value === 0) continue; // an empty hand throws nothing
      const landBeat = (beat + t.value) % span;
      const landHand = t.cross ? (hand === "left" ? "right" : "left") : hand;
      const key = `${landBeat}:${landHand}`;
      if (claimed.has(key)) {
        return { legal: false, props, reason: `two props land in the ${landHand} hand on beat ${landBeat}` };
      }
      claimed.add(key);
    }
  }

  return { legal: true, props };
}

// ── Orbits ──────────────────────────────────────────────────────────────────

interface SyncFlight {
  throwBeat: number;
  value: number;
  fromRight: boolean;
  cross: boolean;
}

/**
 * Follow each prop around the pattern, exactly as the vanilla solver does, but
 * tracking (beat, hand) instead of beat alone.
 *
 * Repeats the pattern until every prop has its own chain — same reasoning as
 * vanilla `expand()`: a short period folds several props into one orbit and the
 * render silently loses props.
 */
export function syncOrbits(beats: SyncBeat[]): { orbits: SyncFlight[][]; cycleBeats: number } {
  const { props } = validateSync(beats);

  for (let reps = 1; reps <= 32; reps++) {
    const span = beats.length * 2 * reps;
    const claimed = new Set<string>();
    const orbits: SyncFlight[][] = [];

    const at = (beat: number, hand: "left" | "right"): SyncThrow =>
      beats[(beat / 2) % beats.length][hand];

    for (let start = 0; start < span; start += 2) {
      for (const startHand of ["right", "left"] as const) {
        const key0 = `${start}:${startHand}`;
        if (claimed.has(key0)) continue;
        if (at(start, startHand).value === 0) continue;

        const orbit: SyncFlight[] = [];
        let beat = start;
        let hand: "left" | "right" = startHand;
        do {
          claimed.add(`${beat}:${hand}`);
          const t = at(beat, hand);
          orbit.push({ throwBeat: beat, value: t.value, fromRight: hand === "right", cross: t.cross });
          const next = (beat + t.value) % span;
          hand = t.cross ? (hand === "left" ? "right" : "left") : hand;
          beat = next;
        } while (!(beat === start && hand === startHand));

        orbits.push(orbit);
      }
    }

    if (orbits.length >= props) return { orbits, cycleBeats: span };
  }

  // Fallback: one repetition, whatever it gives us.
  return { orbits: [], cycleBeats: beats.length * 2 };
}

// ── Sampling ────────────────────────────────────────────────────────────────

/**
 * Where every prop sits at time t. Mirrors the vanilla sampler's shape — same
 * parabola, same carry behaviour, same gravity parameter — so the two paths
 * produce visually consistent patterns.
 *
 * The geometry constants are IMPORTED, not restated. Both samplers throw from
 * the same hands into the same space, so "visually consistent" has to be
 * structural rather than two copies of 64 that happen to agree today.
 */
export function sampleSyncAt(
  beats: SyncBeat[],
  t: number,
  opts: { planet?: Planet; prop?: Prop; spinsFor?: (v: number) => number } = {},
): PropPosition[] {
  const { planet = "earth", prop = "balls", spinsFor } = opts;
  const { orbits, cycleBeats } = syncOrbits(beats);
  const apexUnit = APEX_PER_BEAT2_EARTH * apexScale(planet);
  const tt = ((t % cycleBeats) + cycleBeats) % cycleBeats;

  return orbits.map((orbit) => {
    for (const f of orbit) {
      for (const shift of [-cycleBeats, 0, cycleBeats]) {
        const start = f.throwBeat + shift;
        const air = airtimeOf(f.value);
        if (tt >= start && tt < start + air) {
          const p = (tt - start) / air;
          const x1 = f.fromRight ? HAND_X : -HAND_X;
          // Sync marks crossing EXPLICITLY with `x`, rather than inferring it
          // from parity the way vanilla does — every sync value is even, so
          // parity carries no information here.
          const x2 = f.cross ? -x1 : x1;
          const apex = apexUnit * air * air;
          // NOTE: this default spin table is NOT conventionalSpins from
          // engine.ts -- a sync 4 gets one flip here where a vanilla 4 gets
          // two. The divergence is historical rather than principled, but the
          // Box has been verified BY EYE against the real pattern with these
          // numbers, so unifying the tables changes approved art. Decide
          // deliberately, with a juggler looking, not in a cleanup pass.
          const spins = prop === "clubs" ? (spinsFor?.(f.value) ?? (f.value <= 2 ? 0 : f.value <= 4 ? 1 : 2)) : 0;
          return {
            x: x1 + (x2 - x1) * p,
            y: -4 * apex * p * (1 - p),
            spin: spins * 360 * p * (f.fromRight ? 1 : -1),
            airborne: true,
          };
        }
      }
    }

    // Held: ease from where it landed toward the hand's next throw.
    let bestLand = -Infinity;
    let heldAt = 0;
    for (const f of orbit) {
      for (const shift of [-cycleBeats, 0, cycleBeats]) {
        const start = f.throwBeat + shift;
        const land = start + airtimeOf(f.value);
        if (land <= tt && land > bestLand) {
          bestLand = land;
          const x1 = f.fromRight ? HAND_X : -HAND_X;
          heldAt = f.cross ? -x1 : x1;
        }
      }
    }
    let nextThrow = Infinity;
    let nextX = heldAt;
    for (const f of orbit) {
      for (const shift of [-cycleBeats, 0, cycleBeats]) {
        const start = f.throwBeat + shift;
        if (start >= tt && start < nextThrow) {
          nextThrow = start;
          nextX = f.fromRight ? HAND_X : -HAND_X;
        }
      }
    }
    const spanHold = Math.max(nextThrow - bestLand, 0.001);
    const p = Math.min(Math.max((tt - bestLand) / spanHold, 0), 1);
    return { x: heldAt + (nextX - heldAt) * p, y: 4 * Math.sin(p * Math.PI), spin: 0, airborne: false };
  });
}

/** The Box: two columns up the sides, one prop shuttling across the middle. */
export const BOX = parseSync("(4,2x)(2x,4)")!;

/**
 * Sync flight paths, mirroring the vanilla arcPathsOf — engine-owned for the
 * same reason: a trail must come from the sampler the props ride.
 */
export function syncArcPathsOf(
  beats: SyncBeat[],
  opts: { planet?: Planet; prop?: Prop; steps?: number } = {},
): string[] {
  const { steps = 90 } = opts;
  const { cycleBeats } = syncOrbits(beats);
  const frames = Array.from({ length: steps + 1 }, (_, i) =>
    sampleSyncAt(beats, (i / steps) * cycleBeats, opts),
  );
  const n = frames[0]?.length ?? 0;
  return Array.from({ length: n }, (_, k) =>
    frames.map((f, i) => `${i === 0 ? "M" : "L"} ${f[k].x.toFixed(1)} ${f[k].y.toFixed(1)}`).join(" "),
  );
}
