import { useSiteswapSim, expand, type Planet, type Prop } from "../engine";
import { art } from "./theme";
import { GraphicHand, PropGlyph } from "./glyphs";
import { Stage } from "./Stage";
import { Juggler } from "./Juggler";

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
/**
 * How a HELD prop sits in the hand — one rule per prop, because they are not
 * held the same way (John, eyeballing each of them against the figure).
 *
 *   BALLS  centre on the hand. A ball is gripped around its middle.
 *   RINGS  hang a little below centre: a held ring rests IN the hand rather
 *          than being balanced on it, so centring reads a touch high.
 *   CLUBS  hang by the HANDLE, about 40px below where centring puts them, and
 *          flipped 180 degrees -- the glyph is drawn body-up for flight, which
 *          in the hand means the fat end in the palm and the handle in the air.
 *          Backwards.
 *
 * Airborne props always take the centre anchor: in flight a prop rotates about
 * its balance point, and the centre is the honest pivot there.
 */
function heldTransform(prop: Prop, airborne: boolean): string {
  if (airborne) return "translate(-50%, 50%)";
  if (prop === "clubs") return "translate(-50%, 50%) translateY(40px) rotate(180deg)";
  if (prop === "rings") return "translate(-50%, 50%) translateY(6px)";
  return "translate(-50%, 50%)";
}

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
  // Never let the apex touch the frame: a 3 barely rises, so without a little
  // reserved air above it the top throw reads as clipped rather than thrown.
  const headroom = 0.82;

  return (
    <Stage height={height}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "14%",
          transform: `translateX(-50%) scale(${fit * headroom})`,
          transformOrigin: "50% 100%",
        }}
      >
        <Juggler />
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
            transform: heldTransform(prop, p.airborne),
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
