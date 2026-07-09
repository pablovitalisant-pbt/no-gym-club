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

  // Riesgo 2: session-runner captura reps reales en estado 'reps'
  it('session-runner.tsx captura reps reales en estado reps con input', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe tener estado reps').toContain("'reps'");
    expect(raw, 'debe tener input para reps').toContain('repsInput');
  });

  // Riesgo 3: session/[id]/actions.ts exporta saveExerciseReps
  it('session/[id]/actions.ts exporta saveExerciseReps', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/session/[id]/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser server action').toContain("'use server'");
    expect(raw, 'debe exportar saveExerciseReps').toContain('saveExerciseReps');
  });

  // Riesgo 4: session/[id]/actions.ts mergea log_data (SELECT antes de UPDATE)
  it('session/[id]/actions.ts hace SELECT de log_data antes del UPDATE', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/session/[id]/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    const selectIdx = raw.indexOf('.select(');
    const updateIdx = raw.indexOf('.update(');
    expect(selectIdx, 'debe hacer SELECT para leer log_data').toBeGreaterThan(
      -1,
    );
    expect(updateIdx, 'debe hacer UPDATE').toBeGreaterThan(-1);
    expect(
      selectIdx < updateIdx,
      'SELECT debe ejecutarse antes del UPDATE',
    ).toBe(true);
  });

  // Riesgo 5: LogForm solo se renderiza en session-runner.tsx (done), no en dashboard-client
  it('LogForm se renderiza solo en session-runner.tsx, no en dashboard-client', () => {
    const runnerPath = resolve(
      root,
      'app/[locale]/(app)/session/[id]/session-runner.tsx',
    );
    const dashboardPath = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const runnerRaw = readFileSync(runnerPath, 'utf-8');
    const dashboardRaw = readFileSync(dashboardPath, 'utf-8');
    expect(runnerRaw, 'session-runner debe contener LogForm').toContain('<LogForm');
    expect(dashboardRaw, 'dashboard-client NO debe contener LogForm').not.toContain('<LogForm');
  });

  // Riesgo 6: backward compat — session-log-smoke tests intactos
  it('session-log-smoke.test.ts sigue teniendo 8 tests', () => {
    const path = resolve(root, 'tests/session-log-smoke.test.ts');
    const raw = readFileSync(path, 'utf-8');
    const testCount = (raw.match(/\bit\(/g) || []).length;
    expect(testCount, 'debe mantener 8 tests').toBe(8);
  });
});
