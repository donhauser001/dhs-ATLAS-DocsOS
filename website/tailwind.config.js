/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深邃的墨色系
        ink: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b8c1',
          400: '#91919f',
          500: '#737384',
          600: '#5d5d6c',
          700: '#4c4c58',
          800: '#41414b',
          900: '#393941',
          950: '#18181b',
        },
        // 优雅的金色点缀
        gold: {
          50: '#fdfcf8',
          100: '#faf6e8',
          200: '#f3eacc',
          300: '#e9d8a6',
          400: '#ddc16f',
          500: '#d4a84a',
          600: '#c08b3d',
          700: '#a06c34',
          800: '#835630',
          900: '#6c472a',
          950: '#3d2515',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-in': 'slideIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

