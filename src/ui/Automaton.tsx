import { BEAT_S } from "../engine";
import { art } from "./theme";

/**
 * The Automaton.
 *
 * Borrowed from the deck this engine came out of, where he is the archivist who
 * remembers what human memory could not. He belongs on this page for the same
 * reason: he is a MACHINE THAT READS THE NOTATION, which is what the engine is.
 *
 * He is not imitating a human juggler and is pleased about it. No hands --
 * emitter coils instead, so he steers props in flight rather than gripping and
 * releasing them. No grip means no release error and no dwell, which is why the
 * ceiling that limits a human body does not apply to him.
 *
 * THE OIL CAN is the joke and it survives the move intact: a person's limit is
 * tolerance, his is a maintenance schedule. It is the whole difference between
 * a body and a machine, drawn in one prop at his feet.
 */
export function Automaton({ width = 215 }: { width?: number }) {
  return (
  <svg viewBox="0 0 160 250" style={{ width, height: width * 1.56, overflow: "visible" }}>
    {/* legs — planted, square, no strain anywhere */}
    <path d="M 62 128 L 56 232" stroke={art.brass} strokeWidth="12" strokeLinecap="round" />
    <path d="M 98 128 L 104 232" stroke={art.brass} strokeWidth="12" strokeLinecap="round" />
    <rect x="44" y="230" width="26" height="8" rx="3" fill={art.brassDark} />
    <rect x="90" y="230" width="26" height="8" rx="3" fill={art.brassDark} />
    {/* THE OIL CAN — the only thing that limits him. A human's ceiling
        is tolerance; his is a maintenance schedule, and that joke is
        the whole difference between a body and a machine. */}
    <g>
      <path d="M 128 236 L 126 220 Q 126 214 133 214 Q 140 214 140 220 L 138 236 Q 138 239 133 239 Q 128 239 128 236 Z" fill={art.brass} stroke={art.brassDark} strokeWidth="1.5" />
      <path d="M 138 220 Q 150 214 154 204" fill="none" stroke={art.brassDark} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="129" y="209" width="9" height="5" rx="2" fill={art.brassDark} />
      <ellipse cx="133" cy="241" rx="9" ry="2" fill={art.brassDark} opacity={0.5} />
    </g>
    {/* torso, with plating so he reads as built rather than carved */}
    <rect x="50" y="62" width="60" height="72" rx="9" fill={art.brassDeep} stroke={art.brassDark} strokeWidth="2" />
    <line x1="50" y1="86" x2="110" y2="86" stroke={art.brassDark} strokeWidth="1.5" opacity={0.7} />
    <line x1="50" y1="110" x2="110" y2="110" stroke={art.brassDark} strokeWidth="1.5" opacity={0.7} />
    {/* chest dial — the beat counter, ticking on the true beat */}
    <circle cx="80" cy="98" r="15" fill={art.bg} opacity={0.5} />
    <circle cx="80" cy="98" r="15" fill="none" stroke={art.brass} strokeWidth="2.5" />
    <line x1="80" y1="98" x2="80" y2="86" stroke={art.eye} strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: "80px 98px", animation: `je-spin ${BEAT_S * 8}s linear infinite` }} />
    {/* arms held WIDE and level — the posture of something not working hard */}
    <path d="M 50 76 L 12 104" stroke={art.brass} strokeWidth="10" strokeLinecap="round" />
    <path d="M 110 76 L 148 104" stroke={art.brass} strokeWidth="10" strokeLinecap="round" />
    {/* NO HANDS. Emitter coils instead — it does not grip and release,
        it STEERS the props in flight. Which is why the deck's ceiling
        argument does not apply to it: no grip means no release error,
        no dwell, and N−2H stops being a constraint at all. The arcs
        are smoother than a body could ever throw them. */}
    {[
      { x: 12, y: 104 },
      { x: 148, y: 104 },
    ].map(({ x, y }) => (
      <g key={x}>
        <circle cx={x} cy={y} r="9" fill={art.brassDark} stroke={art.brass} strokeWidth="2" />
        <circle cx={x} cy={y} r="4.5" fill={art.eye} style={{ animation: "je-glow 1.7s ease-in-out infinite" }} />
        {/* field arcs — the steering, drawn as three rising rings */}
        {[13, 19, 25].map((r, k) => (
          <path
            key={r}
            d={`M ${x - r} ${y - 2} A ${r} ${r} 0 0 1 ${x + r} ${y - 2}`}
            fill="none"
            stroke={art.eye}
            strokeWidth="1.4"
            opacity={0.5 - k * 0.13}
            style={{ animation: `je-glow ${2 + k * 0.6}s ease-in-out ${k * 0.3}s infinite` }}
          />
        ))}
      </g>
    ))}
    {/* head, and the eyes he is pleased with */}
    <rect x="60" y="16" width="40" height="34" rx="8" fill={art.brass} stroke={art.brassDark} strokeWidth="2" />
    <rect x="66" y="50" width="28" height="12" rx="3" fill={art.brassDark} />
    {[71, 89].map((x) => (
      <circle key={x} cx={x} cy="31" r="5" fill={art.eye} style={{ animation: "je-glow 3.4s ease-in-out infinite" }} />
    ))}
    {/* antenna — a small flourish, because he is showing off */}
    <line x1="80" y1="16" x2="80" y2="6" stroke={art.brassDark} strokeWidth="2" />
    <circle cx="80" cy="4" r="3" fill={art.eye} opacity={0.9} />
  </svg>
  );
}
