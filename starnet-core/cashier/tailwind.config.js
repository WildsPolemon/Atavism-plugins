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
      },
      width: { cart: '380px' },
      height: { header: '56px', footer: '52px' },
    },
  },
  plugins: [],
};
