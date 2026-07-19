/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Phone in landscape: wide but vertically cramped. Desktop stays
        // unaffected because of the max-height condition.
        shortwide: { raw: '(orientation: landscape) and (max-height: 520px)' },
      },
      colors: {
        base: 'var(--c-base)',
        surface: 'var(--c-surface)',
        surface2: 'var(--c-surface2)',
        ink: 'var(--c-ink)',
        muted: 'var(--c-muted)',
        line: 'var(--c-line)',
        pop: {
          pink: '#ff4f9a',
          orange: '#ff8c42',
          yellow: '#ffd23f',
          violet: '#8b5cf6',
          teal: '#10d9a5',
          sky: '#38bdf8',
          rose: '#f43f5e',
        },
      },
      boxShadow: {
        card: '0 8px 24px -10px rgba(70, 30, 140, 0.35)',
        pop: '0 4px 0 rgba(40, 20, 80, 0.25)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        popin: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '70%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 2.4s ease-in-out infinite',
        popin: 'popin 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.4) both',
      },
    },
  },
  plugins: [],
};
