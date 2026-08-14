# Juggling Engine

**Siteswap describes a juggling pattern as a string of numbers. Most jugglers cannot read it. This reads it for you.**

Type `531` and three balls start moving — not an animation somebody drew, but every throw
solved from the digits as a real parabola with a real flight time.

- **[Try it](https://johnfrog76.github.io/juggling-engine/)** — no install
- MIT licensed, ~600 lines of TypeScript, 63 tests

---

## Why it exists

There is a generational split in juggling. Jugglers who came up after siteswap spread live
inside the notation. Jugglers who came up before it — and that is most people who have been
throwing for thirty years — never learned to read it. They know every pattern in their hands
and none of them by number.

So the direction that matters here is **pattern → name**, not name → pattern. Pick something
you already throw and the engine tells you what siteswap calls it. That is the opposite of
every notation tutorial, and it is the right way round for somebody who learned by throwing.

## What siteswap is, in three rules

Each digit is **how many beats later that throw lands**. That is the entire language. A `3`
lands three beats after it leaves the hand; a `5` is thrown higher because it has to stay up
for five.

Three consequences do most of the work:

1. **Props = the average of the digits.** `531` is three balls, because (5+3+1)/3 = 3.
2. **A pattern is legal only if the landing beats form a permutation** — no two throws may
   land in the same hand on the same beat. That is a check, not a matter of taste.
3. **Odd digits cross between hands, even digits stay.** One line of arithmetic
   (`value % 2 === 1 ? -x1 : x1`) is why a cascade looks like a figure of eight and a
   fountain looks like two columns.

## The guarantee

**If it renders, the maths says it is a valid pattern. If it is a valid vanilla pattern, it
renders.** Both directions are tested — including a brute-force pass over all 670 legal
vanilla patterns up to period four.

"Legal" is not the same as "throwable by a human". `13` is legal and only a handful of people
who have ever lived could flash it. The engine will happily run patterns nobody can.

## What it does not do

Stated rather than hidden, because a maintainer needs to know where the edges are:

| Notation | Example | Status |
| --- | --- | --- |
| Vanilla (alternating hands) | `531`, `97531`, `744` | Supported |
| Synchronous (both hands at once) | `(4,2x)(2x,4)` | Supported |
| Multiplex (two props from one hand) | `[43]23` | **Not supported** |
| Passing (multiple jugglers) | `<4p3\|3>` | **Not supported** |

Passing is the biggest gap and the most interesting one — the physics is worked out in the
comments in [`src/sync.ts`](src/sync.ts), but the notation does not parse.

## Using the engine directly

The engine is framework-free apart from one React hook, and has no dependencies at all:

```ts
import { validate, sampleAt, airborneMean } from "./src/engine";

validate([5, 3, 1]);
// { legal: true, props: 3 }

validate([5, 3, 2]);
// { legal: false, props: 3.33…, reason: "the digits do not average to a whole number" }

sampleAt([3], 1.4);
// [{ x, y, spin, airborne }, …] — where every prop is at that instant

airborneMean(5);
// 3 — five balls, two hands, three in the air
```

`useSiteswapSim(pattern)` is the React wrapper: it drives the sampler at
`requestAnimationFrame` and returns positions plus a live airborne count. It is the only
React in the engine, and it is about thirty lines — porting to another framework means
rewriting that one function.

Gravity is a parameter rather than a constant, so the same pattern runs on Mars
(`{ planet: "mars" }`) with a 2.64× apex and 1.63× hang time.

## Design notes worth knowing

A few decisions that look arbitrary and are not:

- **`DWELL_BEATS = 1.4`** — how long a prop stays in the hand. Too low and the N−2H rule
  becomes visibly false: five balls show four or five in the air instead of three.
- **Patterns are expanded before solving.** A short period folds several props into one
  orbit, so `[5]` rendered one ball instead of five until `expand()` was introduced.
- **Sync lives in its own file.** It is a second timing mode, not a special case of the
  first, and making the proven vanilla path conditional would have risked 670 working
  patterns for the sake of the newer one.
- **The ring glyph is a three-quarter read, not a true side projection.** A real side-on view
  puts you down the line of the pattern, where the hands overlap and the shape disappears.
  More correct, much less readable.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 63 tests
npm run verify     # lint + typecheck + test
npm run shots      # screenshot both pages (dev server must be running)
```

`src/engine.ts` and `src/sync.ts` are the product. Everything under `src/ui` and
`src/pages` exists to present it.

## For siteswap-literate jugglers — review wanted

This engine was validated by a juggler of 46 years who **does not read
siteswap** — his eye is authoritative on whether the render looks like real
juggling, and it caught real bugs (club orientation, reverse flips, inflated
pass arcs). What it cannot certify is notation semantics. If you live in the
notation, this section is for you: the following are *deliberate* choices, so
you know what to review as opinion versus report as bug.

- **Bare `10`–`15` runs as a single throw when the digit-reading is illegal.**
  `"10"` renders a ten-prop fountain, because `1,0` is not a pattern and a
  juggler typing 10 means a count. Reference tools reject it; we narrate it.
  When the digits DO form a legal pattern (`13` → `1,3`, `15` → the shower),
  the digits always win.
- **Throws cap at `f` (15)** — two past the attested edge of the craft
  (Lucas's 13-ring flash), where a new record would land if one ever comes.
- **Dwell is modelled, not standard**: 1.4 beats for tosses, shortened for
  throws of 3+ (`DWELL_FRACTION`), and a separate longer dwell for 1s and 2s
  (`PASS_DWELL_BEATS`) so passes stay low with a little lift.
- **Club spin counts are art direction** (`conventionalSpins`), and the sync
  path currently uses a *different* table — flagged in `sync.ts`, awaiting a
  juggler's eye.
- **The ring side view is a three-quarter read, not a true projection** — see
  the note in `src/ui/glyphs.tsx` before "fixing" it.

Open an issue for anything else that reads wrong to a notation-native eye —
especially sync formatting, the multiplex/passing gaps, and edge cases in
validation.

## Provenance

Extracted from a talk about juggling as notation, where the engine drives the slides live.
The visual vocabulary — the automaton, the prop glyphs, the lit stage — comes from that deck.

## Licence

MIT. If this turns out to be useful to you and you want to maintain it, get in touch.
