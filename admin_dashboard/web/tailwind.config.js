/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          card: '#161922',
          elevated: '#1c2030',
          border: '#2a2f42',
        },
        accent: {
          DEFAULT: '#7c5cff',
          soft: '#9b82ff',
          glow: 'rgba(124, 92, 255, 0.35)',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#8b93a7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(124, 92, 255, 0.15)',
        card: '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
