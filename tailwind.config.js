/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#D4A574',
        card: '#E8DDD0',
        muted: '#F5EFE9',
        'text-dark': '#1A1410',
        'text-secondary': '#6B6560',
        success: '#6B8E23',
        error: '#B42C1F',
        pro: '#A0826D',
        elite: '#C9A961',
        legend: '#D4A574',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
