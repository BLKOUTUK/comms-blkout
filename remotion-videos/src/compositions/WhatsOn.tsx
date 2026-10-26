// BLKOUT What's On, the AIvor events digest (Rob's review of W44, 26 Oct 2026): AIvor large and
// moving between positions, each gathering's own picture on screen while he names it, and no
// empty space beneath him. Built for 9:16, the only shape the events workflow renders.
//
// props.timeline holds the second each spoken segment starts (intro, one per gathering, close),
// written by weekly-render.mjs from the voice track. Without it the segments split evenly.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, PROPERTY_GRADIENTS } from "../brand";
import { NewsTicker } from "../components/NewsTicker";
import type { IvorMessageProps } from "../schemas/ivor-message";

type Rect = { x: number; y: number; w: number; h: number; r: number };

const W = 1080;

// Where AIvor stands in each segment. Gatherings alternate sides so he keeps moving.
const AT_INTRO: Rect = { x: 70, y: 330, w: 940, h: 1330, r: 28 };
const AT_ITEM = (i: number): Rect => ({ x: i % 2 === 0 ? 560 : 40, y: 1150, w: 480, h: 680, r: 24 });
const AT_CLOSE: Rect = { x: 205, y: 320, w: 670, h: 940, r: 28 };

const mix = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
  r: a.r + (b.r - a.r) * t,
});

