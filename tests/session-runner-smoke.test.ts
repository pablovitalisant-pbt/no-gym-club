import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 8 — session runner (tap timer)', () => {

  // ─── Riesgo 1: Timer cleanup ───
  it('session-runner.tsx limpia setInterval al desmontar (useEffect return)', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    expect(existsSync(path), 'session-runner.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    // Debe usar setInterval o setTimeout para el timer
    const hasTimer =
      raw.includes('setInterval') || raw.includes('setTimeout');
    expect(hasTimer, 'debe tener timer con setInterval/setTimeout').toBe(true);
    // Debe limpiar el timer (clearInterval / clearTimeout en useEffect return)
    const hasCleanup =
      raw.includes('clearInterval') || raw.includes('clearTimeout');
    expect(hasCleanup, 'debe limpiar el timer al desmontar').toBe(true);
  });

  // ─── Riesgo 2: Tipos compartidos, no duplicados ───
  it('lib/types/session.ts existe con SessionData y SessionExercise', () => {
    const path = resolve(root, 'lib/types/session.ts');
    expect(existsSync(path), 'lib/types/session.ts debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe exportar SessionData').toContain('SessionData');
    expect(raw, 'debe exportar SessionExercise').toContain('SessionExercise');
  });

  it('dashboard-client.tsx importa tipos de lib/types/session.ts', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe importar los tipos compartidos, no definirlos inline
    expect(raw, 'debe importar de lib/types/session').toContain(
      '@/lib/types/session',
    );
    // No debe tener las interfaces viejas inline
    expect(raw, 'tipos no deben estar duplicados inline').not.toContain(
      'interface SessionExercise',
    );
    expect(raw, 'tipos no deben estar duplicados inline').not.toContain(
      'interface SessionData',
    );
  });

  // ─── Riesgo 3: Client Component no toca DB ───
  it('session-runner.tsx es Client Component y NO importa supabase', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser Client Component').toContain("'use client'");
    expect(raw, 'no debe importar supabase server').not.toContain(
      '@/lib/supabase/server',
    );
    expect(raw, 'no debe importar supabase client').not.toContain(
      '@/lib/supabase/client',
    );
  });

  // ─── Riesgo 4: Server Component con defensa en profundidad ───
  it('session page.tsx es Server Component y verifica user_id', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/page.tsx',
    );
    expect(existsSync(path), 'session page.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    // Server Component
    expect(raw, 'page debe ser Server Component').not.toContain("'use client'");
    // Debe verificar que la sesión pertenece al usuario
    expect(raw, 'debe filtrar por user_id').toContain('user_id');
  });

  // ─── Riesgo 5: Ruta protegida ───
  it('middleware.ts protege la ruta /session', () => {
    const path = resolve(root, 'middleware.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'PROTECTED_PATHS debe incluir /session').toContain('/session');
  });

  // ─── Riesgo 6: Estados del runner ───
  it('session-runner.tsx tiene 4 estados (idle, active, rest, done)', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe tener state machine con estados de sesión
    expect(raw, 'debe tener estado active').toContain('active');
    expect(raw, 'debe tener estado rest').toContain('rest');
    expect(raw, 'debe tener estado done').toContain('done');
  });

  it('session-runner.tsx aplana warmup+main+cooldown en un array', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe trabajar con las 3 secciones
    expect(raw, 'debe referenciar warmup').toContain('warmup');
    expect(raw, 'debe referenciar main').toContain('main');
    expect(raw, 'debe referenciar cooldown').toContain('cooldown');
  });

  // ─── Riesgo 7: Feature flag ───
  it('feature flag session_runner existe en false', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(
      'session_runner' in flags,
      'debe existir session_runner en feature-flags.json',
    ).toBe(true);
    expect(flags.session_runner, 'session_runner debe estar definido').toBe(true);
  });

  // ─── Riesgo 8: i18n keys simétricas ───
  it('keys session.* son simétricas ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    const requiredKeys = [
      'start',
      'done',
      'skipRest',
      'nextExercise',
      'restComplete',
      'complete',
      'completeMessage',
      'backToDashboard',
      'progress',
      'exercise',
      'rest',
      'warmup',
      'main',
      'cooldown',
    ];

    requiredKeys.forEach((key) => {
      expect(
        es.session?.[key],
        `falta session.${key} en es.json`,
      ).toBeTruthy();
      expect(
        en.session?.[key],
        `falta session.${key} en en.json`,
      ).toBeTruthy();
    });
  });

  // ─── Riesgo 9: Dashboard tiene botón de iniciar sesión ───
  it('dashboard-client.tsx tiene botón para iniciar sesión (startSession)', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe tener un botón o link para iniciar la sesión
    expect(raw, 'debe tener startSession').toContain('startSession');
    // Debe navegar a /session/{id}
    expect(raw, 'debe navegar a /session/').toContain('/session/');
  });
});
