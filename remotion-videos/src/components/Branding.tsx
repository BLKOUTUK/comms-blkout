import React from "react";
import { staticFile, interpolate, useCurrentFrame } from "remotion";

export const Branding: React.FC<{ aspect: "9:16" | "1:1" | "16:9" }> = ({
  aspect,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 0.85], {
    extrapolateRight: "clamp",
  });
  const logoHeight = aspect === "9:16" ? 56 : aspect === "1:1" ? 48 : 44;
  const tickerClearance =
    aspect === "9:16" ? 88 : aspect === "1:1" ? 76 : 72;
  const sideMargin = aspect === "9:16" ? 24 : 20;

  return (
    <img
      src={staticFile("assets/blkoutlogo_wht_transparent.png")}
      alt=""
      style={{
        position: "absolute",
        bottom: tickerClearance,
        right: sideMargin,
        height: logoHeight,
        opacity,
      }}
    />
  );
};