export const WhatsOn: React.FC<IvorMessageProps> = ({
  property,
  title,
  teases,
  cta,
  avatarVideo,
  voiceTrack,
  showName,
  weekLabel,
  dateRangeFrom,
  dateRangeTo,
  tickerText,
  timeline,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sec = frame / fps;

  const items = teases.filter((t) => !/\/add\b/.test(t.url));
  const segCount = items.length + 2;
  const starts =
    timeline && timeline.length === segCount
      ? timeline
      : Array.from({ length: segCount }, (_, i) => (i * (durationInFrames / fps - 4)) / segCount);
  // Index of the segment playing now: 0 intro, 1..n gatherings, n+1 close.
  const seg = starts.reduce((acc, s, i) => (sec >= s ? i : acc), 0);
  const segStartFrame = Math.round(starts[seg] * fps);
  const enter = spring({ frame: frame - segStartFrame, fps, config: { damping: 16, stiffness: 80 } });

  const rectFor = (i: number) => (i === 0 ? AT_INTRO : i === segCount - 1 ? AT_CLOSE : AT_ITEM(i - 1));
  const avatar = seg === 0 ? AT_INTRO : mix(rectFor(seg - 1), rectFor(seg), enter);
  // A slow breath so he is never quite still, even within a segment.
  const drift = 1 + 0.015 * Math.sin(sec * 0.9);

  const gradient = PROPERTY_GRADIENTS[property];
  const dateRange = dateRangeFrom && dateRangeTo ? `${dateRangeFrom} – ${dateRangeTo}` : dateRangeFrom || dateRangeTo || "";
  const item = seg >= 1 && seg <= items.length ? items[seg - 1] : null;
  const itemIndex = seg - 1;
  const day = item ? item.hook.split(". ")[0] : "";

  const fadeIn = (from: number, len = 12) =>
    interpolate(frame, [from, from + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${gradient[0]} 0%, ${gradient[1]} 45%, ${COLORS.obsidian} 100%)` }}>
      {voiceTrack && <Audio src={staticFile(voiceTrack)} />}
      <Audio
        src={staticFile("assets/news-bed.mp3")}
        startFrom={Math.floor(fps * 6)}
        volume={(f) =>
          interpolate(f, [0, fps * 1.5, durationInFrames - fps * 1.5, durationInFrames], [0, 0.4, 0.4, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <img
        src={staticFile("assets/blkoutlogo_wht_transparent.png")}
        alt=""
        style={{ position: "absolute", right: -120, bottom: 160, width: 760, opacity: 0.08 }}
      />

      {/* Masthead: always there, small once the gatherings start. */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 60,
          right: 60,
          textAlign: seg === 0 || seg === segCount - 1 ? "center" : "left",
          opacity: item ? 0 : 1,
        }}
      >
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: COLORS.cream, textTransform: "uppercase" }}>
          {showName}
          {weekLabel ? ` · ${weekLabel}` : ""}
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 124,
            lineHeight: 0.95,
            letterSpacing: -3,
            color: COLORS.goldDivine,
            textTransform: "uppercase",
            textShadow: "0 6px 30px rgba(0,0,0,0.6)",
          }}
        >
          {title}
        </div>
        {dateRange && (
          <div style={{ fontFamily: FONTS.italic, fontStyle: "italic", fontSize: 38, color: COLORS.cream, marginTop: 6 }}>{dateRange}</div>
        )}
      </div>

      {/* The gathering on screen while AIvor names it: its own picture, or its day set large. */}
      {item && (
        <div style={{ position: "absolute", inset: 0, opacity: fadeIn(segStartFrame) }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 860, overflow: "hidden", background: COLORS.black }}>
            {item.thumbnail ? (
              <>
                <Img
                  src={item.thumbnail}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(36px) brightness(0.5)", transform: "scale(1.2)" }}
                />
                <Img
                  src={item.thumbnail}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: `scale(${interpolate(frame - segStartFrame, [0, fps * 8], [1, 1.08], { extrapolateRight: "clamp" })})`,
                  }}
                />
              </>
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(135deg, ${gradient[0]}, ${COLORS.pridePurpleDeep})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 200,
                    lineHeight: 0.9,
                    letterSpacing: -6,
                    color: COLORS.goldDivine,
                    textTransform: "uppercase",
                    textAlign: "center",
                    transform: `translateX(${interpolate(frame - segStartFrame, [0, fps * 8], [30, -30], { extrapolateRight: "clamp" })}px)`,
                  }}
                >
                  {day.split(" ")[0]}
                </div>
              </div>
            )}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 220, background: `linear-gradient(transparent, ${gradient[1]})` }} />
          </div>

          <div style={{ position: "absolute", left: 60, right: 60, top: 860 }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 46, letterSpacing: 4, color: COLORS.goldDivine, textTransform: "uppercase" }}>
              {day}
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: item.title.length > 45 ? 58 : 72,
                lineHeight: 1.02,
                color: COLORS.white,
                marginTop: 10,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.title.replace(/\.{2,}/g, " ")}
            </div>
          </div>

          {/* Beside AIvor: where, and how many of how many. */}
          <div
            style={{
              position: "absolute",
              top: 1200,
              width: 460,
              left: itemIndex % 2 === 0 ? 60 : 560,
              opacity: fadeIn(segStartFrame + 8),
            }}
          >
            {item.where && (
              <div style={{ fontFamily: FONTS.italic, fontStyle: "italic", fontSize: 40, lineHeight: 1.2, color: COLORS.cream }}>
                {item.where.split(",")[0]}
                {item.where.split(",").length > 2 ? <div style={{ fontSize: 30, opacity: 0.8 }}>{item.where.split(",").slice(-1)[0].trim()}</div> : null}
              </div>
            )}
            <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 150, color: COLORS.goldDivine, opacity: 0.9, marginTop: 30, lineHeight: 1 }}>
              {itemIndex + 1}
              <span style={{ fontSize: 50, color: COLORS.cream, opacity: 0.7 }}> / {items.length}</span>
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 28, color: COLORS.cream, marginTop: 20, opacity: 0.85 }}>
              Details at {cta.displayUrl || "events.blkoutuk.com"}
            </div>
          </div>
        </div>
      )}

      {/* AIvor. One video element throughout, so his voice never breaks as he moves. */}
      <div
        style={{
          position: "absolute",
          left: avatar.x,
          top: avatar.y,
          width: avatar.w,
          height: avatar.h,
          borderRadius: avatar.r,
          overflow: "hidden",
          border: `4px solid ${COLORS.goldRich}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          transform: `scale(${drift})`,
        }}
      >
        <OffthreadVideo
          src={staticFile(avatarVideo)}
          muted={!!voiceTrack}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }}
        />
      </div>

      {/* Close: where everything is, and the door for the ones we missed. */}
      {seg === segCount - 1 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1300, textAlign: "center", opacity: fadeIn(segStartFrame + 6) }}>
          <div style={{ fontFamily: FONTS.italic, fontStyle: "italic", fontSize: 44, color: COLORS.cream }}>{cta.text}</div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 82, color: COLORS.goldDivine, letterSpacing: -1 }}>
            {cta.displayUrl || "events.blkoutuk.com"}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 34,
              padding: "18px 34px",
              borderRadius: 999,
              border: `3px solid ${COLORS.goldDivine}`,
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 36,
              color: COLORS.white,
            }}
          >
            Running something? Add yours
          </div>
        </div>
      )}

      <NewsTicker text={tickerText} aspect="9:16" position="bottom" label="What's on" />
    </AbsoluteFill>
  );
};
