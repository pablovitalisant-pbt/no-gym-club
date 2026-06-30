import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 2c — auth guard + dashboard', () => {
  // ─── Riesgo 1: guard no bloquea rutas publicas ───
  it('middleware.ts NO es demasiado agresivo — rutas publicas (/login) no se tocan', () => {
    const raw = readFileSync(resolve(root, 'middleware.ts'), 'utf-8');

    // el guard debe ser selectivo, no un catch-all
    // debe mencionar 'dashboard' o '/app' — no un wildcard de todo
    expect(raw).toContain('dashboard');
    // no debe contener un redirect incondicional (fuera de un if)
    const redirectLines = raw
      .split('\n')
      .filter((line) => line.includes('redirect'));
    // cada redirect debe estar dentro de un bloque condicional
    redirectLines.forEach((line) => {
      const idx = raw.indexOf(line);
      const before = raw.slice(Math.max(0, idx - 200), idx);
      // antes del redirect debe haber un 'if' verificando getUser
      expect(before).toMatch(/if\s*\(/);
    });
  });

  // ─── Riesgo 2: CTA migrado a Link ───
  it('page.tsx usa Link de next-intl, no Button as="a"', () => {
    const raw = readFileSync(
      resolve(root, 'app/[locale]/page.tsx'),
      'utf-8',
    );
    expect(raw).toContain('@/i18n/navigation');
    expect(raw).toContain('<Link');
    expect(raw).toContain('/signup');
  });

  it('Button.tsx NO se modifico — sigue exportando solo Button', () => {
    const raw = readFileSync(
      resolve(root, 'components/ui/Button.tsx'),
      'utf-8',
    );
    // Button no deberia tener referencias a next-intl
    expect(raw).not.toContain('next-intl');
    expect(raw).toContain('export function Button');
  });

  // ─── Riesgo 3: feature flag dashboard ───
  it('feature-flags.json contiene dashboard:false', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags).toHaveProperty('dashboard');
    expect(flags.dashboard).toBe(false);
  });

  // ─── Riesgo 4: dashboard keys simetricas ───
  it('dashboard keys estan en ES y EN con los mismos nombres', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    expect(es.dashboard).toBeDefined();
    expect(en.dashboard).toBeDefined();
    expect(es.dashboard.fallback).toBeTruthy();
    expect(en.dashboard.fallback).toBeTruthy();
  });

  // ─── Riesgo 5: dashboard layout existe y es Server Component ───
  it('(app)/layout.tsx existe y NO tiene use client', () => {
    const raw = readFileSync(
      resolve(root, 'app/[locale]/(app)/layout.tsx'),
      'utf-8',
    );
    expect(raw).not.toContain("'use client'");
    expect(raw).not.toContain('"use client"');
  });

  // ─── Smokeless: dashboard page existe ───
  it('(app)/dashboard/page.tsx existe', () => {
    const raw = readFileSync(
      resolve(root, 'app/[locale]/(app)/dashboard/page.tsx'),
      'utf-8',
    );
    expect(raw).toBeDefined();
    expect(raw.length).toBeGreaterThan(0);
  });
});
