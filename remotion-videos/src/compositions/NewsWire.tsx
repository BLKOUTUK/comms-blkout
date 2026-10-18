import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS, FONTS } from "../brand";
import globalGeo from "./wire/gb-wire.json";
import streetGeo from "./wire/street-wire.json";

// "The Wire" — news-round promo (Rob, 18 Oct 2026). The global diaspora through a UK lens:
// a dot-matrix globe turned to Britain (its dots in gold), telegraph wires carrying real Morse
// (HAVENT YOU HEARD). The payoff line is the campaign's "Tell Sid": BLKOUT. Are you in?
// Points are places, never member locations. scale "street" is the hyperlocal version: an
// indicative, generated neighbourhood (no real street), homes as dots, the wire between doorsteps.

export const newsWireSchema = z.object({
  scale: z.enum(["global", "street"]).default("global"),
  moment: z.enum(["open", "voted", "lastcall", "results"]),
  storyCount: z.number().int().optional(),
  // The deadline people act on; no round numbers on screen (Rob, 18 Oct 2026).
  closesOn: z.string(), // e.g. "Sat 31 Oct"; last call uses e.g. "midnight tomorrow"
  // Results only. There is no results Reel when nobody voted: that Sunday posts the next
  // round's "open" Reel instead (Rob, 18 Oct 2026).
  pickedBy: z.enum(["votes", "editor"]).optional(),
});
type Props = z.infer<typeof newsWireSchema>;

const MESSAGE = "HAVENT YOU HEARD";
const MORSE: Record<string, string> = {
  A: ".-", D: "-..", E: ".", H: "....", N: "-.", O: "---", R: ".-.", T: "-", U: "..-", V: "...-", Y: "-.--",
};

// Morse timing in frames: dot = 1 unit, dash = 3, gaps 1 / 3 / 7 (standard ratios).
const UNIT = 3;
type Mark = { start: number; len: number };
function morseMarks(text: string): { marks: Mark[]; total: number } {
  const marks: Mark[] = [];
  let t = 0;
  for (const word of text.split(" ")) {
    for (const ch of word) {
      for (const sym of MORSE[ch]) {
        const len = (sym === "." ? 1 : 3) * UNIT;
        marks.push({ start: t, len });
        t += len + UNIT;
      }
      t += 2 * UNIT;
    }
    t += 4 * UNIT;
  }
  return { marks, total: t };
}
const { marks: MARKS, total: MORSE_TOTAL } = morseMarks(MESSAGE);

type Node = { x: number; y: number; kind: string };

function ctrl(a: Node, b: Node) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  return { x: mx - dy * 0.2, y: my + dx * 0.2 };
}
function at(a: Node, c: { x: number; y: number }, b: Node, t: number) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}
type Edge = [number, number];
const length = (nodes: Node[], [i, j]: Edge) => Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);

// How busy the wire is, per moment.
function traffic(moment: Props["moment"], nodes: Node[], edges: Edge[]) {
  const all = edges.map((_, i) => i);
  switch (moment) {
    case "open": return { lanes: all, stagger: 9, reverse: false, intensity: 0.85 };   // the call goes out
    case "voted": return { lanes: all, stagger: 5, reverse: true, intensity: 1 };      // the world answers
    case "lastcall": return { lanes: all, stagger: 2, reverse: false, intensity: 1.2 }; // everyone at once
    case "results": // the three longest wires burn brightest
      return { lanes: [...all].sort((a, b) => length(nodes, edges[b]) - length(nodes, edges[a])).slice(0, 3), stagger: 8, reverse: false, intensity: 1.1 };
  }
}

