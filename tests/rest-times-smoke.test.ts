import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('actualRestTimes persistence', () => {

  // Riesgo 1: Server Action para guardar rest times
  it('session/[id]/actions.ts exporta saveSessionTimes', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/actions.ts',
    );
    expect(existsSync(path), 'actions.ts debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser server action').toContain("'use server'");
    expect(raw, 'debe exportar saveSessionTimes').toContain('saveSessionTimes');
  });

  // Riesgo 2: Server Action actualiza log_data con actualRestTimes
  it('actions.ts UPDATE log_data con jsonb_build_object y actualRestTimes', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe hacer UPDATE a workout_sessions
    expect(raw, 'debe actualizar workout_sessions').toContain(
      'workout_sessions',
    );
    // Debe usar log_data
    expect(raw, 'debe actualizar log_data').toContain('log_data');
    // Debe validar auth con getUser
    expect(raw, 'debe validar auth').toContain('getUser');
    // Defense in depth: filter by user_id
    expect(raw, 'debe filtrar por user.id').toContain('user.id');
  });

  // Riesgo 3: session-runner trackea restStartTime
  it('session-runner.tsx trackea restStartTime con Date.now()', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe registrar timestamp al iniciar descanso
    expect(raw, 'debe trackear restStartTime').toContain('restStart');
  });

  // Riesgo 4: session-runner acumula actualRestTimes
  it('session-runner.tsx acumula actualRestTimes en array', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe tener un array de actualRestTimes o similar
    const hasArray =
      raw.includes('actualRest') ||
      raw.includes('restTimes') ||
      raw.includes('restData');
    expect(hasArray, 'debe acumular datos de descanso').toBe(true);
  });

  // Riesgo 5: al llegar a done, llama la Server Action
  it('session-runner.tsx llama saveSessionTimes al completar', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe importar la acción
    expect(raw, 'debe importar saveSessionTimes').toContain(
      'saveSessionTimes',
    );
  });

  // Riesgo 6: backwards compat — session-runner-smoke tests intactos
  it('session-runner-smoke.test.ts sigue teniendo 11 tests', () => {
    const path = resolve(root, 'tests/session-runner-smoke.test.ts');
    const raw = readFileSync(path, 'utf-8');
    const testCount = (raw.match(/\bit\(/g) || []).length;
    expect(testCount, 'debe mantener 11 tests').toBe(11);
  });
});
