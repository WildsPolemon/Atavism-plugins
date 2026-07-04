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
          green: '#28A745',
          bg: '#F5F5F5',
          border: '#E0E0E0',
          text: '#333333',
          muted: '#666666',
        },
      },
      width: { cart: '380px', 'product-card': '140px' },
      height: { header: '64px', footer: '60px', 'product-card': '200px', 'sale-btn': '56px' },
      fontSize: { 'price-lg': '18px' },
    },
  },
  plugins: [],
};
