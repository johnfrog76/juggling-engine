# Using the engine directly

Back to the [README](../README.md).

The engine is [`src/engine.ts`](../src/engine.ts) and [`src/sync.ts`](../src/sync.ts). It is
framework-free apart from one React hook, and has no other dependencies:

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

## The React hook

`useSiteswapSim(pattern)` is the React wrapper: it drives the sampler at
`requestAnimationFrame` and returns positions plus a live airborne count. It is the only
React in the engine, and it is about thirty lines — porting to another framework means
rewriting that one function.

## Gravity

Gravity is a parameter rather than a constant, so the same pattern runs on Mars
(`{ planet: "mars" }`) with a 2.64× apex and 1.63× hang time.

## Where to go next

- [Siteswap, and what the engine accepts](siteswap.md) — the rules `validate` enforces.
- [Design notes](design.md) — how a throw is solved, and the constants that shape it.
