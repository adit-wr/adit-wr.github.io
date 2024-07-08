/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif']
      },
      screens: {
        'mbl': { 'max': '500px' },
        'ltp': { 'min': '500px' },
      },
    },
  },
  plugins: [require('tailwind-hamburgers')],
}