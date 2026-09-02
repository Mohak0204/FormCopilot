/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New warm-white palette from Stitch
        surface: {
          DEFAULT: '#faf9f7',    // main bg
          50: '#ffffff',
          100: '#f5f4f1',
          200: '#edecea',
          300: '#e4e3e0',
          400: '#d4d3d0',
        },
        ink: {
          DEFAULT: '#1a1a1a',    // primary text
          secondary: '#4a4a4a',  // secondary text
          muted: '#7a7a7a',      // muted/meta text
          faint: '#a0a0a0',      // dimmed labels
        },
        accent: {
          DEFAULT: '#2d6a4f',    // muted green primary
          light: '#40916c',
          dark: '#1b4332',
          muted: '#52796f',
          bg: '#e8f5e9',
          border: '#c8e6c9',
        },
        status: {
          green: '#2d6a4f',
          'green-light': '#40916c',
          'green-bg': '#e8f5e9',
          'green-border': '#a5d6a7',
          red: '#c62828',
          'red-bg': '#ffebee',
          'red-border': '#ef9a9a',
          amber: '#e65100',
          'amber-light': '#f57c00',
          'amber-bg': '#fff3e0',
          'amber-border': '#ffcc80',
          blue: '#1565c0',
          'blue-bg': '#e3f2fd',
          'blue-border': '#90caf9',
        },
        border: {
          DEFAULT: '#e0dfdc',
          light: '#eeedeb',
          dark: '#c8c7c4',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'premium': '0.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'elevated': '0 8px 24px 0 rgba(0,0,0,0.08)',
        'subtle': '0 1px 2px 0 rgba(0,0,0,0.04)',
      },
      maxWidth: {
        'page': '1280px',
      },
    },
  },
  plugins: [],
}
