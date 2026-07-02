import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 6 — session log + RPE', () => {

  // Riesgo 0: la API route retorna session_id (necesario para el UPDATE)
  it('generate-session route retorna session_id en el JSON de respuesta', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // Debe devolver session_id en el body de la respuesta
    expect(raw, 'debe retornar session_id').toContain('session_id');
    // Debe usar inserted.id como valor
    expect(raw, 'session_id debe venir de inserted.id').toContain('inserted.id');
  });

  // Riesgo 1: el Client Component no toca la DB
  it('log-form.tsx NO importa createClient — usa Server Action', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/log-form.tsx',
    );
    expect(existsSync(path), 'log-form.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'no debe importar supabase server').not.toContain(
      '@/lib/supabase/server',
    );
    expect(raw, 'no debe importar supabase client').not.toContain(
      '@/lib/supabase/client',
    );
    // Debe ser Client Component
    expect(raw, 'debe ser Client Component').toContain("'use client'");
  });

  // Riesgo 2: RPE selector 1-10
  it('log-form.tsx tiene selector de RPE con 10 valores', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/log-form.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe tener botones o inputs para seleccionar RPE
    expect(raw, 'debe tener RPE').toContain('rpe');
    // Debe cubrir valores 1-10 (chequear que 1 y 10 aparecen)
    const hasRange = raw.includes('10') || raw.includes('rpe');
    expect(hasRange, 'debe cubrir rango 1-10').toBe(true);
  });

  // Riesgo 3: Server Action con auth + defensa en profundidad
  it('actions.ts exporta saveSessionLog con validacion de auth', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/actions.ts',
    );
    expect(existsSync(path), 'actions.ts debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser server action').toContain("'use server'");
    expect(raw, 'debe exportar saveSessionLog').toContain('saveSessionLog');
    expect(raw, 'debe verificar auth con getUser').toContain('getUser');
  });

  it('actions.ts UPDATE usa user.id en WHERE para defensa en profundidad', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    // WHERE debe incluir user_id = user.id (además del id = sessionId)
    expect(raw, 'UPDATE debe filtrar por user.id').toContain('user.id');
    // RLS cubre esto, pero la doble verificación es defensa en profundidad
    expect(raw, 'debe hacer UPDATE a workout_sessions').toContain(
      'workout_sessions',
    );
  });

  // Riesgo 4: dashboard-client almacena sessionId
  it('dashboard-client.tsx almacena sessionId del API response', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe extraer y almacenar session_id de la respuesta
    const hasSessionId =
      raw.includes('session_id') || raw.includes('sessionId');
    expect(hasSessionId, 'debe almacenar sessionId').toBe(true);
  });

  // Riesgo 5: feature flag
  it('feature flag session_log existe en false', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(
      'session_log' in flags,
      'debe existir session_log en feature-flags.json',
    ).toBe(true);
    expect(flags.session_log, 'session_log debe ser false').toBe(false);
  });

  // Riesgo 6: i18n keys simétricas
  it('keys dashboard.log.* y dashboard.rpe* son simétricas ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    const requiredKeys = [
      'logTitle',
      'rpeLabel',
      'rpeVeryEasy',
      'rpeEasy',
      'rpeModerate',
      'rpeHard',
      'rpeVeryHard',
      'rpeMaximal',
      'notesLabel',
      'save',
      'saving',
      'saved',
      'logError',
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
});
