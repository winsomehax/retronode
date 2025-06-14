/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,js}",
    "./node_modules/tw-elements/dist/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        dark: 'var(--color-dark)',
        card: 'var(--color-card)',
        sidebar: 'var(--color-sidebar)',
        border: 'var(--color-border)',
        body: 'var(--color-body)',
        'body-dim': 'var(--color-body-dim)',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: 'var(--glow-shadow)',
      },
    },
  },
  plugins: [require("tw-elements/dist/plugin.cjs"),
    require('@tailwindcss/line-clamp')
  ],
  darkMode: "class"
}