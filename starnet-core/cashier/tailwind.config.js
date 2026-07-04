/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pos: {
          bg: '#f0f2f5',
          panel: '#ffffff',
          border: '#e5e7eb',
          header: '#1db8c8',
          accent: '#22c55e',
          text: '#1f2937',
          muted: '#6b7280',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
};
