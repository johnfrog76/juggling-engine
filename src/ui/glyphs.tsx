import type { CSSProperties } from "react";
import { BEAT_S, palmsUpFor, type Prop } from "../engine";
import { art } from "./theme";

// ── Prop and hand glyphs ─────────────────────────────────────────────────────
//
// Lifted from the deck this engine was extracted from, comments and all. The
// reasoning in them is hard-won -- particularly the ring projection note -- and
// it is exactly the sort of thing a maintainer needs and cannot reconstruct.
//
// The only change is the palette: deck-specific token names became the engine's
// own art. The shapes are untouched.

export function PropGlyph({
  prop = "balls",
  size = 16,
  color = art.prop,
  view = "side",
  spin = 0,
  /** 0 at hand height → 1 at apex. Rings narrow as they rise. */
  altitude = 0,
}: {
  prop?: Prop;
  size?: number;
  color?: string;
  view?: "front" | "side";
  spin?: number;
  altitude?: number;
}) {
  if (prop === "balls") {
    return <div style={{ width: size, height: size, borderRadius: "50%", background: color }} />;
  }

  if (prop === "rings") {
    // Front: near-full circle. Side: open ellipse, 58% → 42% of width with height.
    //
    // DO NOT "FIX" THIS INTO A TRUE SIDE PROJECTION. A real side-on view puts
    // you down the line of the pattern: the hands nearly overlap, the arc
    // collapses toward vertical, and the rings cross each other. That is more
    // correct and much less readable — the shape of the pattern disappears.
    //
    // What is here instead is a three-quarter read: the ring GLYPH is squished
    // to its side-on ellipse while the pattern keeps its front-view spread, so
    // it lands as "rings seen from slightly off-axis". John reviewed this
    // against the real thing and called it right — the correct trade, not an
    // accident. Changing the projection would make the deck more accurate and
    // worse.
    const ratio = view === "front" ? 0.92 : 0.58 - 0.16 * Math.min(Math.max(altitude, 0), 1);
    // Side view rings need to be drawn LARGER, not merely counter-scaled: they
    // sit inside a pattern squashed to 28% and then fitted to a box, and the
    // two compound until a ring is a 2px sliver. Size them up at the source so
    // a ring stays a ring however the pattern around it is scaled.
    const boost = view === "side" ? 1.9 : 1;
    return (
      <div
        style={{
          width: size * 1.6 * ratio * boost,
          height: size * 1.6 * boost,
          borderRadius: "50%",
          border: `${Math.max(size * 0.22 * boost, 3)}px solid ${color}`,
          boxSizing: "border-box",
        }}
      />
    );
  }

  // Clubs — pivot at the balance point, near the knob end.
  // The barrel is deliberately FAT: a thin club reads as a dash or a sliver at
  // slide scale, and the taper-plus-knob silhouette is the only thing that
  // says "club" rather than "line". Widened on John's note that the shape
  // reads but wants more body.
  return (
    <div style={{ width: size * 0.62, height: size * 2.3, transform: `rotate(${spin}deg)`, transformOrigin: "50% 72%" }}>
      <svg viewBox="0 0 20 66" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        {/* ROTATED IN THE SVG, not by the caller (John).
            The club was drawn body-at-top with the knob at the bottom, so every
            caller holding one had to add its own rotate(180deg) and then a
            compensating offset to undo the pivot shift -- two magic numbers per
            call site, tuned separately, drifting apart. Turning the artwork
            once here means the glyph is simply the right way up: handle down
            where a hand grips it, body standing above. */}
        <g transform="rotate(180 10 33)">
          {/* body — widest a third down from the top, tapering into the handle */}
          <path d="M 10 1 Q 17.5 13 16.5 31 L 13.5 47 Q 12.6 52 10 52 Q 7.4 52 6.5 47 L 3.5 31 Q 2.5 13 10 1 Z" fill={color} />
          {/* handle */}
          <rect x="7.6" y="49" width="4.8" height="12" rx="2.4" fill={color} opacity={0.9} />
          {/* knob — the balance-point end, and the read that fixes orientation */}
          <circle cx="10" cy="62.5" r="3.6" fill={color} />
        </g>
      </svg>
    </div>
  );
}

export function GraphicHand({
  side = "right",
  prop = "balls",
  size = 160,
  color = art.body,
  rimColor,
  style,
  sway = false,
  delay = 0,
}: {
  side?: "left" | "right";
  prop?: Prop;
  size?: number;
  color?: string;
  rimColor?: string;
  style?: CSSProperties;
  sway?: boolean;
  delay?: number;
}) {
  const palmsUp = palmsUpFor(prop);
  const flip = side === "left" ? -1 : 1;

  return (
    <div
      style={{
        width: size,
        height: size * 0.78,
        transform: `scaleX(${flip})`,
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "50% 90%",
          animation: sway ? `je-sway ${BEAT_S * 2}s ease-in-out ${delay}s infinite` : undefined,
        }}
      >
        <svg viewBox="0 0 100 78" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          {palmsUp ? (
            // OPEN CUP — one continuous silhouette, because a hand is one shape.
            // The earlier version drew palm and fingers as separate blocks and
            // read as a fist; the cup has to be a single unbroken outline with
            // the fingers curling UP out of it, so the eye sees a bowl that
            // could hold something.
            <>
              {/* The cup, drawn as a THIN WALL rather than a solid mass: an arc
                  sweeping up into four finger tips. A filled blob reads as a paw
                  — what says "this could hold something" is the open interior
                  and the fingers standing clear of it. */}
              <path
                d="M 12 26 C 6 54 20 72 50 72 C 80 72 94 54 88 26"
                fill="none"
                stroke={color}
                strokeWidth="15"
                strokeLinecap="round"
              />
              {/* four fingers rising off the rim, tallest in the middle */}
              {[
                { x: 22, h: 26 },
                { x: 39, h: 34 },
                { x: 57, h: 33 },
                { x: 73, h: 24 },
              ].map(({ x, h }) => (
                <rect key={x} x={x - 5.5} y={30 - h} width="11" height={h + 8} rx="5.5" fill={color} />
              ))}
              {/* thumb, laid across the outside of the near wall */}
              <rect x="84" y="30" width="11" height="24" rx="5.5" fill={color} transform="rotate(16 89 42)" />
              {rimColor && (
                <path d="M 12 26 C 6 54 20 72 50 72 C 80 72 94 54 88 26" fill="none" stroke={rimColor} strokeWidth="1.5" opacity={0.5} />
              )}
            </>
          ) : (
            // GRIP — turned inward, edge-on to the audience. Rings by the rim,
            // clubs by the handle; the hand reads the same for both.
            <>
              <path
                d="M 34 18 Q 24 20 22 34 L 22 56 Q 24 70 40 72 L 58 72 Q 72 70 74 56 L 74 30 Q 72 20 60 18 Z"
                fill={color}
                stroke={rimColor ?? "none"}
                strokeWidth={rimColor ? 2 : 0}
              />
              {/* curled fingers, seen end-on — stacked bars, not splayed columns */}
              {[26, 38, 50, 62].map((y) => (
                <rect key={y} x="30" y={y} width="34" height="9" rx="4.5" fill={color} opacity={0.94} />
              ))}
              {/* thumb wrapping the front */}
              <rect x="60" y="30" width="11" height="26" rx="5.5" fill={color} />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
