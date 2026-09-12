import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import { art } from "../ui/theme";
import { Explorer } from "../Explorer";

/**
 * The tool, with as little around it as possible.
 *
 * A visitor reaches this page having already read the argument, so the page
 * does not repeat it. One line of orientation, a way back, and then the
 * explorer takes the whole viewport.
 */

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: art.bg,
    color: art.text,
    fontFamily: tokens.fontFamilyBase,
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "14px",
    paddingBottom: "14px",
    borderBottom: `1px solid ${art.border}`,
  },
  title: {
    fontFamily: art.mono,
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: art.notation,
  },
  hint: {
    fontSize: "0.85rem",
    color: art.muted,
    "@media (max-width: 640px)": { display: "none" },
  },
  spacer: { flex: 1 },
  body: {
    flex: 1,
    // The explorer fills what is left of the viewport rather than sitting in
    // the top half with dead space under it -- on this page the tool IS the
    // page, so it gets the room.
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "18px",
    paddingBottom: "24px",
    "@media (max-width: 640px)": {
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingTop: "12px",
    },
  },
});

export function EnginePage() {
  const s = useStyles();

  return (
    <div className={s.page}>
      <div className={s.bar}>
        <Button appearance="subtle" icon={<ArrowLeftRegular />} href="#/" as="a">
          Back
        </Button>
        <span className={s.title}>JUGGLING ENGINE</span>
        <span className={s.spacer} />
        <span className={s.hint}>
          Pick a pattern you know, or type one — digits, or brackets for sync.
        </span>
      </div>
      <div className={s.body}>
        <Explorer />
      </div>
    </div>
  );
}
