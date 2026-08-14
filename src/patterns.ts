import { validate, airborneMean } from "./engine";
import { parseSync, formatSync, validateSync, type SyncBeat } from "./sync";


// ── The Explorer ─────────────────────────────────────────────────────────────
//
// THE READER, made usable. The engine can already turn a siteswap into a
// pattern; this is the surface that lets somebody actually drive it.
//
// WHO IT IS FOR, and this shapes every decision below: a juggler of 46 years
// who does not read siteswap. He knows every pattern in his hands and none of
// them by number. So the primary direction is PATTERN → NAME, not name →
// pattern: he should be able to click something he recognises and be told what
// the notation calls it. Free-text entry is secondary, for when he wants to ask
// "is 633 mine?".
//
// Consequences of that:
//   · Named patterns come FIRST and are the big affordance.
//   · Every pattern shows its siteswap next to its name, always — that pairing
//     is the whole lesson.
//   · The readout says what a juggler cares about (how many, does it cross, how
//     many in the air), not what a parser cares about.
//   · Illegal input explains ITSELF rather than just going red.
//
// WHY THE DIRECTION MATTERS, from watching him use it: he worked out what a
// shower was by THROWING it at his desk and then describing what he had done —
// "two in one hand, then a pass". The notation asks for the opposite: read the
// digits, derive the pattern. He called that "so left brain", and he is right;
// it is a translation step that costs a lifetime of embodied knowledge nothing
// and gains it nothing.
//
// So this tool runs the direction a juggler already works in. Recognition
// first, label second. Do not "improve" it by making notation the primary
// input — that would be the same tool everyone else has already built, aimed at
// the half of the problem he does not have.

// ── The catalogue ───────────────────────────────────────────────────────────
//
// Named by what a juggler calls them, labelled with what siteswap calls them.
// `note` is the recognition hook — the thing that makes you say "oh, that one".
//
// NOT IN HERE, and it is the best argument for building sync support: the BOX.
//
// It is a SYNC pattern — both hands throw on the same beat, written
// (4,2x)(2x,4) — and sync is one of the three extensions this engine does not
// model. (Listing it as 441 was simply wrong; 441 is its own pattern and is
// already in the catalogue under its own name.)
//
// What makes it worth naming as a gap rather than quietly omitting: John's
// description of what the Box is FOR. It is the pattern that lets a juggler
// SWITCH SHOWER DIRECTION — one throw each way — so it is the hinge between
// shower-right and shower-left, both of which ARE in this catalogue. The engine
// can show you both ends of that transition and not the transition itself.
//
// So sync is not an abstract missing feature. It is a move jugglers actually
// use, sitting in a hole between two patterns already on the menu.
interface NamedPattern {
  name: string;
  /** Vanilla digits, or a sync string like "(4,2x)(2x,4)". */
  pattern: number[] | string;
  note: string;
  props: number;
}

export const CATALOGUE: NamedPattern[] = [
  { name: "Cascade", pattern: [3], note: "every throw crosses", props: 3 },
  { name: "Fountain", pattern: [4], note: "each hand keeps its own", props: 4 },
  // Shower comes in two hands. A juggler thinks of these as two patterns and
  // learns them separately, so both are listed — but siteswap gives them the
  // same digits rotated, which is itself worth noticing.
  { name: "Shower", pattern: [5, 1], note: "one high round, one shoved across", props: 3 },
  { name: "Half shower", pattern: [5, 3], note: "one hand throws all the high ones", props: 4 },
  { name: "Five", pattern: [5], note: "the next cascade up", props: 5 },
  { name: "Six", pattern: [6], note: "the next fountain up", props: 6 },
  { name: "Seven", pattern: [7], note: "five in the air", props: 7 },
  { name: "531", pattern: [5, 3, 1], note: "three heights at once", props: 3 },
  { name: "441", pattern: [4, 4, 1], note: "two columns and a crossing throw", props: 3 },
  // SYNC — both hands throwing together. The Box is the reason sync exists in
  // this engine: it is how a juggler switches shower direction.
  { name: "Box", pattern: "(4,2x)(2x,4)", note: "columns up the sides, one ball across the middle", props: 3 },
  { name: "Sync fountain", pattern: "(4,4)", note: "both hands at once, nothing crosses", props: 4 },
  { name: "Shower (other way)", pattern: [1, 5], note: "same pattern, other hand doing the work", props: 3 },
  { name: "97531", pattern: [9, 7, 5, 3, 1], note: "a different height every throw", props: 5 },
  { name: "744", pattern: [7, 4, 4], note: "one over the top of two", props: 5 },
  { name: "Thirteen", pattern: [13], note: "the ring record, flashed — thirteen is d", props: 13 },
];

