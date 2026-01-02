/**
 * Comms BLKOUT - Tailwind Configuration
 *
 * Uses @blkout/shared preset for consistent design system.
 * App-specific extensions can be added below.
 */

/** @type {import('tailwindcss').Config} */
export default {
  // Use shared BLKOUT design system
  presets: [require('../../packages/shared/tailwind.preset')],

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      // App-specific: Plus Jakarta Sans for display (admin dashboard aesthetic)
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
