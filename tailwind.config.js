/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        racing: {
          red: '#E10600',
          crimson: '#B00000',
          gold: '#F5B301',
          asphalt: '#0A0A0A',
          smoke: '#1A1A1A',
          steel: '#2A2A2A',
          bone: '#F5F5F5',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(225,6,0,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(225,6,0,0.8)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'slide-stripe': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'slide-stripe': 'slide-stripe 3s linear infinite',
      },
    },
  },
  plugins: [],
};
