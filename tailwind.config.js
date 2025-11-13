/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4f46e5',
        'brand-secondary': '#7c3aed',
        'brand-light': '#6366f1',
        'brand-dark': '#312e81',
        'background': '#111827',
        'surface': '#1f2937',
        'text-primary': '#f9fafb',
        'text-secondary': ' #d1d5db',
        'accent': '#a78bfa',
      },
      fontFamily: {
        'vazir': ['Vazirmatn', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
