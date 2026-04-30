import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import type { Cta } from "../schemas/ivor-message";

export const CTA: React.FC<{
  cta: Cta;
  startFrame: number;
  aspect: "9:16" | "1:1" | "16:9";
}> = ({ cta, startFrame, aspect }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < startFrame) return null;

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [30, 0]);
  const labelSize = aspect === "9:16" ? 28 : aspect === "1:1" ? 24 : 22;
  const urlSize = aspect === "9:16" ? 38 : aspect === "1:1" ? 32 : 28;

  const ctaLayout =
    aspect === "9:16"
      ? { left: 0, right: 0, bottom: "12%" }
      : aspect === "1:1"
      ? { left: 0, right: 0, bottom: "13%" }
      : { left: "48%", right: "4%", bottom: "14%" };

  return (
    <div
      style={{
        position: "absolute",
        ...ctaLayout,
        textAlign: aspect === "16:9" ? "left" : "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "rgba(0, 0, 0, 0.78)",
          border: `2px solid ${COLORS.goldRich}`,
          borderRadius: 14,
          padding: aspect === "9:16" ? "18px 40px" : "14px 26px",
          boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: labelSize,
            color: COLORS.cream,
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          {cta.text}
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: urlSize,
            fontWeight: 800,
            color: COLORS.goldDivine,
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
            textShadow: "0 2px 12px rgba(0, 0, 0, 0.85)",
          }}
        >
          {cta.displayUrl ?? cta.spokenUrl}
        </div>
      </div>
    </div>
  );
};
