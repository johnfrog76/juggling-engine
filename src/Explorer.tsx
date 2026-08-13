import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  InlineDrawer,
  OverlayDrawer,
} from "@fluentui/react-components";
import { DismissRegular, SettingsRegular } from "@fluentui/react-icons";
import { useSiteswapSim, ALWAYS_LIVE, expand, validate, type Planet, type Prop } from "./engine";
import { formatSync, sampleSyncAt, parseSync, validateSync } from "./sync";
import {
  CATALOGUE,
  asCurrent,
  labelOf,
  parsePattern,
  describe,
  type Current,
} from "./patterns";
import { PropGlyph, GraphicHand } from "./ui/glyphs";
import { art } from "./ui/theme";
import { useCompactLayout } from "./ui/useCompactLayout";


// ── The stage ───────────────────────────────────────────────────────────────

function LiveFigure({
  current,
  prop,
  planet,
  height = 360,
  fill = false,
}: {
  current: Current;
  prop: Prop;
  planet: Planet;
  height?: number;
  /**
   * Take the height of whatever contains this instead of a fixed number.
   *
   * The desktop layout knows how tall the figure should be and says so. A
   * phone does not: the space left over depends on the readout, the handle and
   * the browser's own chrome, none of which are knowable up front. So compact
   * measures its box and fits the pattern to what it actually got.
   */
  fill?: boolean;
}) {
  // Vanilla runs through the engine's own hook; sync samples per frame here.
  // Two timing modes, two paths — the alternative was making the hook
  // conditional, which would have complicated the path already proven across
  // 670 patterns for the sake of the newer one.
  const vanilla = current.kind === "vanilla" ? current.digits : [3];
  // The `kind` check is the real condition here: sync patterns are sampled
  // per-frame further down rather than through this hook.
  const sim = useSiteswapSim(vanilla, {
    prop,
    planet,
    enabled: ALWAYS_LIVE && current.kind === "vanilla",
  });

  // Same reasoning as the engine's sim hook: key the animation on the pattern's
  // CONTENT so a re-render with an equivalent pattern does not restart it.
  const syncKey = current.kind === "sync" ? formatSync(current.beats) : "";

  const [syncT, setSyncT] = useState(0);
  useEffect(() => {
    if (current.kind !== "sync") return;
    let raf = 0;
    const started = performance.now();
    const tick = () => {
      setSyncT((performance.now() - started) / 1000 / 0.42);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
     
  }, [current.kind, syncKey]);

  const positions =
    current.kind === "sync" ? sampleSyncAt(current.beats, syncT, { prop, planet }) : (sim?.positions ?? []);

  const peak =
    current.kind === "sync"
      ? Math.max(...current.beats.flatMap((b) => [b.left.value, b.right.value]), 3)
      : Math.max(...expand(current.digits), 3);

  // In fill mode the usable height is measured rather than passed.
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState(0);
  useEffect(() => {
    if (!fill) return;
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setMeasured(entry.contentRect.height));
    ro.observe(el);
    setMeasured(el.clientHeight);
    return () => ro.disconnect();
  }, [fill]);

  // Fit the tallest throw into the box we were given — the caller passes the
  // scale, exactly as the engine's design note says it should.
  const box = fill ? measured : height;
  const apexPx = 11.5 * Math.pow(Math.max(peak - 1.4, 0.45), 2);
  const fit = box <= 0 ? 1 : Math.max(0.12, Math.min(1, (box - 120) / Math.max(apexPx, 1)));

  return (
    // FILL IS ABSOLUTE, not `height: 100%`. The compact layout puts this inside
    // a flex child, where a percentage height has no resolved base to measure
    // against: the box was 628px tall and the figure computed to 0, so the
    // ResizeObserver saw nothing and the pattern never drew. Absolute
    // positioning takes the parent's real box whatever sized it.
    <div
      ref={boxRef}
      style={
        fill
          ? { position: "absolute", inset: 0, overflow: "hidden" }
          : { position: "relative", width: "100%", height, overflow: "hidden" }
      }
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "16%",
          height: 2,
          background: `radial-gradient(60% 100% at 50% 50%, ${art.floor} 0%, transparent 100%)`,
        }}
      />
          <div style={{ position: "absolute", left: "50%", bottom: "16%", transform: `translateX(-50%) scale(${fit})`, transformOrigin: "50% 100%" }}>
        {[-1, 1].map((side) => (
          <div
            key={side}
            style={{
              position: "absolute",
              left: side * 64,
              bottom: 0,
              transform: `translateX(-50%) scaleX(${side})`,
            }}
          >
            <GraphicHand side={side < 0 ? "left" : "right"} prop={prop} size={44} color={art.body} />
          </div>
        ))}
        {positions.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              bottom: -p.y,
              transform: "translate(-50%, 50%)",
            }}
          >
            <PropGlyph prop={prop} size={prop === "rings" ? 26 : 18} color={art.prop} view="front" spin={p.spin} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              fontFamily: art.mono,
              fontSize: "0.85rem",
              padding: "0.45rem 0.9rem",
              minHeight: 44,
              cursor: "pointer",
              borderRadius: 4,
              border: `1px solid ${on ? art.notation : art.border}`,
              background: on ? art.notation : "transparent",
              color: on ? art.bg : art.muted,
              fontWeight: on ? 700 : 400,
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ── The explorer ────────────────────────────────────────────────────────────

