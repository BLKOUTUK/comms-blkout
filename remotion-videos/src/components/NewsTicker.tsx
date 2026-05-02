import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";

const SCROLL_PX_PER_SEC = 90;

export const NewsTicker: React.FC<{
  text: string;
  aspect: "9:16" | "1:1" | "16:9";
  position?: "bottom" | "middle";
}> = ({ text, aspect, position = "middle" }) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();

  const segment = `${text}   ·   `;
  const segments = Array.from({ length: 6 }).map(() => segment).join("");
  const seconds = frame / fps;
  const offset = (seconds * SCROLL_PX_PER_SEC) % (width * 2);

  const height = aspect === "9:16" ? 76 : aspect === "1:1" ? 60 : 56;
  const fontSize = aspect === "9:16" ? 26 : aspect === "1:1" ? 22 : 20;
  const labelSize = aspect === "9:16" ? 18 : 16;

  const containerPosition: React.CSSProperties =
    position === "middle"
      ? aspect === "9:16"
        ? { top: "57%" }
        : aspect === "1:1"
        ? { top: "71%" }
        : { top: "78%" }
      : { bottom: 0 };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        ...containerPosition,
        height,
        background: COLORS.black,
        borderTop: `2px solid ${COLORS.goldDivine}`,
        borderBottom:
          position === "middle"
            ? `2px solid ${COLORS.goldDivine}`
            : "none",
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        boxShadow:
          position === "middle"
            ? "0 8px 24px rgba(0,0,0,0.6), 0 -8px 24px rgba(0,0,0,0.6)"
            : "none",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "0 18px",
          background: COLORS.goldDivine,
          color: COLORS.black,
          fontFamily: FONTS.ui,
          fontWeight: 700,
          fontSize: labelSize,
          letterSpacing: 3,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
        }}
      >
        Community editorial
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            transform: `translateX(${-offset}px)`,
            fontFamily: FONTS.body,
            fontWeight: 500,
            fontSize,
            color: COLORS.white,
            letterSpacing: 1,
            paddingLeft: 24,
          }}
        >
          {segments}
        </div>
      </div>
    </div>
  );
};
