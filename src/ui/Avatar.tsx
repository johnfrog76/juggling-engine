import { palmsUpFor, type Prop } from "../engine";
import type { Avatar } from "./avatars";
import { art } from "./theme";

/**
 * Who is doing the juggling.
 *
 * Bringing a body in forces a choice that hands alone did not: once there is a
 * figure, it is a *particular* figure, and not everyone wants a stick person.
 * So it is a setting (John) — hands only, a stick figure, a robot, or an alien.
 *
 * A "shadow" was tried and dropped: it was the same silhouette at lower
 * opacity, which is a rendering of the figure rather than a different juggler.
 *
 * GEOMETRY IS SHARED AND FIXED. The engine throws from ±64 units around the
 * centreline at hand height, so every avatar must put its hands exactly there.
 * They are drawn in the same 160×150 box with the shoulder at (80, 48) and the
 * hands at (80 ± HAND_X, 74) — an avatar that invents its own reach makes the
 * props launch out of empty air beside the body, which is precisely what went
 * wrong when the body was first added.
 */

/** Half the hand span, in engine units. Must match the sampler's HAND_X. */
const HAND_X = 64;
/** Where the hands sit in the avatar's own box. */
const HAND_Y = 74;
const SHOULDER = { x: 80, y: 48 };

function Arms({ color, width = 11 }: { color: string; width?: number }) {
  return (
    <>
      <path
        d={`M ${SHOULDER.x} ${SHOULDER.y} L ${SHOULDER.x - HAND_X} ${HAND_Y}`}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
      <path
        d={`M ${SHOULDER.x} ${SHOULDER.y} L ${SHOULDER.x + HAND_X} ${HAND_Y}`}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    </>
  );
}

/**
 * The figure's own hands.
 *
 * NOT `GraphicHand` (John): the block hand is for the hands-only view, where a
 * hand IS the subject and can carry detail. At figure scale that same block
 * reads as a dark claw, so a body gets these instead -- a cup for palms-up
 * props, a fist for gripped ones, which is the only distinction that survives
 * at this size.
 */
function FigureHands({ prop, color }: { prop: Prop; color: string }) {
  const palmsUp = palmsUpFor(prop);
  return (
    <>
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${80 + side * HAND_X}, ${HAND_Y}) scale(${side}, 1) translate(-16, -10)`}>
          {palmsUp ? (
            <path
              d="M 3 4 C 2 15 9 19 16 19 C 23 19 30 15 29 4"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
            />
          ) : (
            <rect x="7" y="4" width="18" height="15" rx="7" fill={color} />
          )}
        </g>
      ))}
    </>
  );
}

export function AvatarFigure({
  kind,
  prop = "balls",
  color = art.body,
}: {
  kind: Avatar;
  prop?: Prop;
  color?: string;
}) {
  // `hands` draws nothing: the hand glyphs are rendered by the caller in the
  // prop layer, so this avatar is simply the absence of a body.
  if (kind === "hands") return null;

  // The alien is green all through -- see `alien` in the theme for why the
  // props change with it.
  const ink = kind === "alien" ? art.alien : color;

  return (
    <svg
      data-je="avatar"
      data-avatar={kind}
      viewBox="0 0 160 150"
      style={{
        position: "absolute",
        left: "50%",
        bottom: 0,
        width: 160,
        height: 150,
        transform: "translateX(-50%)",
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {kind === "robot" ? (
        <>
          {/* plated torso and a boxy head — built rather than drawn */}
          <rect x="62" y="34" width="36" height="52" rx="6" fill={ink} />
          <line x1="62" y1="52" x2="98" y2="52" stroke={art.bg} strokeWidth="1.5" opacity={0.5} />
          <line x1="62" y1="68" x2="98" y2="68" stroke={art.bg} strokeWidth="1.5" opacity={0.5} />
          <rect x="66" y="8" width="28" height="22" rx="5" fill={ink} />
          <rect x="74" y="30" width="12" height="6" fill={ink} />
          {[74, 86].map((x) => (
            <circle key={x} cx={x} cy="18" r="3.4" fill={art.notation} />
          ))}
          <path d="M 80 8 L 80 1" stroke={ink} strokeWidth="2" />
          <circle cx="80" cy="0" r="2.6" fill={art.notation} />
          <Arms color={ink} width={10} />
          <FigureHands prop={prop} color={ink} />
          <path d="M 72 86 L 68 148" stroke={ink} strokeWidth="12" strokeLinecap="round" />
          <path d="M 88 86 L 92 148" stroke={ink} strokeWidth="12" strokeLinecap="round" />
        </>
      ) : kind === "alien" ? (
        <>
          {/* big cranium, tapered chin, almond eyes */}
          <path d="M 60 18 C 60 -2 100 -2 100 18 C 100 32 92 44 80 48 C 68 44 60 32 60 18 Z" fill={ink} />
          <ellipse cx="71" cy="22" rx="7" ry="3.6" fill={art.bg} transform="rotate(-20 71 22)" />
          <ellipse cx="89" cy="22" rx="7" ry="3.6" fill={art.bg} transform="rotate(20 89 22)" />
          <path d="M 80 48 L 80 96" stroke={ink} strokeWidth="12" strokeLinecap="round" />
          <Arms color={ink} width={9} />
          <FigureHands prop={prop} color={ink} />
          <path d="M 80 96 L 68 148" stroke={ink} strokeWidth="10" strokeLinecap="round" />
          <path d="M 80 96 L 92 148" stroke={ink} strokeWidth="10" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="80" cy="20" r="13" fill={ink} />
          <path d="M 80 34 L 80 96" stroke={ink} strokeWidth="15" strokeLinecap="round" />
          <path d="M 80 96 L 66 148" stroke={ink} strokeWidth="12" strokeLinecap="round" />
          <path d="M 80 96 L 96 148" stroke={ink} strokeWidth="12" strokeLinecap="round" />
          <Arms color={ink} />
          <FigureHands prop={prop} color={ink} />
        </>
      )}
    </svg>
  );
}
