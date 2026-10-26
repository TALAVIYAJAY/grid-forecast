/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grid: {
          900: '#0B0F19',
          850: '#111827',
          800: '#1F2937',
          700: '#374151',
          teal: '#06B6D4',
          amber: '#F59E0B',
          emerald: '#10B981',
          rose: '#F43F5E',
        }
      }
    },
  },
  plugins: [],
}
