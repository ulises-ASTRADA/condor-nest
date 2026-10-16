import type { Config } from 'tailwindcss';
const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  // Spec v2 says ['class', '.dark'], but dark is the :root default and `.light` toggles light,
  // so `dark:` variants are unused. Tokens carry the theme.
  darkMode: ['class', '.dark'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'), surface: c('surface'), 'surface-2': c('surface-2'), border: c('border'),
        fg: c('fg'), 'fg-muted': c('fg-muted'),
        primary: { DEFAULT: c('lime'), fg: c('on-lime') },
        lime: c('lime'), magenta: c('magenta'), violet: c('violet'), cyan: c('cyan'),
        danger: c('danger'), warning: c('warning'), success: c('success'),
      },
      fontFamily: {
        display: ['var(--font-unbounded)', '"Unbounded Fallback Local"', '"Unbounded Fallback Roboto"', 'system-ui', 'sans-serif'],
        sans: ['var(--font-space-grotesk)', '"Space Grotesk Fallback Local"', '"Space Grotesk Fallback Roboto"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', '1rem'], sm: ['0.875rem', '1.25rem'], base: ['1rem', '1.5rem'],
        lg: ['1.125rem', '1.625rem'], xl: ['1.375rem', '1.75rem'], '2xl': ['1.625rem', '2rem'],
        '3xl': ['2rem', '2.375rem'], '4xl': ['2.75rem', '3rem'], '5xl': ['3.75rem', '4rem'],
      },
      borderRadius: { card: 'var(--radius)', pill: '9999px' },
      boxShadow: { 'glow-lime': 'var(--glow-lime)', 'glow-magenta': 'var(--glow-magenta)', 'glow-cyan': 'var(--glow-cyan)' },
      backgroundImage: { 'grad-brand': 'var(--grad-brand)', 'grad-hot': 'var(--grad-hot)' },
      transitionTimingFunction: { 'out-expo': 'cubic-bezier(.16,1,.3,1)', 'in-out-strong': 'cubic-bezier(.65,0,.35,1)', spring: 'cubic-bezier(.34,1.56,.64,1)' },
      transitionDuration: { instant: '100ms', fast: '160ms', base: '240ms', slow: '420ms', xslow: '700ms' },
      spacing: { tap: '2.75rem' },
      maxWidth: { content: '80rem' },
      screens: { xs: '360px' },
      keyframes: {
        shimmer: { '0%': { transform: 'translateX(-120%) skewX(-20deg)' }, '100%': { transform: 'translateX(220%) skewX(-20deg)' } },
        gridDrift: { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '48px 48px' } },
        auroraShift: { '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' }, '50%': { transform: 'translate3d(-6%,4%,0) scale(1.08)' } },
        pulseGlow: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.55' } },
        tick: { '0%': { transform: 'translateY(40%)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        skel: { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s cubic-bezier(.65,0,.35,1) 1 both',
        'grid-drift': 'gridDrift 24s linear infinite',
        aurora: 'auroraShift 18s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 1.6s ease-in-out infinite',
        'pulse-fast': 'pulseGlow 1s ease-in-out infinite',
        tick: 'tick 200ms cubic-bezier(.16,1,.3,1) both',
        skel: 'skel 1.2s linear infinite',
      },
    },
  },
} satisfies Config;
