/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E89951', // Terracotta Orange
          dark: '#d38038',
        },
        accent: {
          DEFAULT: '#ECB65F', // Mustard Amber
          green: '#A5CF83', // Sage Green
          cream: '#f0e76f',
        },
        bg: {
          dark: '#2A1D19', // Coffee Brown
          light: '#FDFBF7', // Soft Creamy Off-White
          subtle: '#FAF6EE',
        },
        ink: {
          DEFAULT: '#2A1D19',
          muted: 'rgba(42, 29, 25, 0.6)',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        md: '2px',
        DEFAULT: '2px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '4px',
        full: '2px', // Rigid corners for buttons in industrial brutalist UI
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
