import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice Persistencia — restauración de estado al recargar', () => {
  const runnerPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/session-runner.tsx',
  );
  const runner = readFileSync(runnerPath, 'utf-8');

  // ─── Riesgo 1: El runner importa los helpers de persistence ───
  it('importa saveSnapshot, loadSnapshot, clearSnapshot desde runner-persistence', () => {
    expect(runner).toContain('saveSnapshot');
    expect(runner).toContain('loadSnapshot');
    expect(runner).toContain('clearSnapshot');
    expect(runner).toContain('@/lib/session/runner-persistence');
  });

  // ─── Riesgo 2: loadSnapshot NO se llama en inicializador de useState ───
  it('loadSnapshot no aparece dentro de useState inicializador (debe estar en useEffect)', () => {
    // Buscar loadSnapshot DENTRO de useState( — debe fallar
    // Patrón prohibido: useState(loadSnapshot(  o  useState(() => loadSnapshot(
    const useStateInitPattern = /useState\s*\(\s*(?:\(\)\s*=>\s*)?loadSnapshot\s*\(/;
    expect(useStateInitPattern.test(runner)).toBe(false);
    // Patrón correcto: loadSnapshot debe estar asociado a useEffect
    expect(runner).toContain('useEffect');
  });

  // ─── Riesgo 3: saveSnapshot aparece al menos en 6 puntos estructurales ───
  it('saveSnapshot aparece al menos en 6 puntos (rest, timing, reps advance, handleDone advance, skipRest advance, confirmReps advance)', () => {
    const occurrences = (runner.match(/saveSnapshot\(/g) || []).length;
    expect(occurrences).toBeGreaterThanOrEqual(6);
  });

  // ─── Riesgo 3b: saveSnapshot cubre avance de índice sin timer/reps ───
  it('saveSnapshot en avance simple de handleDone (ejercicio sin rest/timer/reps)', () => {
    const handleDoneIdx = runner.indexOf('const handleDone');
    const block = runner.slice(handleDoneIdx, handleDoneIdx + 2000);
    // Busca un else { ... saveSnapshot({ ... state: 'active' ... }) ... }
    // dentro de handleDone. Usa multilinea: saveSnapshot y state: 'active' en el bloque else.
    const elseIdx = block.lastIndexOf('else {');
    const elseBlock = block.slice(elseIdx, elseIdx + 300);
    expect(elseBlock).toContain('saveSnapshot');
    expect(elseBlock).toContain("state: 'active'");
    expect(elseBlock).toContain('index: index + 1');
    // No debe estar en una rama de isLast (esa va a done, no persiste)
    expect(elseBlock).not.toContain('isLast');
  });

  it('saveSnapshot en avance de handleSkipRest', () => {
    const skipRestIdx = runner.indexOf('const handleSkipRest');
    const block = runner.slice(skipRestIdx, skipRestIdx + 2000);
    const elseIdx = block.lastIndexOf('else {');
    const elseBlock = block.slice(elseIdx, elseIdx + 300);
    expect(elseBlock).toContain('saveSnapshot');
    expect(elseBlock).toContain("state: 'active'");
    expect(elseBlock).toContain('index: index + 1');
  });

  it('saveSnapshot en avance de handleConfirmReps (ejercicio sin rest_seconds)', () => {
    const confirmRepsIdx = runner.indexOf('const handleConfirmReps');
    const block = runner.slice(confirmRepsIdx, confirmRepsIdx + 2000);
    const elseIdx = block.lastIndexOf('else {');
    const elseBlock = block.slice(elseIdx, elseIdx + 300);
    expect(elseBlock).toContain('saveSnapshot');
    expect(elseBlock).toContain("state: 'active'");
    expect(elseBlock).toContain('index: index + 1');
  });

  // ─── Riesgo 4: clearSnapshot aparece cerca de saveSessionTimes en state === done ───
  it('clearSnapshot aparece en el mismo bloque que saveSessionTimes en done', () => {
    const doneIdx = runner.indexOf("state === 'done'");
    const block = runner.slice(doneIdx, doneIdx + 300);
    expect(block).toContain('clearSnapshot');
    expect(block).toContain('saveSessionTimes');
  });

  // ─── Riesgo 5: El cálculo de countdown usa timestamps absolutos ───
  it('el runner usa restEndsAt y timingEndsAt (timestamps absolutos)', () => {
    expect(runner).toContain('restEndsAt');
    expect(runner).toContain('timingEndsAt');
  });

  // ─── Riesgo 6: Restauración usa snapshot.state como guard, no solo timestamp ───
  it('restauración decide por snapshot.state (evita rama errónea si ref quedó sucio)', () => {
    // Debe checkear snapshot.state antes de restEndsAt/timingEndsAt
    const restoreEffectStart = runner.indexOf('// Restore snapshot on mount');
    const restoreEffectEnd = runner.indexOf('// Cleanup timer on unmount');
    const block = runner.slice(restoreEffectStart, restoreEffectEnd);
    expect(block).toContain("snapshot.state === 'rest'");
    expect(block).toContain("snapshot.state === 'timing'");
    // No debe decidir solo por != null del timestamp
    const soloRestNull = /if\s*\(\s*snapshot\.restEndsAt\s*!=\s*null\s*\)\s*\{/;
    const soloTimingNull = /if\s*\(\s*snapshot\.timingEndsAt\s*!=\s*null\s*\)\s*\{/;
    expect(soloRestNull.test(block)).toBe(false);
    expect(soloTimingNull.test(block)).toBe(false);
  });

  // ─── Riesgo 7: feature-flags.json sigue igual (session_runner: true) ───
  it('feature-flags.json mantiene session_runner: true sin cambios', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags.session_runner).toBe(true);
    // No se agregaron keys nuevas
    const keys = Object.keys(flags);
    expect(keys).toEqual([
      'landing_page',
      'auth',
      'dashboard',
      'assessment',
      'ai_session_generation',
      'session_log',
      'session_runner',
      'exercises_catalog',
      'weekly_report',
      'progress',
    ]);
  });

  // ─── Riesgo 8: No se agregaron keys i18n nuevas para este slice ───
  it('no se agregaron keys i18n nuevas para persistencia (slice invisible al usuario)', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );
    const esKeys = Object.keys(es.session || {});
    const enKeys = Object.keys(en.session || {});
    // Mismas keys que antes del slice: sin cambios
    expect(es.session).not.toHaveProperty('persistence');
    expect(en.session).not.toHaveProperty('persistence');
    expect(es.session).not.toHaveProperty('resume');
    expect(en.session).not.toHaveProperty('resume');
    expect(esKeys).toEqual(enKeys);
  });
});
