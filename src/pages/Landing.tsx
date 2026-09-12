import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowRightRegular } from "@fluentui/react-icons";
import { art } from "../ui/theme";
import { Automaton } from "../ui/Automaton";
import { LivePattern } from "../ui/LivePattern";
import { Checks } from "../ui/Checks";

/**
 * The story page.
 *
 * "Without the story it is nothing" -- the engine on its own is dots moving in
 * a box. What makes it worth anything is the fact underneath: siteswap is a
 * real notation that describes juggling patterns as numbers, most jugglers
 * cannot read it, and this reads it for them.
 *
 * The page is deliberately short. Someone arriving from a talk has already been
 * sold; they need the argument compressed and then the door.
 */

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    background: art.bg,
    color: art.text,
    fontFamily: tokens.fontFamilyBase,
  },
  wrap: {
    maxWidth: "1040px",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "24px",
    paddingRight: "24px",
    paddingTop: "72px",
    paddingBottom: "96px",
    "@media (max-width: 640px)": {
      paddingTop: "40px",
      paddingBottom: "56px",
    },
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "40px",
    alignItems: "center",
    "@media (max-width: 820px)": {
      gridTemplateColumns: "1fr",
      gap: "24px",
    },
  },
  h1: {
    fontFamily: art.mono,
    fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1.02,
    margin: 0,
    color: art.text,
  },
  h1accent: { color: art.notation },
  standfirst: {
    fontSize: "clamp(1.05rem, 2vw, 1.35rem)",
    lineHeight: 1.6,
    color: art.muted,
    maxWidth: "44ch",
    marginTop: "20px",
    marginBottom: "32px",
  },
  h2: {
    fontFamily: art.mono,
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.26em",
    textTransform: "uppercase",
    color: art.notation,
    marginTop: "6px",
    marginBottom: "14px",
    lineHeight: 1.5,
  },
  section: {
    marginTop: "72px",
    display: "grid",
    // The heading sits in its own narrow rail beside the prose rather than
    // stacked on top of it. Uses the full page width, keeps one comfortable
    // measure for reading, and needs no column balancing.
    gridTemplateColumns: "220px 1fr",
    gap: "40px",
    alignItems: "start",
    "@media (max-width: 820px)": {
      gridTemplateColumns: "1fr",
      gap: "12px",
      marginTop: "48px",
    },
  },
  sectionWide: {
    marginTop: "72px",
    "@media (max-width: 640px)": { marginTop: "48px" },
  },
  prose: {
    fontSize: "1.05rem",
    lineHeight: 1.75,
    color: art.text,
    maxWidth: "62ch",
    "& p": { marginTop: 0, marginBottom: "1.1em" },
    "& strong": { color: art.text, fontWeight: 600 },
    "& code": {
      fontFamily: art.mono,
      fontSize: "0.95em",
      color: art.notation,
      background: `${art.notation}14`,
      paddingLeft: "6px",
      paddingRight: "6px",
      paddingTop: "2px",
      paddingBottom: "2px",
      borderRadius: "4px",
    },
  },
  proseSingle: {
    fontSize: "1.05rem",
    lineHeight: 1.75,
    color: art.text,
    maxWidth: "70ch",
    "& p": { marginTop: 0, marginBottom: "1.1em" },
    "& code": {
      fontFamily: art.mono,
      fontSize: "0.95em",
      color: art.notation,
      background: `${art.notation}14`,
      paddingLeft: "6px",
      paddingRight: "6px",
      paddingTop: "2px",
      paddingBottom: "2px",
      borderRadius: "4px",
    },
  },
  examplesWrap: { marginTop: "28px" },
  examples: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "28px",
  },
  card: {
    border: `1px solid ${art.border}`,
    borderRadius: "10px",
    background: art.panel,
    padding: "18px 18px 14px",
  },
  cardPattern: {
    fontFamily: art.mono,
    fontSize: "2rem",
    fontWeight: 700,
    color: art.notation,
    lineHeight: 1,
  },
  cardName: {
    fontFamily: art.mono,
    fontSize: "0.9rem",
    color: art.text,
    marginTop: "8px",
  },
  cardNote: {
    fontSize: "0.85rem",
    color: art.muted,
    marginTop: "4px",
    lineHeight: 1.5,
  },
  cta: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" },
  ctaNote: { fontSize: "0.85rem", color: art.muted },
  foot: {
    marginTop: "80px",
    paddingTop: "24px",
    borderTop: `1px solid ${art.border}`,
    fontSize: "0.85rem",
    color: art.muted,
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
  },
  link: { color: art.notation, textDecoration: "none" },
});

const EXAMPLES = [
  { p: "3", name: "Cascade", note: "Three balls, every throw crossing. The one everybody pictures." },
  { p: "531", name: "531", note: "Three balls, three different heights, every beat." },
  { p: "(4,2x)(2x,4)", name: "The Box", note: "Both hands at once. One ball shuttles across the middle." },
];

