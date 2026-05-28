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
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
        },
        gold: {
          50:  'rgb(240 224 188 / <alpha-value>)',
          100: 'rgb(232 213 183 / <alpha-value>)',
          300: 'rgb(212 180 109 / <alpha-value>)',
          400: 'rgb(212 180 109 / <alpha-value>)',
          500: 'rgb(201 169 97 / <alpha-value>)',
          700: 'rgb(184 149 76 / <alpha-value>)',
          900: 'rgb(107 84 41 / <alpha-value>)',
        },
        crimson: {
          500: 'rgb(168 65 63 / <alpha-value>)',
          700: 'rgb(122 42 40 / <alpha-value>)',
        },
        sage:      { 500: 'rgb(109 212 126 / <alpha-value>)' },
        sky:       { 500: 'rgb(126 176 212 / <alpha-value>)' },
        amethyst:  { 500: 'rgb(181 110 181 / <alpha-value>)' },
        success:   { 400: 'rgb(109 212 126 / <alpha-value>)', 500: 'rgb(109 212 126 / <alpha-value>)' },
        danger:    { 400: 'rgb(255 122 122 / <alpha-value>)', 500: 'rgb(220 80 80 / <alpha-value>)' },
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
