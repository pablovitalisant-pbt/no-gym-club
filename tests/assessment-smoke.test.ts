import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 4a — assessment profile + PAR-Q', () => {
  // ─── Riesgo 1: middleware modificado sin romper capas existentes ───
  it('middleware.ts tiene PROTECTED_PATHS con dashboard y assessment', () => {
    const raw = readFileSync(resolve(root, 'middleware.ts'), 'utf-8');
    expect(raw).toContain('PROTECTED_PATHS');
    expect(raw).toContain('/dashboard');
    expect(raw).toContain('/assessment');
  });

  it('middleware.ts conserva config.matcher identico a Slice 1b', () => {
    const raw = readFileSync(resolve(root, 'middleware.ts'), 'utf-8');
    // el matcher no debe haber sido alterado — verificar excluye api y _next
    expect(raw).toContain('matcher');
    // next-intl pattern: excluye api, _next, archivos estaticos
    const matcherLine = raw.split('\n').find((l) => l.includes('matcher'));
    expect(matcherLine).toContain('api');
    expect(matcherLine).toContain('_next');
    // next-intl usa negative lookahead (?! para excluir rutas
    expect(matcherLine).toContain('(?!');
  });

  it('middleware.ts conserva el guard de env vars', () => {
    const raw = readFileSync(resolve(root, 'middleware.ts'), 'utf-8');
    // guard de env vars: updateSession (en lib) y auth guard (en middleware.ts)
    // --- guard en updateSession (lib/supabase/middleware.ts) ---
    const mwLib = readFileSync(
      resolve(root, 'lib/supabase/middleware.ts'),
      'utf-8',
    );
    expect(mwLib).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(mwLib).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // --- guard en auth guard (middleware.ts) ---
    // el createServerClient dentro de isProtected debe estar precedido por
    // un if que verifica las env vars
    const isProtectedIdx = raw.indexOf('if (isProtected)');
    const createServerIdx = raw.indexOf('createServerClient', isProtectedIdx);
    const beforeCreate = raw.slice(isProtectedIdx, createServerIdx);
    // entre isProtected y createServerClient debe haber un check de env vars
    expect(beforeCreate).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(beforeCreate).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('middleware.ts conserva la fusion de cookies updateSession -> intlMiddleware', () => {
    const raw = readFileSync(resolve(root, 'middleware.ts'), 'utf-8');
    // la logica de merge de cookies no debe haber sido removida
    expect(raw).toContain('cookies.getAll()');
    expect(raw).toContain('cookies.set');
    expect(raw).toContain('intlMiddleware(request)');
  });

  // ─── Riesgo 2: saveProfile valida datos y requiere auth ───
  it('actions.ts exporta saveProfile como Server Action', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/assessment/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain('saveProfile');
    expect(raw).toContain('export');
    // debe ser server-side: usar server client, no browser client
    expect(raw).toContain('@/lib/supabase/server');
    // no debe importar browser client
    expect(raw).not.toContain('@/lib/supabase/client');
    // debe verificar autenticacion
    expect(raw).toContain('auth');
  });

  it('actions.ts valida datos del perfil server-side', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/assessment/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    // debe validar campos requeridos
    expect(raw).toMatch(/age|weight|height|experience_level/);
    // debe manejar errores de insercion
    expect(raw).toContain('error');
  });

  // ─── Riesgo 3: assessment/page.tsx es Server Component con flag gate ───
  it('(app)/layout.tsx es shell sin condiciones — sin getFlag', () => {
    const raw = readFileSync(
      resolve(root, 'app/[locale]/(app)/layout.tsx'),
      'utf-8',
    );
    // layout no debe gatear — es shell compartido para todas las rutas (app)
    expect(raw).not.toContain('getFlag');
    expect(raw).not.toContain("'use client'");
  });

  it('assessment/page.tsx es Server Component con getFlag y sin use client', () => {
    const raw = readFileSync(
      resolve(root, 'app/[locale]/(app)/assessment/page.tsx'),
      'utf-8',
    );
    expect(raw).not.toContain("'use client'");
    expect(raw).toContain('getFlag');
    expect(raw).toContain('assessment');
  });

  // ─── Riesgo 4: i18n keys simetricas ───
  it('assessment keys estan en ES y EN con los mismos nombres', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    expect(es.assessment).toBeDefined();
    expect(en.assessment).toBeDefined();

    const requiredKeys = [
      'profile.title',
      'profile.age',
      'profile.weight',
      'profile.height',
      'profile.experience',
      'profile.goal',
      'profile.days',
      'equipment.title',
      'parq.title',
      'parq.blocked',
    ];

    requiredKeys.forEach((key) => {
      const parts = key.split('.');
      let esVal: unknown = es.assessment;
      let enVal: unknown = en.assessment;
      for (const part of parts) {
        esVal = (esVal as Record<string, unknown>)?.[part];
        enVal = (enVal as Record<string, unknown>)?.[part];
      }
      expect(esVal, `falta key assessment.${key} en es.json`).toBeDefined();
      expect(esVal, `assessment.${key} en es.json vacia`).toBeTruthy();
      expect(enVal, `falta key assessment.${key} en en.json`).toBeDefined();
      expect(enVal, `assessment.${key} en en.json vacia`).toBeTruthy();
    });
  });

  // ─── Riesgo 5: feature flag ───
  it('feature-flags.json contiene assessment:false', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags).toHaveProperty('assessment');
    expect(flags.assessment).toBe(false);
  });
});
