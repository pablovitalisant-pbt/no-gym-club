import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { resumeRunnerState } from '../lib/session/continuous-view';
import { buildTimeline, READY_SECONDS } from '../lib/session/continuous';
import type { SessionExercise } from '../lib/types/session';
import type { ContinuousRunnerSnapshot } from '../lib/session/runner-persistence';

const exercises: SessionExercise[] = [
  { exercise: 'Sentadillas', sets: 2, reps: '10', rest_seconds: 30 },
];
const timeline = buildTimeline(exercises);
const now = 1_000_000;

describe('QA-04 — recarga en medio del modo de corrido', () => {
  it('sin snapshot arranca en la selección de modo', () => {
    expect(resumeRunnerState(null, timeline, now)).toBe('idle');
  });

  it('snapshot vigente retoma el modo de corrido', () => {
    const snapshot = {
      sessionId: 's1',
      updatedAt: now,
      state: { index: 0, remaining: READY_SECONDS, running: true, updatedAt: now },
    } as ContinuousRunnerSnapshot;
    expect(resumeRunnerState(snapshot, timeline, now)).toBe('continuous');
  });

  it('snapshot ya terminado lleva al resumen', () => {
    const snapshot = {
      sessionId: 's1',
      updatedAt: now,
      state: { index: timeline.length, remaining: 0, running: true, updatedAt: now },
    } as ContinuousRunnerSnapshot;
    expect(resumeRunnerState(snapshot, timeline, now)).toBe('summary');
  });
});

describe('QA-03 — dashboard fresco tras guardar RPE', () => {
  const src = readFileSync(
    resolve(__dirname, '../app/[locale]/(session)/session/[id]/session-runner.tsx'),
    'utf8',
  );

  it('refresca el router al volver al dashboard', () => {
    expect(src).toContain('router.refresh');
  });

  it('al montar lee el snapshot continuo', () => {
    expect(src).toContain('loadContinuousSnapshot');
  });
});
