/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef9ff',
          100: '#d9f1ff',
          200: '#bce7ff',
          300: '#8edaff',
          400: '#59c4ff',
          500: '#33a6ff',
          600: '#1a87f5',
          700: '#1270e1',
          800: '#155ab6',
          900: '#174d8f',
          950: '#133057',
        },
        surface: {
          light: '#f0f2f5',
          dark: '#1a1d21',
        },
        chat: {
          sent: '#0084ff',
          received: '#e4e6eb',
          receivedDark: '#2d3139',
        },
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'chat-sent': '0 1px 1px rgba(0, 132, 255, 0.2)',
        'chat-received': '0 1px 1px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
