/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta propia: azul noche profundo + verde patrimonio (crecimiento) + ámbar (alertas)
        // Deliberadamente NO usamos el terracota/crema por defecto de IA — este es un producto
        // financiero serio, referencia visual: Bloomberg terminal + Revolut, sobrio y denso en datos.
        ink: {
          950: "#0A0E14",
          900: "#0F1520",
          800: "#161D2C",
          700: "#212B3D",
          600: "#334059",
        },
        mist: {
          400: "#8B94A8",
          300: "#AEB5C4",
          200: "#D4D8E0",
          100: "#EEF0F4",
        },
        wealth: {
          // verde "patrimonio" — crecimiento, positivo
          500: "#1FA97C",
          400: "#3DC494",
          100: "#DFF5EC",
        },
        signal: {
          amber: "#E8A33D",
          red: "#E15B5B",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
