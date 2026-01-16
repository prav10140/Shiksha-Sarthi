/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        glass: "rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
}
