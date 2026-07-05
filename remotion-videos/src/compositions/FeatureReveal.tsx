import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  staticFile,
} from 'remotion';
import { BLKOUT_COLORS } from '../Root';

const FEATURES = [
  {
    title: 'IVOR AI',
    tagline: 'Your culturally competent companion',
    platforms: 'WhatsApp · Telegram · Instagram · Web',
  },
  {
    title: 'Events Calendar',
    tagline: 'Find your tribe across the UK',
    platforms: 'Personalized recommendations',
  },
  {
    title: 'BLKOUT News',
    tagline: 'We ARE the media',
    platforms: 'Community stories that matter',
  },
  {
    title: 'Phygital Journal',
    tagline: 'Physical + Digital liberation',
    platforms: 'Journal · IVOR prompts · Community circles',
  },
  {
    title: 'BLKOUTHUB',
    tagline: 'Your community space',
    platforms: 'Connect · Share · Belong',
  },
  {
    title: 'Critical Frequency',
    tagline: 'Mental health for our community',
    platforms: 'Population health project',
  },
  {
    title: 'Governance Portal',
    tagline: 'Your voice, your vote',
    platforms: 'Democratic ownership',
  },
];

const FeatureCard: React.FC<{
  title: string;
  tagline: string;
  platforms: string;
  index: number;
}> = ({ title, tagline, platforms, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = 30 + index * 50; // Staggered start
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  if (frame < startFrame) return null;

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [200, 0]);
  const scale = interpolate(progress, [0, 1], [0.8, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
        display: 'flex',
        alignItems: 'center',
        padding: '30px',
        background: `linear-gradient(135deg, ${BLKOUT_COLORS.purple}30, ${BLKOUT_COLORS.black}60)`,
        borderRadius: '20px',
        border: `2px solid ${BLKOUT_COLORS.gold}40`,
        marginBottom: '20px',
        width: '90%',
      }}
    >
      <img
        src="/assets/blkout_logo_roundel_colour.png"
        alt="BLKOUT"
        style={{
          width: '60px',
          height: '60px',
          marginRight: '25px',
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '36px',
            fontWeight: 900,
            color: BLKOUT_COLORS.white,
            fontFamily: "'Arial Black', Arial, sans-serif",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '24px',
            color: BLKOUT_COLORS.gold,
            marginTop: '5px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            fontSize: '18px',
            color: BLKOUT_COLORS.silver,
            marginTop: '5px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {platforms}
        </div>
      </div>
    </div>
  );
};

export const FeatureReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  // Scroll effect for cards
  const scrollOffset = interpolate(
    frame,
    [0, durationInFrames],
    [0, -800],
    { extrapolateRight: 'clamp' }
  );

  // Audio volume
  const audioVolume = interpolate(
    frame,
    [0, 30, durationInFrames - 45, durationInFrames],
    [0, 0.6, 0.6, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BLKOUT_COLORS.black}, ${BLKOUT_COLORS.purpleDark})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background Music */}
      <Audio
        src={staticFile('assets/music/Instrumental.mp3')}
        volume={audioVolume}
      />

      {/* Header */}
      <div
        style={{
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [-30, 0])}px)`,
          textAlign: 'center',
          paddingTop: '80px',
          paddingBottom: '40px',
          width: '100%',
          background: `linear-gradient(180deg, ${BLKOUT_COLORS.black}, transparent)`,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <img
          src="/assets/blkout_logo_roundel_colour.png"
          alt="BLKOUT"
          style={{
            width: '80px',
            height: '80px',
            marginBottom: '10px',
          }}
        />
        <div
          style={{
            fontSize: '48px',
            color: BLKOUT_COLORS.white,
            fontWeight: 900,
            marginTop: '10px',
            fontFamily: "'Arial Black', Arial, sans-serif",
          }}
        >
          New Platform Features
        </div>
        <div
          style={{
            fontSize: '24px',
            color: BLKOUT_COLORS.purpleLight,
            marginTop: '10px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Liberation technology, realized
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          transform: `translateY(${scrollOffset}px)`,
          paddingTop: '20px',
        }}
      >
        {FEATURES.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}

        {/* Rising roundel after features */}
        {frame >= 380 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '40px',
              opacity: interpolate(
                frame,
                [380, 410, 440, 450],
                [0, 1, 1, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              ),
            }}
          >
            <img
              src="/assets/blkout_logo_roundel_colour.png"
              alt="BLKOUT"
              style={{
                width: '400px',
                height: '400px',
                filter: `drop-shadow(0 0 60px ${BLKOUT_COLORS.purple})`,
              }}
            />
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [400, 450], [0, 1]),
          }}
        >
          <div
            style={{
              fontSize: '24px',
              color: BLKOUT_COLORS.white,
              marginBottom: '15px',
              fontFamily: "'Inter', system-ui, sans-serif",
              textAlign: 'center',
            }}
          >
            Join us February 18th
          </div>
          <div
            style={{
              padding: '15px 50px',
              background: BLKOUT_COLORS.gold,
              borderRadius: '50px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: BLKOUT_COLORS.black,
              fontFamily: "'Arial Black', Arial, sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            blkoutuk.com/movement
          </div>
        </div>
        <img
          src="/assets/blkoutlogo_wht_transparent.png"
          alt="BLKOUT"
          style={{
            height: '30px',
            opacity: 0.8,
            marginTop: '15px',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
