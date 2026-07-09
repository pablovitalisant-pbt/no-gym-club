import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Original palette (backward compatible)
        accent: '#e8570a',
        border: '#2a2a2a',
        text: {
          primary: '#f5f5f5',
          muted: '#888888',
        },
        surface: {
          DEFAULT: '#111111',
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
        },
        // Semantic aliases (Stitch-compatible naming, corrected values)
        background: '#0a0a0a',
        'on-background': '#f5f5f5',
        'on-surface': '#f5f5f5',
        'on-surface-variant': '#888888',
        primary: '#e8570a',
        'on-primary': '#ffffff',
        'primary-container': '#ff8a3c',
        'on-primary-container': '#1a0500',
        outline: '#2a2a2a',
        'outline-variant': '#333333',
        error: '#ff4444',
        'error-container': '#93000a',
        'on-error': '#ffffff',
        'on-error-container': '#ffdad6',
      },
      spacing: {
        'margin-desktop': '40px',
        'margin-mobile': '16px',
        gutter: '16px',
        xs: '8px',
        base: '4px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-lg-mobile': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif'],
        'label-bold': ['Inter', 'sans-serif'],
        'display-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'mono-data': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['64px', { lineHeight: '1', letterSpacing: '-0.05em', fontWeight: '900' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'label-bold': ['14px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '800' }],
        'mono-data': ['14px', { lineHeight: '1', letterSpacing: '0em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '1', letterSpacing: '0.02em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};

export default config;