export function Landing() {
  const s = useStyles();

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        {/* ── hero ─────────────────────────────────────────────────────── */}
        <div className={s.hero}>
          <div>
            <h1 className={s.h1}>
              Juggling
              <br />
              <span className={s.h1accent}>Engine</span>
            </h1>
            <p className={s.standfirst}>
              Siteswap describes a juggling pattern as a string of numbers. Most jugglers cannot
              read it. This reads it for you.
            </p>
            <div className={s.cta}>
              <Button appearance="primary" size="large" icon={<ArrowRightRegular />} iconPosition="after" href="#/engine" as="a">
                Get the juggling engine
              </Button>
              <span className={s.ctaNote}>No install. Type a pattern and watch it run.</span>
            </div>
          </div>
          <Automaton width={200} />
        </div>

        {/* ── what is this ─────────────────────────────────────────────── */}
        <section className={s.section}>
          <h2 className={s.h2}>What is this?</h2>
          <div className={s.prose}>
            <p>
              An engine that turns siteswap notation into a running pattern. You type{" "}
              <code>531</code> and three balls start moving — not an animation somebody drew, but
              every throw solved from the digits as a real parabola with a real flight time.
            </p>
            <p>
              It exists because of a gap. Jugglers who came up after siteswap spread live inside the
              notation. Jugglers who came up before it — and that is most people who have been
              throwing for thirty years — never learned to read it. They know every pattern in their
              hands and none of them by number.
            </p>
            <p>
              So the direction that matters here is <strong>pattern to name</strong>, not name to
              pattern. Pick something you already throw and the engine tells you what siteswap calls
              it. That is the opposite of every notation tutorial, and it is the right way round for
              somebody who has been juggling since they were eleven.
            </p>
          </div>
        </section>

        {/* ── what is siteswap ─────────────────────────────────────────── */}
        <section className={s.section}>
          <h2 className={s.h2}>What is siteswap, aka quantum juggling</h2>
          <div className={s.prose}>
            <p>
              Each digit is <strong>how many beats later that throw lands</strong>. That is the
              entire language. A <code>3</code> lands three beats after it leaves; a <code>5</code>{" "}
              is thrown higher because it has to stay up for five.
            </p>
            <p>
              Two rules fall out of that and they do a surprising amount of work. The{" "}
              <strong>average of the digits is the number of props</strong> — so <code>531</code> is
              three balls, because five plus three plus one over three is three. And a pattern is{" "}
              <strong>legal only if no two throws land on the same beat in the same hand</strong>,
              which is a permutation check, not a matter of taste. The engine runs that check before
              it draws anything: if it renders, the maths says it is throwable.
            </p>
            <p>
              One more, and it is the piece people find satisfying: <strong>odd digits cross</strong>{" "}
              between hands and <strong>even digits stay</strong> on the same side. That single line
              of arithmetic is why a cascade looks like a figure of eight and a fountain looks like
              two columns.
            </p>
          </div>
        </section>

        <div className={s.examplesWrap}>
          <div className={s.examples}>
            {EXAMPLES.map((e) => (
              <div key={e.p} className={s.card}>
                <div className={s.cardPattern}>{e.p}</div>
                <div className={s.cardName}>{e.name}</div>
                <div className={s.cardNote}>{e.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── see it ───────────────────────────────────────────────────── */}
        <section className={s.sectionWide}>
          <h2 className={s.h2}>Three balls, and the beat under them</h2>
          <LivePattern pattern={[3]} height={260} propSize={24} />
          <div className={s.proseSingle} style={{ marginTop: "20px" }}>
            <p>
              That is <code>3</code>, solved rather than drawn. Every arc on screen has a real
              apex and a real flight time, and gravity is a parameter — the engine will run the same
              pattern on Mars if you ask it to.
            </p>
            <div className={s.cta}>
              <Button appearance="primary" size="large" icon={<ArrowRightRegular />} iconPosition="after" href="#/engine" as="a">
                Get the juggling engine
              </Button>
            </div>
          </div>
        </section>

        {/* ── the guarantee, checkable ─────────────────────────────────── */}
        <section className={s.section}>
          <h2 className={s.h2}>Does it actually work?</h2>
          <div>
            <div className={s.proseSingle} style={{ marginBottom: "20px" }}>
              <p>
                The claim is narrow and testable: <strong>if it renders, the maths says it is a
                valid pattern, and if it is a valid vanilla pattern, it renders.</strong> Both
                directions are checked — the second by brute force over all 670 legal patterns up
                to period four.
              </p>
            </div>
            <Checks />
          </div>
        </section>

        <footer className={s.foot}>
          <span>MIT licensed.</span>
          <a className={s.link} href="https://github.com/johnfrog76/juggling-engine">
            Source on GitHub
          </a>
          <span>Sync and vanilla siteswap. Multiplex and passing are not supported.</span>
        </footer>
      </div>
    </div>
  );
}
