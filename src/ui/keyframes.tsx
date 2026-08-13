/**
 * The handful of keyframes the art needs, injected once.
 *
 * These are plain CSS rather than Griffel's `makeStyles` because they are
 * global animation names referenced from inline SVG `style` attributes, which
 * is the one thing atomic CSS-in-JS is a poor fit for. Everything that is a
 * component style goes through Griffel; these three are the exception and the
 * reason is written here so nobody has to guess.
 */
export function Keyframes() {
  return (
    <style>{`
      @keyframes je-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes je-glow { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
      @keyframes je-sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
    `}</style>
  );
}
