/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        safety: {
          orange: '#FF5722',
          red: '#E53935',
          green: '#43A047',
          amber: '#FFB300',
          dark: '#0F172A',
          navy: '#1E293B'
        }
      }
    },
  },
  plugins: [],
}
