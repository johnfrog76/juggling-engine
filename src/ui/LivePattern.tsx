import { makeStyles } from "@fluentui/react-components";
import { useSiteswapSim, expand, palmsUpFor, type Planet, type Prop } from "../engine";
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
 * FIGURE POSITIONING, in Griffel rather than inline (John).
 *
 * These offsets were all eyeballed against the render, so they get tuned again
 * -- and an inline style on a generated div is unfindable in DevTools and gets
 * rewritten every frame by the animation. As classes they are one rule in the
 * inspector, and the class name says what each number is FOR.
 *
 * Only `left` and `bottom` for a prop stay inline: those change per frame and
 * are the simulation's output, not a design decision.
 */
const useFigureStyles = makeStyles({
  /** Block hand, palms-up props. The cup's bowl sits on the throw line. */
  handCup: { position: "absolute", bottom: "-34px" },
  /**
   * Block hand, gripped props.
   *
   * The fist is a lower, tighter block than the palms-up cup, so the two
   * hands need genuinely different offsets to put the prop where the hand
   * closes on it. -4 sits the fist on the throw line; -38 and -48 both drop
   * it below and leave the clubs floating free above.
   */
  handFist: { position: "absolute", bottom: "-4px" },
  /** A prop in flight: centred on its coordinates. */
  propFlying: { position: "absolute", transform: "translate(-50%, 50%)" },
  /** Held ball: gripped around its middle, so also centred. */
  propHeldBall: { position: "absolute", transform: "translate(-50%, 50%)" },
  /** Held ring: rests IN the hand, so it hangs slightly below centre. */
  propHeldRing: { position: "absolute", transform: "translate(-50%, 50%) translateY(6px)" },
  /**
   * Held club: hangs by the HANDLE and flipped, because the glyph is drawn
   * body-up for flight -- which in the hand puts the fat end in the palm.
   * Rotate before the offset: transforms apply right to left, so rotating last
   * spins the already-displaced position instead of the club itself.
   */
  propHeldClub: { position: "absolute", transform: "translate(-50%, 50%) rotate(180deg) translateY(34px)" },
});

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
  const fs = useFigureStyles();
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
            data-je="hand"
            data-side={side < 0 ? "left" : "right"}
            data-prop={prop}
            className={palmsUpFor(prop) ? fs.handCup : fs.handFist}
            style={{
              left: side * 64,
              transform: `translateX(-50%) scaleX(${side})`,
            }}
          >
            <GraphicHand side={side < 0 ? "left" : "right"} prop={prop} size={38} color={art.body} />
          </div>
        ))}
        {(sim?.positions ?? []).map((p, i) => (
          <div
            key={i}
            data-je="prop"
            data-prop={prop}
            data-held={p.airborne ? "false" : "true"}
            className={
              p.airborne
                ? fs.propFlying
                : prop === "clubs"
                  ? fs.propHeldClub
                  : prop === "rings"
                    ? fs.propHeldRing
                    : fs.propHeldBall
            }
            style={{
              left: p.x,
              bottom: -p.y,
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
