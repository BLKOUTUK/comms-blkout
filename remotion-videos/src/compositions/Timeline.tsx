import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  random,
  staticFile,
} from 'remotion';
import { BLKOUT_COLORS } from '../Root';

// Timeline data - 10 years of BLKOUT
const TIMELINE_YEARS = [
  {
    year: '2016',
    title: 'The Beginning',
    quote: 'We created our own spaces.',
  },
  {
    year: '2017-18',
    title: 'Growing Roots',
    quote: 'Every brother was a seed.',
  },
  {
    year: '2019-20',
    title: 'Resilience',
    quote: 'When the world locked down, we opened up.',
  },
  {
    year: '2021-22',
    title: 'Digital Horizons',
    quote: 'Technology amplifies community.',
  },
  {
    year: '2023-24',
    title: 'Building Infrastructure',
    quote: 'We started building our own tables.',
  },
  {
    year: '2025',
    title: 'Revolution Digitized',
    quote: 'Liberation technology, realized.',
  },
  {
    year: '2026',
    title: 'The Next Decade',
    quote: 'The ancestors are celebrating.',
  },
];

// Confetti particle component
const ConfettiParticle: React.FC<{
  index: number;
  side: 'left' | 'right';
}> = ({ index, side }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  // Randomize particle properties using Remotion's seeded random
  const seed = `confetti-${side}-${index}`;
  const startDelay = random(seed + '-delay') * 30;
  const horizontalSpeed = random(seed + '-hspeed') * 3 + 2;
  const verticalSpeed = random(seed + '-vspeed') * 4 + 3;
  const rotationSpeed = random(seed + '-rot') * 20 - 10;
  const size = random(seed + '-size') * 15 + 10;
  const colorIndex = Math.floor(random(seed + '-color') * 3);

  const colors = [BLKOUT_COLORS.gold, BLKOUT_COLORS.purple, BLKOUT_COLORS.purpleLight];
  const color = colors[colorIndex];

  // Start position at bottom corners
  const startX = side === 'left' ? 50 : width - 50;
  const startY = height / 3 - 50;

  // Calculate position based on frame
  const activeFrame = Math.max(0, frame - startDelay);
  const progress = activeFrame / fps;

  // Parabolic trajectory
  const gravity = 200;
  const directionX = side === 'left' ? 1 : -1;
  const x = startX + directionX * horizontalSpeed * progress * 60;
  const y = startY - verticalSpeed * progress * 80 + 0.5 * gravity * progress * progress;

  // Fade out as it falls
  const opacity = interpolate(y, [0, height * 0.8], [1, 0], {
    extrapolateRight: 'clamp',
  });

  const rotation = activeFrame * rotationSpeed;

  if (frame < startDelay || y > height) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        borderRadius: 2,
        transform: `rotate(${rotation}deg)`,
        opacity,
      }}
    />
  );
};

// Confetti cannon burst
const ConfettiCannon: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const particles = Array.from({ length: 25 }, (_, i) => i);

  return (
    <>
      {particles.map((i) => (
        <ConfettiParticle key={`${side}-${i}`} index={i} side={side} />
      ))}
    </>
  );
};

