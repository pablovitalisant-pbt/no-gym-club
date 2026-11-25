import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeRestore,
  applyRestore,
  type RestoreTargets,
} from '../lib/session/restore';
import type { RunnerSnapshot } from '../lib/session/runner-persistence';
import type { SessionExercise } from '../lib/types/session';

// Plancha bilateral temporizada, sentadilla por reps y remo temporizado unilateral.
const exercises: SessionExercise[] = [
  { exercise: 'Plancha', duration_seconds: 30, bilateral: true },
  { exercise: 'Sentadilla', sets: 3, reps: '10', rest_seconds: 60 },
  { exercise: 'Remo', duration_seconds: 45 },
];
const now = 1_000_000;

function snap(over: Partial<RunnerSnapshot> = {}): RunnerSnapshot {
  return {
    sessionId: 's1',
    state: 'active',
    index: 0,
    restEndsAt: null,
    timingEndsAt: null,
    restInfo: { exerciseIndex: 0, exercise: 'Plancha', prescribedRest: 30 },
    restTimes: [],
    exerciseLog: [],
    updatedAt: now,
    ...over,
  };
}

const ctx = (entry: 'done' | 'summary' | 'rpe' | 'continuous' | 'idle' = 'idle', serverRpe: number | null = null) => ({
  entry,
  exercises,
  serverRpe,
});

describe('computeRestore — decisión pura de restauración al montar', () => {
  // ─── Pantallas de cierre (entry) ───
  it('done: usa el rpe del servidor y va a saved', () => {
    expect(computeRestore(snap(), now, ctx('done', 7))).toEqual({ entry: 'saved', savedRpe: 7 });
  });

  it('summary: retoma las reps registradas del snapshot', () => {
    const s = snap({ stage: 'summary', recordedReps: { '0:1': '12' } });
    expect(computeRestore(s, now, ctx('summary'))).toEqual({
      entry: 'summary',
      recordedReps: { '0:1': '12' },
    });
  });

  it('summary sin snapshot no restaura reps', () => {
    expect(computeRestore(null, now, ctx('summary'))).toEqual({ entry: 'summary', recordedReps: null });
  });

  it('rpe: retoma reps solo si el snapshot las trae', () => {
    expect(computeRestore(snap({ stage: 'rpe', recordedReps: { '1:1': '9' } }), now, ctx('rpe'))).toEqual({
      entry: 'rpe',
      recordedReps: { '1:1': '9' },
    });
    expect(computeRestore(snap({ stage: 'rpe' }), now, ctx('rpe'))).toEqual({ entry: 'rpe' });
  });

  it('continuous: retoma el modo de corrido sin mirar el snapshot de paso a paso', () => {
    expect(computeRestore(snap(), now, ctx('continuous'))).toEqual({ entry: 'continuous' });
  });

  it('sin snapshot y sin entry de cierre no restaura nada (inválido/otra sesión/vencido)', () => {
    expect(computeRestore(null, now, ctx('idle'))).toEqual({ entry: 'none' });
  });

  // ─── Rest ───
  it('rest vigente: conserva endsAt y los segundos restantes', () => {
    const endsAt = now + 30_000;
    const action = computeRestore(snap({ state: 'rest', index: 1, restEndsAt: endsAt }), now, ctx());
    expect(action).toMatchObject({
      entry: 'snapshot',
      state: 'rest',
      index: 1,
      side: null,
      rest: { endsAt, remaining: 30, expired: false },
      timing: null,
    });
  });

  it('rest expirado: remaining 0 sin rama de timing', () => {
    const endsAt = now - 5_000;
    const action = computeRestore(snap({ state: 'rest', index: 1, restEndsAt: endsAt }), now, ctx());
    expect(action).toMatchObject({
      entry: 'snapshot',
      state: 'rest',
      rest: { endsAt, remaining: 0, expired: true },
      timing: null,
    });
  });

  it('rest sin restEndsAt cae al restaurado genérico, sin rama rest', () => {
    const action = computeRestore(snap({ state: 'rest', index: 1, restEndsAt: null }), now, ctx());
    expect(action).toMatchObject({ entry: 'snapshot', state: 'rest', rest: null, timing: null });
  });

  // ─── Timing ───
  it('timing vigente lado 1 bilateral: al expirar debe pasar al lado 2', () => {
    const endsAt = now + 5_000;
    const action = computeRestore(
      snap({ state: 'timing', index: 0, timingEndsAt: endsAt, currentSide: 1 }),
      now,
      ctx(),
    );
    expect(action).toMatchObject({
      entry: 'snapshot',
      state: 'timing',
      side: 1,
      timing: { endsAt, remaining: 5, expired: false, tick: false, restartSide2: true, duration: 30 },
    });
  });

  it('timing vigente con 3s o menos pide tick', () => {
    const action = computeRestore(
      snap({ state: 'timing', index: 0, timingEndsAt: now + 3_000, currentSide: 1 }),
      now,
      ctx(),
    );
    expect((action as any).timing.tick).toBe(true);
  });

  it('timing vigente lado 2 no reinicia lado 2', () => {
    const action = computeRestore(
      snap({ state: 'timing', index: 0, timingEndsAt: now + 5_000, currentSide: 2 }),
      now,
      ctx(),
    );
    expect((action as any).timing.restartSide2).toBe(false);
  });

  it('timing vigente unilateral no reinicia lado 2', () => {
    const action = computeRestore(
      snap({ state: 'timing', index: 2, timingEndsAt: now + 10_000, currentSide: 1 }),
      now,
      ctx(),
    );
    expect((action as any).timing).toMatchObject({ restartSide2: false, duration: 45 });
  });

  it('timing expirado lado 1 bilateral: reinicia lado 2 con la duración prescrita', () => {
    const action = computeRestore(
      snap({ state: 'timing', index: 0, timingEndsAt: now - 1_000, currentSide: 1 }),
      now,
      ctx(),
    );
    expect(action).toMatchObject({
      entry: 'snapshot',
      state: 'timing',
      side: 1,
      timing: { remaining: 0, expired: true, restartSide2: true, duration: 30 },
    });
  });

  it('timing expirado lado 2: termina el ejercicio, no reinicia', () => {
    const action = computeRestore(
      snap({ state: 'timing', index: 0, timingEndsAt: now - 1_000, currentSide: 2 }),
      now,
      ctx(),
    );
    expect(action).toMatchObject({ entry: 'snapshot', state: 'timing', side: 2, timing: { expired: true, restartSide2: false } });
  });

  it('timing sin timingEndsAt cae al restaurado genérico', () => {
    const action = computeRestore(snap({ state: 'timing', currentSide: 1, timingEndsAt: null }), now, ctx());
    expect(action).toMatchObject({ entry: 'snapshot', state: 'timing', rest: null, timing: null });
  });

  // ─── Otros estados ───
  it('reps: restaura estado e índice (sin ramas de temporizador)', () => {
    expect(computeRestore(snap({ state: 'reps', index: 1 }), now, ctx())).toMatchObject({
      entry: 'snapshot',
      state: 'reps',
      index: 1,
      side: null,
      rest: null,
      timing: null,
    });
  });

  it('active lado 2: restaura el lado', () => {
    expect(computeRestore(snap({ state: 'active', index: 0, currentSide: 2 }), now, ctx())).toMatchObject({
      entry: 'snapshot',
      state: 'active',
      side: 2,
    });
  });
});

