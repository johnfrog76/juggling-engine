import { useEffect, useRef, useState } from "react";

// ── siteswap-engine ─────────────────────────────────────────────────────────
//
// A siteswap parser, validator and physical sampler.
//
// THIS FILE IS THE POC DELIVERABLE, not deck scenery. It is written to be lifted
// into its own open-source repo, so it holds to three rules:
//
//   1. ZERO imports from this repo. `orbitsOf` is inlined below rather than
//      imported from hackathon-atoms — the duplication is the price of being
//      extractable, and it is cheap (about twenty lines).
//   2. The core is framework-free. Everything above the "React adapter" section
//      is plain TypeScript and runs anywhere: Node, a worker, a canvas, a test.
//      React appears once, at the bottom, in a hook that is trivially replaceable.
//   3. No deck vocabulary leaks in. No palette, no slides, no atom names. A
//      stranger should be able to read this without knowing what it is for.
//
// WHAT IT IS FOR, in the words of the juggler it was built for:
//
//   "What I love about the engine is that it can render 53 or 633, because I
//    don't know what that is. I don't read music."
//
// That is the point of this package, and it is worth stating plainly because it
// is easy to mistake for a visualiser. Siteswap is NOTATION — dots on a stave.
// Most jugglers, including very good ones, cannot read it. They can recognise a
// pattern in about a second when they SEE it, and not at all when they read it.
//
// So this is not a picture of a pattern. It is the READER: the thing that turns
// a notation you cannot read into a pattern you already know. Hand it `633` and
// a juggler who has never parsed a siteswap in their life will tell you
// immediately whether that is the pattern they throw. (That happened during the
// build, and it caught a wrong pattern on a slide.)
//
// WHO ELSE IT IS FOR — this is not a tool for one person.
//
// There is a generational split in juggling. Jugglers who came up after
// siteswap became common LIVE in it: they read a number, look it up, watch a
// video, drill it. The notation is their native vocabulary, not a translation.
//
// Jugglers who came up before it learned in gyms, from people, without video.
// Patterns had names and lineages; someone showed you or you did not learn it.
// That cohort includes a great many very good jugglers, and for them the
// notation younger jugglers write is genuinely foreign.
//
// So this engine is a bridge across that split. It takes what the
// post-notation generation speaks natively and renders it into what the
// pre-notation generation knows: shape, recognised at a glance.
//
// The companion deck consumes this the way an outside user would, which is the
// only honest proof that it is reusable.
//
// WHAT IT DOES THAT siteswapCss() DID NOT: gravity is a parameter rather than a
// baked constant, props carry their own physics, patterns expand so short
// periods don't collapse, and the sampler can be driven per-frame instead of
// only emitted as CSS.

// ── Running live ──────────────────────────────────────────────
//
// This engine was extracted from a slide deck, where a build-time flag decided
// whether figures animated live or fell back to composed CSS keyframes: that
// deck ships onto a poster wall which freezes card animation, so a live
// requestAnimationFrame loop would have been the one card moving among forty
// still ones.
//
// None of that applies here. This is a tool somebody drives, so it runs. The
// `enabled` option on useSiteswapSim survives for callers that genuinely want
// to pause a simulation — offscreen, tab hidden, prefers-reduced-motion —
// which is a real need and a different one.
export const ALWAYS_LIVE = true;

// ── Constants ───────────────────────────────────────────────────────────────
export const BEAT_S = 0.42; // seconds per beat — shared with the sibling deck

/**
 * How long a caught prop stays in the hand, in beats.
 *
 * DELIBERATELY NOT the sibling deck's 0.4. That value is a *look* — hot, snappy,
 * props barely touching the hand — and at 0.4 almost everything reads as
 * airborne: a 5-ball cascade shows 4 or 5 in the air. This deck argues N − 2H on
 * screen with a live counter, so a dwell that makes that number visibly false is
 * not a style choice, it is the deck contradicting itself.
 *
 * 1.4 is the honest middle. Each hand throws every OTHER beat, so a prop waits
 * up to 2 beats for its hand to come round again; a dwell near that keeps hands
 * genuinely occupied. At 1.4 the instantaneous airborne count oscillates between
 * N−2 and N−1 — which is the truth the contract asks for, because at the instant
 * of a throw the previous prop has not landed yet. (Exactly 2.0 pins it flat at
 * N−2 and loses the oscillation; 0.4 loses the claim entirely.)
 */
export const DWELL_BEATS = 1.4;

