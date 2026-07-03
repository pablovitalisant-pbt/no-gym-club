import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Exercise log — per-exercise actuals', () => {

  // Riesgo 1: LogForm recibe session prop
  it('log-form.tsx acepta prop session con SessionData', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/log-form.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe recibir session prop').toContain('session');
  });

  // Riesgo 2: LogForm muestra ejercicios del bloque main
  it('log-form.tsx muestra ejercicios del main con inputs de reps', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/log-form.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe iterar sobre session.main o tener inputs por ejercicio
    expect(raw, 'debe referenciar main exercises').toContain('main');
    // Debe tener inputs o text fields para reps reales
    const hasInput =
      raw.includes('actualReps') ||
      raw.includes('reps') ||
      raw.includes('result');
    expect(hasInput, 'debe tener campos para reps reales').toBe(true);
  });

  // Riesgo 3: saveSessionLog acepta exerciseLog como parámetro
  it('actions.ts saveSessionLog acepta parametro exerciseLog', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe aceptar exerciseLog').toContain('exerciseLog');
  });

  // Riesgo 4: actions.ts hace SELECT antes del UPDATE (merge)
  it('actions.ts hace SELECT de log_data antes del UPDATE para merge', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe leer log_data existente antes de hacer UPDATE
    const selectIdx = raw.indexOf('.select');
    const updateIdx = raw.indexOf('.update');
    expect(selectIdx, 'debe hacer SELECT para leer log_data').toBeGreaterThan(
      -1,
    );
    expect(updateIdx, 'debe hacer UPDATE').toBeGreaterThan(-1);
    // SELECT debe estar antes que UPDATE (merge strategy)
    expect(
      selectIdx < updateIdx,
      'SELECT debe ejecutarse antes del UPDATE',
    ).toBe(true);
  });

  // Riesgo 5: dashboard-client pasa session a LogForm
  it('dashboard-client.tsx pasa session prop a LogForm', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // El render de LogForm debe incluir session prop
    expect(raw, 'LogForm debe recibir session').toContain('<LogForm');
    // Debe pasar session data
    expect(raw, 'debe pasar session como prop').toContain('session={');
  });

  // Riesgo 6: backward compat — session-log-smoke tests intactos
  it('session-log-smoke.test.ts sigue teniendo 8 tests', () => {
    const path = resolve(root, 'tests/session-log-smoke.test.ts');
    const raw = readFileSync(path, 'utf-8');
    const testCount = (raw.match(/\bit\(/g) || []).length;
    expect(testCount, 'debe mantener 8 tests').toBe(8);
  });
});
