/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        avinity: {
          dark: '#015A66',
          cyan: '#1FA9B3',
          blue: '#CFE6F7',
          ink: '#0A2A2F',
          bg: '#F5F9FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
