/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          paper: '#F3ECDD',
          paper2: '#EAE1CB',
          ink: '#26201B',
          inkSoft: '#5B5347',
          red: '#A13328',
          redDark: '#7C261D',
          brass: '#AD8A50',
          brassDark: '#8C6B35',
          brassLight: '#F5EDD8',
          olive: '#516B47',
          oliveDark: '#3A4E33',
          oliveLight: '#EBF0E8',
          line: 'rgba(38, 32, 27, 0.14)',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        serif: ['"Source Serif 4"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'arc-dots': 'radial-gradient(circle at 1px 1px, rgba(38, 32, 27, 0.05) 1px, transparent 0)',
        'arc-header': 'linear-gradient(135deg, #7C261D 0%, #A13328 50%, #8C6B35 100%)',
        'arc-btn': 'linear-gradient(135deg, #A13328 0%, #7C261D 100%)',
        'arc-hero': 'linear-gradient(135deg, #26201B 0%, #3d3028 100%)',
        'arc-dots-light': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)',
        'arc-dots-light-sm': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
      },
      boxShadow: {
        'arc-header': '0 4px 24px rgba(124, 38, 29, 0.4)',
        'arc-card': '0 4px 20px rgba(38,32,27,0.06)',
        'arc-card-soft': '0 2px 12px rgba(0,0,0,0.05)',
        'arc-btn': '0 6px 20px rgba(161,51,40,0.35)',
        'arc-btn-sm': '0 4px 12px rgba(161,51,40,0.35)',
        'arc-fexp': '0 8px 40px rgba(38,32,27,0.07)',
        'arc-stat': '0 4px 20px rgba(0,0,0,0.08)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        tabIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        tipIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        savedPulse: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
      },
      animation: {
        fadeIn: 'fadeIn .35s ease forwards',
        slideUp: 'slideUp .4s cubic-bezier(.16,1,.3,1) forwards',
        tabIn: 'tabIn .3s ease forwards',
        tipIn: 'tipIn .3s ease forwards',
        savedPulse: 'savedPulse .4s ease',
      },
    },
  },
  plugins: [],
}
