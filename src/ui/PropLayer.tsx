import { makeStyles } from "@fluentui/react-components";
import { palmsUpFor, type Prop, type PropPosition } from "../engine";
import { art } from "./theme";
import { GraphicHand, PropGlyph } from "./glyphs";
import { AvatarFigure } from "./Avatar";
import { propColorFor, type Avatar } from "./avatars";

/**
 * The juggler and everything in their hands — ONE implementation.
 *
 * This used to live twice: once in the Explorer's LiveFigure and once in the
 * landing page's LivePattern. Every offset in here was eyeballed against the
 * render and tuned through DevTools, and with two copies each fix had to land
 * twice — it didn't. The landing page kept the pre-avatar body floating 76px
 * above its own hands for a full day after the Explorer was fixed, because the
 * fix went where the tuning session happened and nowhere else.
 *
 * The layer expects to be mounted inside the caller's scaled wrapper, at the
 * pattern's origin: the CENTRELINE at hand height. The sampler returns x in
 * ±64 around zero and y negative-up from the hand line, and everything here is
 * anchored to that.
 */

/**
 * FIGURE POSITIONING, in Griffel rather than inline (John).
 *
 * These offsets were all eyeballed against the render, so they get tuned again
 * — and an inline style on a generated div is unfindable in DevTools and gets
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
   * Held club: a plain centre anchor, same as a ball.
   *
   * It used to carry a 180° flip and a hand-tuned drop, back when the club
   * glyph was drawn body-at-top — every holder had to turn it over and then
   * compensate for the pivot moving. The artwork now rotates once inside its
   * own SVG (see PropGlyph), so the club arrives the right way up and the
   * holder does nothing special. Kept as its own class so a club-specific
   * adjustment has a home if one is ever needed again.
   */
  propHeldClub: { position: "absolute", transform: "translate(-50%, 50%)" },
});

export function PropLayer({
  positions,
  prop,
  avatar = "figure",
  ringSize = 26,
  propSize = 18,
  colors,
}: {
  positions: PropPosition[];
  prop: Prop;
  avatar?: Avatar;
  /** Rings render larger than their nominal size — see PropGlyph's boost note. */
  ringSize?: number;
  propSize?: number;
  /**
   * Per-prop colours, cycled by orbit index ("colored props" setting).
   * When given, this wins over every default — including the alien's grey,
   * because an explicit user choice beats an avatar's art direction.
   */
  colors?: string[];
}) {
  const fs = useFigureStyles();
  const propColor = propColorFor(avatar, art.prop, art.alienProp);

  return (
    <>
      {/* THE AVATAR'S HANDS MUST LAND ON THE REAL HAND LINE. Its box is 150
          tall with hands drawn at y=74, so it hangs 76 units below the prop
          layer's origin — without that offset the body floats above its own
          hands, which is exactly how it looked when the body was first added
          (and again on the landing page, which missed the fix). */}
      <div style={{ position: "absolute", left: 0, bottom: -76, width: 0 }}>
        <AvatarFigure kind={avatar} prop={prop} />
      </div>

      {/* THE BLOCK HANDS ARE FOR THE HANDS-ONLY VIEW (John). Every other
          avatar draws its own smaller hands, which belong with the body —
          the block at figure scale reads as a claw. */}
      {avatar === "hands" &&
        [-1, 1].map((side) => (
          <div
            key={side}
            // STABLE HOOKS FOR TUNING. These positions are eyeballed against
            // the render, so they need to be findable in DevTools — an inline
            // style on a generated div is not. Select
            // `[data-je="hand"][data-prop="clubs"]` and the offset is one rule
            // away.
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

      {positions.map((p, i) => (
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
            size={prop === "rings" ? ringSize : propSize}
            color={colors ? colors[i % colors.length] : propColor}
            view="front"
            spin={p.spin}
          />
        </div>
      ))}
    </>
  );
}
