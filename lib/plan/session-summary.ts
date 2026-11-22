import { buildTimeline, totalSeconds } from '@/lib/session/continuous';
import type { SessionData, SessionExercise } from '@/lib/types/session';

export const SESSION_SECTIONS = ['warmup', 'main', 'finisher', 'cardio', 'cooldown'] as const;
export type SessionSection = (typeof SESSION_SECTIONS)[number];

export function sectionExercises(session: SessionData, section: SessionSection): SessionExercise[] {
  return session[section] ?? [];
}

export function sessionExercises(session: SessionData): SessionExercise[] {
  return SESSION_SECTIONS.flatMap((section) => sectionExercises(session, section));
}

export function sectionMinutes(session: SessionData, section: SessionSection): number {
  return Math.max(1, Math.round(totalSeconds(buildTimeline(sectionExercises(session, section))) / 60));
}

/** Duración estimada de la sesión completa, en minutos redondeados. */
export function estimateSessionMinutes(session: SessionData): number {
  return Math.max(1, Math.round(totalSeconds(buildTimeline(sessionExercises(session))) / 60));
}
