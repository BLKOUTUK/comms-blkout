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
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS, FONTS } from "../brand";

export const FPS = 30;
const TRANSITION_FRAMES = 6;
const KEN_BURNS_MAX = 1.05;

type Beat =
  | { kind: "open"; dur: number }
  | { kind: "close"; dur: number }
  | { kind: "question"; dur: number; big: string }
  | {
      kind: "video" | "image";
      dur: number;
      src: string;
      big: string;
      eyebrow?: string;
    };

const A = "assets/bhm-sizzle";

export const BEATS: Beat[] = [
  { kind: "open", dur: 2.5 },
  {
    kind: "video",
    dur: 3.5,
    src: `${A}/1-together-panel-talking.mp4`,
    big: "WE COME TOGETHER",
  },
  {
    kind: "video",
    dur: 3.5,
    src: `${A}/2-space-celebrate-mic.mp4`,
    big: "TO MAKE SPACE",
  },
  {
    kind: "video",
    dur: 3.5,
    src: `${A}/3-create-blkout-creates.mp4`,
    big: "TO CREATE",
  },
  {
    kind: "video",
    dur: 4.5,
    src: `${A}/4-create-placard-grid.mp4`,
    big: "CONNECTIONS",
  },
  {
    kind: "video",
    dur: 3.5,
    src: `${A}/5-buildpower-organise-placard.mp4`,
    big: "THAT BUILD POWER",
  },
  {
    kind: "image",
    dur: 3.5,
    src: `${A}/1987-conference-poster.jpg`,
    big: "1987",
    eyebrow: "31 OCTOBER 1987",
  },
  {
    kind: "image",
    dur: 3.5,
    src: `${A}/2007-bgmag-oxford.jpg`,
    big: "2007",
    eyebrow: "BGMAG SUMMIT, OXFORD",
  },
  { kind: "question", dur: 2.5, big: "2027?" },
  { kind: "close", dur: 3.0 },
];

export const TOTAL_FRAMES =
  BEATS.reduce((sum, b) => sum + Math.round(b.dur * FPS), 0) -
  (BEATS.length - 1) * TRANSITION_FRAMES;

