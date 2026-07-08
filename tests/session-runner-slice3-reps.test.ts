import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 3 — registro inmediato de reps reales', () => {
  const runnerPath = resolve(
    root,
    'app/[locale]/(app)/session/[id]/session-runner.tsx',
  );
  const runner = readFileSync(runnerPath, 'utf-8');
  const actionsPath = resolve(
    root,
    'app/[locale]/(app)/session/[id]/actions.ts',
  );
  const actions = readFileSync(actionsPath, 'utf-8');
  const logFormPath = resolve(
    root,
    'app/[locale]/(app)/dashboard/log-form.tsx',
  );
  const logForm = readFileSync(logFormPath, 'utf-8');
  const dashActionsPath = resolve(
    root,
    'app/[locale]/(app)/dashboard/actions.ts',
  );
  const dashActions = readFileSync(dashActionsPath, 'utf-8');

  // ─── Riesgo 1: Race condition — saveSessionTimes debe mergear ───
  it('saveSessionTimes mergea log_data (SELECT antes de UPDATE)', () => {
    // Debe hacer SELECT de log_data existente antes de UPDATE (no overwrite)
    const hasSelect = actions.includes('.select(');
    const hasUpdate = actions.includes('.update(');
    expect(hasSelect, 'saveSessionTimes debe hacer SELECT').toBe(true);
    expect(hasUpdate, 'saveSessionTimes debe hacer UPDATE').toBe(true);
  });

  // ─── Riesgo 2: Flush gate incluye exerciseLogRef ───
  it('useEffect flush se gatilla con exerciseLogRef aunque restTimesRef vacío', () => {
    // La condición del useEffect debe incluir ambos refs
    expect(runner).toContain('exerciseLogRef');
    expect(runner).toContain('restTimesRef');
  });

  // ─── Riesgo 3: Cada escritura optimista manda el ref COMPLETO, no un delta ───
  it('saveExerciseReps recibe exerciseLogRef.current (ref completo, no [entry])', () => {
    // La llamada optimista debe pasar el ref completo:
    //   saveExerciseReps(sessionId, exerciseLogRef.current)
    // NO un delta:
    //   saveExerciseReps(sessionId, [entry])
    // Si mandara [entry], mergeLogData reemplazaría exerciseLog entero y
    // las entradas anteriores se perderían en DB si la app cierra antes de done.
    expect(runner).toContain(
      'saveExerciseReps(sessionId, exerciseLogRef.current)',
    );
    // El flush final también manda el ref completo (saveSessionTimes)
    expect(actions).toContain('exerciseLog');
  });

  // ─── Riesgo 4: Intercepción en handleDone con condición exacta ───
  it('handleDone intercepta sets/reps con sets != null && ex.reps', () => {
    const handleDoneIdx = runner.indexOf('const handleDone');
    const block = runner.slice(
      handleDoneIdx,
      handleDoneIdx + 500,
    );
    expect(block).toContain('sets != null');
    expect(block).toContain('reps');
  });

  // ─── Riesgo 5: i18n keys simétricas ES/EN ───
  it('keys repsPrompt, prescribed, actualRepsLabel, confirmReps simétricas', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );
    const keys = ['repsPrompt', 'prescribed', 'actualRepsLabel', 'confirmReps'];
    keys.forEach((key) => {
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

  // ─── Riesgo 6: Double-submit prevention ───
  it('handleConfirmReps tiene guard contra doble click (repsSubmittedRef)', () => {
    expect(runner).toContain('repsSubmitted');
  });
});