// ── One pattern type, two timing modes ──────────────────────────────────────
//
// Vanilla and sync are genuinely different models (alternating hands versus
// simultaneous ones), so rather than pretend one is a special case of the
// other, the explorer carries a tagged union and dispatches. Everything below
// this line works in either mode.
export type Current =
  | { kind: "vanilla"; digits: number[] }
  | { kind: "sync"; beats: SyncBeat[] };

export function asCurrent(p: number[] | string): Current {
  if (typeof p === "string") {
    const beats = parseSync(p);
    if (beats) return { kind: "sync", beats };
    return { kind: "vanilla", digits: [3] };
  }
  return { kind: "vanilla", digits: p };
}

export function labelOf(c: Current): string {
  // THROWS ABOVE 9 ARE LETTERS -- a=10 through f=15, the siteswap standard.
  //
  // This used to join big digits with spaces, which collided: [13] printed as
  // "13" and so did [1,3] -- two different patterns, one label. Since the
  // catalogue highlight, the describe() memo and the text field all key on
  // this string, typing "13" rendered the two-ball pattern while the
  // THIRTEEN row lit up as selected (John hit exactly this). Letters make
  // every label unambiguous and round-trip through parsePattern, which has
  // always accepted a-f.
  return c.kind === "sync"
    ? formatSync(c.beats)
    : c.digits.map((d) => (d > 9 ? String.fromCharCode(87 + d) : String(d))).join("");
}

/** Parse what a person types. Accepts "633", "6 3 3", "6,3,3". */
export function parsePattern(text: string): number[] | null {
  const cleaned = text.trim().toLowerCase();
  if (!cleaned) return null;
  // space/comma separated lets counts above 9 be typed at all
  if (/[\s,]/.test(cleaned)) {
    const parts = cleaned.split(/[\s,]+/).filter(Boolean);
    const nums = parts.map((p) => Number(p));
    return nums.every((n) => Number.isInteger(n) && n >= 0 && n < 100) ? nums : null;
  }
  // bare digit string, with a..f for 10-15 as siteswap convention allows
  const out: number[] = [];
  for (const ch of cleaned) {
    if (ch >= "0" && ch <= "9") out.push(Number(ch));
    else if (ch >= "a" && ch <= "f") out.push(ch.charCodeAt(0) - 87);
    else return null;
  }
  return out.length ? out : null;
}

/** Everything a juggler would want said about a pattern, in their terms. */
export function describe(c: Current) {
  if (c.kind === "sync") {
    const v = validateSync(c.beats);
    const throws = c.beats.flatMap((b) => [b.left, b.right]);
    const anyCross = throws.some((t) => t.cross);
    const allCross = throws.every((t) => t.cross);
    return {
      legal: v.legal,
      props: v.props,
      shape: !anyCross
        ? "synchronous — both hands together, nothing crosses"
        : allCross
          ? "synchronous — both hands together, everything crosses"
          : "synchronous — columns and a crossing throw",
      airborne: airborneMean(v.props),
      label: formatSync(c.beats),
      sync: true,
    };
  }
  const v = validate(c.digits);
  const crosses = c.digits.some((d) => d % 2 === 1);
  const allCross = c.digits.every((d) => d % 2 === 1);
  const shape = !crosses ? "fountain — nothing crosses" : allCross ? "cascade — every throw crosses" : "mixed — some cross, some don't";
  return {
    legal: v.legal,
    props: v.props,
    shape,
    airborne: airborneMean(v.props),
    label: labelOf(c),
    sync: false,
  };
}

/**
 * The 10-to-15 trap, caught at the moment it happens.
 *
 * Digits parse one at a time, so "12" is the two-throw pattern 1,2 — not a
 * twelve-ball fountain — and "13" is the perfectly legal two-ball 1,3, which
 * renders while the THIRTEEN row lights up. John walked straight into both:
 * "if 13 works and I change to 12 why does the text area not accept it?" The
 * honest answer is siteswap's own convention — throws above 9 are letters —
 * and the tool should say so exactly when the trap springs, not in a manual.
 */
export function bigThrowTip(raw: string): string | null {
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 10 || n > 15) return null;
  const letter = String.fromCharCode(87 + n);
  return `Digits read one at a time — "${raw.trim()}" is the pattern ${raw
    .trim()
    .split("")
    .join(",")}. For a single throw of ${n}, type "${letter}".`;
}
