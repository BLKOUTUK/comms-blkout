import React from "react";
import {
  Easing,
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
  avatarSideStill?: string;
  avatarCloseupStill?: string;
  hasExternalAudio: boolean;
  backdropVideo?: string;
  backdropImage?: string;
  layout: { top: string; left: string; width: string; height: string };
  frame: number;
  fps: number;
  introFrames: number;
  teaseFrames: number;
  teaseStartFrames: number[];
  ctaStart: number;
  totalFrames: number;
  displayUrl?: string;
}> = ({
  avatarSrc,
  avatarSideStill,
  avatarCloseupStill,
  hasExternalAudio,
  backdropVideo,
  backdropImage,
  layout,
  frame,
  fps,
  introFrames,
  teaseFrames,
  teaseStartFrames,
  ctaStart,
  totalFrames,
  displayUrl,
}) => {
  const sideFlashFrames = Math.floor(fps * 2.5);
  const sideFlashWindows = teaseStartFrames.map((s) => {
    const cutawayCenter = s + Math.floor(teaseFrames / 2);
    return {
      from: Math.max(0, cutawayCenter - Math.floor(sideFlashFrames / 2)),
      to: cutawayCenter + Math.floor(sideFlashFrames / 2),
    };
  });
  const inSideFlash = avatarSideStill
    ? sideFlashWindows.some((w) => frame >= w.from && frame < w.to)
    : false;
  const inClosePhase = !!avatarCloseupStill && frame >= ctaStart;

  const activeSrc = inClosePhase
    ? avatarCloseupStill!
    : inSideFlash
    ? avatarSideStill!
    : avatarSrc;
  const isStill = /\.(jpe?g|png|webp|avif)$/i.test(activeSrc);

  const introEnd = introFrames;
  const t1End = introFrames + teaseFrames;
  const t2End = introFrames + 2 * teaseFrames;
  const t3End = ctaStart;
  const urlEnd = Math.min(ctaStart + Math.floor(fps * 1.8), totalFrames);
  const finalEnd = totalFrames;

  const keyframes = [0, introEnd, t1End, t2End, t3End, urlEnd, finalEnd];
  const easeOpts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  };
  const scale = interpolate(
    frame,
    keyframes,
    [1.0, 1.05, 1.12, 1.05, 1.12, 1.05, 1.0],
    easeOpts
  );
  const tx = 0;
  const ty = 0;
  const microScale = Math.sin((frame / fps) * 0.6) * 0.025;

  const finalPhase = frame > urlEnd;
  const twinkleProgress = (frame - urlEnd) / Math.max(1, finalEnd - urlEnd);
  const twinkleOpacity = finalPhase
    ? Math.max(
        0,
        Math.sin(twinkleProgress * Math.PI * 2) * 0.7 +
          Math.sin(twinkleProgress * Math.PI * 5) * 0.3
      )
    : 0;
  const twinkleScale = 0.8 + (finalPhase ? Math.sin(twinkleProgress * Math.PI * 4) * 0.4 : 0);

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
          transform: `scale(${scale + microScale}) translate(${tx}%, ${ty}%)`,
          transformOrigin: "50% 28%",
        }}
      >
        {isStill ? (
          <Img
            src={staticFile(activeSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 25%",
            }}
          />
        ) : (
          <OffthreadVideo
            src={staticFile(activeSrc)}
            muted={hasExternalAudio}
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
      {twinkleOpacity > 0.05 && (
        <svg
          style={{
            position: "absolute",
            left: "60%",
            top: "26%",
            width: 50,
            height: 50,
            opacity: twinkleOpacity,
            transform: `scale(${twinkleScale})`,
            transformOrigin: "center",
            pointerEvents: "none",
          }}
          viewBox="0 0 50 50"
        >
          <path
            d="M25 5 L27 22 L44 25 L27 28 L25 45 L23 28 L6 25 L23 22 Z"
            fill={COLORS.goldDivine}
            opacity="0.95"
          />
          <circle cx="25" cy="25" r="2.5" fill="#fff" />
        </svg>
      )}
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
          gap: 14,
          textAlign: "center",
        }}
      >
        <Img
          src={staticFile("assets/blkouthub_logo.png")}
          style={{
            width: "88%",
            maxHeight: "44%",
            objectFit: "contain",
          }}
        />
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.cream,
            lineHeight: 1.25,
            letterSpacing: 0.3,
          }}
        >
          where the UK's Black Queer Men Meet
        </div>
        <div
          style={{
            marginTop: 4,
            padding: "6px 14px",
            background: COLORS.pridePurple,
            color: COLORS.white,
            borderRadius: 999,
            fontFamily: FONTS.ui,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          blkouthub.com
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
  avatarSideStill?: string;
  avatarCloseupStill?: string;
  hasExternalAudio: boolean;
  aspect: "9:16" | "1:1" | "16:9";
  propertyKey: PropertyKey;
  presenterName?: string;
  showName?: string;
  backdropImage?: string;
  backdropVideo?: string;
  teases: Tease[];
  introFrames: number;
  teaseFrames: number;
  teaseStartFrames: number[];
  ctaStart: number;
  displayUrl?: string;
}> = ({
  avatarSrc,
  avatarSideStill,
  avatarCloseupStill,
  hasExternalAudio,
  aspect,
  presenterName = "AIvor",
  showName = "BLKOUT News",
  backdropImage,
  backdropVideo,
  teases,
  introFrames,
  teaseFrames,
  teaseStartFrames,
  ctaStart,
  displayUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

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
        avatarSideStill={avatarSideStill}
        avatarCloseupStill={avatarCloseupStill}
        hasExternalAudio={hasExternalAudio}
        backdropVideo={backdropVideo}
        backdropImage={backdropImage}
        layout={portraitLayout}
        frame={frame}
        fps={fps}
        introFrames={introFrames}
        teaseFrames={teaseFrames}
        teaseStartFrames={teaseStartFrames}
        ctaStart={ctaStart}
        totalFrames={durationInFrames}
        displayUrl={displayUrl}
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
