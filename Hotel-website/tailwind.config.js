/** @type {import('tailwindcss').Config} */
export default {
  // Dark styles are opt-in via a `.dark` class, never the OS setting. The site
  // never adds that class, so every `dark:` utility stays dormant and the whole
  // site renders in its light theme regardless of the visitor's OS dark mode.
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand gradient endpoints used by the admin dashboard.
        brand: { start: "#667eea", end: "#764ba2" },
        sidebar: "#1f2233",
        canvas: "#f4f5fa",
        // Public hotel website palette — mirrors the admin panel:
        // navy = admin dark surface, steel = admin brand indigo, cream = admin canvas.
        navy: "#1f2233",
        steel: "#667eea",
        cream: "#f4f5fa",
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      fontFamily: {
        // Whole site uses the admin panel's system sans (Segoe UI stack).
        sans: ['"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
        jost: ['"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
        display: ['"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
