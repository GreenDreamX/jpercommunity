/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#09090b',
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(to right, rgb(39 39 42 / 0.4) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(39 39 42 / 0.4) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '48px 48px',
      },
    },
  },
  plugins: [],
}
