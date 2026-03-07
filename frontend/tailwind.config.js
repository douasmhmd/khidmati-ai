/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
<<<<<<< HEAD
      fontFamily: {
        sans: ['Noto Kufi Arabic', 'Noto Sans Arabic', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        border: "rgba(0, 0, 0, 0.1)",
        input: "transparent",
        ring: "oklch(0.708 0 0)",
        background: "#ffffff",
        foreground: "oklch(0.145 0 0)",
        primary: {
          DEFAULT: "#030213",
          foreground: "oklch(1 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(0.95 0.0058 264.53)",
          foreground: "#030213",
        },
        muted: {
          DEFAULT: "#ececf0",
          foreground: "#717182",
        },
        accent: {
          DEFAULT: "#e9ebef",
          foreground: "#030213",
        },
        destructive: {
          DEFAULT: "#d4183d",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
=======
      colors: {
        'morocco-green':      '#006233',
        'morocco-green-dark': '#004D2B',
        'morocco-red':        '#C1272D',
        'morocco-gold':       '#C8A951',
        'morocco-gold-light': '#E8D08A',
        'morocco-cream':      '#FDF8EE',
      },
      fontFamily: {
        tifinagh: ['"Noto Sans Tifinagh"', 'sans-serif'],
        arabic:   ['"Noto Sans Arabic"', '"Segoe UI"', 'sans-serif'],
      },
      animation: {
        'slide-in':        'slideInUp 0.3s ease-out both',
        'fade-in':         'fadeIn 0.4s ease-out both',
        'pulse-moroccan':  'pulseMoroccan 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        pulseMoroccan: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(193,39,45,0.5)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(193,39,45,0)'  },
        },
>>>>>>> fb97117c4d47f2bf0b4bc89a21addde3b3f490da
      },
    },
  },
  plugins: [],
};
