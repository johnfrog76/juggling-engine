import type { ReactNode } from "react";
import { art } from "./theme";

/**
 * The lit volume a pattern is thrown into.
 *
 * WHY THIS EXISTS AT ALL, given the engine would run without it: a bare dark
 * rectangle with dots moving in it reads as a debug harness. What makes a
 * pattern look like juggling rather than like output is the sense of a room —
 * a floor to stand on, air above it, and light coming from somewhere.
 *
 * It is three layers, all of them very low contrast:
 *   1. VOLUME — a gradient rising off the floor. A bare line says "here is a
 *      floor"; the gradient says "and look how much room is above it", which
 *      is what a seven-ball pattern needs.
 *   2. RAKING LIGHT — two pools, cool from the left, warm from the right. A
 *      few percent each, but they give the volume a direction so the figure
 *      reads as lit rather than pasted on.
 *   3. THE FLOOR — brightest under the figure, dissolving outward, so the
 *      ground has a centre without ever drawing a hard edge.
 *
 * Every layer fades out on BOTH axes. A gradient that stops at a container
 * boundary draws a visible rectangle, which is the single most common way this
 * effect goes wrong — it happened repeatedly in the deck before the masks were
 * added, on any slide that put a figure in a narrow column.
 */
export function Stage({ children, height = "100%" }: { children?: ReactNode; height?: number | string }) {
  const fadeSides = "linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
        background: art.bg,
        borderRadius: 10,
        border: `1px solid ${art.border}`,
        isolation: "isolate",
      }}
    >
      {/* 1 — the volume of air */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, transparent 44%, ${art.notation}0a 72%, ${art.floor}1f 100%)`,
          WebkitMaskImage: fadeSides,
          maskImage: fadeSides,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* 2 — two lights raking in from the wings */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "88%",
          background: `radial-gradient(46% 68% at 16% 100%, ${art.notation}12 0%, transparent 70%), radial-gradient(46% 68% at 84% 100%, ${art.prop}10 0%, transparent 70%)`,
          WebkitMaskImage: fadeSides,
          maskImage: fadeSides,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* 3 — the floor itself */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "14%",
          height: 2,
          background: `radial-gradient(60% 100% at 50% 50%, ${art.floor} 0%, ${art.floor}88 40%, transparent 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {children}
    </div>
  );
}
