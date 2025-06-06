/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5ccedf',      // Azul municipalidad
        secondary: '#A4C9F5',   // Azul municipalidad 2
        warning: '#d97706',     // Amarillo
        error: '#dc2626',       // Rojo
        success: '#059669',     // Verde
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
