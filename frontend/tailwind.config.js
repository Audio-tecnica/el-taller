/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores del logo El Taller
        primary: '#D4AF37',        // Oro del logo
        'primary-dark': '#B8941F',  // Oro oscuro
        'primary-light': '#F0E68C', // Oro claro
        secondary: '#1a1a1a',       // Negro del logo
        'secondary-light': '#2d2d2d',
        accent: '#D4AF37',          // Oro para acentos
        
        // Estados
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        
        // Estados de Mesa (adaptados al tema)
        'mesa-disponible': '#10b981',
        'mesa-ocupada': '#ef4444',
        'mesa-reservada': '#f59e0b',
        'mesa-por-pagar': '#D4AF37',
        
        // Backgrounds
        'bg-dark': '#0a0a0a',
        'bg-secondary': '#1a1a1a',
        'bg-card': '#2d2d2d',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'], // Para títulos (similar al logo)
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
