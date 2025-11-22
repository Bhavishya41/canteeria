/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#F4F4F4',
        'foreground': '#000000',
        'primary': '#FFD700', // Gold/Yellow
        'tertiary': '#00FFFF',
        'secondary': '#FFFFFF',
        'accent': '#FF0000', // A bright red for accent
      },
    },
  },
  plugins: [],
}