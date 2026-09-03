/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#14161a',
        surface: '#1c1f26',
        surfaceHover: '#242832',
        border: '#2a2e38',
        covert: '#e0473e',
        gold: '#d4af37',
        muted: '#8a8f9c'
      },
      fontFamily: {
        display: ['"Rajdhani"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
