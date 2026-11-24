import type { SessionData } from '@/lib/types/session';
import { estimateSessionMinutes, sessionExercises } from '@/lib/plan/session-summary';
import { TOTAL_DAYS } from '@/lib/plan/plan';
import type { RunnerSnapshot } from './runner-persistence';

export type SessionEntry = 'done' | 'summary' | 'rpe' | 'continuous' | 'idle';

/** Lo que aporta el navegador (localStorage) a la decisión de pantalla. */
export type EntrySnapshot =
  | { stage: 'summary' | 'rpe' }
  | { continuousDone: boolean }
  | null;

/** Decide qué pantalla mostrar al entrar a /session/[id]. */
export function resolveSessionEntry(
  row: { completed_at: string | null; rpe: number | null },
  snapshot: EntrySnapshot,
): SessionEntry {
  if (row.completed_at != null || row.rpe != null) return 'done';
  if (!snapshot) return 'idle';
  if ('stage' in snapshot) return snapshot.stage;
  return snapshot.continuousDone ? 'summary' : 'continuous';
}

/** Resume el snapshot local en la forma que consume resolveSessionEntry. */
export function snapshotForEntry(
  runner: RunnerSnapshot | null,
  continuous: { state: import('./continuous').ContinuousState } | null,
  continuousDone = false,
): EntrySnapshot {
  if (runner?.stage === 'summary' || runner?.stage === 'rpe') {
    return { stage: runner.stage };
  }
  if (continuous) return { continuousDone };
  return null;
}

export interface SessionOutcome {
  exerciseCount: number;
  exerciseNames: string[];
  minutes: number;
  rpe: number | null;
  dayNumber: number | null;
  totalDays: number;
}

/** Datos del resumen final del día. */
export function sessionOutcome(
  session: SessionData,
  rpe: number | null,
  planDayIndex: number | null,
): SessionOutcome {
  const exercises = sessionExercises(session);
  return {
    exerciseCount: exercises.length,
    exerciseNames: exercises.map((ex) => ex.exercise),
    minutes: estimateSessionMinutes(session),
    rpe,
    dayNumber: planDayIndex == null ? null : planDayIndex + 1,
    totalDays: TOTAL_DAYS,
  };
}