const YearCard: React.FC<{
  year: string;
  title: string;
  quote: string;
  index: number;
}> = ({ year, title, quote, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cards start appearing after hero section (after ~2 seconds)
  const startFrame = 60 + index * 60;
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [-100, 0]);
  const scale = interpolate(progress, [0, 1], [0.9, 1]);

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
        display: 'flex',
        alignItems: 'center',
        padding: '25px 30px',
        background: `linear-gradient(135deg, ${BLKOUT_COLORS.purple}40, ${BLKOUT_COLORS.black}80)`,
        borderRadius: '20px',
        border: `2px solid ${BLKOUT_COLORS.gold}60`,
        marginBottom: '15px',
        width: '85%',
      }}
    >
      <img
        src="/assets/blkout_logo_roundel_colour.png"
        alt="BLKOUT"
        style={{
          width: '50px',
          height: '50px',
          marginRight: '20px',
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '42px',
            fontWeight: 900,
            color: BLKOUT_COLORS.gold,
            fontFamily: "'Arial Black', Arial, sans-serif",
          }}
        >
          {year}
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: BLKOUT_COLORS.white,
            marginTop: '2px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '20px',
            color: BLKOUT_COLORS.silver,
            marginTop: '5px',
            fontStyle: 'italic',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          "{quote}"
        </div>
      </div>
    </div>
  );
};

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Hero animations
  const heroProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const numberScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Glow pulse effect on the 10
  const glowPulse = Math.sin(frame / 10) * 20 + 40;

  // Scroll the timeline cards
  const scrollStart = 90;
  const scrollOffset = interpolate(
    frame,
    [scrollStart, durationInFrames],
    [0, -1200],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Audio fade out near end
  const audioVolume = interpolate(
    frame,
    [0, 30, durationInFrames - 60, durationInFrames],
    [0, 0.7, 0.7, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BLKOUT_COLORS.black} 0%, ${BLKOUT_COLORS.purpleDark} 50%, ${BLKOUT_COLORS.black} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Background Music */}
      <Audio
        src={staticFile('assets/music/UKJazzBrothers.mp3')}
        volume={audioVolume}
      />
      {/* Hero Section - Top Third */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '33.33%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          background: `radial-gradient(ellipse at center, ${BLKOUT_COLORS.purple}30, transparent 70%)`,
        }}
      >
        {/* Confetti Cannons */}
        <ConfettiCannon side="left" />
        <ConfettiCannon side="right" />

        {/* Large 10 */}
        <div
          style={{
            fontSize: '280px',
            fontWeight: 900,
            color: BLKOUT_COLORS.white,
            fontFamily: "'Arial Black', Arial, sans-serif",
            transform: `scale(${numberScale})`,
            textShadow: `
              0 0 ${glowPulse}px ${BLKOUT_COLORS.purple},
              0 0 ${glowPulse * 2}px ${BLKOUT_COLORS.gold}40,
              0 4px 0 ${BLKOUT_COLORS.purpleDark}
            `,
            lineHeight: 0.9,
            letterSpacing: '-10px',
          }}
        >
          10
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 600,
            color: BLKOUT_COLORS.gold,
            fontFamily: "'Inter', system-ui, sans-serif",
            marginTop: '15px',
            opacity: subtitleOpacity,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            textShadow: `0 2px 10px ${BLKOUT_COLORS.black}`,
          }}
        >
          10 years making space for us
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: interpolate(heroProgress, [0, 1], [0, 300]),
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${BLKOUT_COLORS.gold}, transparent)`,
            marginTop: '20px',
          }}
        />
      </div>

      {/* Timeline Cards Section - Bottom Two Thirds */}
      <div
        style={{
          position: 'absolute',
          top: '33.33%',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '30px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `translateY(${scrollOffset}px)`,
          }}
        >
          {TIMELINE_YEARS.map((item, index) => (
            <YearCard key={item.year} {...item} index={index} />
          ))}

          {/* Rising BLKOUT Roundel - appears at 18 seconds, follows card path */}
          {frame >= 540 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '40px',
                opacity: interpolate(
                  frame,
                  [540, 570, 870, 900],
                  [0, 1, 1, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                ),
              }}
            >
              <img
                src="/assets/blkout_logo_roundel_colour.png"
                alt="BLKOUT"
                style={{
                  width: '600px',
                  height: '600px',
                  filter: `drop-shadow(0 0 80px ${BLKOUT_COLORS.purple})`,
                  transform: `scale(${interpolate(
                    frame,
                    [540, 600],
                    [0.8, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  )})`,
                }}
              />
            </div>
          )}
        </div>
      </div>


      {/* Footer CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            padding: '12px 40px',
            background: BLKOUT_COLORS.gold,
            borderRadius: '50px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: BLKOUT_COLORS.black,
            fontFamily: "'Arial Black', Arial, sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          blkoutuk.com/movement
        </div>
        <img
          src="/assets/blkoutlogo_wht_transparent.png"
          alt="BLKOUT"
          style={{
            height: '30px',
            opacity: 0.7,
            marginTop: '12px',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
