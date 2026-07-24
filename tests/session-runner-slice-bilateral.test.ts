import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice bilateral — types + runner + persistence + i18n', () => {
  const runnerPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/session-runner.tsx',
  );
  const runner = readFileSync(runnerPath, 'utf-8');
  const typesPath = resolve(root, 'lib/types/session.ts');
  const types = readFileSync(typesPath, 'utf-8');
  const actionsPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/actions.ts',
  );
  const actions = readFileSync(actionsPath, 'utf-8');
  const persistencePath = resolve(root, 'lib/session/runner-persistence.ts');
  const persistence = readFileSync(persistencePath, 'utf-8');

  // ─── 1: SessionExercise tiene bilateral?: boolean ───
  it('SessionExercise en types/session.ts tiene bilateral?: boolean', () => {
    expect(types).toContain('bilateral');
    expect(types).toContain('bilateral?: boolean');
  });

  // ─── 2: RepEntry en actions.ts tiene bilateral: boolean ───
  it('RepEntry en actions.ts tiene bilateral (opcional)', () => {
    expect(actions).toContain('bilateral');
    // El campo es opcional para compatibilidad con snapshots viejos
    expect(actions).toContain('bilateral?');
  });

  // ─── 3: RunnerSnapshot en persistence.ts tiene currentSide ───
  it('RunnerSnapshot en runner-persistence.ts tiene currentSide', () => {
    expect(persistence).toContain('currentSide');
  });

  // ─── 4: handleStartTimer inicializa side (no hereda valor previo) ───
  it('handleStartTimer inicializa side a 1 al empezar timing', () => {
    const startTimerIdx = runner.indexOf('const handleStartTimer');
    const block = runner.slice(startTimerIdx, startTimerIdx + 500);
    // Debe resetear side antes de setState('timing')
    const beforeTiming = block.slice(0, block.indexOf("setState('timing'") + 50);
    expect(beforeTiming).toContain('setSide');
    expect(beforeTiming).toContain('sideRef');
  });

  // ─── 5: Timing expiry en bilateral lado 1 genera nuevo endsAt ───
  it('transición lado 1→2 genera nuevo timingEndsAt (no reusa el viejo)', () => {
    const startTimerIdx = runner.indexOf('const handleStartTimer');
    // Buscar bilateral dentro del bloque de handleStartTimer
    const timerBlock = runner.slice(startTimerIdx, startTimerIdx + 2000);
    const bilateralInTimer = timerBlock.indexOf('bilateral');
    const nearbyEnds = timerBlock.slice(bilateralInTimer, bilateralInTimer + 1000);
    // Debe recalcular endsAt vía Date.now() + duration_seconds
    expect(nearbyEnds).toContain('Date.now()');
    expect(nearbyEnds).toContain('duration_seconds');
    // Debe reiniciar el interval para lado 2 (no solo llamar handleDone)
    expect(nearbyEnds).toContain('setSide(2)');
  });

  // ─── 6: side no se filtra entre ejercicios ───
  it('side se resetea en avances no-bilaterales (handleDone / handleSkipRest)', () => {
    const handleDoneIdx = runner.indexOf('const handleDone');
    const doneBlock = runner.slice(handleDoneIdx, handleDoneIdx + 1000);
    // Verificar que handleDone resetea side en sus ramas de avance
    // Buscar setSide en handleDone
    expect(doneBlock).toContain('setSide');
    // side debe aparecer en el estado del componente (useState o ref)
    expect(runner).toContain('side');
  });

  // ─── 7: Guards de restauración por snapshot.state siguen intactos ───
  it('restauración sigue usando snapshot.state === rest/timing (fix slice 1)', () => {
    const restoreStart = runner.indexOf('// Restore snapshot on mount');
    const restoreEnd = runner.indexOf('// Cleanup timer on unmount');
    const block = runner.slice(restoreStart, restoreEnd);
    expect(block).toContain("snapshot.state === 'rest'");
    expect(block).toContain("snapshot.state === 'timing'");
  });

  // ─── 8: Restore effect maneja bilateral timing (no avanza al terminar lado 1) ───
  it('restauración bilateral: timer expirado en lado 1 cambia a lado 2 en vez de avanzar', () => {
    const restoreStart = runner.indexOf('// Restore snapshot on mount');
    const restoreEnd = runner.indexOf('// Cleanup timer on unmount');
    const block = runner.slice(restoreStart, restoreEnd);
    // Debe reconstruir currentSide
    expect(block).toContain('currentSide');
    // Debe chequear bilateral && currentSide === 1 en la rama de timing
    expect(block).toContain('bilateral');
    expect(block).toContain("snapshot.currentSide === 1");
    // Debe referenciar el ejercicio desde allExercises y snapshot.index
    expect(block).toContain('restoreEx?.bilateral');
    // Debe generar un nuevo lado 2 (setSide(2)) dentro del restore effect
    expect(block).toContain('setSide(2)');
    // Debe generar nuevo endsAt dentro del timing restoration
    expect(block).toContain('Date.now() + (restoreEx.duration_seconds');
  });

  // ─── 9: UI reps bilateral renderiza 2×series ───
  it('render de reps bilateral usa ex.sets * 2 o equivalente', () => {
    const repsBlockStart = runner.indexOf("state === 'reps'");
    const repsBlock = runner.slice(repsBlockStart, repsBlockStart + 2000);
    // Si bilateral, debe multiplicar sets por 2 (un juego por lado)
    const hasDoubleSets = repsBlock.includes('* 2') || repsBlock.includes('*2');
    const hasBilateralCheck = repsBlock.includes('bilateral');
    expect(hasDoubleSets || hasBilateralCheck).toBe(true);
    // Debe mostrar labels de "Lado" en los inputs
    expect(repsBlock).toContain('side');
  });

  // ─── 10: i18n key session.side simétrica ───
  it('session.side existe en es.json y en.json con interpolación {n}', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );
    expect(es.session?.side).toBeTruthy();
    expect(en.session?.side).toBeTruthy();
    expect(es.session?.side).toContain('{n}');
    expect(en.session?.side).toContain('{n}');
  });
});
