
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0a0a0a', accent: '#ffd700', neon: '#39ff14' }
      },
      boxShadow: { soft: '0 6px 28px rgba(0,0,0,0.12)' }
    },
  },
  plugins: [],
}
