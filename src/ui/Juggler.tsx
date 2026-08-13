import { art } from "./theme";

/**
 * The body under the hands.
 *
 * Hands floating on their own read as a diagram, not a juggler — John's note
 * when he sketched a torso and arms under the hand line. A figure also gives
 * the props a scale reference, which matters most at the low end where a three
 * barely clears the hands.
 *
 * Carried over from the deck this engine came out of, so the two match: same
 * proportions, same silhouette treatment, same reason for every number. Kept to
 * a flat silhouette so the props stay the subject — this is scenery.
 *
 * THE ARMS REACH THE HAND LINE. The engine throws from ±64px around the
 * centreline, so the arms must end there and not at some shorter cosmetic span,
 * or the props launch out of empty air beside the body.
 */
export function Juggler({
  handX = 64,
  scale = 1,
  color = art.body,
}: {
  /** Half the distance between hands, in engine units. Matches the sampler. */
  handX?: number;
  scale?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 0,
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "50% 100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg viewBox="0 0 160 150" style={{ width: 160, height: 150, overflow: "visible" }}>
        <circle cx="80" cy="20" r="13" fill={color} />
        <path d="M 80 34 L 80 96" stroke={color} strokeWidth="15" strokeLinecap="round" />
        <path d="M 80 96 L 66 148" stroke={color} strokeWidth="12" strokeLinecap="round" />
        <path d="M 80 96 L 96 148" stroke={color} strokeWidth="12" strokeLinecap="round" />
        <path d={`M 80 48 L ${80 - handX} 74`} stroke={color} strokeWidth="11" strokeLinecap="round" />
        <path d={`M 80 48 L ${80 + handX} 74`} stroke={color} strokeWidth="11" strokeLinecap="round" />
      </svg>
    </div>
  );
}
