/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Manufacturing-specific color palette
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Manufacturing status colors
        status: {
          operational: '#10b981', // green-500
          warning: '#f59e0b',     // amber-500
          alarm: '#ef4444',       // red-500
          offline: '#6b7280',     // gray-500
          maintenance: '#8b5cf6', // violet-500
        },
        // Production metrics colors
        metrics: {
          good: '#10b981',        // green-500
          acceptable: '#f59e0b',  // amber-500
          poor: '#ef4444',        // red-500
        },
        // Equipment hierarchy colors
        hierarchy: {
          site: '#0066cc',        // blue-600
          area: '#7c3aed',        // violet-600
          workCenter: '#059669',  // emerald-600
          equipment: '#dc2626',   // red-600
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        // Manufacturing-specific animations
        'pulse-operational': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'blink-alarm': {
          '0%, 50%': { opacity: 1 },
          '51%, 100%': { opacity: 0.3 },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-operational': 'pulse-operational 2s ease-in-out infinite',
        'blink-alarm': 'blink-alarm 1s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      // Manufacturing-specific spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Typography for industrial displays
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
        // Large display sizes for manufacturing dashboards
        'display-sm': ['2rem', { lineHeight: '2.5rem' }],
        'display-md': ['3rem', { lineHeight: '3.5rem' }],
        'display-lg': ['4rem', { lineHeight: '4.5rem' }],
        'display-xl': ['6rem', { lineHeight: '6.5rem' }],
      },
      // Grid layouts for manufacturing dashboards
      gridTemplateColumns: {
        // Dashboard layouts
        'dashboard': 'minmax(250px, 300px) 1fr',
        'dashboard-wide': 'minmax(300px, 350px) 1fr minmax(250px, 300px)',
        // Equipment monitoring layouts
        'equipment-grid': 'repeat(auto-fit, minmax(300px, 1fr))',
        'metrics-grid': 'repeat(auto-fit, minmax(200px, 1fr))',
      },
      // Shadow variations for depth
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 16px -8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 16px -4px rgba(0, 0, 0, 0.15), 0 8px 32px -16px rgba(0, 0, 0, 0.15)',
        'dialog': '0 8px 32px -8px rgba(0, 0, 0, 0.2), 0 16px 64px -32px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
