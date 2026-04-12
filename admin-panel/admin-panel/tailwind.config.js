/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",          // blue-600 for a professional accent
        "primary-dark": "#1e40af", // blue-800 darker shade
        sidebar: "#0f172a",         // almost-black navy for sidebar
      },
      boxShadow: {
        // custom shadow that matches the primary color
        "primary/20": "0 10px 15px -3px rgba(37, 99, 235, 0.2), 0 4px 6px -2px rgba(37, 99, 235, 0.1)",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
