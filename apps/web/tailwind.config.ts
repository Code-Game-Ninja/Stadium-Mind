import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette: ink black, lime accent, cream canvas (matches landing page)
        ink: {
          DEFAULT: '#191A23',
          800: '#23242F',
          700: '#2E2F3B',
          600: '#3A3B49',
        },
        lime: {
          DEFAULT: '#B9FF66',
          50: '#F4FFE1',
          100: '#E9FFC5',
          200: '#DCFFA3',
          300: '#CDFF83',
          400: '#B9FF66',
          500: '#A3F04A',
          600: '#84CC16',
          700: '#65A30D',
        },
        cream: '#F3F3F3',
        base: {
          975: '#0f172a', // Slate-900 (primary text/headers)
          900: '#1e293b', // Slate-800
          850: '#334155', // Slate-700
          800: '#475569', // Slate-600
          750: '#64748b', // Slate-500
          700: '#94a3b8', // Slate-400
          600: '#cbd5e1', // Slate-300
          500: '#e2e8f0', // Slate-200 (primary borders)
          400: '#f1f5f9', // Slate-100 (light panels)
          300: '#f8fafc', // Slate-50  (main body/canvas bg)
        },
        // Legacy "pitch" accent — remapped to the ink brand so existing
        // components (btn-primary, eyebrows, spinners) pick up the theme.
        pitch: {
          300: '#E9FFC5', // lime-100
          400: '#B9FF66', // lime
          500: '#191A23', // ink (primary actions)
          600: '#23242F', // ink-800 (hover)
          700: '#2E2F3B', // ink-700
        },
        signal: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          blue: '#3b82f6',
          amber: '#f97316',
        },
        theme: {
          slate: '#191A23',      // Outer layout base (ink)
          sidebar: '#191A23',    // Sidebar background (ink)
          teal: '#B9FF66',       // Accent (lime)
          peach: '#e2b49a',      // Custom gradient end
          coral: '#fceada',      // Popularity Rate background
          coralDark: '#f5d6bb',  // Popularity Rate borders
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        glow: '0 0 0 1px rgba(185,255,102,0.35), 0 10px 30px -10px rgba(185,255,102,0.45)',
        lift: '0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(203,213,225,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(203,213,225,0.2) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'dash-flow': {
          to: { strokeDashoffset: '-20' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-in-fast': 'fade-in-fast 0.25s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'live-pulse': 'live-pulse 1.8s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
