import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import type { Tease } from "../schemas/ivor-message";

export const TeaseCard: React.FC<{
  tease: Tease;
  index: number;
  startFrame: number;
  visibleFrames: number;
  aspect: "9:16" | "1:1" | "16:9";
}> = ({ tease, index, startFrame, visibleFrames, aspect }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const exit = interpolate(
    frame,
    [startFrame + visibleFrames - 8, startFrame + visibleFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = enter * exit;
  const translateY = interpolate(enter, [0, 1], [40, 0]);

  if (frame < startFrame || frame > startFrame + visibleFrames) return null;

  const padding = aspect === "9:16" ? 32 : 26;
  const titleSize = aspect === "9:16" ? 48 : aspect === "1:1" ? 40 : 36;
  const hookSize = aspect === "9:16" ? 28 : aspect === "1:1" ? 24 : 22;

  const cardLayout =
    aspect === "9:16"
      ? { left: "6%", right: "6%", top: "64%" }
      : aspect === "1:1"
      ? { left: "8%", right: "8%", top: "78%" }
      : { left: "48%", right: "4%", top: "12%" };

  return (
    <div
      style={{
        position: "absolute",
        ...cardLayout,
        padding,
        borderRadius: 24,
        background: "rgba(0, 0, 0, 0.78)",
        border: `2px solid ${COLORS.goldDivine}`,
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.45)",
        opacity,
        transform: `translateY(${translateY}px)`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            background: COLORS.pridePurple,
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONTS.ui,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Rank #{tease.rank ?? index + 1}
        </div>
        {tease.voteCount != null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: FONTS.ui,
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.goldDivine,
              letterSpacing: 1,
            }}
          >
            👍 {tease.voteCount.toLocaleString()} votes
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.1,
          color: COLORS.white,
          marginBottom: 16,
        }}
      >
        {tease.title}
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: hookSize,
          lineHeight: 1.4,
          color: COLORS.textMuted,
        }}
      >
        {tease.hook}
      </div>
    </div>
  );
};
