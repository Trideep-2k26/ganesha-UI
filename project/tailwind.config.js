/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: 'var(--saffron-50)',
          100: 'var(--saffron-100)',
          200: 'var(--saffron-200)',
          300: 'var(--saffron-300)',
          400: 'var(--saffron-400)',
          500: 'var(--saffron-500)',
          600: 'var(--saffron-600)',
          700: 'var(--saffron-700)',
          800: 'var(--saffron-800)',
          900: 'var(--saffron-900)',
        },
        gold: {
          50: 'var(--gold-50)',
          100: 'var(--gold-100)',
          200: 'var(--gold-200)',
          300: 'var(--gold-300)',
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          600: 'var(--gold-600)',
          700: 'var(--gold-700)',
          800: 'var(--gold-800)',
          900: 'var(--gold-900)',
        },
        crimson: {
          50: 'var(--crimson-50)',
          100: 'var(--crimson-100)',
          200: 'var(--crimson-200)',
          300: 'var(--crimson-300)',
          400: 'var(--crimson-400)',
          500: 'var(--crimson-500)',
          600: 'var(--crimson-600)',
          700: 'var(--crimson-700)',
          800: 'var(--crimson-800)',
          900: 'var(--crimson-900)',
        },
        ivory: {
          50: 'var(--ivory-50)',
          100: 'var(--ivory-100)',
          200: 'var(--ivory-200)',
          300: 'var(--ivory-300)',
          400: 'var(--ivory-400)',
          500: 'var(--ivory-500)',
          600: 'var(--ivory-600)',
          700: 'var(--ivory-700)',
          800: 'var(--ivory-800)',
          900: 'var(--ivory-900)',
        }
      },
      fontFamily: {
        'devanagari': ['Noto Sans Devanagari', 'sans-serif'],
        'tamil': ['Noto Sans Tamil', 'sans-serif'],
        'telugu': ['Noto Sans Telugu', 'sans-serif'],
        'gujarati': ['Noto Sans Gujarati', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        'gentle-glow': 'gentle-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 30s linear infinite',
      },
      backgroundImage: {
        'divine-gradient': 'linear-gradient(135deg, var(--saffron-400) 0%, var(--gold-400) 50%, var(--crimson-500) 100%)',
        'temple-gradient': 'linear-gradient(180deg, var(--saffron-400) 0%, var(--gold-500) 100%)',
        'blessing-gradient': 'radial-gradient(circle, var(--gold-300) 0%, var(--saffron-400) 70%)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'divine': '0 25px 50px -12px rgba(255, 153, 51, 0.25)',
        'sacred': '0 10px 25px -5px rgba(218, 165, 32, 0.3)',
        'temple': '0 20px 40px -8px rgba(220, 20, 60, 0.2)',
      }
    },
  },
  plugins: [],
};