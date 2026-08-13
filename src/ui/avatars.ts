/**
 * Avatar names, split out from the component that draws them.
 *
 * Fast refresh only works when a file exports components and nothing else, and
 * these constants are imported by the explorer's controls as well as by the
 * figure itself -- so they live here rather than being re-exported.
 */
export const AVATARS = ["hands", "figure", "robot", "alien"] as const;

export type Avatar = (typeof AVATARS)[number];

/** Does this avatar override the prop colour? Only the alien does. */
export function propColorFor(avatar: Avatar, fallback: string, alien: string): string {
  return avatar === "alien" ? alien : fallback;
}
