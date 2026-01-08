/**
 * @blkout/shared - Unified Tailwind Preset
 *
 * Single source of truth for BLKOUT design system.
 * All apps should extend this preset for visual consistency.
 *
 * Usage in app tailwind.config.js:
 * ```js
 * export default {
 *   presets: [require('@blkout/shared/tailwind.preset')],
 *   content: ['./src/**\/*.{js,ts,jsx,tsx}'],
 * }
 * ```
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // =================================================================
        // Primary Brand Colors - Liberation Theme
        // =================================================================
        'blkout': {
          // Core brand - Purple spectrum (cooperative identity)
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',  // Primary brand purple
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },

        // =================================================================
        // Liberation Colors - Values-based naming
        // =================================================================
        'liberation': {
          // Gold - Divine, sovereignty, prosperity
          'gold-divine': '#FFD700',
          'sovereignty-gold': '#D4AF37',

          // Power colors
          'pride-purple': '#9B4DCA',
          'resistance-red': '#DC143C',
          'healing-green': '#2E8B57',
          'community-teal': '#00CED1',

          // Foundation
          'black-power': '#000000',
        },

        // =================================================================
        // Community Colors - Semantic naming for values
        // =================================================================
        'community': {
          'warmth': '#f59e0b',   // Amber - welcoming, inclusion
          'trust': '#10b981',    // Emerald - safety, reliability
          'wisdom': '#6366f1',   // Indigo - knowledge, guidance
          'joy': '#ec4899',      // Pink - celebration, pride
          'power': '#ef4444',    // Red - strength, activism
        },

        // =================================================================
        // Pride Flag Colors (for rainbow elements)
        // =================================================================
        'pride': {
          'red': '#E40303',
          'orange': '#FF8C00',
          'yellow': '#FFED00',
          'green': '#008018',
          'blue': '#004CFF',
          'purple': '#732982',
          'pink': '#FFB3DA',
          'cyan': '#00D4FF',
          'black': '#000000',
          'brown': '#613915',
        },

        // =================================================================
        // Accent Colors (for UI elements)
        // =================================================================
        'accent': {
          'primary': '#D4261A',      // Bold red for CTAs
          'secondary': '#F4A261',    // Warm gold
          'tertiary': '#2A9D8F',     // Teal
          'warm': '#E76F51',         // Orange
          'deep': '#264653',         // Forest green
        },

        // =================================================================
        // Neutral Grays (consistent dark theme)
        // =================================================================
        'neutral': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },

      // =================================================================
      // Typography
      // =================================================================
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // =================================================================
      // Spacing & Layout
      // =================================================================
      borderRadius: {
        'blkout': '0.75rem',  // Standard rounded corners
        'blkout-lg': '1rem',
        'blkout-xl': '1.5rem',
      },

      // =================================================================
      // Shadows
      // =================================================================
      boxShadow: {
        'blkout': '0 4px 6px -1px rgba(168, 85, 247, 0.1), 0 2px 4px -1px rgba(168, 85, 247, 0.06)',
        'blkout-lg': '0 10px 15px -3px rgba(168, 85, 247, 0.1), 0 4px 6px -2px rgba(168, 85, 247, 0.05)',
        'liberation': '0 4px 14px 0 rgba(255, 215, 0, 0.25)',
      },

      // =================================================================
      // Animations
      // =================================================================
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      // =================================================================
      // Background Images / Gradients
      // =================================================================
      backgroundImage: {
        'liberation-gradient': 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f59e0b 100%)',
        'pride-gradient': 'linear-gradient(180deg, #E40303 0%, #FF8C00 17%, #FFED00 33%, #008018 50%, #004CFF 67%, #732982 100%)',
        'dark-gradient': 'linear-gradient(to bottom right, #171717, #3b0764, #064e3b)',
      },
    },
  },
  plugins: [],
};
