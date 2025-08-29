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
      },
      spacing: {
        'safe-top': 'max(env(safe-area-inset-top, 0px), 44px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
      height: {
        'safe-top': 'max(env(safe-area-inset-top, 0px), 44px)',
      },
      paddingTop: {
        'safe': 'max(env(safe-area-inset-top, 0px), 44px)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
