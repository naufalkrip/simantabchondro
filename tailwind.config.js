/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D6001C',
          dark: '#A30015',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(214, 0, 28, 0.06)',
        'red-glow': '0 8px 24px rgba(214, 0, 28, 0.25)',
      },
    },
  },
  plugins: [],
}
