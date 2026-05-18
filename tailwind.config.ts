import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: { 950: '#0a0a0f', 900: '#14110e', 800: '#1a1612', 700: '#2a2318' },
        gold: { 50: '#f0e0bc', 100: '#e8d5b7', 300: '#d4b46d', 500: '#c9a961', 700: '#b8954c', 900: '#6b5429' },
        crimson: { 500: '#a8413f', 700: '#7a2a28' },
        sage: { 500: '#6dd47e' },
        sky: { 500: '#7eb0d4' },
        amethyst: { 500: '#b56eb5' }
      },
      boxShadow: {
        glow: '0 0 24px rgba(212, 180, 109, 0.25)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.4)',
        lift: '0 1px 0 rgba(255,255,255,0.06) inset, 0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(201, 169, 97, 0.1)'
      },
      animation: { 'fade-in': 'fadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' },
      keyframes: { fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } }
    }
  },
  plugins: []
} satisfies Config;
