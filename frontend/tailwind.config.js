/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0e1a',
          900: '#0f1525',
          800: '#151d32',
          700: '#1c2640',
          600: '#243050',
          500: '#2f3f66',
        },
        bronze: {
          DEFAULT: '#c9a96e',
          light: '#dfc8a0',
          dark: '#a88a4e',
          muted: '#8a7551',
        },
        ivory: {
          DEFAULT: '#f0ece4',
          dim: '#b8b3a8',
          muted: '#8a8680',
        },
        status: {
          green: '#4ade80',
          'green-bg': '#0d2818',
          'green-border': '#16432b',
          red: '#f87171',
          'red-bg': '#2a1215',
          'red-border': '#451a1e',
          amber: '#fbbf24',
          'amber-bg': '#2a2008',
          'amber-border': '#42350f',
          blue: '#60a5fa',
          'blue-bg': '#0c1929',
          'blue-border': '#172d47',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'premium': '0.625rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)',
        'glow-bronze': '0 0 20px rgba(201,169,110,0.15)',
      },
    },
  },
  plugins: [],
}
