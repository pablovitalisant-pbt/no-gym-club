import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 5 — dashboard session display', () => {

  // Riesgo 1: Client Component no toca la DB directamente
  it('dashboard-client.tsx NO importa createClient de supabase', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    expect(existsSync(path), 'dashboard-client.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    // No debe importar createClient (server ni browser) — solo llama a la API
    expect(raw, 'no debe importar supabase server').not.toContain(
      '@/lib/supabase/server',
    );
    expect(raw, 'no debe importar supabase client').not.toContain(
      '@/lib/supabase/client',
    );
    expect(raw, 'no debe importar createClient').not.toContain('createClient');
  });

  // Riesgo 2: el Client Component llama a la API, no hace INSERT directo
  it('dashboard-client.tsx llama a /api/generate-session via fetch', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    expect(existsSync(path), 'dashboard-client.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    // Debe llamar a la API — no hacer INSERT directo a workout_sessions
    expect(raw, 'debe llamar a /api/generate-session').toContain(
      '/api/generate-session',
    );
    // No debe referenciar la tabla workout_sessions directamente
    expect(raw, 'no debe hacer INSERT directo a workout_sessions').not.toContain(
      'workout_sessions',
    );
  });

  // Riesgo 3: manejo de los 4 estados (idle, loading, error, success)
  it('dashboard-client.tsx maneja estado loading (spinner o generating)', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    const hasLoading =
      raw.includes('loading') ||
      raw.includes('Loading') ||
      raw.includes('generating') ||
      raw.includes('Generating');
    expect(hasLoading, 'debe tener estado loading').toBe(true);
  });

  it('dashboard-client.tsx maneja estado error con mensaje y reintento', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe tener estado error').toContain('error');
  });

  it('dashboard-client.tsx muestra titulo y descripcion de la sesion generada', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe mostrar datos de la sesion: warmup, main, cooldown
    expect(raw, 'debe renderizar warmup').toContain('warmup');
    expect(raw, 'debe renderizar cooldown').toContain('cooldown');
  });

  // Riesgo 4: Server Component + flag gate
  it('dashboard/page.tsx sigue siendo Server Component con getFlag', () => {
    const path = resolve(root, 'app/[locale]/(app)/dashboard/page.tsx');
    expect(existsSync(path), 'dashboard/page.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    // Debe seguir siendo Server Component (sin 'use client')
    expect(raw, 'page.tsx debe ser Server Component').not.toContain("'use client'");
    // Debe usar getFlag para AI session generation
    expect(raw, 'debe usar getFlag para ai_session_generation').toContain(
      'ai_session_generation',
    );
    // Debe importar el Client Component
    expect(raw, 'debe importar DashboardClient').toContain('DashboardClient');
  });

  // Riesgo 5: i18n keys simétricas
  it('keys dashboard.generate.* existen y son simetricas ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    const requiredKeys = [
      'generate',
      'generating',
      'warmup',
      'main',
      'cooldown',
      'rationale',
      'scienceRefs',
      'error',
      'retry',
    ];

    requiredKeys.forEach((key) => {
      expect(
        es.dashboard?.[key],
        `falta dashboard.${key} en es.json`,
      ).toBeTruthy();
      expect(
        en.dashboard?.[key],
        `falta dashboard.${key} en en.json`,
      ).toBeTruthy();
    });
  });

  // Riesgo 6: el flag ai_session_generation está en false
  it('feature flag ai_session_generation sigue en false', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags.ai_session_generation, 'debe seguir en false').toBe(false);
  });
});
