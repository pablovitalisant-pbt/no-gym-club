import type { SessionExercise } from '@/lib/types/session';

export type SegmentKind = 'ready' | 'work' | 'rest' | 'reps';
export type RunMode = 'auto' | 'manual';

export interface Segment {
  kind: SegmentKind;
  exerciseIndex: number;
  /** 1-based para work/rest; 0 para ready. */
  set: number;
  side?: 'left' | 'right';
  seconds: number;
  nextLabel?: string;
  /** Segmento que no corre solo: espera a `advance`. */
  waitsForUser?: boolean;
}

export interface ContinuousState {
  /** -1 antes de entrar al primer segmento; timeline.length = terminado. */
  index: number;
  remaining: number;
  running: boolean;
  updatedAt: number;
  mode: RunMode;
  /** Clave `${exerciseIndex}:${slot}` → reps registradas en el momento. */
  reps: Record<string, string>;
}

export interface TickResult {
  index: number;
  remaining: number;
  done: boolean;
  waiting?: boolean;
}

export const READY_SECONDS = 10;
export const SECONDS_PER_REP = 3;
export const MIN_ESTIMATE_SECONDS = 20;

/** Estimación: tope del rango de reps × 3 s, mínimo 20 s. Sin números → mínimo. */
export function estimateWorkSeconds(reps?: string): number {
  const nums = (reps ?? '').match(/\d+/g);
  if (!nums) return MIN_ESTIMATE_SECONDS;
  return Math.max(MIN_ESTIMATE_SECONDS, Math.max(...nums.map(Number)) * SECONDS_PER_REP);
}

export function buildTimeline(exercises: SessionExercise[]): Segment[] {
  if (exercises.length === 0) return [];
  const timeline: Segment[] = [
    {
      kind: 'ready',
      exerciseIndex: 0,
      set: 0,
      seconds: READY_SECONDS,
      nextLabel: exercises[0].exercise,
    },
  ];

  exercises.forEach((ex, i) => {
    const sets = ex.sets ?? 1;
    const rest = ex.rest_seconds ?? 0;
    // Con reps prescritas (y sin duración) el trabajo se mide por repeticiones:
    // work_seconds se ignora y cada serie espera al usuario.
    const byReps = Boolean(ex.reps?.trim()) && ex.duration_seconds == null;
    const work = ex.work_seconds ?? ex.duration_seconds ?? MIN_ESTIMATE_SECONDS;
    const isLast = i === exercises.length - 1;
    const nextIdx = i + 1;

    for (let set = 1; set <= sets; set++) {
      const kind: SegmentKind = byReps ? 'reps' : 'work';
      const seconds = byReps ? 0 : work;
      const waitsForUser = byReps ? true : undefined;
      if (ex.bilateral) {
        timeline.push({ kind, exerciseIndex: i, set, side: 'left', seconds, waitsForUser });
        timeline.push({ kind, exerciseIndex: i, set, side: 'right', seconds, waitsForUser });
      } else {
        timeline.push({ kind, exerciseIndex: i, set, seconds, waitsForUser });
      }
      if (rest > 0 && !(isLast && set === sets)) {
        timeline.push({
          kind: 'rest',
          exerciseIndex: i,
          set,
          seconds: rest,
          nextLabel:
            set === sets && nextIdx < exercises.length
              ? exercises[nextIdx].exercise
              : ex.exercise,
        });
      }
    }
  });

  return timeline;
}

export function totalSeconds(timeline: Segment[]): number {
  return timeline.reduce((sum, s) => sum + s.seconds, 0);
}

/** Estado inicial: arranca en el segmento ready (siempre primero en buildTimeline). */
export function start(now: number, mode: RunMode = 'auto'): ContinuousState {
  return { index: 0, remaining: READY_SECONDS, running: true, updatedAt: now, mode, reps: {} };
}

export function pause(state: ContinuousState, now: number): ContinuousState {
  return freeze(state, now, false);
}

export function resume(state: ContinuousState, now: number): ContinuousState {
  return { ...state, running: true, updatedAt: now };
}

/** Marca el segmento actual como vencido; el siguiente tick entra al próximo. */
export function skip(state: ContinuousState, now: number): ContinuousState {
  return { ...freeze(state, now, state.running), remaining: -1e-9 };
}

export function stop(): ContinuousState {
  return { index: -1, remaining: 0, running: false, updatedAt: 0, mode: 'auto', reps: {} };
}

/** Sale de un segmento que espera al usuario (ej. "Serie hecha"), al siguiente. */
export function advance(
  state: ContinuousState,
  timeline: Segment[],
  now: number,
): ContinuousState {
  const next = state.index + 1;
  if (next >= timeline.length) {
    return { ...state, index: timeline.length, remaining: 0, updatedAt: now };
  }
  return { ...state, index: next, remaining: timeline[next].seconds, updatedAt: now };
}

/** Cambia auto/manual en medio de la sesión; al pasar a auto avanza lo ya vencido. */
export function setMode(state: ContinuousState, mode: RunMode, now: number): ContinuousState {
  const frozen = freeze(state, now, state.running);
  if (mode === 'auto' && frozen.remaining <= 0) frozen.remaining = -1e-9;
  return { ...frozen, mode };
}

/** Registra reps de una serie en el momento (inmutable). */
export function recordReps(
  state: ContinuousState,
  key: string,
  value: string,
): ContinuousState {
  return { ...state, reps: { ...state.reps, [key]: value } };
}

export function tick(state: ContinuousState, timeline: Segment[], now: number): TickResult {
  const current = timeline[state.index];
  // Los reps esperan siempre, aunque pase el tiempo.
  if (current?.waitsForUser) return { index: state.index, remaining: 0, done: false, waiting: true };

  let remaining = state.remaining;
  if (state.running) remaining -= (now - state.updatedAt) / 1000;

  if (state.mode === 'manual') {
    if (!current) return { index: timeline.length, remaining: 0, done: true };
    return remaining <= 0
      ? { index: state.index, remaining: 0, done: false, waiting: true }
      : { index: state.index, remaining: Math.ceil(remaining), done: false, waiting: false };
  }

  let i = state.index;
  while (i < timeline.length && remaining <= 0) {
    i++;
    if (i < timeline.length) {
      if (timeline[i].waitsForUser) return { index: i, remaining: 0, done: false, waiting: true };
      remaining += timeline[i].seconds;
    }
  }

  const done = i >= timeline.length;
  return {
    index: Math.min(i, timeline.length),
    remaining: done ? 0 : Math.max(0, Math.ceil(remaining)),
    done,
    waiting: false,
  };
}

function freeze(state: ContinuousState, now: number, running: boolean): ContinuousState {
  const remaining = state.running
    ? state.remaining - (now - state.updatedAt) / 1000
    : state.remaining;
  return { ...state, remaining, running, updatedAt: now };
}
