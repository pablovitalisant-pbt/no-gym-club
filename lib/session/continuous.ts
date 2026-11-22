import type { SessionExercise } from '@/lib/types/session';

export type SegmentKind = 'ready' | 'work' | 'rest';

export interface Segment {
  kind: SegmentKind;
  exerciseIndex: number;
  /** 1-based para work/rest; 0 para ready. */
  set: number;
  side?: 'left' | 'right';
  seconds: number;
  nextLabel?: string;
}

export interface ContinuousState {
  /** -1 antes de entrar al primer segmento; timeline.length = terminado. */
  index: number;
  remaining: number;
  running: boolean;
  updatedAt: number;
}

export interface TickResult {
  index: number;
  remaining: number;
  done: boolean;
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
    const work =
      ex.work_seconds ?? ex.duration_seconds ?? estimateWorkSeconds(ex.reps);
    const isLast = i === exercises.length - 1;
    const nextIdx = i + 1;

    for (let set = 1; set <= sets; set++) {
      if (ex.bilateral) {
        timeline.push({ kind: 'work', exerciseIndex: i, set, side: 'left', seconds: work });
        timeline.push({ kind: 'work', exerciseIndex: i, set, side: 'right', seconds: work });
      } else {
        timeline.push({ kind: 'work', exerciseIndex: i, set, seconds: work });
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
export function start(now: number): ContinuousState {
  return { index: 0, remaining: READY_SECONDS, running: true, updatedAt: now };
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
  return { index: -1, remaining: 0, running: false, updatedAt: 0 };
}

export function tick(state: ContinuousState, timeline: Segment[], now: number): TickResult {
  let remaining = state.remaining;
  if (state.running) remaining -= (now - state.updatedAt) / 1000;

  let i = state.index;
  while (i < timeline.length && remaining <= 0) {
    i++;
    if (i < timeline.length) remaining += timeline[i].seconds;
  }

  const done = i >= timeline.length;
  return {
    index: Math.min(i, timeline.length),
    remaining: done ? 0 : Math.max(0, Math.ceil(remaining)),
    done,
  };
}

function freeze(state: ContinuousState, now: number, running: boolean): ContinuousState {
  const remaining = state.running
    ? state.remaining - (now - state.updatedAt) / 1000
    : state.remaining;
  return { ...state, remaining, running, updatedAt: now };
}
