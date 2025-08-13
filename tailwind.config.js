/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'provn-bg': 'var(--color-provn-bg)',
        'provn-surface': 'var(--color-provn-surface)',
        'provn-surface-2': 'var(--color-provn-surface-2)',
        'provn-text': 'var(--color-provn-text)',
        'provn-muted': 'var(--color-provn-muted)',
        'provn-border': 'var(--color-provn-border)',
        'provn-accent': 'var(--color-provn-accent)',
        'provn-accent-press': 'var(--color-provn-accent-press)',
        'provn-accent-subtle': 'var(--color-provn-accent-subtle)',
        'provn-success': 'var(--color-provn-success)',
        'provn-warning': 'var(--color-provn-warning)',
        'provn-error': 'var(--color-provn-error)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        chart: {
          '1': 'var(--color-chart-1)',
          '2': 'var(--color-chart-2)',
          '3': 'var(--color-chart-3)',
          '4': 'var(--color-chart-4)',
          '5': 'var(--color-chart-5)',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        headline: ['var(--font-headline)', 'Space Grotesk', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}