import type { MutableRefObject } from 'react';
import type { SessionEntry } from './entry';
import type { RunnerSnapshot } from './runner-persistence';
import type { SnapshotOver } from './useRunnerSnapshot';
import type { SessionExercise } from '@/lib/types/session';
import { startCountdown } from './startCountdown';

export type RestoreSide = 1 | 2 | null;

export interface RestoreRest {
  endsAt: number;
  remaining: number;
  expired: boolean;
}

export interface RestoreTiming extends RestoreRest {
  /** Debe sonar el tick al montar (3s o menos restantes). */
  tick: boolean;
  /** Al expirar hay que arrancar el lado 2 (bilateral, lado 1). */
  restartSide2: boolean;
  /** Duración prescrita del lado 2. */
  duration: number;
}

export type RestoreAction =
  | { entry: 'none' }
  | { entry: 'saved'; savedRpe: number | null }
  | { entry: 'summary'; recordedReps: Record<string, string> | null }
  | { entry: 'rpe'; recordedReps?: Record<string, string> }
  | { entry: 'continuous' }
  | {
      entry: 'snapshot';
      state: string;
      index: number;
      side: RestoreSide;
      restInfo: RunnerSnapshot['restInfo'];
      restTimes: RunnerSnapshot['restTimes'];
      exerciseLog: RunnerSnapshot['exerciseLog'];
      rest: RestoreRest | null;
      timing: RestoreTiming | null;
    };

export interface RestoreContext {
  entry: SessionEntry;
  exercises: SessionExercise[];
  serverRpe: number | null;
}

function secondsUntil(endsAt: number, now: number): number {
  return Math.max(0, Math.round((endsAt - now) / 1000));
}

/** Decide qué hacer al montar. Pura: no toca refs ni estado, solo describe la acción. */
export function computeRestore(
  snapshot: RunnerSnapshot | null,
  now: number,
  { entry, exercises, serverRpe }: RestoreContext,
): RestoreAction {
  if (entry === 'done') return { entry: 'saved', savedRpe: serverRpe };
  if (entry === 'summary') return { entry: 'summary', recordedReps: snapshot?.recordedReps ?? null };
  if (entry === 'rpe') {
    return snapshot?.recordedReps
      ? { entry: 'rpe', recordedReps: snapshot.recordedReps }
      : { entry: 'rpe' };
  }
  if (entry === 'continuous') return { entry: 'continuous' };
  if (!snapshot) return { entry: 'none' };

  const base = {
    entry: 'snapshot' as const,
    state: snapshot.state,
    index: snapshot.index,
    side: snapshot.currentSide != null ? (snapshot.currentSide as 1 | 2) : null,
    restInfo: snapshot.restInfo,
    restTimes: snapshot.restTimes,
    exerciseLog: snapshot.exerciseLog,
  };

  if (snapshot.state === 'rest' && snapshot.restEndsAt != null) {
    const remaining = secondsUntil(snapshot.restEndsAt, now);
    return {
      ...base,
      rest: { endsAt: snapshot.restEndsAt, remaining, expired: remaining <= 0 },
      timing: null,
    };
  }

  if (snapshot.state === 'timing' && snapshot.timingEndsAt != null) {
    const remaining = secondsUntil(snapshot.timingEndsAt, now);
    const restoreEx = exercises[snapshot.index];
    const restartSide2 = !!(restoreEx?.bilateral && snapshot.currentSide === 1);
    return {
      ...base,
      rest: null,
      timing: {
        endsAt: snapshot.timingEndsAt,
        remaining,
        expired: remaining <= 0,
        tick: remaining >= 1 && remaining <= 3,
        restartSide2,
        duration: restoreEx?.duration_seconds ?? 0,
      },
    };
  }

  return { ...base, rest: null, timing: null };
}

