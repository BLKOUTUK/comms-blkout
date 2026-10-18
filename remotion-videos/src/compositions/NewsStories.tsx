import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS, FONTS } from "../brand";
import geo from "./wire/gb-wire.json";

// The fortnight's stories, one after another, numbered, so people vote by commenting the
// number on Instagram (Rob, 18 Oct 2026: per-story shorts + comment voting; the video-wall
// idea in Reel form). Same Wire language as NewsWire. Headlines are quoted with their source.

export const newsStoriesSchema = z.object({
  closesOn: z.string(), // "Sat 31 Oct"
  stories: z.array(z.object({ title: z.string(), source: z.string().optional() })).min(1).max(10),
});
type Props = z.infer<typeof newsStoriesSchema>;

export const FPS = 30;
export const INTRO = 75, PER_STORY = 150, OUTRO = 120; // 2.5s, 5s each, 4s
export const storiesDuration = (n: number) => INTRO + n * PER_STORY + OUTRO;

const Backdrop: React.FC<{ glow: number }> = ({ glow }) => (
  <svg viewBox="0 0 1000 1000" style={{ position: "absolute", left: 140, top: 1100, width: 800, height: 800, opacity: 0.35 }}>
    <circle cx={500} cy={500} r={490} fill="#10101f" stroke={COLORS.goldRich} strokeOpacity={0.4} strokeWidth={2} />
    <path d={geo.landDots} fill={COLORS.cream} fillOpacity={0.35} />
    <path d={geo.ukDots} fill={COLORS.goldDivine} fillOpacity={0.6 + 0.4 * glow} />
  </svg>
);

// A Morse-ish pulse running across under the headline: the wire carrying the story.
const Wire: React.FC<{ frame: number }> = ({ frame }) => {
  const x = interpolate(frame % 60, [0, 60], [-200, 1080]);
  return (
    <svg width={1080} height={20} style={{ position: "absolute", left: 0, top: 1060 }}>
      <line x1={0} y1={10} x2={1080} y2={10} stroke={COLORS.goldRich} strokeOpacity={0.35} strokeWidth={2} />
      {[0, 40, 70, 160, 190].map((o, i) => (
        <line key={i} x1={x + o} y1={10} x2={x + o + (i % 2 ? 12 : 40)} y2={10} stroke={COLORS.goldDivine} strokeWidth={6} strokeLinecap="round" />
      ))}
    </svg>
  );
};

const Story: React.FC<{ n: number; title: string; source?: string }> = ({ n, title, source }) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(f, [PER_STORY - 10, PER_STORY], [1, 0], { extrapolateLeft: "clamp" });
  const size = title.length > 110 ? 58 : title.length > 70 ? 66 : 78;
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, exit) }}>
      <div style={{ position: "absolute", top: 260, left: 80, display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ width: 170, height: 170, borderRadius: 85, border: `5px solid ${COLORS.goldDivine}`, display: "flex",
          alignItems: "center", justifyContent: "center", fontFamily: FONTS.display, fontWeight: 900, fontSize: 104, color: COLORS.goldDivine }}>
          {n}
        </div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 40, color: COLORS.cream, lineHeight: 1.2 }}>
          Comment <span style={{ color: COLORS.goldDivine }}>{n}</span><br />to vote
        </div>
      </div>
      <div style={{ position: "absolute", top: 520, left: 80, right: 80, transform: `translateY(${(1 - enter) * 30}px)` }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: size, lineHeight: 1.12, color: COLORS.white }}>{title}</div>
        {source && <div style={{ marginTop: 28, fontFamily: FONTS.mono, fontSize: 30, color: COLORS.creamMuted, letterSpacing: 2 }}>{source}</div>}
      </div>
      <Wire frame={f} />
    </AbsoluteFill>
  );
};

export const NewsStories: React.FC<Props> = ({ closesOn, stories }) => {
  const frame = useCurrentFrame();
  const total = storiesDuration(stories.length);
  const outroStart = INTRO + stories.length * PER_STORY;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.obsidian }}>
      <Backdrop glow={Math.abs(Math.sin(frame / 20))} />

      <Sequence durationInFrames={INTRO}>
        <AbsoluteFill style={{ padding: "300px 80px 0" }}>
          <div style={{ fontFamily: FONTS.italic, fontStyle: "italic", fontSize: 110, lineHeight: 1, color: COLORS.cream }}>Haven&rsquo;t you heard?</div>
          <div style={{ marginTop: 40, fontFamily: FONTS.display, fontWeight: 700, fontSize: 52, color: COLORS.goldDivine, lineHeight: 1.2 }}>
            You pick what leads.<br />Comment the number to vote.
          </div>
        </AbsoluteFill>
      </Sequence>

      {stories.map((s, i) => (
        <Sequence key={i} from={INTRO + i * PER_STORY} durationInFrames={PER_STORY}>
          <Story n={i + 1} title={s.title} source={s.source} />
        </Sequence>
      ))}

      <Sequence from={outroStart} durationInFrames={total - outroStart}>
        <AbsoluteFill style={{ padding: "330px 80px 0" }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 150, lineHeight: 0.95, color: COLORS.white, letterSpacing: -2 }}>BLKOUT</div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 150, lineHeight: 0.95, color: COLORS.goldDivine, letterSpacing: -2 }}>Are you in?</div>
          <div style={{ marginTop: 50, fontFamily: FONTS.display, fontWeight: 600, fontSize: 44, color: COLORS.cream, lineHeight: 1.3 }}>
            Comment the numbers you back.<br />Vote before {closesOn}.
          </div>
        </AbsoluteFill>
      </Sequence>

      <div style={{ position: "absolute", left: 80, right: 80, bottom: 90, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 500, fontSize: 36, color: COLORS.cream }}>News for us. Curated by you.</div>
          <div style={{ marginTop: 8, fontFamily: FONTS.mono, fontSize: 26, color: COLORS.goldDivine, letterSpacing: 2 }}>or vote at news.blkoutuk.com</div>
        </div>
        <Img src={staticFile("assets/blkoutlogo_wht_transparent.png")} style={{ height: 84 }} />
      </div>
    </AbsoluteFill>
  );
};
