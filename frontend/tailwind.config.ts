import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        /* ── Brand ── */
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        /* ── Surface ── */
        surface: {
          DEFAULT: '#F8FAFC',
          card:    '#FFFFFF',
          hover:   '#F1F5F9',
          border:  '#E2E8F0',
          muted:   '#F8FAFC',
        },
        /* ── Sidebar Navy ── */
        navy: {
          950: '#080C14',
          900: '#0D1117',
          800: '#161B27',
          700: '#1E2433',
          600: '#273040',
          500: '#374151',
          400: '#4B5563',
          text: '#94A3B8',
          subtle: '#64748B',
        },
      },
      boxShadow: {
        'xs':    '0 1px 2px rgb(0 0 0 / 0.04)',
        'sm':    '0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)',
        'card':  '0 1px 4px rgb(0 0 0 / 0.05), 0 1px 2px rgb(0 0 0 / 0.04)',
        'md':    '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg':    '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        'modal': '0 20px 60px -10px rgb(0 0 0 / 0.25), 0 8px 25px -5px rgb(0 0 0 / 0.10)',
        'glow':  '0 0 0 3px rgb(37 99 235 / 0.15)',
      },
      borderRadius: {
        'sm':  '6px',
        'md':  '8px',
        'lg':  '10px',
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.05em' }],
        'xs':  ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        'sm':  ['13px', { lineHeight: '20px' }],
        'base':['14px', { lineHeight: '22px' }],
        'md':  ['15px', { lineHeight: '24px' }],
        'lg':  ['17px', { lineHeight: '26px' }],
        'xl':  ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '34px' }],
      },
    },
  },
  plugins: [],
};
export default config;
