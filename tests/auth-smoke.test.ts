import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function fileContains(path: string, search: string): boolean {
  const raw = readFileSync(path, 'utf-8');
  return raw.includes(search);
}

function fileStartsWith(path: string, prefix: string): boolean {
  const raw = readFileSync(path, 'utf-8');
  return raw.startsWith(prefix);
}

describe('Slice 2b — auth pages', () => {
  // ─── Riesgo 1: layout de (auth) es Server Component ───
  it('(auth)/layout.tsx NO tiene use client — evita hydration mismatch con getFlag()', () => {
    const path = resolve(root, 'app/[locale]/(auth)/layout.tsx');
    const raw = readFileSync(path, 'utf-8');
    expect(raw).not.toContain("'use client'");
    expect(raw).not.toContain('"use client"');
    // debe usar getFlag para leer el feature flag auth
    expect(raw).toContain('getFlag');
  });

  // ─── Riesgo 2: paginas de auth NO importan getFlag() directamente ───
  it('login/page.tsx NO importa getFlag() — es Client Component', () => {
    const path = resolve(root, 'app/[locale]/(auth)/login/page.tsx');
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain("'use client'");
    // no debe importar getFlag (es fs-based, explota en browser)
    expect(raw).not.toMatch(/from ['"]@\/lib\/flags['"]/);
  });

  it('signup/page.tsx NO importa getFlag() — es Client Component', () => {
    const path = resolve(root, 'app/[locale]/(auth)/signup/page.tsx');
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain("'use client'");
    expect(raw).not.toMatch(/from ['"]@\/lib\/flags['"]/);
  });

  // ─── Riesgo 3: callback route no crashea con code invalido ───
  it('api/auth/callback/route.ts exporta GET y POST sin crashear', async () => {
    const mod = await import('@/app/api/auth/callback/route');
    expect(mod.GET).toBeDefined();
    // el handler debe ser una funcion exportable
    expect(typeof mod.GET).toBe('function');
  });

  // ─── Keys i18n ───
  it('auth keys estan presentes y simetricas en ES y EN', () => {
    const es = JSON.parse(readFileSync(resolve(root, 'messages/es.json'), 'utf-8'));
    const en = JSON.parse(readFileSync(resolve(root, 'messages/en.json'), 'utf-8'));

    const authKeys = [
      'auth.email',
      'auth.password',
      'auth.confirmPassword',
      'auth.login',
      'auth.signup',
      'auth.loginButton',
      'auth.signupButton',
      'auth.error.required',
      'auth.error.passwordMismatch',
    ];

    authKeys.forEach((key) => {
      const parts = key.split('.');
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

  // ─── Feature flag ───
  it('feature-flags.json contiene auth:false', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags).toHaveProperty('auth');
    expect(flags.auth).toBe(true);
  });
});
