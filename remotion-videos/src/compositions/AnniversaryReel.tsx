import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
  staticFile,
} from 'remotion';
import { BLKOUT_COLORS } from '../Root';

const IntroSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 15 } });
  const pulse = Math.sin(frame / 10) * 0.1 + 1;

  return (
    <AbsoluteFill
      style={{
        background: BLKOUT_COLORS.black,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Glowing circle */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BLKOUT_COLORS.purple}60, transparent)`,
          transform: `scale(${pulse})`,
        }}
      />

      <img
        src="/assets/blkout_logo_roundel_colour.png"
        alt="BLKOUT"
        style={{
          width: '300px',
          height: '300px',
          transform: `scale(${titleProgress})`,
          filter: `drop-shadow(0 0 60px ${BLKOUT_COLORS.purple})`,
        }}
      />

      <div
        style={{
          fontSize: '72px',
          fontWeight: 900,
          color: BLKOUT_COLORS.gold,
          marginTop: '20px',
          opacity: interpolate(frame, [30, 60], [0, 1]),
          fontFamily: "'Arial Black', Arial, sans-serif",
        }}
      >
        10 YEARS
      </div>

      <div
        style={{
          fontSize: '36px',
          color: BLKOUT_COLORS.purpleLight,
          marginTop: '30px',
          opacity: interpolate(frame, [60, 90], [0, 1]),
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        A Decade of Liberation
      </div>
    </AbsoluteFill>
  );
};

const YearSection: React.FC<{
  year: string;
  title: string;
  quote: string;
  content: string;
}> = ({ year, title, quote, content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BLKOUT_COLORS.purpleDark}, ${BLKOUT_COLORS.black})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
    >
      <img
        src="/assets/blkout_logo_roundel_colour.png"
        alt="BLKOUT"
        style={{
          width: '80px',
          height: '80px',
          marginBottom: '20px',
          opacity: 0.6,
        }}
      />

      <div
        style={{
          fontSize: '96px',
          fontWeight: 900,
          color: BLKOUT_COLORS.gold,
          transform: `scale(${progress})`,
          fontFamily: "'Arial Black', Arial, sans-serif",
        }}
      >
        {year}
      </div>

      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: BLKOUT_COLORS.white,
          marginTop: '30px',
          opacity: interpolate(frame, [30, 60], [0, 1]),
          fontFamily: "'Arial Black', Arial, sans-serif",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: '32px',
          color: BLKOUT_COLORS.purpleLight,
          marginTop: '40px',
          textAlign: 'center',
          fontStyle: 'italic',
          opacity: interpolate(frame, [60, 90], [0, 1]),
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        "{quote}"
      </div>

      <div
        style={{
          fontSize: '28px',
          color: BLKOUT_COLORS.silver,
          marginTop: '40px',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          opacity: interpolate(frame, [90, 120], [0, 1]),
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {content}
      </div>
    </AbsoluteFill>
  );
};

const CTASection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 15 } });
  const pulse = Math.sin(frame / 8) * 0.05 + 1;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${BLKOUT_COLORS.purple}, ${BLKOUT_COLORS.black})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
    >
      {/* Large rising roundel */}
      <img
        src="/assets/blkout_logo_roundel_colour.png"
        alt="BLKOUT"
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          opacity: interpolate(frame, [0, 60], [0, 0.3]),
          transform: `translateY(${interpolate(frame, [0, 120], [200, 0])}px)`,
          filter: `drop-shadow(0 0 80px ${BLKOUT_COLORS.purple})`,
        }}
      />

      <div
        style={{
          fontSize: '48px',
          color: BLKOUT_COLORS.white,
          textAlign: 'center',
          transform: `scale(${progress})`,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          zIndex: 10,
        }}
      >
        The Next Decade
      </div>
      <div
        style={{
          fontSize: '64px',
          color: BLKOUT_COLORS.gold,
          textAlign: 'center',
          marginTop: '20px',
          fontWeight: 900,
          opacity: interpolate(frame, [30, 60], [0, 1]),
          fontFamily: "'Arial Black', Arial, sans-serif",
          zIndex: 10,
        }}
      >
        Starts Now
      </div>

      <div
        style={{
          marginTop: '60px',
          padding: '20px 50px',
          background: BLKOUT_COLORS.gold,
          borderRadius: '50px',
          fontSize: '28px',
          fontWeight: 'bold',
          color: BLKOUT_COLORS.black,
          transform: `scale(${pulse})`,
          opacity: interpolate(frame, [90, 120], [0, 1]),
          fontFamily: "'Arial Black', Arial, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '2px',
          zIndex: 10,
        }}
      >
        blkoutuk.com/movement
      </div>

      <div
        style={{
          fontSize: '28px',
          color: BLKOUT_COLORS.purpleLight,
          marginTop: '60px',
          textAlign: 'center',
          fontStyle: 'italic',
          opacity: interpolate(frame, [150, 180], [0, 1]),
          fontFamily: "'Inter', system-ui, sans-serif",
          zIndex: 10,
        }}
      >
        "The ancestors are celebrating with us"
      </div>

      <img
        src="/assets/blkoutlogo_wht_transparent.png"
        alt="BLKOUT"
        style={{
          position: 'absolute',
          bottom: '40px',
          height: '35px',
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
};

export const AnniversaryReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Audio fade in/out
  const audioVolume = interpolate(
    frame,
    [0, 60, durationInFrames - 90, durationInFrames],
    [0, 0.6, 0.6, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      {/* Background Music - Instrumental for longer reel */}
      <Audio
        src={staticFile('assets/music/Instrumental.mp3')}
        volume={audioVolume}
      />

      {/* Intro: 0-5 seconds */}
      <Sequence from={0} durationInFrames={150}>
        <IntroSection />
      </Sequence>

      {/* 2016: 5-15 seconds */}
      <Sequence from={150} durationInFrames={300}>
        <YearSection
          year="2016"
          title="The Beginning"
          quote="We created our own spaces"
          content={'February 10th, 2016\nBLKOUT was born in London'}
        />
      </Sequence>

      {/* Growth: 15-25 seconds */}
      <Sequence from={450} durationInFrames={300}>
        <YearSection
          year="2017-2020"
          title="Growing & Surviving"
          quote="Every brother found was a seed planted"
          content={'London · Manchester · Birmingham · Bristol\nPandemic resilience through digital connection'}
        />
      </Sequence>

      {/* Digital: 25-35 seconds */}
      <Sequence from={750} durationInFrames={300}>
        <YearSection
          year="2021-2024"
          title="Digital Horizons"
          quote="Technology amplifies community"
          content={'Building infrastructure for liberation\nCommunity Benefit Society formed'}
        />
      </Sequence>

      {/* 2025: 35-45 seconds */}
      <Sequence from={1050} durationInFrames={300}>
        <YearSection
          year="2025"
          title="Revolution Digitized"
          quote="Liberation technology, realized"
          content={'IVOR AI · Events Calendar\nNews Platform · Governance Portal'}
        />
      </Sequence>

      {/* Features: 45-60 seconds */}
      <Sequence from={1350} durationInFrames={450}>
        <YearSection
          year="2026"
          title="New Platform"
          quote="The next chapter begins"
          content={'Critical Frequency · Phygital Journal\nBLKOUT Shop · Democratic Governance'}
        />
      </Sequence>

      {/* Event: 60-75 seconds */}
      <Sequence from={1800} durationInFrames={450}>
        <YearSection
          year="FEB 18"
          title="Representation 365"
          quote="10 years recognized"
          content={'UAL × UK Black Pride\nDr Rob Berkeley in conversation\nLondon Art Bar · 6:30PM'}
        />
      </Sequence>

      {/* CTA: 75-90 seconds */}
      <Sequence from={2250} durationInFrames={450}>
        <CTASection />
      </Sequence>
    </AbsoluteFill>
  );
};
