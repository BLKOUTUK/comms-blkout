import { loadFont as loadWorkSans } from "@remotion/google-fonts/WorkSans";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const workSans = loadWorkSans("normal", {
  weights: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
});
const frauncesItalic = loadFraunces("italic", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const plexMono = loadIBMPlexMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const COLORS = {
  black: "#000000",
  obsidian: "#0a0a14",
  abyss: "#14141f",
  goldDivine: "#FFD700",
  goldRich: "#D4AF37",
  pridePurple: "#7C3AED",
  pridePurpleDeep: "#5B21B6",
  cream: "#F5F1E8",
  creamMuted: "#A8A195",
  white: "#FFFFFF",
  textMuted: "rgba(245, 241, 232, 0.78)",
} as const;

export const FONTS = {
  display: `${workSans.fontFamily}, "Helvetica Neue", Arial, sans-serif`,
  body: `${workSans.fontFamily}, "Helvetica Neue", Arial, sans-serif`,
  ui: `${workSans.fontFamily}, "Helvetica Neue", Arial, sans-serif`,
  italic: `${frauncesItalic.fontFamily}, "Times New Roman", serif`,
  mono: `${plexMono.fontFamily}, "Courier New", monospace`,
} as const;

export const PROPERTY_GRADIENTS = {
  "ivor-events": [
    "rgb(17, 94, 89)",
    "rgb(6, 78, 59)",
    "rgb(15, 23, 42)",
  ],
  "news-digest": [
    "rgb(15, 23, 42)",
    "rgb(17, 24, 39)",
    "rgb(23, 37, 84)",
  ],
  "social-seen": [
    "rgb(59, 7, 100)",
    "rgb(76, 5, 82)",
    "rgb(67, 56, 202)",
  ],
} as const;

export type PropertyKey = keyof typeof PROPERTY_GRADIENTS;
