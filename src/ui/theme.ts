import { webDarkTheme, webLightTheme } from "@fluentui/react-components";
import type { Theme as FluentTheme } from "@fluentui/react-components";

/**
 * Theming, in two halves — and the split is the important part.
 *
 * 1. THE CHROME is Fluent. Buttons, inputs, tabs, the drawer: all of it comes
 *    from @fluentui/react-components, themed by spreading a web theme and
 *    overriding a handful of brand tokens. Griffel (Fluent's CSS-in-JS) is the
 *    reason — it buys atomic CSS, real hover and focus states, and media
 *    queries, none of which inline styles can express.
 *
 * 2. THE ART is not. A juggling stage is not a control surface; it is a lit
 *    volume with props flying through it, and Fluent has no tokens for "the
 *    colour a prop is while airborne" or "the floor line under a figure". Those
 *    live in `art` below, and they are the palette carried over from the deck
 *    this engine was extracted from.
 *
 * Keeping them apart means somebody can restyle the controls to match their own
 * site without touching the look of the pattern itself, and vice versa.
 */

// ── 1 · Chrome ───────────────────────────────────────────────────────────────
//
// The brand accent is the notation cyan from the art palette, so the two halves
// agree at the one place they meet: a focused input and a rendered siteswap
// digit are the same colour, because they are the same idea.
export const darkTheme: FluentTheme = {
  ...webDarkTheme,
  colorBrandBackground: "#1a7f96",
  colorBrandBackgroundHover: "#2299b4",
  colorBrandBackgroundPressed: "#146678",
  colorBrandForeground1: "#62e6ff",
  colorBrandForeground2: "#3fd0ee",
};

export const lightTheme: FluentTheme = {
  ...webLightTheme,
  colorBrandBackground: "#146678",
  colorBrandBackgroundHover: "#1a7f96",
  colorBrandBackgroundPressed: "#0e4d5b",
  colorBrandForeground1: "#146678",
  colorBrandForeground2: "#1a7f96",
};

// ── 2 · Art ──────────────────────────────────────────────────────────────────

/**
 * The stage palette. Names say what a colour DOES, not where it came from —
 * the deck called this same amber "energy" and its background "quantum night",
 * which are names only that deck can explain.
 */
export interface ArtTheme {
  /** Stage ground. Dark, so a prop in flight reads as the bright thing. */
  bg: string;
  /** Panel edges and rules. */
  border: string;
  /** Secondary type — units, hints, annotations. */
  muted: string;
  /** Primary type. */
  text: string;
  /** PROPS IN FLIGHT. Whatever is airborne is the warmest thing on screen. */
  prop: string;
  /** THE NOTATION — digits, pattern labels, language rather than motion. */
  notation: string;
  /** Illegal input, collisions, anything the validator rejects. */
  invalid: string;
  /** Readouts and secondary numbers. */
  reading: string;
  /**
   * THE BODY. A raised slate rather than a near-black: a silhouette reads as a
   * silhouette whether it is darker or lighter than its ground, and on a dark
   * stage the legible choice is the lighter one.
   */
  body: string;
  /** The floor line under a pattern. */
  floor: string;
  /** Panel fill, one step up from the page. */
  panel: string;
  /** Siteswap is notation; it belongs in a mono face. */
  mono: string;

  /** The Automaton is built, not drawn: brass plate, darker seams. */
  brass: string;
  brassDark: string;
  brassDeep: string;
  /** His eyes and emitter coils — the one cool light on a warm machine. */
  eye: string;
  /**
   * THE ALIEN, and the props it throws.
   *
   * Not a skin on the same figure: an alien juggling amber props reads as a
   * costume, so the whole picture goes green -- body and props together (John).
   * The one avatar that changes what the props look like.
   */
  alien: string;
  /**
   * PER-PROP COLOURS for the "colored props" setting, cycled by orbit index.
   *
   * Born as a QA diagnostic on the deck's slide 22 — one club painted red so a
   * single prop could be tracked through the whole orbit by eye — and promoted
   * to a feature (John): being able to follow ONE prop is how a juggler reads
   * an unfamiliar pattern. Same six as the deck Automaton's LED balls, which
   * are a real product and already proven legible against the night stage.
   */
  propColors: string[];
  /**
   * The alien's PROPS: a pale GREY, not another green.
   *
   * At one flat green the clubs disappeared into the figure holding them --
   * same hue, near enough the same value. A brighter green fixed the contrast
   * and left two greens competing; grey separates cleanly and is neutral
   * enough to stay out of the way (John). It also happens to be the right
   * colour for a grey alien.
   *
   * The range was walked in both directions. A pale grey read as near-white
   * and pulled focus off the figure; #333 went too far the other way and
   * vanished into the dark stage, which matters most in MOTION -- a prop that
   * is hard to see standing still is impossible to follow mid-flight. #666 is
   * the value that stays legible while still sitting back.
   */
  alienProp: string;
}

export const nightArt: ArtTheme = {
  bg: "#131022",
  border: "#282344",
  muted: "#9a92b8",
  text: "#eae6f6",
  prop: "#ffb347",
  notation: "#62e6ff",
  invalid: "#f25c54",
  reading: "#e8d9b0",
  body: "#5a5478",
  floor: "#6a4a30",
  panel: "rgba(8,7,16,0.5)",
  mono: "'Cascadia Code', 'Fira Code', 'Consolas', ui-monospace, monospace",
  brass: "#95713d",
  brassDark: "#5c3f22",
  brassDeep: "#6a4f28",
  eye: "#7fd4e8",
  alien: "#5fbf7d",
  propColors: ["#ff5f8f", "#ffb347", "#ffe66d", "#7ee787", "#62e6ff", "#a78bfa"],
  alienProp: "#666666",
};

/**
 * A second palette, included to prove the seam is real — with only one, the
 * abstraction would be a guess. Warmer: props read as stage lights over a gym
 * floor rather than objects in a dark room.
 */
export const gymArt: ArtTheme = {
  ...nightArt,
  bg: "#161210",
  border: "#33291f",
  muted: "#a89880",
  text: "#f4ece0",
  prop: "#ffd166",
  notation: "#5fd0c4",
  body: "#6b5c47",
  floor: "#8a5f38",
  panel: "rgba(14,10,7,0.5)",
};

/** Base plus overrides. Any subset of tokens may be replaced. */
export function makeArt(overrides: Partial<ArtTheme> = {}, base: ArtTheme = nightArt): ArtTheme {
  return { ...base, ...overrides };
}

/**
 * The art palette components fall back to when not handed one.
 *
 * A mutable module default rather than React context on purpose: the glyphs are
 * leaf components called in tight loops, and an app that wants one look
 * everywhere sets it once at startup instead of wrapping a provider around
 * every figure.
 */
export let art: ArtTheme = nightArt;

/** Swap the default art palette. */
export function setArt(next: ArtTheme): void {
  art = next;
}
