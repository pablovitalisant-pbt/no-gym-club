import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const css = readFileSync(resolve(root, 'app/globals.css'), 'utf-8');

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

function luminance(channels: string): number {
  const [r, g, b] = channels.split(/\s+/).map(Number).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('Slice v2-20 — contraste AA (≥ 4.5:1)', () => {
  it.each(['dark', 'light'] as const)(
    'texto principal y secundario sobre fondo en %s',
    (theme) => {
      const vars = palette(theme);
      expect(vars.background, `${theme} sin --c-background`).toBeDefined();
      expect(ratio(vars['on-background'], vars.background)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(vars['on-surface-variant'], vars.background)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
