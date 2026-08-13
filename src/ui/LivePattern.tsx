import { useSiteswapSim, expand, type Planet, type Prop } from "../engine";
import { art } from "./theme";
import { GraphicHand, PropGlyph } from "./glyphs";
import { Stage } from "./Stage";

/**
 * One pattern, running, with nothing to drive it.
 *
 * The landing page needs a figure that simply works while somebody reads — no
 * controls, no state, no invitation to fiddle. That is a different component
 * from the Explorer, which is all controls, and trying to make one serve both
 * would compromise each.
 *
 * The engine's origin is the CENTRELINE at hand height: it returns x in roughly
 * ±64 around zero, so the prop layer has to be centred and anchored at the same
 * height as the hands. Get that wrong and the pattern hangs off to one side of
 * the hands throwing it.
 */
export function LivePattern({
  pattern,
  prop = "balls",
  planet = "earth",
  height = 300,
  propSize = 20,
}: {
  pattern: number[];
  prop?: Prop;
  planet?: Planet;
  height?: number;
  propSize?: number;
}) {
  const sim = useSiteswapSim(pattern, { prop, planet });

  // Fit the tallest throw into the box we were given.
  const peak = Math.max(...expand(pattern), 3);
  const apexPx = 11.5 * Math.pow(Math.max(peak - 1.4, 0.45), 2);
  const fit = Math.min(1, (height - 130) / Math.max(apexPx, 1));

  return (
    <Stage height={height}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "14%",
          transform: `translateX(-50%) scale(${fit})`,
          transformOrigin: "50% 100%",
        }}
      >
        {[-1, 1].map((side) => (
          <div
            key={side}
            style={{
              position: "absolute",
              left: side * 64,
              bottom: 0,
              transform: `translateX(-50%) scaleX(${side})`,
            }}
          >
            <GraphicHand side={side < 0 ? "left" : "right"} prop={prop} size={46} color={art.body} />
          </div>
        ))}
        {(sim?.positions ?? []).map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              bottom: -p.y,
              transform: "translate(-50%, 50%)",
            }}
          >
            <PropGlyph
              prop={prop}
              size={prop === "rings" ? propSize * 1.4 : propSize}
              color={art.prop}
              view="front"
              spin={p.spin}
            />
          </div>
        ))}
      </div>
    </Stage>
  );
}
