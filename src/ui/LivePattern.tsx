import { useSiteswapSim, expand, type Planet, type Prop } from "../engine";
import { Stage } from "./Stage";
import { PropLayer } from "./PropLayer";
import type { Avatar } from "./avatars";

/**
 * One pattern, running, with nothing to drive it.
 *
 * The landing page needs a figure that simply works while somebody reads — no
 * controls, no state, no invitation to fiddle. That is a different component
 * from the Explorer, which is all controls, and trying to make one serve both
 * would compromise each.
 *
 * The figure itself comes from PropLayer, shared with the Explorer. This file
 * used to carry its own copy of the body, hands and prop anchors, and it kept
 * the pre-avatar Juggler — arms ending 76px above its own hands — for a full
 * day after the Explorer was fixed. One implementation, or the fixes only land
 * where the tuning session happened.
 */
export function LivePattern({
  pattern,
  prop = "balls",
  planet = "earth",
  height = 300,
  propSize = 20,
  avatar = "figure",
}: {
  pattern: number[];
  prop?: Prop;
  planet?: Planet;
  height?: number;
  propSize?: number;
  avatar?: Avatar;
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
        <PropLayer
          positions={sim?.positions ?? []}
          prop={prop}
          avatar={avatar}
          propSize={propSize}
          ringSize={propSize * 1.4}
        />
      </div>
    </Stage>
  );
}
