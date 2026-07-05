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

export const Countdown: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Each number gets 30 frames (1 second)
  const currentNumber = 10 - Math.floor(frame / 30);

  const numberProgress = spring({
    frame: frame % 30,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const scale = interpolate(numberProgress, [0, 1], [0, 1]);
  const rotation = interpolate(numberProgress, [0, 1], [-180, 0]);

  // Pulse effect
  const pulse = Math.sin(frame / 5) * 0.05 + 1;

  // Glow intensity
  const glowIntensity = Math.sin(frame / 8) * 20 + 60;

  // Audio volume
  const audioVolume = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0, 0.7, 0.7, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${BLKOUT_COLORS.purpleDark}, ${BLKOUT_COLORS.black})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Music */}
      <Audio
        src={staticFile('assets/music/UKJazzBrothers.mp3')}
        volume={audioVolume}
      />

      {/* Animated rings */}
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          style={{
            position: 'absolute',
            width: `${300 + ring * 150}px`,
            height: `${300 + ring * 150}px`,
            borderRadius: '50%',
            border: `2px solid ${BLKOUT_COLORS.gold}${Math.round(30 / ring)}`,
            transform: `scale(${pulse}) rotate(${frame * (ring % 2 === 0 ? 1 : -1)}deg)`,
          }}
        />
      ))}

      {/* BLKOUT roundel background */}
      <img
        src="/assets/blkout_logo_roundel_colour.png"
        alt="BLKOUT"
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          opacity: 0.15,
          transform: `scale(${pulse})`,
        }}
      />

      {/* Days text */}
      <div
        style={{
          fontSize: '32px',
          color: BLKOUT_COLORS.gold,
          fontWeight: 900,
          letterSpacing: '8px',
          marginBottom: '20px',
          fontFamily: "'Arial Black', Arial, sans-serif",
          textTransform: 'uppercase',
        }}
      >
        DAYS UNTIL
      </div>

      {/* Number */}
      <div
        style={{
          fontSize: '300px',
          fontWeight: 900,
          color: BLKOUT_COLORS.white,
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          textShadow: `0 0 ${glowIntensity}px ${BLKOUT_COLORS.purple}, 0 0 ${glowIntensity * 2}px ${BLKOUT_COLORS.gold}`,
          fontFamily: "'Arial Black', Arial, sans-serif",
          lineHeight: 0.9,
        }}
      >
        {Math.max(1, currentNumber)}
      </div>

      {/* Event text */}
      <div
        style={{
          fontSize: '36px',
          color: BLKOUT_COLORS.purpleLight,
          marginTop: '20px',
          textAlign: 'center',
          fontFamily: "'Arial Black', Arial, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '4px',
        }}
      >
        10TH ANNIVERSARY
      </div>
      <div
        style={{
          fontSize: '28px',
          color: BLKOUT_COLORS.gold,
          marginTop: '10px',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        FEBRUARY 18, 2026
      </div>

      {/* CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          padding: '15px 40px',
          background: BLKOUT_COLORS.gold,
          borderRadius: '50px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: BLKOUT_COLORS.black,
          fontFamily: "'Arial Black', Arial, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '2px',
          opacity: interpolate(frame, [60, 90], [0, 1]),
        }}
      >
        blkoutuk.com/movement
      </div>

      {/* BLKOUT branding */}
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
