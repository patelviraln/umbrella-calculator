/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#f97316',
          orangeDark: '#ea580c',
        },
      },
    },
  },
  plugins: [],
}
