import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
// Kratos — Tailwind config
// Extiende el theme con los tokens semánticos definidos en design-tokens.css.
// Los componentes deben usar clases semánticas (bg-primary, text-muted,
// rounded-card, shadow-card, font-display, font-body) — no valores raw.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised:  'var(--color-surface-raised)',
          sunken:  'var(--color-surface-sunken)',
          muted:   'var(--color-surface-muted)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover:   'var(--color-primary-hover)',
          active:  'var(--color-primary-active)',
          soft:    'var(--color-primary-soft)',
          'soft-text': 'var(--color-primary-soft-text)',
          fg:      'var(--color-text-on-primary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          soft:    'var(--color-accent-soft)',
          'soft-text': 'var(--color-accent-soft-text)',
          fg:      'var(--color-text-on-accent)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          soft:    'var(--color-success-soft)',
          text:    'var(--color-success-text)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft:    'var(--color-warning-soft)',
          text:    'var(--color-warning-text)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft:    'var(--color-danger-soft)',
          text:    'var(--color-danger-text)',
        },
        fg: {
          DEFAULT:   'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
          disabled:  'var(--color-text-disabled)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
          focus:   'var(--color-border-focus)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
      fontSize: {
        xs:   ['var(--text-xs)',   { lineHeight: 'var(--leading-normal)' }],
        sm:   ['var(--text-sm)',   { lineHeight: 'var(--leading-normal)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        lg:   ['var(--text-lg)',   { lineHeight: 'var(--leading-snug)' }],
        xl:   ['var(--text-xl)',   { lineHeight: 'var(--leading-snug)' }],
        '2xl':['var(--text-2xl)',  { lineHeight: 'var(--leading-tight)' }],
        '3xl':['var(--text-3xl)',  { lineHeight: 'var(--leading-tight)' }],
        '4xl':['var(--text-4xl)',  { lineHeight: 'var(--leading-tight)' }],
      },
      borderRadius: {
        xs:      'var(--radius-xs)',
        sm:      'var(--radius-sm)',
        md:      'var(--radius-md)',
        lg:      'var(--radius-lg)',
        xl:      'var(--radius-xl)',
        '2xl':   'var(--radius-2xl)',
        pill:    'var(--radius-pill)',
        card:    'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      boxShadow: {
        xs:    'var(--shadow-xs)',
        sm:    'var(--shadow-sm)',
        md:    'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        xl:    'var(--shadow-xl)',
        card:  'var(--shadow-card)',
        focus: 'var(--shadow-focus)',
      },
      ringColor: {
        focus: 'var(--color-focus-ring)',
      },
      transitionDuration: {
        instant: '80ms',
        fast:    '140ms',
        base:    '220ms',
        slow:    '320ms',
      },
      transitionTimingFunction: {
        out:    'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [forms({ strategy: 'class' })],
};
