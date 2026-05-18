/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          200: '#f6e9c7',
          300: '#f0e0bc',
          400: '#d4b46d',
          500: '#c9a961',
          600: '#b8954c',
          700: '#8e6d2e',
        },
        ink: {
          900: '#0a0a0f',
          800: '#14110e',
          750: '#1a1612',
          700: '#1f1a14',
          600: '#2a2318',
          500: '#3a3328',
          400: '#5a4f3e',
          300: '#8a7f70',
          200: '#b3a99a',
          100: '#e8e6e3',
        },
        danger: {
          400: '#c45a58',
          500: '#a8413f',
          600: '#7a2a28',
        },
        success: {
          400: '#6dd47e',
          500: '#46b464',
        },
        info: {
          400: '#7eb0d4',
        },
        mystic: {
          400: '#b56eb5',
        },
        sage: {
          500: '#6dd47e',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(180deg, #d4b46d, #b8954c)',
        'gold-text': 'linear-gradient(180deg, #f0e0bc 0%, #c9a961 100%)',
      },
      boxShadow: {
        'card': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.4)',
        'lift': '0 1px 0 rgba(255,255,255,0.06) inset, 0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,97,0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