// ─── Efectos de la acción (mismos que el efecto de montaje original) ───

function targets(over: Partial<RestoreTargets> = {}): RestoreTargets {
  const ref = <T,>(value: T) => ({ current: value });
  return {
    total: exercises.length,
    timerRef: ref<ReturnType<typeof setInterval> | null>(null),
    restEndsAtRef: ref<number | null>(null),
    timingEndsAtRef: ref<number | null>(null),
    sideRef: ref<1 | 2 | null>(null),
    recordedRepsRef: ref<Record<string, string> | null>(null),
    restInfoRef: ref({ exerciseIndex: 0, exercise: '', prescribedRest: 0 }),
    restTimesRef: ref([]),
    exerciseLogRef: ref([]),
    audioRef: ref(true),
    recordActualRest: vi.fn(),
    finishExercise: vi.fn(),
    saveSnap: vi.fn(),
    setState: vi.fn(),
    setIndex: vi.fn(),
    setRestSeconds: vi.fn(),
    setTimingSeconds: vi.fn(),
    setSide: vi.fn(),
    setRecordedReps: vi.fn(),
    setSavedRpe: vi.fn(),
    playTick: vi.fn(),
    playTransition: vi.fn(),
    ...over,
  };
}

describe('applyRestore — efectos idénticos al efecto de montaje', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('rest vigente: cuenta atrás y al llegar a 0 registra el descanso y avanza', () => {
    const d = targets();
    const endsAt = Date.now() + 3_000;
    applyRestore(
      computeRestore(snap({ state: 'rest', index: 1, restEndsAt: endsAt }), Date.now(), ctx()),
      d,
    );
    expect(d.setRestSeconds).toHaveBeenCalledWith(3);
    expect(d.restEndsAtRef.current).toBe(endsAt);
    vi.advanceTimersByTime(3_000);
    expect(d.recordActualRest).toHaveBeenCalledTimes(1);
    expect(d.playTransition).toHaveBeenCalledTimes(1);
    expect(d.setState).toHaveBeenCalledWith('active');
    expect(d.finishExercise).not.toHaveBeenCalled();
    expect(d.saveSnap).not.toHaveBeenCalled();
  });

  it('rest expirado: cierra el ejercicio sin persistir snapshot (comportamiento previo)', () => {
    const d = targets();
    applyRestore(
      computeRestore(snap({ state: 'rest', index: 1, restEndsAt: Date.now() - 1_000 }), Date.now(), ctx()),
      d,
    );
    expect(d.finishExercise).toHaveBeenCalledWith(1);
    expect(d.setRestSeconds).toHaveBeenCalledWith(0);
    expect(d.restEndsAtRef.current).toBeNull();
    expect(d.saveSnap).not.toHaveBeenCalled();
    expect(d.recordActualRest).not.toHaveBeenCalled();
  });

  it('timing expirado lado 1: arranca lado 2, persiste currentSide y cierra al terminar', () => {
    const d = targets();
    applyRestore(
      computeRestore(
        snap({ state: 'timing', index: 0, timingEndsAt: Date.now() - 1_000, currentSide: 1 }),
        Date.now(),
        ctx(),
      ),
      d,
    );
    expect(d.setSide).toHaveBeenCalledWith(2);
    expect(d.saveSnap).toHaveBeenCalledWith('timing', 0, { currentSide: 2 });
    expect(d.playTransition).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    expect(d.finishExercise).toHaveBeenCalledWith(0);
    expect(d.timingEndsAtRef.current).toBeNull();
  });

  it('timing expirado lado 2 avanza directo por finishExercise (divergencia previa, sin handleDone)', () => {
    const d = targets();
    applyRestore(
      computeRestore(
        snap({ state: 'timing', index: 0, timingEndsAt: Date.now() - 1_000, currentSide: 2 }),
        Date.now(),
        ctx(),
      ),
      d,
    );
    expect(d.finishExercise).toHaveBeenCalledWith(0);
    // setSide(2) solo restaura el lado persistido; no arranca una sesión nueva de lado 2.
    expect(d.setTimingSeconds).toHaveBeenCalledWith(0);
    expect(d.setTimingSeconds).not.toHaveBeenCalledWith(30);
    expect(d.saveSnap).not.toHaveBeenCalled();
  });

  it('timing vigente lado 1: tick al montar y reinicio de lado 2 al expirar', () => {
    const d = targets();
    applyRestore(
      computeRestore(
        snap({ state: 'timing', index: 0, timingEndsAt: Date.now() + 3_000, currentSide: 1 }),
        Date.now(),
        ctx(),
      ),
      d,
    );
    expect(d.playTick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3_000);
    expect(d.setSide).toHaveBeenCalledWith(2);
    expect(d.saveSnap).toHaveBeenCalledWith('timing', 0, { currentSide: 2 });
    vi.advanceTimersByTime(30_000);
    expect(d.finishExercise).toHaveBeenCalledWith(0);
  });

  it('sin audio no reproduce sonidos de restauración', () => {
    const d = targets({ audioRef: { current: false } });
    applyRestore(
      computeRestore(snap({ state: 'rest', index: 1, restEndsAt: Date.now() + 2_000 }), Date.now(), ctx()),
      d,
    );
    vi.advanceTimersByTime(2_000);
    expect(d.playTransition).not.toHaveBeenCalled();
    expect(d.recordActualRest).toHaveBeenCalledTimes(1);
  });

  it('restaura refs y pantallas de cierre como el efecto original', () => {
    const d = targets();
    const restTimes = [{ exerciseIndex: 0, exercise: 'Plancha', prescribedRest: 30, actualRest: 28 }];
    applyRestore(
      computeRestore(snap({ state: 'active', index: 1, restTimes }), Date.now(), ctx()),
      d,
    );
    expect(d.restTimesRef.current).toBe(restTimes);
    expect(d.setState).toHaveBeenCalledWith('active');
    expect(d.setIndex).toHaveBeenCalledWith(1);

    const saved = targets();
    applyRestore(computeRestore(snap(), Date.now(), ctx('done', 6)), saved);
    expect(saved.setSavedRpe).toHaveBeenCalledWith(6);
    expect(saved.setState).toHaveBeenCalledWith('saved');
    expect(saved.restTimesRef.current).toEqual([]);
  });
});