export const NewsWire: React.FC<Props> = ({ scale = "global", moment, storyCount, closesOn, pickedBy }) => {
  const geo = scale === "street" ? streetGeo : globalGeo;
  const nodes = geo.nodes as Node[];
  const edges = geo.edges as Edge[];
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const payoff = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tr = traffic(moment, nodes, edges);
  const winners = moment === "results" ? new Set(tr.lanes) : new Set<number>();
  const [vx, vy, vw, vh] = geo.viewBox;
  const { cx, cy, r } = geo.globe;
  const sub = {
    open: `Vote before ${closesOn}${storyCount ? ` · ${storyCount} stories` : ""}`,
    voted: `Have you voted? Vote before ${closesOn}`,
    lastcall: `Last call · vote before ${closesOn}`,
    results: "The results are in",
  }[moment];
  // What the vote is and what it does, in one plain line per moment. Results never claim a
  // community verdict the vote didn't produce.
  const explain = {
    open: "Pick the stories that matter to you. The three with the most votes lead our news digest.",
    voted: "One tap, no login. Your vote decides which stories lead the digest.",
    lastcall: "Vote now. The three with the most votes lead this week's digest.",
    results: {
      votes: "You chose the top three. They lead this week's digest.",
      editor: "No clear winner, so an editor picked this round's top three.",
    }[pickedBy ?? "votes"],
  }[moment];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.obsidian, opacity: fadeIn }}>
      <div style={{ position: "absolute", top: 100, left: 80, right: 80 }}>
        <div style={{ fontFamily: FONTS.italic, fontStyle: "italic", fontSize: 84, lineHeight: 1, color: COLORS.cream }}>
          Haven&rsquo;t you heard?
        </div>
        <div style={{ marginTop: 22, fontFamily: FONTS.display, fontWeight: 700, fontSize: 40, color: COLORS.goldDivine }}>
          {sub}
        </div>
        <div style={{ marginTop: 14, fontFamily: FONTS.display, fontWeight: 500, fontSize: 34, lineHeight: 1.25, color: COLORS.cream }}>
          {explain}
        </div>
      </div>

      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} style={{ position: "absolute", left: 90, top: 380, width: 900, height: 900 }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="halo">
            <stop offset="0%" stopColor={COLORS.goldDivine} stopOpacity={0.45} />
            <stop offset="100%" stopColor={COLORS.goldDivine} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="sea" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#151530" />
            <stop offset="100%" stopColor="#07070f" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="url(#sea)" stroke={COLORS.goldRich} strokeWidth={2} strokeOpacity={0.4} />
        {scale === "street" && (
          <g>
            {streetGeo.streets.map((d, i) => (
              <path key={`s${i}`} d={d} fill="none" stroke={COLORS.cream} strokeOpacity={0.14} strokeWidth={streetGeo.streetWidths[i] * 2.2} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            <path d={streetGeo.rail} stroke={COLORS.creamMuted} strokeOpacity={0.5} strokeWidth={3} />
            <path d={streetGeo.rail} stroke={COLORS.creamMuted} strokeOpacity={0.5} strokeWidth={14} strokeDasharray="2 14" />
          </g>
        )}
        <path d={geo.landDots} fill={COLORS.cream} fillOpacity={0.32} />
        <circle cx={nodes[geo.hub].x} cy={nodes[geo.hub].y - (scale === "global" ? 18 : 0)} r={70} fill="url(#halo)" />
        <path d={geo.ukDots} fill={COLORS.goldDivine} />
        {edges.map(([i, j], k) => {
          const a = nodes[i], b = nodes[j], c = ctrl(a, b);
          const lit = winners.has(k);
          return (
            <path key={`w${k}`} d={`M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`} fill="none"
              stroke={lit ? COLORS.goldDivine : COLORS.goldRich} strokeWidth={lit ? 4 : 1.4} strokeOpacity={lit ? 0.95 : 0.45} />
          );
        })}
        {tr.lanes.map((k, n) => {
          const [i, j] = edges[k];
          const [a, b] = tr.reverse ? [nodes[j], nodes[i]] : [nodes[i], nodes[j]];
          const c = ctrl(a, b);
          const travel = 18 + length(nodes, edges[k]) / 12; // long wires take longer
          const local = (frame - n * tr.stagger + MORSE_TOTAL * 4) % MORSE_TOTAL;
          return MARKS.filter((m) => local >= m.start && local < m.start + m.len + travel).map((m, q) => {
            const t = Math.min(1, (local - m.start) / travel);
            const tail = Math.max(0, t - (m.len > UNIT ? 0.14 : 0.045));
            const d = Array.from({ length: 9 }, (_, s) => at(a, c, b, tail + ((t - tail) * s) / 8))
              .map((p, s) => `${s ? "L" : "M"}${p.x},${p.y}`).join(" ");
            return <path key={`p${k}-${q}`} d={d} fill="none" stroke={COLORS.goldDivine} strokeLinecap="round"
              strokeWidth={4.5 * tr.intensity} opacity={1 - t * 0.3} filter="url(#glow)" />;
          });
        })}
        {nodes.map((p, i) => {
          const pulse = 0.55 + 0.45 * Math.abs(Math.sin((frame + i * 7) / 14));
          const big = i === geo.hub;
          return (
            <g key={`n${i}`}>
              <circle cx={p.x} cy={p.y} r={big ? 15 : 10} fill="none" stroke={COLORS.cream} strokeWidth={1.4} opacity={0.5 * pulse} />
              <circle cx={p.x} cy={p.y} r={big ? 6.5 : p.kind === "uk" ? 4 : 5} fill={p.kind === "home" ? COLORS.goldDivine : COLORS.cream} />
            </g>
          );
        })}
      </svg>

      <div style={{ position: "absolute", left: 80, right: 80, top: 1300, opacity: payoff }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 150, lineHeight: 0.95, color: COLORS.white, letterSpacing: -2 }}>
          BLKOUT
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 150, lineHeight: 0.95, color: COLORS.goldDivine, letterSpacing: -2 }}>
          Are you in?
        </div>
      </div>

      <div style={{ position: "absolute", left: 80, right: 80, bottom: 110, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 500, fontSize: 38, color: COLORS.cream }}>News for us. Curated by you.</div>
          <div style={{ marginTop: 10, fontFamily: FONTS.mono, fontSize: 28, color: COLORS.goldDivine, letterSpacing: 2 }}>Vote at news.blkoutuk.com · no login</div>
        </div>
        <Img src={staticFile("assets/blkoutlogo_wht_transparent.png")} style={{ height: 90 }} />
      </div>

      {/* The insider line: the same Morse the wires carry, for those who read it. */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: FONTS.mono,
        fontSize: 26, color: COLORS.goldDivine, opacity: 0.85, letterSpacing: 3 }}>
        {MESSAGE.split(" ").map((w) => [...w].map((ch) => MORSE[ch].replace(/\./g, "·").replace(/-/g, "–")).join(" ")).join("   /   ")}
      </div>
    </AbsoluteFill>
  );
};