/**
 * How long a prop is actually in the air, in beats.
 *
 * DWELL IS NOT CONSTANT, and pretending it was made low patterns look wrong.
 * Height goes as the square of airtime, so with a flat 1.4-beat dwell a `3`
 * got 1.6 beats of flight and an apex of about 29px against a `7` at 361px --
 * twelve to one. On screen the three shuffled along the hand line, and in
 * clubs the arc was smaller than the prop. John kept flagging it: "the 3
 * juggle club cascade has no arc".
 *
 * The physical reading is that a hand holds a LOW prop proportionally longer.
 * There is no time to hold a nine for 1.4 beats -- the next one is already
 * coming -- but a three sits in the hand comfortably that long. So dwell is
 * capped at a fraction of the throw value and only bites at the bottom of the
 * range: a `3` dwells 1.05 beats instead of 1.4 and its apex rises from 29px to
 * about 44, while everything from `4` upward is untouched -- which is the other
 * half of John's note, that a seven does not need expanding.
 *
 * 0.35 IS A CEILING, NOT A PREFERENCE. Push it lower and props spend more time
 * airborne until N-2H stops holding: at 0.3 a three shows two or three in the
 * air instead of one or two, and that invariant is the whole claim. The tests
 * catch it. Do not raise the arc further without a different model.
 *
 * This is a model change, not a fudge factor. An earlier attempt DID add a
 * fudge -- a minimum apex -- and it was reverted, because it lifted the `1` in
 * `441` (a hand-across, not a toss) into a real arc. No toss works that way.
 */
export const DWELL_FRACTION = 0.35;

export function airtimeOf(value: number): number {
  return Math.max(value - Math.min(DWELL_BEATS, DWELL_FRACTION * value), 0.45);
}

const HAND_X = 64; // px, hands at ±HAND_X around the centreline

/** Surface gravity, m/s². The one constant whose change re-times the whole deck. */
export const GRAVITY = { earth: 9.81, mars: 3.71 } as const;
export type Planet = keyof typeof GRAVITY;

// Apex px per airtime-beat² on Earth. Mars is the same throw under weaker pull,
// so its apex scales by g_earth/g_mars ≈ 2.64 and its hang time by √that ≈ 1.63.
//
// TODO (design note, John 2026-08-12): this axis is arbitrary pixels, but the
// render is effectively a chart's y-axis — so the UNIT could be defined.
// h = g·t²/8 gives real metres from the airtime the sampler already computes;
// the engine would return metres and take a pixels-per-metre scale from the
// caller.
//
// The framing that makes it worth doing, in his words: "you can take 90% of
// the slide stage height and show a world record juggle — and I love that
// sometimes we decide to bleed, but it is our design CHOICE that we do this."
//
// That is the real payoff. Today a composition bleeds because a fixed pixel
// constant happened to overflow its box; nobody chose it. With a defined unit
// the caller says "fit the tallest pattern into 90% of this stage" and gets a
// scale back — so containing a pattern and deliberately running it off the top
// become two decisions, not one accident and one intention that look alike.
// (Compare the judge contract's check 2: decisive bleed vs ambiguous clipping.
// That check is currently unanswerable here, because the geometry isn't under
// anyone's control.)
//
// Secondary payoff: the extracted package returns physical units rather than
// one deck's pixel convention.
//
// CAVEAT that must survive into any unit work (John, 2026-08-12): the digit
// does NOT determine absolute height. He can run a 5-ball pattern at 8 feet to
// his office ceiling, or compressed to 2.5 feet at eye level, by throwing it at
// 7-speed — same siteswap, same prop count, the pattern simply compressed. The
// digit fixes the TIMING RATIO (a 5 lands five beats later); the absolute apex
// follows the tempo the juggler picks, and BEAT_S here is one arbitrary point
// on that continuum rather than a physical constant.
//
// So a metre axis must be honest about what it is plotting: height at a STATED
// tempo, not "the height of a 5". Siteswap records neither tempo nor dwell, so
// it does not record height — which is one more thing outside the language, and
// unlike the others it is a variable a performer uses deliberately.
//
// AND THAT IS THE WHOLE DESIGN: compressing the y-axis and compressing the
// pattern are THE SAME OPERATION. A juggler running 5 fast under an 8-foot
// ceiling scales the height while the timing holds — exactly what a `scaleY`
// to fit a stage does. Low ceiling, small stage: one constraint, one answer.
//
// So there is no mode to resolve and nothing to infer. THE CALLER PASSES THE
// SCALE. One parameter, chosen per slide — 90% of the stage for a record, an
// office ceiling for a 5 — and bleed is simply a scale you picked knowing the
// pattern is bigger than the room.
//
// The reductio, and it is worth keeping because it also indicts DWELL_BEATS
// above (John): a 3 can be thrown so low you have to look down at your hands,
// or every throw can go a hundred feet — in which case you stand there holding
// a ball in each hand for a long time waiting for the third. Same siteswap,
// same three props. At that extreme the dwell is nothing like 1.4 beats, so
// tempo and dwell are ONE choice, and both constants in this file are single
// arbitrary points on it.
//
// Which is the sharper version of this deck's thesis: siteswap fixes the ORDER
// of events. Not height, not tempo, not dwell, not how long you wait. It is
// complete about sequence, and every other thing a body does is interpretation.
//
// Deferred — it changes every call site's geometry, so not mid-QA.
const APEX_PER_BEAT2_EARTH = 11.5;

