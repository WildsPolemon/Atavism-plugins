/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pos: { bg: '#0a0e1a', panel: '#111827', card: '#1a2236', border: '#2d3a52', accent: '#3b82f6', success: '#10b981', danger: '#ef4444' },
      },
    },
  },
  plugins: [],
};
