/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
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
      },
    },
  },
  plugins: [],
};