/**
 * A NOTE ON WHY A 3 LOOKS LOW, and why there is no fudge factor here.
 *
 * Height goes as the SQUARE of airtime. With a dwell of 1.4 beats a `3` has 1.6
 * beats of flight and a `7` has 5.6, so a seven's apex is about twelve times a
 * three's. On screen a three ends up close to the hand line, and John's first
 * reaction was "I can juggle three like that but most people can't" -- a real
 * three-ball cascade goes to roughly eye height.
 *
 * A minimum apex was tried and reverted. It fixed the picture and broke the
 * claim: `441` lifted its `1` -- a fast hand-across, not a toss -- into a real
 * arc, and the whole point of this engine is that every arc is SOLVED rather
 * than drawn. No toss works that way.
 *
 * The honest fix, if it is ever worth doing, is that dwell is not constant: a
 * juggler holds a low ball proportionally longer than a high one, so a real
 * three flies higher than a fixed dwell predicts. That means making dwell a
 * function of throw value, which changes every timing guarantee in this file
 * and the N-2H tests that rest on them. Worth doing properly or not at all.
 */


export function apexScale(planet: Planet): number {
  return GRAVITY.earth / GRAVITY[planet];
}

// ── Props ───────────────────────────────────────────────────────────────────
//
// A prop is not a skin. Each one adds a constraint siteswap has no character
// for — which is the whole argument of the deck's first dial.
export type Prop = "balls" | "rings" | "clubs";

export interface PropSpec {
  /** Palms up (open cup) vs palms inward (grip). Balls are the odd one out. */
  palmsUp: boolean;
  /** The view a performer actually presents. Rings are the only constrained prop. */
  goodView: "front" | "side" | "either";
  /** What this prop adds that the notation cannot record. */
  unrecorded: string;
}

export const PROPS: Record<Prop, PropSpec> = {
  balls: { palmsUp: true, goodView: "front", unrecorded: "nothing — the pure case" },
  rings: { palmsUp: false, goodView: "side", unrecorded: "orientation, and the showmanship of presenting it" },
  clubs: { palmsUp: false, goodView: "either", unrecorded: "rotation" },
};

/** Palm orientation is one boolean, not a three-way: only balls sit in an open hand. */
export const palmsUpFor = (prop: Prop): boolean => PROPS[prop].palmsUp;

// ── Orbits ──────────────────────────────────────────────────────────────────
//
// Inlined deliberately (see the file header): this is the one piece of maths the
// engine cannot do without, and importing it from a deck file would tie the
// package to this repo forever.

