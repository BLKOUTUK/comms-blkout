import React from "react";
import {
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS } from "../brand";
import type { PropertyKey } from "../brand";
import type { Tease } from "../schemas/ivor-message";

const FILTER_ID = "ivor-duotone";
const HALFTONE_ID = "ivor-halftone";
const HERO_FILTER_ID = "hero-tone";

const Defs: React.FC = () => (
  <svg
    width="0"
    height="0"
    style={{ position: "absolute", pointerEvents: "none" }}
    aria-hidden
  >
    <defs>
      <filter id={FILTER_ID} colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="
            0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0      0      0      1 0"
        />
        <feComponentTransfer>
          <feFuncR tableValues="0 0.05 0.2 0.4 0.7 1" />
          <feFuncG tableValues="0 0.04 0.17 0.34 0.59 0.843" />
          <feFuncB tableValues="0 0 0 0 0 0" />
        </feComponentTransfer>
      </filter>
      <filter id={HERO_FILTER_ID} colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="
            0.18 0.6 0.06 0 0
            0.16 0.55 0.06 0 0
            0.10 0.32 0.08 0 0
            0    0    0    1 0"
        />
      </filter>
      <pattern
        id={HALFTONE_ID}
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="3" cy="3" r="1.1" fill="rgba(0,0,0,0.55)" />
      </pattern>
    </defs>
  </svg>
);

const AvatarPortrait: React.FC<{
  avatarSrc: string;
  backdropVideo?: string;
  backdropImage?: string;
  layout: { top: string; left: string; width: string; height: string };
  frame: number;
  fps: number;
}> = ({ avatarSrc, backdropVideo, backdropImage, layout, frame, fps }) => {
  const isStill = /\.(jpe?g|png|webp|avif)$/i.test(avatarSrc);
  const seconds = frame / fps;
  const zoom = 1 + 0.03 * (Math.sin(seconds * 0.18) + 1) * 0.5;
  const sway = Math.sin(seconds * 0.12) * 0.6;
  return (
    <div
      style={{
        position: "absolute",
        ...layout,
        borderRadius: 16,
        overflow: "hidden",
        border: `3px solid ${COLORS.goldDivine}`,
        background: COLORS.black,
        boxShadow: `0 18px 56px rgba(0,0,0,0.7), 0 0 0 6px rgba(124,58,237,0.18)`,
      }}
    >
      {backdropVideo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: `url(#${HERO_FILTER_ID})`,
          }}
        >
          <OffthreadVideo
            src={staticFile(backdropVideo)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              opacity: 0.7,
            }}
          />
        </div>
      )}
      {!backdropVideo && backdropImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: `url(#${HERO_FILTER_ID})`,
          }}
        >
          <Img
            src={staticFile(backdropImage)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              opacity: 0.7,
            }}
          />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: isStill
            ? `scale(${zoom}) translateX(${sway}%)`
            : `scale(${1 + 0.06 * (frame / (fps * 35))}) translateX(${sway * 0.4}%)`,
          transformOrigin: "center 38%",
        }}
      >
        {isStill ? (
          <Img
            src={staticFile(avatarSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 25%",
            }}
          />
        ) : (
          <OffthreadVideo
            src={staticFile(avatarSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 25%",
            }}
          />
        )}
      </div>
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "multiply",
          opacity: 0.22,
          pointerEvents: "none",
        }}
      >
        <rect width="100%" height="100%" fill={`url(#${HALFTONE_ID})`} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

