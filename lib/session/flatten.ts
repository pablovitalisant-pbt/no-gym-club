import type { SessionData, SessionExercise } from '@/lib/types/session';

export type SessionSection =
  | 'warmup'
  | 'main'
  | 'finisher'
  | 'cardio'
  | 'cooldown';

export interface FlatExercise extends SessionExercise {
  section: SessionSection;
}

const ORDER: SessionSection[] = ['warmup', 'main', 'finisher', 'cardio', 'cooldown'];

export function flattenSession(session: SessionData): FlatExercise[] {
  return ORDER.flatMap((section) =>
    (session[section] ?? []).map((e) => ({ ...e, section })),
  );
}
