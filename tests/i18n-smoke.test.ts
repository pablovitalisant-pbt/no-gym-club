import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 1b — i18n smoke', () => {
  it('i18n/config.ts exporta locales con es como default', async () => {
    const mod = await import(resolve(root, 'i18n/config.ts'));
    expect(mod.locales).toEqual(['es', 'en']);
    expect(mod.defaultLocale).toBe('es');
  });

  it('messages/es.json y messages/en.json tienen las mismas keys', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    const esKeys = Object.keys(es).sort();
    const enKeys = Object.keys(en).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it('middleware.ts exporta middleware de next-intl sin crashear', async () => {
    // verify the module resolves — next-intl middleware creates a function
    const mod = await import(resolve(root, 'middleware.ts'));
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('middleware.ts exporta config con matcher no vacio', async () => {
    const mod = await import(resolve(root, 'middleware.ts'));
    expect(mod.config).toBeDefined();
    expect(mod.config.matcher).toBeDefined();
    // next-intl usa patron de exclusion generico, no menciona es/en explicitamente
    const matcher = mod.config.matcher as string[];
    expect(matcher.length).toBeGreaterThan(0);
    // debe excluir api y _next
    expect(matcher[0]).toContain('api');
    expect(matcher[0]).toContain('_next');
  });
});
