import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        /* ── Brand (Indigo — premium SaaS) ── */
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        /* ── Surface ── (kept literal for backwards compat with bg-surface*, etc.) */
        surface: {
          DEFAULT: '#F8FAFC',
          card:    '#FFFFFF',
          hover:   '#F1F5F9',
          border:  '#E5E8ED',
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
      backgroundImage: {
        'page-glow':
          'radial-gradient(1200px 600px at 100% -10%, rgba(99,102,241,0.06), transparent 50%), ' +
          'radial-gradient(800px 400px at -10% 110%, rgba(16,185,129,0.04), transparent 50%)',
        'sidebar-glow':
          'linear-gradient(180deg, #0F1320 0%, #0A0E18 100%)',
        'shimmer':
          'linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.18) 50%, transparent 100%)',
      },
      boxShadow: {
        'xs':    '0 1px 2px rgb(15 23 42 / 0.04)',
        'sm':    '0 1px 0 rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.04)',
        'card':  '0 1px 0 rgb(15 23 42 / 0.04), 0 4px 12px -2px rgb(15 23 42 / 0.05)',
        'md':    '0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        'lg':    '0 10px 15px -3px rgb(15 23 42 / 0.07), 0 4px 6px -4px rgb(15 23 42 / 0.04)',
        'pop':   '0 4px 8px -2px rgb(15 23 42 / 0.06), 0 16px 32px -8px rgb(15 23 42 / 0.10)',
        'modal': '0 20px 60px -10px rgb(15 23 42 / 0.25), 0 8px 25px -5px rgb(15 23 42 / 0.10)',
        'glow':  '0 0 0 3px rgb(99 102 241 / 0.15)',
        'glow-lg': '0 0 0 1px rgb(99 102 241 / 0.18), 0 8px 24px -8px rgb(99 102 241 / 0.32)',
        'inner-soft': 'inset 0 0 0 1px rgb(255 255 255 / 0.05)',
      },
      borderRadius: {
        'sm':  '6px',
        'md':  '8px',
        'lg':  '10px',
        'xl':  '12px',
        '2xl': '14px',
        '3xl': '20px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
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
        '3xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
      },
      keyframes: {
        'fade-in':   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up':   { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'shimmer':   { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        'pulse-glow':{ '0%, 100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
      animation: {
        'fade-in':    'fade-in 200ms cubic-bezier(0.16,1,0.3,1)',
        'fade-up':    'fade-up 250ms cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':    'shimmer 1.6s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
