/** @type {import('tailwindcss').Config} */
const scrollbarPlugin = require("tailwind-scrollbar");

module.exports = {
  content: ["./src/**/*.{html,js,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#B92025",
      },
    },
  },
  plugins: [scrollbarPlugin({ nocompatible: true })],
};
