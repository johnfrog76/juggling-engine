import { useEffect, useState } from "react";

/**
 * Is the viewport narrow enough to need the stacked layout?
 *
 * The explorer has two shapes: figure and controls side by side where there is
 * width, and figure plus a bottom drawer where there is not. A phone cannot
 * show a running pattern AND a control column at a usable size, and between the
 * two it is the pattern that is worth seeing.
 *
 * 576px is the boundary. Below it is the base case — portrait phones. At 576
 * and up (landscape phones, small tablets) the side-by-side split fits.
 *
 * Live matchMedia subscription so rotating a phone to landscape restores the
 * split without a reload. Guarded for jsdom, which has no matchMedia: tests get
 * `false`, the desktop layout.
 */
export const COMPACT_MAX_WIDTH = 575;

const QUERY = `(max-width: ${COMPACT_MAX_WIDTH}px)`;

export function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(() => window.matchMedia?.(QUERY).matches ?? false);

  useEffect(() => {
    const mql = window.matchMedia?.(QUERY);
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setCompact(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return compact;
}
