```text
                      .---(@)---.
                 .--''           ''--.
             .-''                     ''-.
          .-'        .-----------.        '-.
        .'      (@)''             ''-.       '.
       /      .-'                     '-.      \
      /     .'      .-------------.      '.     \
     |     /     .-'               (@)     \     |
     |    |     /                     \     |    |
   \_|____|_____|_                   _|_____|____|_/

             J U G G L I N G   E N G I N E
```

<p align="center"><strong>Type the numbers. Watch the throws.</strong></p>

**Siteswap describes a juggling pattern as a string of numbers. Most jugglers cannot read it.
Juggling Engine reads it for you.** Type `531` and three balls start moving — not an animation
somebody drew, but every throw solved from the digits as a real parabola with a real flight
time.

**What you get** is a page you can play with and an engine you can build on. The page runs
any legal vanilla or synchronous pattern with balls, clubs or rings, and names the patterns
you already throw. The engine underneath says why an illegal pattern is illegal, and tells you
where every prop is at any instant — on Earth or on Mars.

**It is for jugglers who learned by throwing**, and know every pattern in their hands and none
of them by number. It is also for jugglers who live in the notation and want to see a pattern
before they try it, and for developers who want a small, tested physics engine to drive.

- **[Try it](https://johnfrog76.github.io/juggling-engine/)** — in the browser, no install
- MIT licensed · two TypeScript files and one React hook · 92 tests

---

## How it works, in one paragraph

Each digit is **how many beats later that throw lands**. The number of props is the average
of the digits, a pattern is legal only if no two throws land in the same hand on the same
beat, and odd throws cross between hands while even ones stay. The engine checks those rules,
then solves every throw as a parabola. The promise: **if it renders, it is a valid pattern;
if it is a valid vanilla pattern, it renders** — tested over all 670 legal vanilla patterns
up to period four. The rules in full, and what is not supported yet (multiplex and passing),
are in [Siteswap](docs/siteswap.md).

## Using the engine

```ts
import { validate } from "./src/engine";

validate([5, 3, 1]); // { legal: true, props: 3 }
```

The rest of the API — sampling positions, the React hook, gravity — is in
[Using the engine directly](docs/api.md).

## Documentation

| Read | For |
| --- | --- |
| [Siteswap](docs/siteswap.md) | The notation in three rules, the guarantee, and what is not supported |
| [Using the engine directly](docs/api.md) | `validate`, `sampleAt`, `useSiteswapSim`, and gravity |
| [Design notes](docs/design.md) | How a throw is solved, and the deliberate choices behind it |

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # the full suite
npm run verify     # lint + typecheck + test
npm run shots      # screenshot both pages (dev server must be running)
```

`src/engine.ts` and `src/sync.ts` are the product. Everything under `src/ui` and
`src/pages` exists to present it.

## Review wanted

This engine was validated by a juggler of 46 years who does not read siteswap. His eye is
authoritative on whether the render looks like real juggling; what it cannot certify is
notation semantics. If you live in the notation, the choices that are deliberate rather than
standard are listed in [Design notes](docs/design.md#for-siteswap-literate-jugglers--review-wanted),
so you know what to review as opinion and what to report as a bug.
[Open an issue](https://github.com/johnfrog76/juggling-engine/issues) for anything that reads
wrong.

## Licence

[MIT](LICENSE). If this turns out to be useful to you and you want to maintain it, get in
touch.