const Chyron: React.FC<{
  presenterName: string;
  showName: string;
  frame: number;
  layout: {
    left: string;
    right: string;
    top: string;
  };
}> = ({ presenterName, showName, frame, layout }) => {
  const blink = (frame % 60) < 50 ? 1 : 0.4;
  return (
    <div
      style={{
        position: "absolute",
        ...layout,
        display: "flex",
        alignItems: "stretch",
        borderRadius: 6,
        overflow: "hidden",
        border: `1px solid ${COLORS.goldRich}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          background: COLORS.goldDivine,
          color: COLORS.black,
          padding: "12px 18px",
          fontFamily: FONTS.ui,
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {presenterName}
      </div>
      <div
        style={{
          background: "#E11D48",
          color: COLORS.white,
          padding: "12px 16px",
          fontFamily: FONTS.ui,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 3,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: COLORS.white,
            opacity: blink,
            boxShadow: "0 0 12px rgba(255,255,255,0.85)",
          }}
        />
        On Air
      </div>
      <div
        style={{
          background: COLORS.pridePurple,
          color: COLORS.white,
          padding: "12px 14px",
          fontFamily: FONTS.ui,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 3,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
        }}
      >
        Community
      </div>
      <div
        style={{
          flex: 1,
          background: "rgba(0,0,0,0.85)",
          color: COLORS.white,
          padding: "12px 18px",
          fontFamily: FONTS.ui,
          fontWeight: 500,
          fontSize: 17,
          letterSpacing: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        {showName}
      </div>
    </div>
  );
};

type SidePanelPhase =
  | { kind: "intro"; showName: string }
  | { kind: "tease"; index: number; tease: Tease }
  | { kind: "outro" };

const SidePanel: React.FC<{
  phase: SidePanelPhase;
  frame: number;
  layout: {
    top: string;
    right: string;
    width: string;
    height: string;
  };
}> = ({ phase, frame, layout }) => {
  const flicker = 0.93 + 0.07 * Math.sin(frame * 0.18);
  const enter = interpolate(frame % 90, [0, 12], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let body: React.ReactNode;
  if (phase.kind === "intro") {
    body = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "10% 8%",
          gap: 14,
        }}
      >
        <Img
          src={staticFile("assets/blkoutlogo_wht_transparent.png")}
          style={{ width: "75%", opacity: 0.95 }}
        />
        <div
          style={{
            fontFamily: FONTS.ui,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 4,
            color: COLORS.goldDivine,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {phase.showName}
        </div>
        <div
          style={{
            marginTop: "auto",
            padding: "6px 12px",
            background: COLORS.pridePurple,
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONTS.ui,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          You voted · We tally
        </div>
      </div>
    );
  } else if (phase.kind === "tease") {
    const rank = phase.tease.rank ?? phase.index + 1;
    const votes = phase.tease.voteCount;
    body = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "8% 8%",
          gap: 8,
          opacity: enter,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 6,
            padding: "5px 12px",
            background: COLORS.pridePurple,
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONTS.ui,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Rank #{rank}
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 88,
            fontWeight: 800,
            color: COLORS.goldDivine,
            lineHeight: 0.9,
            letterSpacing: -2,
            marginTop: 2,
          }}
        >
          {String(rank).padStart(2, "0")}
        </div>
        {votes != null && (
          <div
            style={{
              fontFamily: FONTS.ui,
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.pridePurple,
              letterSpacing: 1,
            }}
          >
            👍 {votes.toLocaleString()} votes
          </div>
        )}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            fontWeight: 500,
            color: COLORS.white,
            lineHeight: 1.2,
            marginTop: 4,
          }}
        >
          {phase.tease.title}
        </div>
        <div
          style={{
            marginTop: "auto",
            padding: "8px 12px",
            background: COLORS.pridePurple,
            color: COLORS.white,
            borderRadius: 8,
            fontFamily: FONTS.ui,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          👍 Vote · No login
        </div>
      </div>
    );
  } else {
    body = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "10% 8%",
          gap: 12,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            lineHeight: 1,
          }}
        >
          👍
        </div>
        <div
          style={{
            padding: "6px 12px",
            background: COLORS.pridePurple,
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONTS.ui,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          No login needed
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.white,
            lineHeight: 1.05,
          }}
        >
          Upvote the stories that matter
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        ...layout,
        background: "rgba(0,0,0,0.82)",
        border: `2px solid ${COLORS.goldRich}`,
        borderRadius: 14,
        overflow: "hidden",
        opacity: 0.98 * flicker,
        boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,215,0,0.05) 0px, rgba(255,215,0,0.05) 1px, transparent 1px, transparent 4px)`,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
      {body}
    </div>
  );
};

export const NewsroomSet: React.FC<{
  avatarSrc: string;
  aspect: "9:16" | "1:1" | "16:9";
  propertyKey: PropertyKey;
  presenterName?: string;
  showName?: string;
  backdropImage?: string;
  backdropVideo?: string;
  teases: Tease[];
  introFrames: number;
  teaseFrames: number;
  ctaStart: number;
}> = ({
  avatarSrc,
  aspect,
  presenterName = "AIvor",
  showName = "BLKOUT News",
  backdropImage,
  backdropVideo,
  teases,
  introFrames,
  teaseFrames,
  ctaStart,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const portraitLayout =
    aspect === "9:16"
      ? { top: "11%", left: "13%", width: "48%", height: "38%" }
      : aspect === "1:1"
      ? { top: "12%", left: "17%", width: "38%", height: "52%" }
      : { top: "10%", left: "12%", width: "32%", height: "62%" };

  const sideLayout =
    aspect === "9:16"
      ? { top: "11%", right: "13%", width: "22%", height: "38%" }
      : aspect === "1:1"
      ? { top: "12%", right: "18%", width: "25%", height: "52%" }
      : { top: "10%", right: "60%", width: "20%", height: "62%" };

  const chyronLayout =
    aspect === "9:16"
      ? { left: "13%", right: "13%", top: "50%" }
      : aspect === "1:1"
      ? { left: "17%", right: "18%", top: "65%" }
      : { left: "5%", right: "55%", top: "74%" };

  let phase: SidePanelPhase;
  if (frame < introFrames) {
    phase = { kind: "intro", showName };
  } else if (frame < ctaStart) {
    const teaseIndex = Math.min(
      Math.floor((frame - introFrames) / teaseFrames),
      teases.length - 1
    );
    phase = { kind: "tease", index: teaseIndex, tease: teases[teaseIndex] };
  } else {
    phase = { kind: "outro" };
  }

  return (
    <>
      <Defs />
      <AvatarPortrait
        avatarSrc={avatarSrc}
        backdropVideo={backdropVideo}
        backdropImage={backdropImage}
        layout={portraitLayout}
        frame={frame}
        fps={fps}
      />
      <SidePanel phase={phase} frame={frame} layout={sideLayout} />
      <Chyron
        presenterName={presenterName}
        showName={showName}
        frame={frame}
        layout={chyronLayout}
      />
    </>
  );
};