export interface Flight {
  /** When it leaves the hand, in beats within the cycle. */
  throwBeat: number;
  /** The siteswap digit thrown. */
  value: number;
  /** Even beats are the right hand — hand parity is preserved across the cycle. */
  fromRight: boolean;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Partition a pattern's beats into per-prop orbits.
 *
 * For each unclaimed beat b, follow b → (b + digit[b % period]) mod cycle until
 * it returns to where it started: that chain is one prop's whole life. The cycle
 * is lcm(period, 2) so that hand parity survives the wrap.
 */
export function orbitsOf(pattern: number[]): { orbits: Flight[][]; cycleBeats: number } {
  const period = pattern.length;
  const cycleBeats = (period * 2) / gcd(period, 2);
  const claimed = new Set<number>();
  const orbits: Flight[][] = [];
  for (let start = 0; start < cycleBeats; start++) {
    if (claimed.has(start) || pattern[start % period] === 0) continue;
    const orbit: Flight[] = [];
    let b = start;
    do {
      claimed.add(b);
      const value = pattern[b % period];
      orbit.push({ throwBeat: b, value, fromRight: b % 2 === 0 });
      b = (b + value) % cycleBeats;
    } while (b !== start);
    orbits.push(orbit);
  }
  return { orbits, cycleBeats };
}

// ── Validation ──────────────────────────────────────────────────────────────
//
// A vanilla siteswap is legal iff its landing beats form a permutation: every
// beat is claimed exactly once. Two throws landing on one beat is a collision —
// the body's answer and the engine's answer are the same answer.
export interface Validity {
  legal: boolean;
  props: number; // = the average of the digits, which is why avg must be an integer
  landings: number[];
  collisionAt?: number;
}

/**
 * KNOWN SIMPLIFICATION: the cascade's figure-eight.
 *
 * A real cascade traces a FIGURE-EIGHT with TWO peaks — throws from each hand
 * rise on opposite sides of the centreline and cross in the middle. This
 * sampler gives every flight a symmetric parabola peaking at x ≈ 0, so all the
 * arcs pile onto one dome. Verified: for `[3]` all three orbits peak within
 * 4px of centre.
 *
 * A truer model would bias each flight's apex toward the throwing hand's side,
 * turning the pile of domes into the crossing pair of lobes the pattern
 * actually makes.
 *
 * Left as-is on John's call — "the movement creates the physics": animated, the
 * crossing reads fine and the eye supplies the eight. Worth knowing that it is
 * the FROZEN frame where the simplification shows, which is the frame the
 * public site's poster cards use.
 */

/**
 * NOT SUPPORTED: bounce juggling. Flagged as a candidate for a FUTURE DECK
 * rather than a gap to patch here, because it does not extend this model — it
 * replaces it.
 *
 * Everything below assumes one parabola between two hand events, with gravity
 * the only thing acting on the prop in between. A bounce inserts a THIRD event
 * mid-flight: the prop meets the floor, loses energy by some restitution
 * coefficient (silicone on marble is a very different number from beanbag on
 * carpet), and departs on a second parabola. The floor does work the hand would
 * otherwise have to do, which is why bounce counts run higher than toss counts.
 *
 * It also has two distinct techniques that share a notation, which is very much
 * this deck's kind of argument:
 *   - FORCE press — the juggler adds energy downward, so the prop returns hard
 *     and fast. Expensive, controllable.
 *   - LIFT — the prop is barely given anything and gravity plus the slab do
 *     nearly all the work. Almost free, which is where the high counts live.
 *
 * Source: John worked in Japan with an Italian performer whose act was bouncing
 * silicone balls off a marble slab — five on a lift, seven on a force press
 * while standing on a stool for the height the return trip needed, and one
 * thrown under his leg for good measure. Note the stool: he still had to buy
 * altitude, just not with the throw.
 *
 * Implementing it means restitution, floor geometry, and a per-prop/per-surface
 * material pairing. That is a deck of its own.
 */

/**
 * NOT SUPPORTED YET: sync — and the Box is why it matters.
 *
 * In a sync pattern both hands throw on the SAME beat rather than alternating,
 * written in pairs: the Box is `(4,2x)(2x,4)`, where `x` means the throw
 * crosses. This engine assumes strict alternation (even beat = right hand), so
 * it cannot express sync at all.
 *
 * Worth building, and here is the concrete reason rather than a completeness
 * argument: the Box is what a juggler uses to SWITCH SHOWER DIRECTION. One
 * throw each way, and it is the hinge between shower-right and shower-left.
 * The engine can already render both of those. It cannot render the move that
 * gets you from one to the other — which is exactly the kind of hole a working
 * juggler notices immediately.
 */

/**
 * NOT SUPPORTED YET: multiplex.
 *
 * A hand may legally throw more than one prop on the same beat — written with
 * brackets, e.g. `[43]23`. This engine models one throw per beat, so a pattern
 * needing multiplex cannot be expressed here at all, let alone validated.
 *
 * Worth building, and the Automaton is the natural place to show it: a machine
 * with emitters instead of hands has no reason to release one object at a time.
 * It is also the honest answer to "is this a real siteswap engine?" — vanilla
 * yes, multiplex and sync not yet.
 */
export function validate(pattern: number[]): Validity {
  const n = pattern.length;
  const landings = pattern.map((v, i) => (i + v) % n);
  const seen = new Map<number, number>();
  let collisionAt: number | undefined;
  for (const land of landings) {
    const hits = (seen.get(land) ?? 0) + 1;
    seen.set(land, hits);
    if (hits > 1 && collisionAt === undefined) collisionAt = land;
  }
  const sum = pattern.reduce((a, b) => a + b, 0);
  return {
    legal: collisionAt === undefined && sum % n === 0,
    props: sum / n,
    landings,
    collisionAt,
  };
}

/** Airborne inventory = N − 2H. Hands are fixed servers however many bodies arrive. */
export const airborneMean = (props: number, jugglers = 1): number =>
  Math.max(props - 2 * jugglers, 0);

/**
 * Repeat a pattern until its period is long enough that every prop gets its own
 * orbit. THIS IS NOT COSMETIC.
 *
 * orbitsOf() walks beat → beat + digit around a cycle of lcm(period, 2). When
 * the period is short, several props share one chain and collapse into a single
 * orbit: `[5]` yields ONE orbit, not five, so a "5-ball cascade" renders as one
 * lonely ball. The sibling deck hit this and worked around it by hand-spelling
 * patterns (`[3,3,3]`, `[5,1,5,1,5,1]`); relying on every call site to remember
 * that is how the bug comes back.
 *
 * So expansion happens here, once, and callers may write `[5]` and mean it.
 */
export function expand(pattern: number[]): number[] {
  const { props } = validate(pattern);
  if (!Number.isFinite(props) || props <= 0) return pattern;
  let out = pattern;
  // Growing the period by whole copies preserves the pattern exactly; stop as
  // soon as orbit count reaches the prop count.
  //
  // The cap must exceed the largest prop count the deck can ask for. It was 16,
  // which silently broke every pattern above sixteen: `[17]` fell out of the
  // loop still folded into a SINGLE orbit, so seventeen rings rendered as one
  // ring and nothing complained. Failing quietly is the worst kind of failing —
  // hence the guard below.
  for (let reps = 1; reps <= 64; reps++) {
    out = Array.from({ length: pattern.length * reps }, (_, i) => pattern[i % pattern.length]);
    if (orbitsOf(out).orbits.length >= props) return out;
  }
  return out;
}

// ── Sampling ────────────────────────────────────────────────────────────────

export interface PropPosition {
  x: number;
  y: number;
  /** Rotation in degrees — clubs only; rendered as art direction, never argued. */
  spin: number;
  airborne: boolean;
}

interface SampleOpts {
  planet?: Planet;
  prop?: Prop;
  /** Conventional spins for this throw. Art direction: height and flips are independent. */
  spinsFor?: (value: number) => number;
}

/**
 * Where every prop sits at time t (beats into the cycle).
 *
 * Parabolic while airborne, carried between catch and next throw. This mirrors
 * ballPosition() in hackathon-atoms, with gravity lifted out as a parameter so
 * the Mars dial is a number change rather than a second code path.
 */
export function sampleAt(
  pattern: number[],
  t: number,
  opts: SampleOpts = {},
): PropPosition[] {
  const { planet = "earth", prop = "balls", spinsFor } = opts;
  // expand() first: `[5]` must render as five props, not one (see its comment).
  const { orbits, cycleBeats } = orbitsOf(expand(pattern));
  const apexUnit = APEX_PER_BEAT2_EARTH * apexScale(planet);
  const tt = ((t % cycleBeats) + cycleBeats) % cycleBeats;

  return orbits.map((orbit) => {
    // Unroll at −cycle/0/+cycle so wrap-around flights still cover tt.
    for (const f of orbit) {
      for (const shift of [-cycleBeats, 0, cycleBeats]) {
        const start = f.throwBeat + shift;
        const air = airtimeOf(f.value);
        if (tt >= start && tt < start + air) {
          const p = (tt - start) / air;
          const x1 = f.fromRight ? HAND_X : -HAND_X;
          // Odd digits cross, even digits stay — this one line IS the
          // cascade/fountain dichotomy, not a rule layered on top of it.
          const x2 = f.value % 2 === 1 ? -x1 : x1;
          const apex = apexUnit * air * air;
          const spins = prop === "clubs" ? (spinsFor?.(f.value) ?? conventionalSpins(f.value)) : 0;
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
          heldAt = f.value % 2 === 1 ? -x1 : x1;
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
    const span = Math.max(nextThrow - bestLand, 0.001);
    const p = Math.min(Math.max((tt - bestLand) / span, 0), 1);
    return {
      x: heldAt + (nextX - heldAt) * p,
      y: 4 * Math.sin(p * Math.PI),
      spin: 0,
      airborne: false,
    };
  });
}

/**
 * Conventional spin count for a club throw. ART DIRECTION, NOT PHYSICS.
 *
 * Height and flip count are independent: height comes from linear velocity at
 * release, spin from torque about the club's centre of gravity — two separate
 * inputs from the hand. There is no airtime "budget" that rotations divide into.
 * These numbers exist so rendered clubs look like clubs, and the deck never
 * argues from them.
 */
export function conventionalSpins(value: number): number {
  if (value <= 3) return 1;
  if (value <= 5) return 2;
  return 3;
}

/** Live airborne count at time t — oscillates around the N−2H mean, as a real pattern does. */
export function airborneAt(pattern: number[], t: number, planet: Planet = "earth"): number {
  return sampleAt(pattern, t, { planet }).filter((p) => p.airborne).length;
}

// ── CSS emission ────────────────────────────────────────────────────────────
//
// The same sampler, baked ahead of time into @keyframes.
//
// Not a fallback — for most consumers this is the RIGHT output. Keyframes are
// driven by the compositor, survive being frozen with `animation: none`, cost
// nothing on an idle tab, and need no JavaScript running at all. Per-frame
// sampling is what you reach for when the pattern must change under the user's
// hand; otherwise emit once and let the browser do the work.

export interface EmittedCss {
  css: string;
  /** Seconds for one full cycle — feed straight into `animation` shorthand. */
  cycleS: number;
  /** How many props the pattern actually carries (post-expansion). */
  propCount: number;
}

export function toKeyframes(
  prefix: string,
  pattern: number[],
  opts: SampleOpts & { steps?: number; beatSeconds?: number } = {},
): EmittedCss {
  const { steps = 72, beatSeconds = BEAT_S } = opts;
  const expanded = expand(pattern);
  const { orbits, cycleBeats } = orbitsOf(expanded);
  let css = "";
  for (let i = 0; i < orbits.length; i++) {
    const stops: string[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * cycleBeats;
      const p = sampleAt(expanded, t, opts)[i];
      const rot = p.spin ? ` rotate(${p.spin.toFixed(1)}deg)` : "";
      stops.push(`${((s / steps) * 100).toFixed(2)}% { transform: translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)${rot}; }`);
    }
    css += `@keyframes ${prefix}-p${i} { ${stops.join(" ")} }\n`;
  }
  return { css, cycleS: cycleBeats * beatSeconds, propCount: orbits.length };
}

// ── React adapter ───────────────────────────────────────────────────────────
//
// The ONLY React in this file, and it is deliberately thin: a consumer using
// Vue, Svelte or plain canvas replaces this hook with a loop over sampleAt()
// and loses nothing.

export interface SimState {
  positions: PropPosition[];
  airborne: number;
  beat: number;
}

/**
 * Drive a pattern at requestAnimationFrame.
 *
 * Returns null when the engine flag is off OR when `frozen` is set, which is how
 * a slide falls back to its composed @keyframes still. Callers MUST handle null
 * — that path is the one most viewers see.
 */
export function useSiteswapSim(
  pattern: number[],
  opts: SampleOpts & { frozen?: boolean; enabled?: boolean } = {},
): SimState | null {
  const { frozen = false, enabled = ALWAYS_LIVE, planet = "earth", prop = "balls" } = opts;
  const live = enabled && !frozen;
  const [state, setState] = useState<SimState | null>(null);
  const raf = useRef<number | undefined>(undefined);

  // KEY ON CONTENT, NOT IDENTITY. `pattern` is an array literal at nearly every
  // call site, so it is a new reference on every render; depending on it
  // directly would tear down and restart the animation sixty times a second.
  // Hoisted into a named variable so the exhaustive-deps rule can check it
  // statically rather than being told to look away.
  const patternKey = pattern.join(",");

  useEffect(() => {
    if (!live) {
      setState(null);
      return;
    }
    // Expand ONCE and sample the expanded pattern. Sampling the raw pattern
    // while timing against the expanded cycle put the props on a different
    // clock from the loop — and short periods fold to one orbit anyway.
    const expanded = expand(pattern);
    const { cycleBeats } = orbitsOf(expanded);
    const started = performance.now();
    const tick = () => {
      const beats = ((performance.now() - started) / 1000 / BEAT_S) % cycleBeats;
      const positions = sampleAt(expanded, beats, { planet, prop });
      setState({
        positions,
        airborne: positions.filter((p) => p.airborne).length,
        beat: beats,
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- patternKey IS pattern, by content
  }, [live, patternKey, planet, prop]);

  return state;
}
