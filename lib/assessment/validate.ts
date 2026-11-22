export const TRAINING_HISTORY = ['never', 'past', 'active'] as const;
export type TrainingHistory = (typeof TRAINING_HISTORY)[number];

export const HEALTH_LIMITATIONS = [
  'knees',
  'lower_back',
  'shoulders',
  'wrists',
  'hips',
  'other',
] as const;
export type HealthLimitation = (typeof HEALTH_LIMITATIONS)[number];

export const CARDIO_PREFERENCES = ['none', 'light', 'moderate', 'intense'] as const;
export type CardioPreference = (typeof CARDIO_PREFERENCES)[number];

export const PUSHUP_VARIANTS = ['floor', 'knee', 'incline', 'wall', 'none'] as const;
export type PushupVariant = (typeof PUSHUP_VARIANTS)[number];

export const FOCUS_AREAS = [
  'chest',
  'shoulders',
  'back',
  'arms',
  'legs',
  'glutes',
  'core',
  'skill_pullup',
  'skill_handstand',
  'skill_muscleup',
  'skill_pistol',
] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface ProfileV2 {
  training_history: TrainingHistory | null;
  health_limitations: HealthLimitation[];
  limitations_notes: string | null;
  cardio_preference: CardioPreference;
  timezone: string | null;
  focus_areas: FocusArea[];
  focus_notes: string | null;
}

export const TEST_METRICS = [
  'pushup_variant_reps',
  'dead_hang_seconds',
  'knee_plank_seconds',
  'sit_to_stand_30s',
  'walk_minutes',
  'max_pushups',
  'max_pullups',
  'max_squats',
  'max_dips',
  'plank_seconds',
] as const;
export type TestMetric = (typeof TEST_METRICS)[number];

export interface TestResultsV2 extends Record<TestMetric, number | null> {
  pushup_variant: PushupVariant;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** enteros >= 0 o null; undefined cuenta como null */
function validCount(v: unknown): boolean {
  return v === undefined || v === null || (Number.isInteger(v) && (v as number) >= 0);
}

export function validateProfileV2(input: unknown): Result<ProfileV2> {
  const src = input === undefined || input === null ? {} : input;
  if (!isRecord(src)) return { ok: false, error: 'invalid profile payload' };

  const rawHistory = src.training_history;
  if (rawHistory !== undefined && rawHistory !== null) {
    if (!TRAINING_HISTORY.includes(rawHistory as TrainingHistory)) {
      return { ok: false, error: 'invalid training_history' };
    }
  }

  const rawLimits = src.health_limitations ?? [];
  if (!Array.isArray(rawLimits)) {
    return { ok: false, error: 'health_limitations must be an array' };
  }
  const limits = rawLimits as unknown[];
  if (limits.some((l) => !HEALTH_LIMITATIONS.includes(l as HealthLimitation))) {
    return { ok: false, error: 'unknown health limitation' };
  }
  if (new Set(limits).size !== limits.length) {
    return { ok: false, error: 'duplicate health limitation' };
  }

  const rawNotes = src.limitations_notes;
  if (rawNotes !== undefined && rawNotes !== null && typeof rawNotes !== 'string') {
    return { ok: false, error: 'limitations_notes must be text' };
  }

  const rawCardio = src.cardio_preference ?? 'none';
  if (!CARDIO_PREFERENCES.includes(rawCardio as CardioPreference)) {
    return { ok: false, error: 'invalid cardio_preference' };
  }

  const rawTz = src.timezone;
  if (
    rawTz !== undefined &&
    rawTz !== null &&
    (typeof rawTz !== 'string' || rawTz.trim() === '')
  ) {
    return { ok: false, error: 'timezone must be text' };
  }

  const rawFocus = src.focus_areas ?? [];
  if (!Array.isArray(rawFocus)) {
    return { ok: false, error: 'focus_areas must be an array' };
  }
  const focus = rawFocus as unknown[];
  if (focus.some((f) => !FOCUS_AREAS.includes(f as FocusArea))) {
    return { ok: false, error: 'unknown focus area' };
  }
  if (focus.length > 3) {
    return { ok: false, error: 'too many focus areas' };
  }
  if (new Set(focus).size !== focus.length) {
    return { ok: false, error: 'duplicate focus area' };
  }

  const rawFocusNotes = src.focus_notes;
  if (
    rawFocusNotes !== undefined &&
    rawFocusNotes !== null &&
    (typeof rawFocusNotes !== 'string' || rawFocusNotes.length > 300)
  ) {
    return { ok: false, error: 'focus_notes must be text up to 300 chars' };
  }

  return {
    ok: true,
    value: {
      training_history: (rawHistory as TrainingHistory | null) ?? null,
      health_limitations: limits as HealthLimitation[],
      limitations_notes: (rawNotes as string | null) ?? null,
      cardio_preference: rawCardio as CardioPreference,
      timezone: (rawTz as string | null) ?? null,
      focus_areas: focus as FocusArea[],
      focus_notes: (rawFocusNotes as string | null) ?? null,
    },
  };
}

export function validateTestResultsV2(input: unknown): Result<TestResultsV2> {
  if (!isRecord(input)) return { ok: false, error: 'invalid test payload' };

  const variant = input.pushup_variant;
  if (!PUSHUP_VARIANTS.includes(variant as PushupVariant)) {
    return { ok: false, error: 'invalid pushup_variant' };
  }

  for (const key of TEST_METRICS) {
    if (!validCount(input[key])) {
      return { ok: false, error: `invalid ${key}` };
    }
  }

  const metrics = {} as Record<TestMetric, number | null>;
  for (const key of TEST_METRICS) {
    metrics[key] = (input[key] as number | null | undefined) ?? null;
  }

  return {
    ok: true,
    value: { pushup_variant: variant as PushupVariant, ...metrics },
  };
}
