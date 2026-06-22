/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'poke-red': '#EE3B33',
        'poke-blue': '#3B7BBD',
        'poke-black': '#444444',
        'poke-pink': '#F4A6B8',
        'poke-yellow': '#F5C542',
        'poke-purple': '#8B5CF6',
        'poke-dark': '#1E1E2E',
        'poke-light': '#F0F4F8',
        'poke-gold': '#FFD700',
      },
      fontFamily: {
        'game': ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        glow: { '0%': { boxShadow: '0 0 5px rgba(255,215,0,0.3)' }, '100%': { boxShadow: '0 0 20px rgba(255,215,0,0.7)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
