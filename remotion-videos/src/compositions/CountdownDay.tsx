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

interface CountdownDayProps {
  day: number;
}

export const CountdownDay: React.FC<CountdownDayProps> = ({ day }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const scale = interpolate(progress, [0, 1], [0, 1]);
  const rotation = interpolate(progress, [0, 1], [-360, 0]);

  // Glow pulse
  const glowIntensity = Math.sin(frame / 8) * 20 + 60;

  // Audio volume - short fade for 3 second clip
  const audioVolume = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 0.6, 0.6, 0],
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

      {/* Animated background circle */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BLKOUT_COLORS.purple}40, transparent)`,
          transform: `scale(${1 + Math.sin(frame / 15) * 0.1})`,
        }}
      />

      {/* BLKOUT roundel background */}
      <img
        src="/assets/blkout_logo_roundel_colour.png"
        alt="BLKOUT"
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          opacity: 0.2,
        }}
      />

      {/* Gold ring */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          border: `4px solid ${BLKOUT_COLORS.gold}`,
          transform: `rotate(${frame * 2}deg)`,
          opacity: 0.5,
        }}
      />

      {/* Days text */}
      <div
        style={{
          fontSize: '28px',
          color: BLKOUT_COLORS.gold,
          fontWeight: 900,
          letterSpacing: '6px',
          marginBottom: '10px',
          fontFamily: "'Arial Black', Arial, sans-serif",
          opacity: progress,
          textTransform: 'uppercase',
        }}
      >
        {day === 1 ? 'TOMORROW' : `${day} DAYS`}
      </div>

      {/* Number */}
      <div
        style={{
          fontSize: '250px',
          fontWeight: 900,
          color: BLKOUT_COLORS.white,
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          textShadow: `0 0 ${glowIntensity}px ${BLKOUT_COLORS.purple}, 0 0 ${glowIntensity * 2}px ${BLKOUT_COLORS.gold}`,
          fontFamily: "'Arial Black', Arial, sans-serif",
          lineHeight: 1,
        }}
      >
        {day}
      </div>

      {/* Event info */}
      <div
        style={{
          fontSize: '24px',
          color: BLKOUT_COLORS.purpleLight,
          marginTop: '20px',
          textAlign: 'center',
          fontFamily: "'Arial Black', Arial, sans-serif",
          opacity: progress,
          textTransform: 'uppercase',
          letterSpacing: '3px',
        }}
      >
        BLKOUT 10TH ANNIVERSARY
      </div>

      {/* Date */}
      <div
        style={{
          fontSize: '20px',
          color: BLKOUT_COLORS.gold,
          marginTop: '8px',
          fontFamily: "'Inter', system-ui, sans-serif",
          opacity: progress,
        }}
      >
        FEB 18, 2026 | 6:30PM GMT
      </div>

      {/* CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          padding: '12px 35px',
          background: BLKOUT_COLORS.gold,
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: BLKOUT_COLORS.black,
          fontFamily: "'Arial Black', Arial, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '1px',
          opacity: interpolate(frame, [45, 75], [0, 1]),
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
          bottom: '30px',
          height: '30px',
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
};
