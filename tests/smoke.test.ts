import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 1a — scaffold smoke', () => {
  it('package.json es JSON parseable con dependencias minimas', () => {
    const raw = readFileSync(resolve(root, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);

    expect(pkg.name).toBe('no-gym-club');
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.dependencies.next).toBeDefined();
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.devDependencies.typescript).toBeDefined();
    expect(pkg.devDependencies.tailwindcss).toBeDefined();
  });

  it('tsconfig.json es JSON parseable con strict mode', () => {
    const raw = readFileSync(resolve(root, 'tsconfig.json'), 'utf-8');
    const cfg = JSON.parse(raw);

    expect(cfg.compilerOptions.strict).toBe(true);
    expect(cfg.compilerOptions.paths?.['@/*']).toEqual(['./*']);
  });

  it('.gitignore contiene entradas minimas de seguridad', () => {
    const raw = readFileSync(resolve(root, '.gitignore'), 'utf-8');

    expect(raw).toContain('.env');
    expect(raw).toContain('node_modules');
    expect(raw).toContain('.next');
  });

  it('tailwind.config.ts exporta los colores del sistema de diseño', async () => {
    const mod = await import(resolve(root, 'tailwind.config.ts'));
    const cfg = mod.default ?? mod;

    const colors = cfg.theme?.extend?.colors;
    expect(colors?.accent).toBe('#e8570a');
    expect(colors?.surface?.['900']).toBe('#0a0a0a');
  });
});
