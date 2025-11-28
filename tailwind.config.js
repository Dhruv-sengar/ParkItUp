export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5f7",
          100: "#ffe4ea",
          200: "#fecdd6",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        ink: {
          700: "#2a2a2a",
          800: "#1f1f1f",
          900: "#141414",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,0.08)",
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #fff5f7 0%, #ffe4ea 40%, #ffffff 100%)",
        heroDark: "linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 50%, #141414 100%)",
      },
    },
  },
  plugins: [],
}
