import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const flagsPath = resolve(root, 'config/feature-flags.json');

function readFlags(): Record<string, boolean> {
  return JSON.parse(readFileSync(flagsPath, 'utf-8'));
}

function writeFlags(flags: Record<string, boolean>) {
  writeFileSync(flagsPath, JSON.stringify(flags, null, 2));
}

// preservar estado original y restaurar al terminar
const originalFlags = readFileSync(flagsPath, 'utf-8');

afterEach(() => {
  writeFileSync(flagsPath, originalFlags);
});

describe('Slice 1c — landing feature flag', () => {
  it('getFlag() devuelve false para flag inexistente', async () => {
    const { getFlag } = await import('@/lib/flags');
    expect(getFlag('flag_que_no_existe')).toBe(false);
  });

  it('getFlag() devuelve true cuando el flag esta en true', async () => {
    writeFlags({ landing_page: true });
    // re-importar para evitar cache de modulo
    const { getFlag } = await import('@/lib/flags?update=' + Date.now());
    expect(getFlag('landing_page')).toBe(true);
  });

  it('getFlag() devuelve false cuando el flag esta en false', async () => {
    writeFlags({ landing_page: false });
    const { getFlag } = await import('@/lib/flags?update=' + Date.now());
    expect(getFlag('landing_page')).toBe(false);
  });

  it('getFlag() es deterministico — misma llamada mismo resultado', async () => {
    writeFlags({ landing_page: true });
    const { getFlag } = await import('@/lib/flags?update=' + Date.now());
    const a = getFlag('landing_page');
    const b = getFlag('landing_page');
    expect(a).toBe(b);
  });

  it('Button.tsx exporta componente renderizable (no crashea al importar)', async () => {
    // verifica que el componente existe y es una funcion
    const mod = await import('@/components/ui/Button');
    expect(mod.Button).toBeDefined();
    expect(typeof mod.Button).toBe('function');
  });

  it('landing tiene todas las keys en ambos idiomas', () => {
    const es = JSON.parse(readFileSync(resolve(root, 'messages/es.json'), 'utf-8'));
    const en = JSON.parse(readFileSync(resolve(root, 'messages/en.json'), 'utf-8'));

    const requiredKeys = [
      'landing.hero',
      'landing.tagline',
      'landing.cta',
      'landing.manifesto',
      'landing.fallback',
    ];

    requiredKeys.forEach((key) => {
      const parts = key.split('.');
      // navegación segura: landing.hero → es.landing.hero
      let esVal: unknown = es;
      let enVal: unknown = en;
      for (const part of parts) {
        esVal = (esVal as Record<string, unknown>)?.[part];
        enVal = (enVal as Record<string, unknown>)?.[part];
      }
      expect(esVal, `falta key "${key}" en es.json`).toBeDefined();
      expect(esVal, `key "${key}" en es.json esta vacia`).toBeTruthy();
      expect(enVal, `falta key "${key}" en en.json`).toBeDefined();
      expect(enVal, `key "${key}" en en.json esta vacia`).toBeTruthy();
    });
  });

  it('feature-flags.json es JSON valido y contiene landing_page', () => {
    const flags = readFlags();
    expect(flags).toHaveProperty('landing_page');
    expect(typeof flags.landing_page).toBe('boolean');
  });

  it('page.tsx NO tiene use client — es Server Component (evita hydration mismatch)', () => {
    const raw = readFileSync(
      resolve(root, 'app/[locale]/page.tsx'),
      'utf-8',
    );
    // si tiene 'use client', getFlag() correria en el browser sin fs → hydration error
    expect(raw).not.toContain("'use client'");
    expect(raw).not.toContain('"use client"');
  });
});
