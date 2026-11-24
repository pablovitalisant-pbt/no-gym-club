import type { SessionExercise } from '@/lib/types/session';
import type { ContinuousState, Segment, SegmentKind } from './continuous';
import { tick } from './continuous';

export type StartOption = 'continuous' | 'step';

export type InitialRunnerState = 'continuous' | 'summary' | 'idle';

/** Estado con el que debe montar el runner si hay un snapshot continuo persistido. */
export function resumeRunnerState(
  snapshot: { state: ContinuousState } | null,
  timeline: Segment[],
  now: number,
): InitialRunnerState {
  if (!snapshot) return 'idle';
  return tick(snapshot.state, timeline, now).done ? 'summary' : 'continuous';
}

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

/** Claves de reps de un ejercicio: `${index}:${slot}`; bilateral = serie*2+lado. */
export function repsSlotKeys(target: RepsTarget): string[] {
  const keys: string[] = [];
  for (let set = 1; set <= target.sets; set++) {
    if (target.bilateral) {
      keys.push(`${target.index}:${set * 2}`, `${target.index}:${set * 2 + 1}`);
    } else {
      keys.push(`${target.index}:${set}`);
    }
  }
  return keys;
}

function topOfRange(reps: string): string {
  const nums = reps.match(/\d+/g);
  return nums ? String(Math.max(...nums.map(Number))) : reps;
}

/** Valores iniciales de reps del snapshot, con el tope del rango prescrito. */
export function repsDefaults(exercises: SessionExercise[]): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const target of repsTargets(exercises)) {
    const top = topOfRange(target.reps);
    for (const key of repsSlotKeys(target)) defaults[key] = top;
  }
  return defaults;
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
  recorded?: Record<string, string>,
): FinalRepEntry[] {
  return targets.map((t) => ({
    exercise: t.exercise,
    prescribedSets: t.sets,
    prescribedReps: t.reps,
    actualReps: repsSlotKeys(t).map(
      (key, slot) => recorded?.[key] ?? inputs[t.index]?.[slot] ?? t.reps,
    ),
    bilateral: t.bilateral,
  }));
}
