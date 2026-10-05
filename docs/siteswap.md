# Siteswap, and what the engine accepts

The notation in full, the promise the engine makes about it, and where its edges are.
Back to the [README](../README.md).

## Why pattern → name

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
comments in [`src/sync.ts`](../src/sync.ts), but the notation does not parse.

The readings that are deliberate rather than standard — bare `10`, the cap at `f`, the dwell
model — are listed in [Design notes](design.md#for-siteswap-literate-jugglers--review-wanted).
