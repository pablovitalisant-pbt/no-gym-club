import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const themePath = resolve(root, 'lib/theme.ts');
const selectorPath = resolve(root, 'components/settings/ThemeSelector.tsx');

function fakeDom() {
  const attrs: Record<string, string> = {};
  const meta = {
    content: '',
    setAttribute(k: string, v: string) {
      if (k === 'content') this.content = v;
    },
  };
  const doc = {
    documentElement: {
      setAttribute(k: string, v: string) {
        attrs[k] = v;
      },
      style: {} as Record<string, string>,
    },
    querySelector: () => meta,
    createElement: () => meta,
    head: { appendChild() {} },
  };
  return { doc, attrs, meta };
}

async function run(stored: string | null, prefersDark: boolean) {
  const { THEME_INIT_SCRIPT } = await import('@/lib/theme');
  const { doc, attrs, meta } = fakeDom();
  const window = {
    localStorage: { getItem: () => stored },
    matchMedia: () => ({ matches: prefersDark }),
  };
  new Function('window', 'document', THEME_INIT_SCRIPT)(window, doc);
  return { attrs, style: doc.documentElement.style, meta };
}

describe('Slice v2-20 — script de tema previo al pintado', () => {
  if (!existsSync(themePath)) {
    it('lib/theme.ts no existe todavía (Fase B — falla por diseño)', () => {
      expect(existsSync(themePath)).toBe(true);
    });
    return;
  }

  it("sin preferencia guardada arranca en oscuro", async () => {
    const { attrs, style } = await run(null, false);
    expect(attrs['data-theme']).toBe('dark');
    expect(style.colorScheme).toBe('dark');
  });

  it('respeta light y dark guardados', async () => {
    expect((await run('light', true)).attrs['data-theme']).toBe('light');
    expect((await run('dark', false)).attrs['data-theme']).toBe('dark');
  });

  it("system resuelve con prefers-color-scheme", async () => {
    expect((await run('system', true)).attrs['data-theme']).toBe('dark');
    expect((await run('system', false)).attrs['data-theme']).toBe('light');
  });

  it('tolera localStorage roto y valores inválidos', async () => {
    const { THEME_INIT_SCRIPT } = await import('@/lib/theme');
    const { doc, attrs } = fakeDom();
    const broken = {
      localStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
      },
      matchMedia: () => ({ matches: false }),
    };
    expect(() =>
      new Function('window', 'document', THEME_INIT_SCRIPT)(broken, doc),
    ).not.toThrow();
    expect(attrs['data-theme']).toBe('dark');
    expect((await run('raro', false)).attrs['data-theme']).toBe('dark');
  });

  it('actualiza theme-color según el tema resuelto', async () => {
    expect((await run('dark', true)).meta.content).toBe('#0a0a0a');
    expect((await run('light', true)).meta.content).toBe('#f7f7f5');
  });

  it('ThemeSelector existe con las 3 opciones y sigue sin montarse en pantallas', () => {
    expect(existsSync(selectorPath)).toBe(true);
    const src = readFileSync(selectorPath, 'utf-8');
    expect(src).toContain("'light'");
    expect(src).toContain("'dark'");
    expect(src).toContain("'system'");
    expect(src).toContain('readTheme');
    expect(src).toContain('applyTheme');

    const layout = readFileSync(resolve(root, 'app/[locale]/layout.tsx'), 'utf-8');
    expect(layout).not.toContain('ThemeSelector');
  });
});
