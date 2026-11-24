import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Cada token vive en app/globals.css (paletas clara y oscura)
      colors: {
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--c-text-primary) / <alpha-value>)',
          muted: 'rgb(var(--c-text-muted) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          900: 'rgb(var(--c-surface-900) / <alpha-value>)',
          800: 'rgb(var(--c-surface-800) / <alpha-value>)',
          700: 'rgb(var(--c-surface-700) / <alpha-value>)',
        },
        background: 'rgb(var(--c-background) / <alpha-value>)',
        'on-background': 'rgb(var(--c-on-background) / <alpha-value>)',
        'on-surface': 'rgb(var(--c-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--c-on-surface-variant) / <alpha-value>)',
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--c-on-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--c-primary-container) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--c-on-primary-container) / <alpha-value>)',
        outline: 'rgb(var(--c-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--c-outline-variant) / <alpha-value>)',
        error: 'rgb(var(--c-error) / <alpha-value>)',
        'error-container': 'rgb(var(--c-error-container) / <alpha-value>)',
        'on-error': 'rgb(var(--c-on-error) / <alpha-value>)',
        'on-error-container': 'rgb(var(--c-on-error-container) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
        rest: {
          bg: 'rgb(var(--c-rest-bg) / <alpha-value>)',
          fg: 'rgb(var(--c-rest-fg) / <alpha-value>)',
        },
        control: {
          bg: 'rgb(var(--c-control-bg) / <alpha-value>)',
          fg: 'rgb(var(--c-control-fg) / <alpha-value>)',
        },
        // Tokens de shadcn/ui (mismos colores que la paleta de arriba)
        foreground: 'rgb(var(--c-foreground) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--c-card-foreground) / <alpha-value>)',
        popover: 'rgb(var(--c-popover) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--c-popover-foreground) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--c-primary-foreground) / <alpha-value>)',
        secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
        'secondary-foreground': 'rgb(var(--c-secondary-foreground) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--c-muted-foreground) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--c-accent-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--c-destructive) / <alpha-value>)',
        'destructive-foreground': 'rgb(var(--c-destructive-foreground) / <alpha-value>)',
        input: 'rgb(var(--c-input) / <alpha-value>)',
        ring: 'rgb(var(--c-ring) / <alpha-value>)',
      },
      // --radius queda disponible para futuros componentes shadcn; no se remapea
      // rounded-lg/sm/md para no alterar el radius visible de pantallas existentes.
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
        'body-lg': ['20px', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['18px', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'label-bold': ['16px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '800' }],
        'mono-data': ['16px', { lineHeight: '1.2', letterSpacing: '0em', fontWeight: '600' }],
        'label-sm': ['15px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};

export default config;
