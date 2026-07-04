/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ainur: {
          blue: '#2E7BD6',
          'blue-dark': '#1E5BA6',
          orange: '#FF8C00',
          bg: '#F5F5F5',
          border: '#E0E0E0',
          text: '#333333',
          muted: '#666666',
        },
        surface: { DEFAULT: '#FFFFFF', card: '#FFFFFF', elevated: '#F5F5F5', border: '#E0E0E0' },
        accent: { DEFAULT: '#2E7BD6', soft: '#5A9AE8' },
        success: '#28A745', warning: '#FF8C00', danger: '#DC3545', muted: '#666666',
      },
      boxShadow: { card: '0 2px 8px rgba(0,0,0,0.08)' },
    },
  },
  plugins: [],
};
