import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { cn } from '../lib/utils';
import { Button } from '../components/shadcn/button';

const root = resolve(__dirname, '..');
const css = readFileSync(resolve(root, 'app/globals.css'), 'utf-8');
const flags = JSON.parse(readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'));

function palette(theme: 'light' | 'dark'): Record<string, string> {
  const m = css.match(new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`));
  const vars: Record<string, string> = {};
  for (const line of (m?.[1] ?? '').split(';')) {
    const decl = line.match(/--c-([a-z0-9-]+):\s*([\d ]+)/);
    if (decl) vars[decl[1]] = decl[2].trim();
  }
  return vars;
}

// Snapshot literal de la paleta previa al slice: si cambia un valor, algo visible cambió.
const EXISTING_DARK = {
  accent: '232 87 10',
  border: '42 42 42',
  'text-outline': '150 150 150',
  'text-primary': '245 245 245',
  'text-muted': '136 136 136',
  surface: '17 17 17',
  'surface-900': '10 10 10',
  'surface-800': '17 17 17',
  'surface-700': '26 26 26',
  background: '10 10 10',
  'on-background': '245 245 245',
  'on-surface': '245 245 245',
  'on-surface-variant': '136 136 136',
  primary: '232 87 10',
  'on-primary': '255 255 255',
  'primary-container': '255 138 60',
  'on-primary-container': '26 5 0',
  outline: '42 42 42',
  'outline-variant': '51 51 51',
  error: '255 68 68',
  'error-container': '147 0 10',
  'on-error': '255 255 255',
  'on-error-container': '255 218 214',
  success: '74 222 128',
};

const EXISTING_LIGHT = {
  accent: '194 65 12',
  border: '212 212 208',
  'text-outline': '100 100 100',
  'text-primary': '17 17 17',
  'text-muted': '85 85 85',
  surface: '255 255 255',
  'surface-900': '239 239 236',
  'surface-800': '255 255 255',
  'surface-700': '239 239 236',
  background: '247 247 245',
  'on-background': '17 17 17',
  'on-surface': '17 17 17',
  'on-surface-variant': '85 85 85',
  primary: '194 65 12',
  'on-primary': '255 255 255',
  'primary-container': '194 65 12',
  'on-primary-container': '26 5 0',
  outline: '212 212 208',
  'outline-variant': '226 226 222',
  error: '185 28 28',
  'error-container': '254 226 226',
  'on-error': '255 255 255',
  'on-error-container': '127 29 29',
  success: '22 163 74',
};

// Tokens nuevos de shadcn, mapeados a la paleta existente (sin inventar colores).
const NEW_DARK = {
  foreground: '245 245 245',
  card: '17 17 17',
  'card-foreground': '245 245 245',
  popover: '17 17 17',
  'popover-foreground': '245 245 245',
  'primary-foreground': '255 255 255',
  secondary: '26 26 26',
  'secondary-foreground': '245 245 245',
  muted: '26 26 26',
  'muted-foreground': '136 136 136',
  'accent-foreground': '245 245 245',
  destructive: '255 68 68',
  'destructive-foreground': '255 255 255',
  input: '42 42 42',
  ring: '232 87 10',
};

const NEW_LIGHT = {
  foreground: '17 17 17',
  card: '255 255 255',
  'card-foreground': '17 17 17',
  popover: '255 255 255',
  'popover-foreground': '17 17 17',
  'primary-foreground': '255 255 255',
  secondary: '239 239 236',
  'secondary-foreground': '17 17 17',
  muted: '239 239 236',
  'muted-foreground': '85 85 85',
  'accent-foreground': '17 17 17',
  destructive: '185 28 28',
  'destructive-foreground': '255 255 255',
  input: '212 212 208',
  ring: '194 65 12',
};

describe('v2-25 — base shadcn/ui sin cambio visual', () => {
  it('no cambia ningun token visible existente (oscuro)', () => {
    const dark = palette('dark');
    for (const [key, value] of Object.entries(EXISTING_DARK)) {
      expect(dark[key], `--c-${key} (dark)`).toBe(value);
    }
  });

  it('no cambia ningun token visible existente (claro)', () => {
    const light = palette('light');
    for (const [key, value] of Object.entries(EXISTING_LIGHT)) {
      expect(light[key], `--c-${key} (light)`).toBe(value);
    }
  });

  it('define los tokens nuevos de shadcn en ambos temas', () => {
    const dark = palette('dark');
    const light = palette('light');
    for (const [key, value] of Object.entries(NEW_DARK)) {
      expect(dark[key], `--c-${key} (dark)`).toBe(value);
    }
    for (const [key, value] of Object.entries(NEW_LIGHT)) {
      expect(light[key], `--c-${key} (light)`).toBe(value);
    }
  });

  it('tailwind mapea los tokens nuevos al formato rgb(var(--c-*))', async () => {
    const mod = await import(resolve(root, 'tailwind.config.ts'));
    const cfg = mod.default ?? mod;
    const colors = cfg.theme?.extend?.colors as Record<string, unknown>;
    for (const key of [...Object.keys(NEW_DARK), 'border', 'background', 'primary', 'accent']) {
      expect(colors[key], `color ${key}`).toMatch(/^rgb\(var\(--c-[a-z0-9-]+\) \/ <alpha-value>\)$/);
    }
    // accent se mantiene naranja (clase del proyecto); shadcn no la usa como hover en este slice.
    expect(colors.accent).toBe('rgb(var(--c-accent) / <alpha-value>)');
  });

  it('el flag shadcn_ui existe y es booleano', () => {
    expect(flags).toHaveProperty('shadcn_ui');
    expect(typeof flags.shadcn_ui).toBe('boolean');
  });
});

describe('v2-25 — cn() y button de shadcn', () => {
  it('cn mezcla clases y resuelve conflictos con tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-accent', false && 'hidden', undefined, 'p-1')).toBe('text-accent p-1');
  });

  it('button aplica base, variante, tamano y className propio', () => {
    const html = renderToStaticMarkup(<Button variant="destructive" className="mi-clase">Hola</Button>);
    expect(html).toContain('bg-destructive');
    expect(html).toContain('h-10');
    expect(html).toContain('mi-clase');
    expect(html).toContain('Hola');
    expect(html).toContain('type="button"');
  });

  it('className del consumidor gana conflictos de tailwind', () => {
    const html = renderToStaticMarkup(<Button className="px-10">Hola</Button>);
    expect(html).toContain('px-10');
    expect(html).not.toContain('px-4');
  });
});
