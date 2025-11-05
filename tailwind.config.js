/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f5f8',
          100: '#e5ebf1',
          200: '#cdd7e2',
          300: '#b4c3d4',
          400: '#9fb0c5',
          500: '#889bae',
          600: '#71869a',
          700: '#5f7284',
          800: '#4e5d6d',
          900: '#3f4b58',
        },
        secondary: {
          50: '#f3f6f8',
          100: '#e8edf2',
          200: '#d5dee6',
          300: '#c1ceda',
          400: '#aab9c9',
          500: '#94a4b7',
          600: '#7e8fa4',
          700: '#6b7a8c',
          800: '#596573',
          900: '#49545f',
        },
      },
    },
  },
  plugins: [],
}