// Blurred, darkened full-bleed backdrop + a sharp contained foreground copy of
// the same media. Nobody gets cropped out to fill a mismatched aspect ratio —
// same principle the campaign's own beat clips already use for 9:16.
// A slow, constant Ken-Burns push/pull is applied to the whole frame (backdrop
// + foreground together, so their relationship never drifts) — real trailers
// never sit dead still on a shot.
const Frame: React.FC<{
  kind: "video" | "image";
  src: string;
  durInFrames: number;
  zoomIn: boolean;
}> = ({ kind, src, durInFrames, zoomIn }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(
    frame,
    [0, durInFrames],
    zoomIn ? [1, KEN_BURNS_MAX] : [KEN_BURNS_MAX, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fill: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };
  const backdrop: React.CSSProperties = {
    ...fill,
    objectFit: "cover",
    filter: "blur(60px) brightness(0.35) saturate(1.15)",
    transform: "scale(1.15)",
  };
  const fg: React.CSSProperties = { ...fill, objectFit: "contain" };

  return (
    <AbsoluteFill
      style={{
        background: COLORS.black,
        transform: `scale(${zoom})`,
        transformOrigin: "center",
      }}
    >
      {kind === "video" ? (
        <>
          <OffthreadVideo muted src={staticFile(src)} style={backdrop} />
          <OffthreadVideo muted src={staticFile(src)} style={fg} />
        </>
      ) : (
        <>
          <Img src={staticFile(src)} style={backdrop} />
          <Img src={staticFile(src)} style={fg} />
        </>
      )}
    </AbsoluteFill>
  );
};

const BeatStamp: React.FC<{ big: string; eyebrow?: string }> = ({
  big,
  eyebrow,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scrim fades in cleanly and fast — no bounce on a big flat gradient box.
  const scrimOpacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // The type itself gets a bouncy pop: fast spring, unclamped so the natural
  // overshoot carries through into scale/position (that overshoot IS the pop).
  const pop = spring({ frame, fps, config: { damping: 8, stiffness: 200, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [0.72, 1]);
  const translateY = interpolate(pop, [0, 1], [46, 0]);

  const eyebrowPop = spring({
    frame: frame - 3,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.6 },
  });
  const eyebrowOpacity = interpolate(frame - 3, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "160px 8% 9%",
        textAlign: "center",
        background:
          "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)",
        opacity: scrimOpacity,
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontFamily: FONTS.italic,
            fontStyle: "italic",
            fontSize: 30,
            color: COLORS.cream,
            opacity: 0.85 * eyebrowOpacity,
            marginBottom: 8,
            letterSpacing: 0.5,
            transform: `translateY(${interpolate(eyebrowPop, [0, 1], [16, 0])}px)`,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 78,
          color: COLORS.goldDivine,
          textTransform: "uppercase",
          letterSpacing: -1,
          lineHeight: 1,
          textShadow: "0 6px 30px rgba(0,0,0,0.6)",
          transform: `scale(${scale}) translateY(${translateY}px)`,
        }}
      >
        {big}
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 9, stiffness: 190, mass: 0.7 } });
  const scale = interpolate(p, [0, 1], [0.55, 1]);
  const opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });

  // A very slow background drift keeps the card from reading as a dead still
  // frame even though it's pure type — gentle, not a Ken-Burns push.
  const drift = interpolate(frame, [0, 75], [1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, ${COLORS.abyss}, ${COLORS.black})`,
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
        transform: `scale(${drift})`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 170,
          color: COLORS.goldDivine,
          opacity,
          transform: `scale(${scale})`,
          textShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const AnimatedCard: React.FC<{ src: string; durInFrames: number; zoomIn: boolean }> = ({
  src,
  durInFrames,
  zoomIn,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 20, stiffness: 210, mass: 0.7 } });
  const popScale = interpolate(p, [0, 1], [1.08, 1]);
  const opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ width: "100%", height: "100%", opacity, transform: `scale(${popScale})` }}>
      <Frame kind="image" src={src} durInFrames={durInFrames} zoomIn={zoomIn} />
    </div>
  );
};

// Subtle film grain (SVG feTurbulence, overlay blend, low opacity) + a soft
// vignette. Constant across the whole reel — never fades — the texture that
// keeps a clean digital render from reading flat.
const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;

const GrainVignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.5) 100%)",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`,
        opacity: 0.05,
        mixBlendMode: "overlay",
      }}
    />
  </AbsoluteFill>
);

// Music bed — Rob's own track, from 0:43. Fade in over 0.5s, fade out over
// ~0.73s so it doesn't cut off abruptly under the close card. Constant volume
// in between; no ducking under the text stamps — not worth the complexity here.
const MusicBed: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const volume = interpolate(
    frame,
    [0, 15, durationInFrames - 22, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <Audio src={staticFile(`${A}/music-bed.mp3`)} volume={volume} />;
};

const renderBeat = (b: Beat, i: number): React.ReactNode => {
  if (b.kind === "open") {
    return (
      <AnimatedCard
        src={`${A}/open-title-card.png`}
        durInFrames={Math.round(b.dur * FPS)}
        zoomIn
      />
    );
  }
  if (b.kind === "close") {
    return (
      <AnimatedCard
        src={`${A}/close-end-card.png`}
        durInFrames={Math.round(b.dur * FPS)}
        zoomIn
      />
    );
  }
  if (b.kind === "question") {
    return <QuestionCard text={b.big} />;
  }
  return (
    <AbsoluteFill>
      <Frame
        kind={b.kind}
        src={b.src}
        durInFrames={Math.round(b.dur * FPS)}
        zoomIn={i % 2 === 0}
      />
      <BeatStamp big={b.big} eyebrow={b.eyebrow} />
    </AbsoluteFill>
  );
};

export const BHMSizzleReel: React.FC = () => {
  return (
    <AbsoluteFill>
      <MusicBed />
      <TransitionSeries>
        {BEATS.map((b, i) => {
          const isLast = i === BEATS.length - 1;
          return (
            <React.Fragment key={i}>
              <TransitionSeries.Sequence durationInFrames={Math.round(b.dur * FPS)}>
                {renderBeat(b, i)}
              </TransitionSeries.Sequence>
              {!isLast && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <GrainVignette />
    </AbsoluteFill>
  );
};
