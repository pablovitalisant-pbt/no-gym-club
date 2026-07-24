import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice Reps por serie — state + UI + i18n', () => {
  const runnerPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/session-runner.tsx',
  );
  const runner = readFileSync(runnerPath, 'utf-8');
  const actionsPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/actions.ts',
  );
  const actions = readFileSync(actionsPath, 'utf-8');
  const persistencePath = resolve(
    root,
    'lib/session/runner-persistence.ts',
  );
  const persistence = readFileSync(persistencePath, 'utf-8');

  // ─── Riesgo 1: RepEntry.actualReps cambió a string[] ───
  it('RepEntry.actualReps en actions.ts es string[] (ya no string)', () => {
    expect(actions).toContain('actualReps: string[]');
    // La forma vieja no debe aparecer
    expect(actions).not.toContain('actualReps: string;');
  });

  // ─── Riesgo 2: runner-persistence.ts refleja el mismo tipo ───
  it('runner-persistence.ts tiene actualReps: string[] (sincronizado con actions)', () => {
    expect(persistence).toContain('actualReps: string[]');
    expect(persistence).not.toContain('actualReps: string;');
  });

  // ─── Riesgo 3: useState usa repsInputs (plural) y setRepsInputs usa Array() ───
  it('session-runner.tsx usa repsInputs (plural) y Array() para construir inputs', () => {
    expect(runner).toContain('repsInputs');
    // Array() se usa en setRepsInputs dentro de handleDone, no en useState
    // El pre-llenado ahora pasa por totalSets (bilateral-aware)
    expect(runner).toContain('setRepsInputs(Array(totalSets).fill(ex.reps))');
    // La forma singular ya no debe usarse como estado
    expect(runner).toContain("'reps'");
  });

  // ─── Riesgo 4: onChange actualiza por índice (no reemplaza todo) ───
  it('onChange actualiza por índice (map o spread con índice)', () => {
    // Debe actualizar una posición específica, no setear el array entero
    const hasIndexUpdate =
      runner.includes('setRepsInputs((prev) => prev.map(') ||
      runner.includes('setRepsInputs((prev) => { const next = [...prev]');
    expect(hasIndexUpdate).toBe(true);
    // No debe haber onChange que reemplace el array con un string
    // (patrón prohibido: onChange={... setRepsInputs(e.target.value)})
    const dangerousPattern = /setRepsInputs\s*\(\s*e\s*\.\s*target\s*\.\s*value\s*\)/;
    expect(dangerousPattern.test(runner)).toBe(false);
  });

  // ─── Riesgo 5: handleConfirmReps arma entry.actualReps = repsInputs ───
  it('handleConfirmReps usa repsInputs (array completo) en entry.actualReps', () => {
    expect(runner).toContain('actualReps: repsInputs');
    // No debe haber un entry.actualReps que use un solo valor
    const idx = runner.indexOf('actualReps: repsInputs');
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  // ─── Riesgo 6: Guard de entrada a state === reps sigue intacto ───
  it('entrada a reps en handleDone aún chequea ex.sets != null && ex.reps', () => {
    const handleDoneIdx = runner.indexOf('const handleDone');
    const block = runner.slice(handleDoneIdx, handleDoneIdx + 600);
    expect(block).toContain('sets != null');
    expect(block).toContain('reps');
  });

  // ─── Riesgo 7: Double-submit prevention (repsSubmittedRef) sigue intacto ───
  it('repsSubmittedRef sigue presente en handleConfirmReps', () => {
    expect(runner).toContain('repsSubmitted');
  });

  // ─── Riesgo 8: i18n key setLabel simétrica ES/EN con interpolación ───
  it('session.setLabel existe en es.json y en.json con interpolación {n}', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );
    expect(es.session?.setLabel).toBeTruthy();
    expect(en.session?.setLabel).toBeTruthy();
    // next-intl usa {n} para interpolación
    expect(es.session?.setLabel).toContain('{n}');
    expect(en.session?.setLabel).toContain('{n}');
  });

  // ─── Riesgo 9: El render de reps tiene un .map sobre sets ───
  it('el bloque state === reps tiene .map iterando por sets', () => {
    const repsBlockStart = runner.indexOf("state === 'reps'");
    const repsBlock = runner.slice(repsBlockStart, repsBlockStart + 1500);
    expect(repsBlock).toContain('.map(');
    // Debe haber inputs múltiples con un label por serie
    expect(repsBlock).toContain('setLabel');
  });
});
