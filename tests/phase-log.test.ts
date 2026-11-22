import { describe, it, expect } from 'vitest';
import { summarizePhaseLog, type PhaseLogSession } from '../lib/plan/phase-log';
import type { PlanPhase, PlanDay } from '../lib/types/plan';

function main(exercise: string, reps = '8-12') {
  return { exercise, sets: 3, reps, rpe: 7, rest_seconds: 90, work_seconds: 45, notes_es: '', notes_en: '' };
}

function day(exercises: string[]): PlanDay {
  return {
    type: 'full',
    label_es: 'Full body',
    label_en: 'Full body',
    session: {
      title_es: 'Full body',
      title_en: 'Full body',
      warmup: [main('Jumping Jacks', '20')],
      main: exercises.map((e) => main(e)),
      cooldown: [main('Cat-Cow', '10')],
      rationale_es: '',
      rationale_en: '',
      science_refs: [],
    },
  };
}

function phase(): PlanPhase {
  const rest: PlanDay = { type: 'rest', label_es: 'Descanso', label_en: 'Rest', session: null };
  // 3 training days -> 12 training days per 4-week phase
  return {
    index: 0,
    name_es: 'Fase',
    name_en: 'Phase',
    week_template: [day(['Wall Push-Up']), day(['Wall Push-Up']), rest, day(['Wall Push-Up']), rest, rest, rest],
    rationale_es: '',
    rationale_en: '',
    science_refs: [],
    generated_at: '2026-11-22T00:00:00.000Z',
  };
}

function entry(exercise: string, actualReps: string[], prescribedReps = '8-12') {
  return { exercise, prescribedSets: 3, prescribedReps, actualReps };
}

function session(
  plan_day_index: number,
  rpe: number | null,
  log: ReturnType<typeof entry>[],
): PhaseLogSession {
  return {
    plan_day_index,
    rpe,
    completed_at: '2026-11-22T00:00:00.000Z',
    log_data: { exerciseLog: log },
  };
}

describe('summarizePhaseLog', () => {
  it('calcula adherencia sobre los dias de entrenamiento de la fase', () => {
    const out = summarizePhaseLog(phase(), [
      session(0, 6, [entry('Wall Push-Up', ['8', '8', '8'])]),
      session(1, 6, [entry('Wall Push-Up', ['9', '9', '8'])]),
    ]);
    expect(out).toContain('Adherence: 2/12 training days completed (17%)');
  });

  it('marca cuando alcanzo el tope del rango en la mayoria de las series', () => {
    const out = summarizePhaseLog(phase(), [
      session(0, 6, [entry('Wall Push-Up', ['8', '8', '7'])]),
      session(26, 8, [entry('Wall Push-Up', ['12', '12', '11'])]),
    ]);
    expect(out).toContain('prescribed 8-12 reps');
    expect(out).toContain('Latest log: 12, 12, 11');
    expect(out).toContain('reached the top of the prescribed range');
  });

  it('no marca tope cuando se quedo por debajo', () => {
    const out = summarizePhaseLog(phase(), [
      session(0, 7, [entry('Wall Push-Up', ['8', '8', '8'])]),
      session(26, 7, [entry('Wall Push-Up', ['9', '9', '9'])]),
    ]);
    expect(out).toContain('did not reach the top');
  });

  it('sin sesiones: adherencia 0 y texto explicito', () => {
    const out = summarizePhaseLog(phase(), []);
    expect(out).toContain('Adherence: 0/12 training days completed (0%)');
    expect(out).toContain('No completed sessions');
  });

  it('incluye RPE medio y tendencia', () => {
    const out = summarizePhaseLog(phase(), [
      session(0, 6, [entry('Wall Push-Up', ['8', '8', '8'])]),
      session(1, 6, [entry('Wall Push-Up', ['8', '8', '8'])]),
      session(26, 8, [entry('Wall Push-Up', ['9', '9', '9'])]),
      session(27, 8, [entry('Wall Push-Up', ['9', '9', '9'])]),
    ]);
    expect(out).toContain('Average RPE: 7.0');
    expect(out).toContain('rising');
  });

  it('nunca supera 1500 caracteres', () => {
    const p = phase();
    p.week_template = p.week_template.map((d) =>
      d.session
        ? { ...d, session: { ...d.session, main: Array.from({ length: 30 }, (_, i) => main(`Exercise ${i}`)) } }
        : d,
    );
    const out = summarizePhaseLog(p, [
      session(0, 7, Array.from({ length: 30 }, (_, i) => entry(`Exercise ${i}`, ['8', '8', '8']))),
    ]);
    expect(out.length).toBeLessThanOrEqual(1500);
  });
});