export function Explorer() {
  const [current, setCurrent] = useState<Current>({ kind: "vanilla", digits: [3] });
  const [prop, setProp] = useState<Prop>("balls");
  const [planet, setPlanet] = useState<Planet>("earth");
  const [text, setText] = useState("3");
  const [typedError, setTypedError] = useState<string | null>(null);
  // OPEN ON DESKTOP, SHUT ON A PHONE. The desktop case is somebody presenting
  // and driving it live, where a hidden control panel is the wrong default. On
  // a phone the overlay would cover the pattern on arrival, which is the one
  // thing worth seeing first.
  const compact = useCompactLayout();
  const [drawer, setDrawer] = useState(!compact);

  // `current` is rebuilt on every keystroke but is usually equivalent; its
  // label is the stable identity.
  const currentLabel = labelOf(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- currentLabel IS current, by content
  const info = useMemo(() => describe(current), [currentLabel]);

  const pick = (p: number[] | string) => {
    const c = asCurrent(p);
    setCurrent(c);
    setText(labelOf(c));
    setTypedError(null);
  };

  const submit = (raw: string) => {
    setText(raw);

    // SYNC first — a leading "(" is unambiguous, and the sync parser returns
    // null for anything else so vanilla still gets its turn.
    const beats = parseSync(raw);
    if (beats) {
      const v = validateSync(beats);
      if (!v.legal) {
        setTypedError(v.reason ?? "Not a legal sync pattern");
        return;
      }
      setTypedError(null);
      setCurrent({ kind: "sync", beats });
      return;
    }
    if (raw.trim().startsWith("(")) {
      setTypedError("Sync looks like (4,2x)(2x,4) — pairs in brackets");
      return;
    }

    const parsed = parsePattern(raw);
    if (!parsed) {
      setTypedError("Digits, or sync in brackets — try 531 or (4,2x)(2x,4)");
      return;
    }
    const v = validate(parsed);
    if (!v.legal) {
      setTypedError(
        v.collisionAt !== undefined
          ? `Two props would land on beat ${v.collisionAt} at once`
          : "The digits do not average to a whole number of props",
      );
      return;
    }
    setTypedError(null);
    setCurrent({ kind: "vanilla", digits: parsed });
  };

  // ONE SET OF CONTROLS, TWO HOMES. The desktop layout puts these in a column
  // beside the figure; compact puts the identical markup in a drawer. Built as
  // a variable rather than duplicated markup so the two can never drift -- the
  // drawer is a different PLACE to put the controls, not a different control
  // set.
  const controls = (
    <>
      {/* PATTERNS BY NAME -- the primary affordance. You know these; the
          engine tells you what they are called. */}
      <div>
        <div style={{ fontSize: "0.72rem", letterSpacing: "0.2em", color: art.muted, marginBottom: "0.6rem" }}>
          PATTERNS YOU KNOW
        </div>
        <div
          style={
            compact
              ? { display: "flex", flexDirection: "column", gap: 4 }
              : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 0.8rem" }
          }
        >
          {CATALOGUE.map((c, i) => {
            const on = labelOf(asCurrent(c.pattern)) === labelOf(current);
            // ZEBRA STRIPE (John). Two columns of wrapping notes made the rows
            // run together; a very low opacity tint rebuilds the boundary
            // without adding rules. Striped by ROW PAIR, not by index -- in a
            // 2-up grid, alternating every cell gives a checkerboard.
            const striped = (compact ? i : Math.floor(i / 2)) % 2 === 1;
            return (
              <button
                key={c.name}
                onClick={() => pick(c.pattern)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: "0.1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  // 44 stays the TOUCH target; desktop can be tighter, and the
                  // catalogue overflowed its column at the roomier size --
                  // three named patterns fell below the fold, which on the one
                  // slide that is a menu is the whole affordance lost.
                  minHeight: compact ? 44 : 34,
                  padding: compact ? "0.4rem 0.7rem" : "0.25rem 0.6rem",
                  borderRadius: 4,
                  border: `1px solid ${on ? art.notation : "transparent"}`,
                  background: on ? `${art.notation}14` : striped ? `${art.text}08` : "transparent",
                  color: art.text,
                  fontFamily: art.mono,
                }}
              >
                {/* NAME AND NOTATION ON ONE LINE -- that pairing is the whole
                    lesson, so they must never be separated. */}
                <span style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
                  <span style={{ fontSize: compact ? "1.05rem" : "0.95rem", fontWeight: 700, flex: 1, minWidth: 0 }}>{c.name}</span>
                  <span style={{ fontSize: compact ? "1.05rem" : "0.95rem", fontWeight: 700, color: art.notation, whiteSpace: "nowrap" }}>
                    {labelOf(asCurrent(c.pattern))}
                  </span>
                </span>
                {/* the note is the recognition hook -- "oh, THAT one" -- so it
                    gets its own line rather than being truncated to nothing.
                    Squeezing all three onto one line made every note unreadable
                    ("every throw...", "each hand k..."), which is worse than
                    the extra row it costs. */}
                <span style={{ fontSize: "0.72rem", color: art.muted, opacity: 0.8, lineHeight: 1.25 }}>{c.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TYPE ONE -- secondary. "Is 633 mine?" */}
      <div>
        <div style={{ fontSize: "0.72rem", letterSpacing: "0.2em", color: art.muted, marginBottom: "0.5rem" }}>
          OR TYPE ONE
        </div>
        <input
          value={text}
          onChange={(e) => submit(e.target.value)}
          spellCheck={false}
          aria-label="siteswap pattern"
          // NUMERIC KEYPAD ON PHONES, but inputMode not type=number: the field
          // also takes brackets and x for sync, which a number input rejects.
          inputMode="numeric"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: art.mono,
            fontSize: "1.5rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            padding: "0.6rem 0.8rem",
            minHeight: 44,
            borderRadius: 4,
            border: `1px solid ${typedError ? art.invalid : art.border}`,
            background: "rgba(8,7,16,0.6)",
            color: typedError ? art.invalid : art.notation,
          }}
        />
        <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", lineHeight: 1.5, color: typedError ? art.invalid : art.muted, opacity: typedError ? 1 : 0.7, minHeight: "2.4em" }}>
          {typedError ?? "Digits are how many beats later that throw lands. Brackets are sync."}
        </div>
      </div>

      {/* PROP + GRAVITY */}
      <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: compact ? "0.8rem" : "1.2rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.2em", color: art.muted, marginBottom: "0.5rem" }}>PROP</div>
          <Segmented options={["balls", "rings", "clubs"] as const} value={prop} onChange={setProp} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.2em", color: art.muted, marginBottom: "0.5rem" }}>GRAVITY</div>
          <Segmented options={["earth", "mars"] as const} value={planet} onChange={setPlanet} />
        </div>
      </div>
    </>
  );

  // The readout travels with the figure in both layouts -- it is what the
  // figure MEANS, not a control, so it never goes in the drawer.
  const readout = (
    <div
      style={{
        marginTop: compact ? "0.6rem" : "1rem",
        display: "flex",
        alignItems: "baseline",
        gap: compact ? "1rem" : "1.4rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: art.muted }}>SITESWAP</div>
        <div style={{ fontSize: compact ? "1.8rem" : "2.6rem", fontWeight: 700, color: art.notation, lineHeight: 1.1 }}>{info.label}</div>
      </div>
      <div>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: art.muted }}>PROPS</div>
        <div style={{ fontSize: compact ? "1.8rem" : "2.6rem", fontWeight: 700, color: art.prop, lineHeight: 1.1 }}>{info.props}</div>
      </div>
      <div>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: art.muted }}>IN THE AIR</div>
        <div style={{ fontSize: compact ? "1.8rem" : "2.6rem", fontWeight: 700, color: art.prop, lineHeight: 1.1 }}>{info.airborne}</div>
      </div>
      {!compact && (
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: art.muted }}>SHAPE</div>
          <div style={{ fontSize: "1rem", color: art.reading, lineHeight: 1.5 }}>{info.shape}</div>
        </div>
      )}
    </div>
  );

  // ── THE STAGE, shared by both layouts ────────────────────────────────────
  const stage = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          border: `1px solid ${art.border}`,
          borderRadius: 8,
          background: art.panel,
          overflow: "hidden",
        }}
      >
        <LiveFigure current={current} prop={prop} planet={planet} height={0} fill />
        {/* WHEN THE PANEL IS SHUT, THIS IS THE WAY BACK (John). Closing the
            drawer gives the pattern the whole frame, so the only affordance
            left has to be unmissable -- a big gear floating over the stage. */}
        {!drawer && (
          <Button
            appearance="subtle"
            size="large"
            icon={<SettingsRegular style={{ fontSize: 28 }} />}
            aria-label="Show patterns and controls"
            onClick={() => setDrawer(true)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              minWidth: 52,
              height: 52,
              color: art.notation,
              background: `${art.notation}14`,
              border: `1px solid ${art.notation}44`,
            }}
          />
        )}
      </div>
      {readout}
    </div>
  );

  // ── The controls live in a Drawer ─────────────────────────────────────────
  //
  // Fluent's Drawer rather than a hand-rolled sheet (John): it brings the focus
  // trap, the escape key, the overlay and a dismiss button already built and
  // already accessible, none of which a bespoke panel gets for free.
  //
  // INLINE on desktop, because the talk is presented full screen and driven
  // live -- the controls have to be visible, not a click away. OVERLAY on a
  // phone, because there is not room for both and the pattern is the thing
  // worth seeing.
  const panel = (
    <>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={() => setDrawer(false)}
            />
          }
        >
          <span style={{ fontFamily: art.mono, fontSize: "0.95rem", letterSpacing: "0.16em", color: art.notation }}>
            PATTERNS &amp; CONTROLS
          </span>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "1rem" }}>
          {controls}
        </div>
      </DrawerBody>
    </>
  );

  if (compact) {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          height: "100%",
          fontFamily: art.mono,
          color: art.text,
        }}
      >
        {stage}
        <OverlayDrawer
          open={drawer}
          position="bottom"
          onOpenChange={(_, d) => setDrawer(d.open)}
          style={{ height: "82vh", background: art.bg, borderTop: `1px solid ${art.notation}55` }}
        >
          {panel}
        </OverlayDrawer>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1.5rem", flex: 1, minHeight: 0, height: "100%", fontFamily: art.mono, color: art.text }}>
      {stage}
      <InlineDrawer
        open={drawer}
        position="end"
        separator
        style={{ width: "min(56%, 720px)", background: "transparent", borderLeft: `1px solid ${art.border}` }}
      >
        {panel}
      </InlineDrawer>
    </div>
  );
}

