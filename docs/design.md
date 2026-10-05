# Design notes

How throws are solved, and the decisions that look arbitrary and are not.
Back to the [README](../README.md).

## How a throw is solved

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

[`src/engine.ts`](../src/engine.ts) and [`src/sync.ts`](../src/sync.ts) are the product.
Everything under `src/ui` and `src/pages` exists to present it.

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
  (Lucas's 13-ring flash). The range past the record is the point: the engine
  renders patterns *just out of reach*, the way a miler stares at the seconds
  between their time and the record. Nobody chases what they cannot see.
- **Dwell is modelled, not standard**: 1.4 beats for tosses, shortened for
  throws of 3+ (`DWELL_FRACTION`), and a separate longer dwell for 1s and 2s
  (`PASS_DWELL_BEATS`) so passes stay low with a little lift.
- **Club spin counts are art direction** (`conventionalSpins`), and the sync
  path currently uses a *different* table — flagged in `sync.ts`, awaiting a
  juggler's eye.
- **The ring side view is a three-quarter read, not a true projection** — see
  the note in [`src/ui/glyphs.tsx`](../src/ui/glyphs.tsx) before "fixing" it.

[Open an issue](https://github.com/johnfrog76/juggling-engine/issues) for anything else that
reads wrong to a notation-native eye — especially sync formatting, the multiplex/passing gaps,
and edge cases in validation.

## Provenance

Extracted from a talk about juggling as notation, where the engine drives the slides live.
The visual vocabulary — the automaton, the prop glyphs, the lit stage — comes from that deck.
