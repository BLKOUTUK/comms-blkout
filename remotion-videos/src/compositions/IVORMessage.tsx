import React from "react";
import {
  AbsoluteFill,
  Audio,
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
  voiceTrack,
  bgMusic,
  durationSeconds,
  showName,
  weekLabel,
  tickerText,
  backdropImage,
  backdropVideo,
  aspect = "9:16",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const totalSec = durationSeconds;
  const introSec = 2;
  const outroSec = 3;
  const teaseTotalSec = Math.max(totalSec - introSec - outroSec, 6);
  const teaseSec = teaseTotalSec / teases.length;
  const teaseFrames = Math.floor(teaseSec * FPS);
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

  const titleSize = aspect === "9:16" ? 44 : aspect === "1:1" ? 38 : 34;
  const watermarkSize =
    aspect === "9:16" ? "55%" : aspect === "1:1" ? "60%" : "42%";
  const showLabel = weekLabel ? `${showName} · ${weekLabel}` : showName;

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
          top: aspect === "9:16" ? "4.5%" : "4%",
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
            fontWeight: 700,
            color: COLORS.goldDivine,
            letterSpacing: 0,
            lineHeight: 1.05,
            textShadow: `0 4px 24px rgba(0, 0, 0, 0.7)`,
          }}
        >
          {title}
        </div>
      </div>

      <NewsroomSet
        avatarSrc={avatarVideo}
        aspect={aspect}
        propertyKey={property}
        presenterName="AIvor"
        showName={showLabel}
        backdropImage={backdropImage}
        backdropVideo={backdropVideo}
        teases={teases}
        introFrames={introFrames}
        teaseFrames={teaseFrames}
        ctaStart={ctaStart}
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

      <CTA cta={cta} startFrame={ctaStart} aspect={aspect} />
      <NewsTicker text={tickerText} aspect={aspect} />
    </AbsoluteFill>
  );
};
