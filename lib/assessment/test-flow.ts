import type { PushupVariant } from './validate';

/** valor inferior (minutos) de cada rango del test de caminata */
export const WALK_MINUTES = { '0': 0, '5': 5, '10': 10, '20': 20, '30': 30 } as const;
export type WalkRangeKey = keyof typeof WALK_MINUTES;

export interface TestAnswers {
  pushup: PushupVariant;
  pushupReps: number;
  sitToStand: number | null;
  plankType: 'knee' | 'full';
  plankSeconds: number | null;
  deadHangSeconds: number | null;
  maxPullups: number | null;
  walk: WalkRangeKey | null;
}

/** respuestas del wizard → payload de saveTestResults (columnas v2 + legado en 0) */
export function buildTestResults(a: TestAnswers) {
  return {
    max_pushups: a.pushup === 'floor' ? a.pushupReps : 0,
    max_pullups: a.maxPullups ?? 0,
    max_squats: 0,
    max_dips: 0,
    plank_seconds: a.plankType === 'full' ? a.plankSeconds ?? 0 : 0,
    pushup_variant: a.pushup,
    pushup_variant_reps: a.pushup === 'none' ? 0 : a.pushupReps,
    dead_hang_seconds: a.deadHangSeconds,
    knee_plank_seconds: a.plankType === 'knee' ? a.plankSeconds : null,
    sit_to_stand_30s: a.sitToStand,
    walk_minutes: a.walk === null ? null : WALK_MINUTES[a.walk],
  };
}
