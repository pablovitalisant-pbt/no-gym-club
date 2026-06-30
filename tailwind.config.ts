import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#e8570a',
        surface: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
        },
        border: '#2a2a2a',
        text: {
          primary: '#f5f5f5',
          muted: '#888888',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
