/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'meet-blue': '#1976d2',
        'meet-green': '#34a853',
        'meet-red': '#ea4335',
        'meet-dark': '#202124',
        'meet-gray': '#5f6368',
      },
      fontFamily: {
        'google': ['Google Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}