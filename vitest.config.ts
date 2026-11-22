import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  // tsconfig usa jsx: preserve (Next); sin esto los .tsx fallan con "React is not defined"
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
