import { useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';

// BLKOUT brand colors for confetti
const BLKOUT_COLORS = ['#D4AF37', '#FFD700', '#FFFFFF', '#9333ea', '#c026d3'];

/** Fire a single burst of confetti from a given origin */
function burst(origin: { x: number; y: number }) {
  confetti({
    particleCount: 80,
    spread: 70,
    origin,
    colors: BLKOUT_COLORS,
    ticks: 200,
    gravity: 1.2,
    scalar: 1.1,
  });
}

/** Fire confetti from both sides simultaneously */
function doubleBurst() {
  burst({ x: 0.15, y: 0.6 });
  burst({ x: 0.85, y: 0.6 });
}

/** Extended celebration — multiple bursts over time */
function celebration() {
  const end = Date.now() + 2500;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: BLKOUT_COLORS,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: BLKOUT_COLORS,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Hook that fires confetti on mount (once) and exposes manual triggers.
 * @param fireOnMount — fire a celebration burst when the component mounts
 */
export function useConfetti(fireOnMount = true) {
  useEffect(() => {
    if (fireOnMount) {
      // Small delay so the page renders first
      const timer = setTimeout(doubleBurst, 600);
      return () => clearTimeout(timer);
    }
  }, [fireOnMount]);

  return {
    burst: useCallback(burst, []),
    doubleBurst: useCallback(doubleBurst, []),
    celebration: useCallback(celebration, []),
  };
}
