import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildSnapshot } from '../lib/session/useRunnerSnapshot';

const refs = {
  restInfoRef: { current: { exerciseIndex: 1, exercise: 'Squat', prescribedRest: 30 } },
  restTimesRef: { current: [{ exerciseIndex: 0, exercise: 'A', prescribedRest: 30, actualRest: 31 }] },
  exerciseLogRef: { current: [{ exercise: 'A', prescribedSets: 3, prescribedReps: '10', actualReps: ['10'] }] },
  restEndsAtRef: { current: 111 as number | null },
  timingEndsAtRef: { current: 222 as number | null },
};

describe('v3-ref-1 · buildSnapshot (caracterización de saveSnapshot)', () => {
  it('lee los refs y arma el snapshot base', () => {
    const s = buildSnapshot('sid', refs, 'reps', 4);
    expect(s).toMatchObject({
      sessionId: 'sid', state: 'reps', index: 4, restEndsAt: 111, timingEndsAt: 222,
      restInfo: refs.restInfoRef.current, restTimes: refs.restTimesRef.current,
      exerciseLog: refs.exerciseLogRef.current,
    });
    expect(typeof s.updatedAt).toBe('number');
  });
  it('over pisa timestamps, lado, etapa y reps', () => {
    const s = buildSnapshot('sid', refs, 'done', 2, {
      restEndsAt: null, timingEndsAt: null, stage: 'rpe', recordedReps: { '1:1': '12' },
    });
    expect(s).toMatchObject({ restEndsAt: null, timingEndsAt: null, stage: 'rpe', recordedReps: { '1:1': '12' } });
  });
  it('over puede reemplazar restTimes/exerciseLog y fijar currentSide', () => {
    const s = buildSnapshot('sid', refs, 'timing', 0, { currentSide: 2, restTimes: [], exerciseLog: [] });
    expect(s.currentSide).toBe(2);
    expect(s.restTimes).toEqual([]);
    expect(s.exerciseLog).toEqual([]);
  });
});

describe('v3-ref-1 · session-runner usa el hook', () => {
  const runner = readFileSync(
    resolve(__dirname, '../app/[locale]/(session)/session/[id]/session-runner.tsx'), 'utf-8');
  it('ya no llama saveSnapshot directo', () => {
    expect(runner).not.toMatch(/\bsaveSnapshot\(/);
    expect((runner.match(/\bsaveSnap\(/g) || []).length).toBe(11);
    expect(runner).toContain('useRunnerSnapshot');
  });
});
