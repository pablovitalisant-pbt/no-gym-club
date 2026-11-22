import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const css = readFileSync(resolve(root, 'app/globals.css'), 'utf-8');
const layout = readFileSync(resolve(root, 'app/[locale]/layout.tsx'), 'utf-8');

const VAR_RE = /^rgb\(var\(--c-[a-z0-9-]+\) \/ <alpha-value>\)$/;

function leaves(obj: unknown, out: [string, string][] = []): [string, string][] {
  if (typeof obj === 'string') return out;
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') out.push([k, v]);
      else leaves(v, out);
    }
  }
  return out;
}

function palette(theme: 'light' | 'dark'): Record<string, string> {
  const m = css.match(new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`));
  if (!m) return {};
  const vars: Record<string, string> = {};
  for (const line of m[1].split(';')) {
    const decl = line.match(/--c-([a-z0-9-]+):\s*([\d ]+)/);
    if (decl) vars[decl[1]] = decl[2].trim();
  }
  return vars;
}

describe('Slice v2-20 — tokens de color como variables CSS', () => {
  it('todo color de tailwind.config usa rgb(var(--c-*) / <alpha-value>)', async () => {
    const mod = await import(resolve(root, 'tailwind.config.ts'));
    const cfg = mod.default ?? mod;
    const colors = leaves(cfg.theme?.extend?.colors);
    expect(colors.length).toBeGreaterThan(10);
    const bad = colors.filter(([, v]) => !VAR_RE.test(v));
    expect(bad).toEqual([]);
  });

  it('ambas paletas definen todos los tokens usados por tailwind', async () => {
    const mod = await import(resolve(root, 'tailwind.config.ts'));
    const cfg = mod.default ?? mod;
    const used = new Set<string>();
    for (const [, v] of leaves(cfg.theme?.extend?.colors)) {
      const name = v.match(/--c-([a-z0-9-]+)/)?.[1];
      if (name) used.add(name);
    }
    for (const theme of ['dark', 'light'] as const) {
      const vars = palette(theme);
      const missing = [...used].filter((name) => !vars[name]);
      expect(missing, `${theme} sin tokens`).toEqual([]);
    }
  });

  it('la paleta clara entra en el rango pedido (fondo, texto, acento)', () => {
    const light = palette('light');
    const rgb = (name: string) => light[name].split(' ').join(',');
    expect(rgb('background')).toBe('247,247,245');
    expect(rgb('text-primary')).toBe('17,17,17');
    expect(rgb('text-muted')).toBe('85,85,85');
    expect(rgb('primary')).toBe('194,65,12');
  });

  it('no quedan hex sueltos en los archivos del contrato', () => {
    const files = [
      'app/globals.css',
      'app/[locale]/(app)/weekly-report/sections.tsx',
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
      'components/session/CircularTimer.tsx',
    ];
    for (const file of files) {
      const src = readFileSync(resolve(root, file), 'utf-8');
      expect(src.match(/#[0-9a-fA-F]{3,8}/g) ?? [], `${file} conserva hex`).toEqual([]);
    }
  });

  it('layout monta el script de tema antes de pintar', () => {
    expect(layout).toContain('THEME_INIT_SCRIPT');
    expect(layout).toContain('suppressHydrationWarning');
    expect(layout).toContain("media: '(prefers-color-scheme:");
  });
});
