import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const fraunces = loadFraunces("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
const newsreader = loadNewsreader("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const COLORS = {
  black: "#000000",
  goldDivine: "#FFD700",
  goldRich: "#D4AF37",
  pridePurple: "#7C3AED",
  pridePurpleDeep: "#5B21B6",
  white: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.78)",
} as const;

export const FONTS = {
  display: `${fraunces.fontFamily}, "Times New Roman", serif`,
  body: `${newsreader.fontFamily}, "Times New Roman", serif`,
  ui: `${inter.fontFamily}, system-ui, -apple-system, sans-serif`,
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
} as const;

export type PropertyKey = keyof typeof PROPERTY_GRADIENTS;
