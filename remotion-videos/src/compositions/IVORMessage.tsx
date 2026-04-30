import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, PROPERTY_GRADIENTS } from "../brand";
import { TeaseCard } from "../components/TeaseCard";
import { CTA } from "../components/CTA";
import { NewsroomSet } from "../components/NewsroomSet";
import { NewsTicker } from "../components/NewsTicker";
import type { IvorMessageProps } from "../schemas/ivor-message";

const FPS = 30;

export const IVORMessage: React.FC<
  IvorMessageProps & { aspect?: "9:16" | "1:1" | "16:9" }
> = ({
  property,
  title,
  teases,
  cta,
  avatarVideo,
  avatarSideStill,
  avatarCloseupStill,
  voiceTrack,
  bgMusic,
  durationSeconds,
  showName,
  weekLabel,
  dateRangeFrom,
  dateRangeTo,
  tickerText,
  backdropImage,
  backdropVideo,
  aspect = "9:16",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const totalSec = durationSeconds;
  const introSec = 3.5;
  const outroSec = 7;
  const teaseTotalSec = Math.max(totalSec - introSec - outroSec, 6);
  const wordsPerSec = 2.5;
  const teaseDurations = teases.map((t) => {
    const headlineWords = (t.title || "").trim().split(/\s+/).length;
    const connectorOverhead = 1.6;
    const beatOverhead = 1.0;
    return (headlineWords + connectorOverhead + beatOverhead) / wordsPerSec;
  });
  const teaseSecTotal = teaseDurations.reduce((a, b) => a + b, 0) || 1;
  const teaseScale = teaseTotalSec / teaseSecTotal;
  const teaseStartFrames = teases.map((_, i) => {
    const offset = teaseDurations
      .slice(0, i)
      .reduce((a, b) => a + b, 0) * teaseScale;
    return Math.floor((introSec + offset) * FPS);
  });
  const teaseFrames = Math.floor(
    (teaseTotalSec / teases.length) * FPS
  );
  const introFrames = Math.floor(introSec * FPS);
  const ctaStart = durationInFrames - Math.floor(outroSec * FPS);

  const titleProgress = spring({
    frame: frame - 4,
    fps: FPS,
    config: { damping: 14, stiffness: 90 },
  });

  const gradient = PROPERTY_GRADIENTS[property];
  const bgGradient = `linear-gradient(160deg, ${gradient[0]} 0%, ${gradient[1]} 50%, rgba(0,0,0,0.95) 100%)`;

  const bgMusicVolume = interpolate(
    frame,
    [0, 30, durationInFrames - 45, durationInFrames],
    [0, 0.1, 0.1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const titleSize = aspect === "9:16" ? 64 : aspect === "1:1" ? 52 : 44;
  const dateSize = aspect === "9:16" ? 24 : aspect === "1:1" ? 20 : 18;
  const watermarkSize =
    aspect === "9:16" ? "55%" : aspect === "1:1" ? "60%" : "42%";
  const showLabel = weekLabel ? `${showName} · ${weekLabel}` : showName;
  const dateRange =
    dateRangeFrom && dateRangeTo
      ? `${dateRangeFrom} – ${dateRangeTo}`
      : dateRangeFrom || dateRangeTo || null;

  return (
    <AbsoluteFill style={{ background: bgGradient }}>
      {voiceTrack && <Audio src={staticFile(voiceTrack)} volume={1} />}
      {bgMusic && (
        <Audio
          src={staticFile("assets/UKJazzBrothers.mp3")}
          volume={bgMusicVolume}
        />
      )}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 25% 15%, rgba(255, 215, 0, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 78% 12%, rgba(124, 58, 237, 0.18) 0%, transparent 48%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center 55%, transparent 25%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      <img
        src={staticFile("assets/blkoutlogo_wht_transparent.png")}
        alt=""
        style={{
          position: "absolute",
          left: aspect === "9:16" ? "-4%" : "-2%",
          bottom: aspect === "9:16" ? "8.5%" : "9%",
          width: aspect === "9:16" ? "70%" : aspect === "1:1" ? "60%" : "44%",
          opacity: 0.22,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: aspect === "9:16" ? "3%" : "2.5%",
          left: "6%",
          right: "6%",
          textAlign: "center",
          opacity: titleProgress,
          transform: `translateY(${interpolate(
            titleProgress,
            [0, 1],
            [-16, 0]
          )}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: titleSize,
            fontWeight: 900,
            color: COLORS.goldDivine,
            letterSpacing: -1.5,
            lineHeight: 0.95,
            textTransform: "uppercase",
            textShadow: `0 4px 24px rgba(0, 0, 0, 0.7)`,
          }}
        >
          {title}
        </div>
        {dateRange && (
          <div
            style={{
              fontFamily: FONTS.italic,
              fontStyle: "italic",
              fontSize: dateSize,
              fontWeight: 500,
              color: COLORS.cream,
              opacity: 0.9,
              letterSpacing: 0,
              marginTop: 10,
            }}
          >
            {dateRange.toLowerCase()}
          </div>
        )}
      </div>

      <NewsroomSet
        avatarSrc={avatarVideo}
        avatarSideStill={avatarSideStill}
        avatarCloseupStill={avatarCloseupStill}
        hasExternalAudio={!!voiceTrack}
        aspect={aspect}
        propertyKey={property}
        presenterName="AIvor"
        showName={showLabel}
        backdropImage={backdropImage}
        backdropVideo={backdropVideo}
        teases={teases}
        introFrames={introFrames}
        teaseFrames={teaseFrames}
        teaseStartFrames={teaseStartFrames}
        ctaStart={ctaStart}
        displayUrl={cta.displayUrl}
      />

      <Audio
        src={staticFile("assets/news-bed.mp3")}
        startFrom={Math.floor(FPS * 6)}
        volume={(f) =>
          interpolate(
            f,
            [
              0,
              FPS * 1.5,
              ctaStart - FPS * 1,
              ctaStart + FPS * 0.5,
              durationInFrames - FPS * 1.5,
              durationInFrames,
            ],
            [0, 0.4, 0.4, 0.6, 0.6, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )
        }
      />
      {teases.map((tease, i) => (
        <TeaseCard
          key={i}
          tease={tease}
          index={i}
          startFrame={introFrames + i * teaseFrames}
          visibleFrames={teaseFrames}
          aspect={aspect}
        />
      ))}

      {aspect === "9:16" && frame >= ctaStart - FPS * 0.5 && (
        <div
          style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            top: "65%",
            textAlign: "center",
            opacity: interpolate(
              frame,
              [ctaStart - FPS * 0.5, ctaStart],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(0,0,0,0.72)",
              border: `2px solid ${COLORS.goldRich}`,
              borderRadius: 14,
              padding: "20px 28px",
              boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
              maxWidth: "100%",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.italic,
                fontStyle: "italic",
                fontSize: 30,
                fontWeight: 500,
                color: COLORS.cream,
                lineHeight: 1.3,
                letterSpacing: 0.2,
              }}
            >
              Look out for AIvor's weekly round-up of UK Black Queer Events and Social media
            </div>
          </div>
        </div>
      )}

      <CTA cta={cta} startFrame={ctaStart} aspect={aspect} />
      <NewsTicker text={tickerText} aspect={aspect} />
    </AbsoluteFill>
  );
};
