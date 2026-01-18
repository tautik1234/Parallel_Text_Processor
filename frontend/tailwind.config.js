/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // This ensures it listens to the HTML class, not your laptop settings
  theme: {
    extend: {},
  },
  plugins: [],
}