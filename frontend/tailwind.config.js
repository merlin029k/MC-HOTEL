/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './lib/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2f7',
          100: '#d4dfeb',
          200: '#a9bfd6',
          300: '#7e9fc2',
          400: '#4a729e',
          500: '#2c5079',
          600: '#1f3c5f',
          700: '#182f4b',
          800: '#122438',
          900: '#0d1a29',
        },
        gold: {
          50: '#fbf6e9',
          100: '#f3e6bd',
          200: '#e9d38c',
          300: '#dcbc5a',
          400: '#c9a53a',
          500: '#b08a25',
          600: '#8c6d1d',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
