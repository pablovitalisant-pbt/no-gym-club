import type { DayType, PlanPhase } from '../types/plan';

const DAY_TYPES: readonly DayType[] = [
  'push',
  'pull',
  'legs',
  'upper',
  'lower',
  'full',
  'skill',
  'cardio',
  'metabolic',
  'mobility',
  'rest',
];

const SESSION_LISTS = ['warmup', 'main', 'cooldown', 'finisher', 'cardio'] as const;

type Result = { ok: true; value: PlanPhase } | { ok: false; errors: string[] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateExercise(raw: unknown, where: string, errors: string[]): void {
  if (!isRecord(raw)) {
    errors.push(`${where}: ejercicio invalido`);
    return;
  }
  if (typeof raw.exercise !== 'string' || !raw.exercise.trim()) {
    errors.push(`${where}: falta exercise`);
  }
  if (raw.sets !== undefined && (!Number.isInteger(raw.sets) || (raw.sets as number) < 1 || (raw.sets as number) > 10)) {
    errors.push(`${where}: sets debe ser entero 1-10`);
  }
  if (
    raw.rest_seconds !== undefined &&
    (!isNumber(raw.rest_seconds) || raw.rest_seconds < 0 || raw.rest_seconds > 300)
  ) {
    errors.push(`${where}: rest_seconds debe estar entre 0 y 300`);
  }
  if (!isNumber(raw.work_seconds) || raw.work_seconds <= 0) {
    errors.push(`${where}: falta work_seconds`);
  }
}

function validateSession(raw: unknown, where: string, errors: string[]): void {
  if (!isRecord(raw)) {
    errors.push(`${where}: falta session`);
    return;
  }
  for (const list of SESSION_LISTS) {
    const value = raw[list];
    if (value === undefined && list !== 'main') continue;
    if (!Array.isArray(value)) {
      errors.push(`${where}: ${list} debe ser un array`);
      continue;
    }
    value.forEach((ex, i) => validateExercise(ex, `${where}.${list}[${i}]`, errors));
  }
  if (!Array.isArray(raw.main) || raw.main.length === 0) {
    errors.push(`${where}: main debe tener al menos 1 ejercicio`);
  }
}

function validateDay(raw: unknown, where: string, errors: string[]): void {
  if (!isRecord(raw)) {
    errors.push(`${where}: dia invalido`);
    return;
  }
  const type = raw.type;
  if (typeof type !== 'string' || !DAY_TYPES.includes(type as DayType)) {
    errors.push(`${where}: tipo de dia invalido`);
    return;
  }
  if (typeof raw.label_es !== 'string' || typeof raw.label_en !== 'string') {
    errors.push(`${where}: faltan labels`);
  }
  if (type === 'rest') {
    if (raw.session !== null) errors.push(`${where}: un dia rest no lleva session`);
    return;
  }
  validateSession(raw.session, where, errors);
}

export function validatePhase(raw: unknown): Result {
  const errors: string[] = [];
  if (!isRecord(raw)) return { ok: false, errors: ['fase invalida'] };

  if (raw.index !== 0 && raw.index !== 1 && raw.index !== 2) {
    errors.push('index debe ser 0, 1 o 2');
  }
  if (typeof raw.name_es !== 'string' || typeof raw.name_en !== 'string') {
    errors.push('faltan name_es/name_en');
  }
  if (!Array.isArray(raw.week_template) || raw.week_template.length !== 7) {
    errors.push('week_template debe tener exactamente 7 dias');
  } else {
    raw.week_template.forEach((d, i) => validateDay(d, `week_template[${i}]`, errors));
    const restCount = raw.week_template.filter((d) => isRecord(d) && d.type === 'rest').length;
    if (restCount === 0) errors.push('week_template debe incluir al menos 1 dia rest');
  }
  if (typeof raw.rationale_es !== 'string' || typeof raw.rationale_en !== 'string') {
    errors.push('faltan rationale_es/rationale_en');
  }
  if (!Array.isArray(raw.science_refs) || raw.science_refs.some((r) => typeof r !== 'string')) {
    errors.push('science_refs debe ser string[]');
  }
  if (typeof raw.generated_at !== 'string') {
    errors.push('falta generated_at');
  }

  return errors.length === 0 ? { ok: true, value: raw as unknown as PlanPhase } : { ok: false, errors };
}
