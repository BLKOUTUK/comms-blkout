
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blkout-purple': '#6B46C1',
        'blkout-gold': '#F59E0B',
        'blkout-pink': '#EC4899',
        'blkout-blue': '#3B82F6',
      },
    },
  },
  plugins: [],
}
