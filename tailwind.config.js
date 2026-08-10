/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        segov: {
          azul: '#0b3c5d',
          azul2: '#12567f',
          verde: '#1b9e5a',
          dourado: '#e8b923',
          vermelho: '#c0392b',
          cinza: '#f4f6f8',
          borda: '#dde3ea',
          texto: '#22313f',
        }
      }
    },
  },
  plugins: [],
}