export interface RestoreTargets {
  total: number;
  timerRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  restEndsAtRef: MutableRefObject<number | null>;
  timingEndsAtRef: MutableRefObject<number | null>;
  sideRef: MutableRefObject<RestoreSide>;
  recordedRepsRef: MutableRefObject<Record<string, string> | null>;
  restInfoRef: MutableRefObject<RunnerSnapshot['restInfo']>;
  restTimesRef: MutableRefObject<RunnerSnapshot['restTimes']>;
  exerciseLogRef: MutableRefObject<RunnerSnapshot['exerciseLog']>;
  audioRef: MutableRefObject<boolean>;
  recordActualRest: () => void;
  finishExercise: (index: number) => void;
  saveSnap: (state: string, index: number, over?: SnapshotOver) => void;
  setState: (state: string) => void;
  setIndex: (value: number | ((prev: number) => number)) => void;
  setRestSeconds: (seconds: number) => void;
  setTimingSeconds: (seconds: number) => void;
  setSide: (side: RestoreSide) => void;
  setRecordedReps: (reps: Record<string, string> | null) => void;
  setSavedRpe: (rpe: number | null) => void;
  playTick: () => void;
  playTransition: () => void;
}

function applyRest(rest: RestoreRest, index: number, d: RestoreTargets): void {
  d.restEndsAtRef.current = rest.endsAt;
  if (rest.remaining > 0) {
    d.setRestSeconds(rest.remaining);
    startCountdown(d.timerRef, d.restEndsAtRef, {
      onTick: d.setRestSeconds,
      onEnd: () => {
        d.restEndsAtRef.current = null;
        d.recordActualRest();
        if (d.audioRef.current) d.playTransition();
        d.setState('active');
        d.setIndex((i) => (i < d.total - 1 ? i + 1 : i));
      },
    });
    return;
  }
  // Descanso ya vencido: cierra el ejercicio sin persistir snapshot (comportamiento previo).
  d.restEndsAtRef.current = null;
  d.setRestSeconds(0);
  d.finishExercise(index);
}

function applyTiming(t: RestoreTiming, index: number, d: RestoreTargets): void {
  const startSide2 = () => {
    if (d.audioRef.current) d.playTransition();
    d.timingEndsAtRef.current = Date.now() + t.duration * 1000;
    d.sideRef.current = 2;
    d.setSide(2);
    d.setTimingSeconds(t.duration);
    startCountdown(d.timerRef, d.timingEndsAtRef, {
      onTick: d.setTimingSeconds,
      onEnd: () => {
        d.timingEndsAtRef.current = null;
        d.finishExercise(index);
      },
    });
    d.saveSnap('timing', index, { currentSide: 2 });
  };

  d.timingEndsAtRef.current = t.endsAt;
  if (t.remaining > 0) {
    d.setTimingSeconds(t.remaining);
    if (d.audioRef.current && t.tick) d.playTick();
    startCountdown(d.timerRef, d.timingEndsAtRef, {
      onTick: d.setTimingSeconds,
      onEnd: () => {
        if (t.restartSide2) {
          startSide2();
          return;
        }
        d.timingEndsAtRef.current = null;
        d.finishExercise(index);
      },
    });
    return;
  }

  d.timingEndsAtRef.current = null;
  d.setTimingSeconds(0);
  if (t.restartSide2) startSide2();
  else d.finishExercise(index);
}

/** Aplica la acción de computeRestore con el mismo orden de efectos que el montaje original. */
export function applyRestore(action: RestoreAction, d: RestoreTargets): void {
  switch (action.entry) {
    case 'none':
      return;
    case 'saved':
      d.setSavedRpe(action.savedRpe);
      d.setState('saved');
      return;
    case 'summary':
      d.recordedRepsRef.current = action.recordedReps;
      d.setRecordedReps(action.recordedReps);
      d.setState('summary');
      return;
    case 'rpe':
      if (action.recordedReps) {
        d.recordedRepsRef.current = action.recordedReps;
        d.setRecordedReps(action.recordedReps);
      }
      d.setState('done');
      return;
    case 'continuous':
      d.setState('continuous');
      return;
    case 'snapshot':
      break;
  }

  d.restTimesRef.current = action.restTimes;
  d.exerciseLogRef.current = action.exerciseLog;
  d.restInfoRef.current = action.restInfo;
  d.setState(action.state);
  d.setIndex(action.index);
  if (action.side != null) {
    d.sideRef.current = action.side;
    d.setSide(action.side);
  }
  if (action.rest) applyRest(action.rest, action.index, d);
  else if (action.timing) applyTiming(action.timing, action.index, d);
}
