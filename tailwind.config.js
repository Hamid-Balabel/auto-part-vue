/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover-rgb) / <alpha-value>)',
          active: 'rgb(var(--color-primary-active-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-primary-soft-rgb) / <alpha-value>)',
          contrast: 'rgb(var(--color-primary-contrast-rgb) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
          hover: 'rgb(var(--color-secondary-hover-rgb) / <alpha-value>)',
          active: 'rgb(var(--color-secondary-active-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-secondary-soft-rgb) / <alpha-value>)',
          contrast: 'rgb(var(--color-secondary-contrast-rgb) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        background: 'rgb(var(--color-background-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--color-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-success-soft-rgb) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-warning-soft-rgb) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
          hover: 'rgb(var(--color-danger-hover-rgb) / <alpha-value>)',
          active: 'rgb(var(--color-danger-active-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft-rgb) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-info-soft-rgb) / <alpha-value>)',
        },
        neutral: {
          DEFAULT: 'rgb(var(--color-neutral-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-neutral-soft-rgb) / <alpha-value>)',
        },
        ink: '#0f172a',
        metal: '#334155',
        signal: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        elevated: 'var(--shadow-elevated)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
