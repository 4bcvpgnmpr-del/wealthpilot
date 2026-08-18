/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta propia: navy casi negro + esmeralda (crecimiento) + ámbar/rojo (alertas).
        // Deliberadamente NO usamos crema+terracota (el look por defecto de IA) — este es
        // un producto financiero serio, referencia: terminal Bloomberg + Revolut, sobrio,
        // denso en datos, con "paper" frío en vez de cálido.
        ink: {
          950: "#05070C",
          900: "#0B0F17",
          800: "#131924",
          700: "#1E2633",
          600: "#313D4E",
        },
        mist: {
          400: "#7C8798",
          300: "#A6AFBD",
          200: "#D7DBE2",
          100: "#F6F7F9",
        },
        wealth: {
          500: "#0E9F6E",
          400: "#34C28F",
          100: "#E3F8EF",
        },
        signal: {
          amber: "#D97706",
          red: "#DC2626",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      letterSpacing: {
        eyebrow: "0.08em",
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(11 15 23 / 0.04), 0 1px 1px 0 rgb(11 15 23 / 0.03)",
        "card-hover": "0 4px 16px -4px rgb(11 15 23 / 0.10)",
      },
    },
  },
  plugins: [],
};

