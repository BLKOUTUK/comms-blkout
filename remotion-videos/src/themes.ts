/**
 * Weekly look rotation for the news digest.
 *
 * Rob, 28 Aug 2026: if every digest looks the same at a glance, a feed reads
 * it as "seen this already". So the base gradient and the two radial glows rotate on a five-week cycle keyed to the
 * ISO week number (weekly-render.mjs writes props.weekNumber). Deterministic:
 * the same week always renders the same look. Week % 5 === 0 is the original
 * digest look, untouched. The other four take their accents from the ratified
 * BLKOUT theme collection (blkout-themes skill).
 *
 * Not here: recolouring the newsroom set behind AIvor. The set is baked into
 * the presenter illustration (aivor-news*.jpg / the SadTalker mp4), which
 * covers the backdrop layer completely, so a wash on the backdrop is never
 * visible — proven with stills 28 Aug 2026. Changing the set means new
 * presenter renders, not a backdrop tint.
 */
export const DIGEST_THEMES = [
  {
    key: "newsroom-classic",
    gradient: ["rgb(15, 23, 42)", "rgb(17, 24, 39)", "rgb(23, 37, 84)"],
    glowA: "rgba(255, 215, 0, 0.15)",
    glowB: "rgba(124, 58, 237, 0.18)",
  },
  {
    key: "revolutionary-red", // #D4261A on #264653
    gradient: ["rgb(60, 10, 12)", "rgb(38, 6, 10)", "rgb(16, 4, 6)"],
    glowA: "rgba(212, 38, 26, 0.28)",
    glowB: "rgba(38, 70, 83, 0.35)",
  },
  {
    key: "liberation-teal", // #2A9D8F on #264653
    gradient: ["rgb(12, 50, 52)", "rgb(10, 36, 42)", "rgb(6, 18, 24)"],
    glowA: "rgba(42, 157, 143, 0.30)",
    glowB: "rgba(38, 70, 83, 0.40)",
  },
  {
    key: "trans-joy", // #FFB3DA + #00D4FF
    gradient: ["rgb(50, 18, 44)", "rgb(30, 12, 40)", "rgb(12, 6, 22)"],
    glowA: "rgba(255, 179, 218, 0.26)",
    glowB: "rgba(0, 212, 255, 0.20)",
  },
  {
    key: "community-gold", // #F4A261 + #E76F51
    gradient: ["rgb(56, 30, 10)", "rgb(38, 20, 8)", "rgb(16, 8, 4)"],
    glowA: "rgba(244, 162, 97, 0.30)",
    glowB: "rgba(231, 111, 81, 0.24)",
  },
] as const;

export type DigestTheme = (typeof DIGEST_THEMES)[number];
export type DigestThemeKey = DigestTheme["key"];
export const DIGEST_THEME_KEYS = DIGEST_THEMES.map((t) => t.key) as [
  DigestThemeKey,
  ...DigestThemeKey[],
];

/** Explicit key wins (tests, one-offs); otherwise the ISO week picks. */
export function resolveDigestTheme(
  themeKey?: string,
  weekNumber?: number
): DigestTheme {
  if (themeKey) {
    const hit = DIGEST_THEMES.find((t) => t.key === themeKey);
    if (hit) return hit;
  }
  if (typeof weekNumber === "number" && Number.isFinite(weekNumber)) {
    const n = DIGEST_THEMES.length;
    return DIGEST_THEMES[((Math.floor(weekNumber) % n) + n) % n];
  }
  return DIGEST_THEMES[0];
}
