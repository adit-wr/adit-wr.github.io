/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif']
      },
      screens: {
        'mbl': { 'max': '900px' },
        'ltp': { 'min': '901px' },
      },
    },
  },
  plugins: [require('tailwind-hamburgers')],
}