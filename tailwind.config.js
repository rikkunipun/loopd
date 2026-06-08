/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#5b5bd6',
        surface: '#f0f2f8',
      }
    }
  },
  plugins: []
}
