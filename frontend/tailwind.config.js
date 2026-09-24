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
        // DEFAULT : traits, logo, interrupteur. text : petit texte rouge (#e0473e plafonne à 4,0:1 sur surface).
        // fill : aplat portant du texte blanc (#e0473e plafonne à 4,1:1 ; fill 5,1:1, fill-hover 5,9:1)
        covert: { DEFAULT: '#e0473e', text: '#ec6259', fill: '#c83a31', 'fill-hover': '#b8352d' },
        gold: '#d4af37',
        muted: '#8a8f9c',
        // Échelle de rareté : couleurs officielles des tiers du jeu (donnée, pas décor).
        // `unknown` = item sans rareté connue dans le dataset (caisses, capsules…)
        rarity: {
          consumer: '#b0c3d9',
          industrial: '#5e98d9',
          milspec: '#4b69ff',
          restricted: '#8847ff',
          classified: '#d32ce6',
          covert: '#eb4b4b',
          contraband: '#e4ae39',
          unknown: '#3a3f4b'
        }
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        in: 'toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1)'
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
