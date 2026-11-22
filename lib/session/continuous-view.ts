import type { SessionExercise } from '@/lib/types/session';
import type { Segment, SegmentKind } from './continuous';

export type StartOption = 'continuous' | 'step';

/** Opciones de la pantalla inicial del runner según el flag. */
export function startOptions(continuousEnabled: boolean): StartOption[] {
  return continuousEnabled ? ['continuous', 'step'] : ['step'];
}

export interface SegmentView {
  phase: SegmentKind;
  exerciseName: string;
  set: number;
  sets: number;
  side?: 'left' | 'right';
  nextLabel: string | null;
  /** 0..1 — fracción de la línea de tiempo ya consumida. */
  progress: number;
}

export function segmentView(
  timeline: Segment[],
  exercises: SessionExercise[],
  index: number,
  remaining = 0,
): SegmentView | null {
  const segment = timeline[index];
  if (!segment) return null;

  const total = timeline.reduce((sum, s) => sum + s.seconds, 0);
  const before = timeline.slice(0, index).reduce((sum, s) => sum + s.seconds, 0);
  const elapsed = before + Math.max(0, segment.seconds - remaining);

  return {
    phase: segment.kind,
    exerciseName: exercises[segment.exerciseIndex]?.exercise ?? '',
    set: segment.set,
    sets: exercises[segment.exerciseIndex]?.sets ?? 0,
    side: segment.side,
    nextLabel: segment.nextLabel ?? nextExerciseLabel(timeline, exercises, index),
    progress: total > 0 ? Math.min(1, elapsed / total) : 0,
  };
}

/** Próximo ejercicio a partir del segmento actual (null en el último). */
export function nextExerciseLabel(
  timeline: Segment[],
  exercises: SessionExercise[],
  index: number,
): string | null {
  const next = timeline[index + 1];
  if (!next) return null;
  return exercises[next.exerciseIndex]?.exercise ?? null;
}

export interface RepsTarget {
  index: number;
  exercise: string;
  sets: number;
  reps: string;
  bilateral: boolean;
  /** Inputs a mostrar: series × lados. */
  slots: number;
}

/** Ejercicios de la sesión que se registran por reps. */
export function repsTargets(exercises: SessionExercise[]): RepsTarget[] {
  return exercises.flatMap((ex, index) => {
    if (!ex.sets || !ex.reps) return [];
    const bilateral = ex.bilateral ?? false;
    return [
      {
        index,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        bilateral,
        slots: ex.sets * (bilateral ? 2 : 1),
      },
    ];
  });
}

/** Inputs iniciales prellenados con el objetivo prescrito. */
export function initialRepInputs(targets: RepsTarget[]): Record<number, string[]> {
  return Object.fromEntries(
    targets.map((t) => [t.index, Array<string>(t.slots).fill(t.reps)]),
  );
}

export interface FinalRepEntry {
  exercise: string;
  prescribedSets: number;
  prescribedReps: string;
  actualReps: string[];
  bilateral: boolean;
}

/** Arma la lista completa de entradas — nunca un delta (mergeLogData reemplaza). */
export function buildRepEntries(
  targets: RepsTarget[],
  inputs: Record<number, string[]>,
): FinalRepEntry[] {
  return targets.map((t) => ({
    exercise: t.exercise,
    prescribedSets: t.sets,
    prescribedReps: t.reps,
    actualReps: inputs[t.index] ?? Array<string>(t.slots).fill(t.reps),
    bilateral: t.bilateral,
  }));
}
