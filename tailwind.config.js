/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  darkMode: "class",
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", '"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
      },
      screens: {
        "mbl": { "max": "900px" },
        "ltp": { "min": "901px" },
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      borderColor: {
        DEFAULT: "rgb(var(--line) / <alpha-value>)",
      },
    },
  },
  plugins: [
    require("tailwind-hamburgers"),
    // Only apply hover styles when the user actually has a pointer that can hover (mouse/touchpad),
    // preventing sticky/inverted "hover" colors when tapping buttons on touch devices (Android/iOS)
    plugin(function ({ addVariant }) {
      addVariant("hover", "@media (hover: hover) and (pointer: fine)");
      addVariant("group-hover", "@media (hover: hover) and (pointer: fine) { .group:hover & }");
    }),
  ],
};
