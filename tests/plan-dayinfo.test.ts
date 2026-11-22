import { describe, it, expect } from 'vitest';
import { dayInfo, getPlanDay, TOTAL_DAYS } from '../lib/plan/plan';
import type { PlanData, PlanDay } from '../lib/types/plan';

function sessionExercise(name: string) {
  return { exercise: name, sets: 3, reps: '8', rest_seconds: 60, work_seconds: 40 };
}

function makeDay(type: PlanDay['type'], label: string, withSession = true): PlanDay {
  return {
    type,
    label_es: label,
    label_en: label,
    session: withSession
      ? {
          title_es: label,
          title_en: label,
          warmup: [],
          main: [sessionExercise('pushup')],
          cooldown: [],
          rationale_es: '',
          rationale_en: '',
          science_refs: [],
        }
      : null,
  };
}

function makePlan(phaseCount: number): PlanData {
  return {
    version: 2,
    total_weeks: 12,
    phase_weeks: 4,
    phases: Array.from({ length: phaseCount }, (_, i) => ({
      index: i as 0 | 1 | 2,
      name_es: `fase ${i}`,
      name_en: `phase ${i}`,
      week_template: Array.from({ length: 7 }, (_, d) =>
        makeDay(d === 6 ? 'rest' : 'push', `f${i}d${d}`, d !== 6),
      ),
      rationale_es: '',
      rationale_en: '',
      science_refs: [],
      generated_at: '2026-01-01T00:00:00.000Z',
    })),
  };
}

describe('dayInfo', () => {
  it('TOTAL_DAYS es 84', () => {
    expect(TOTAL_DAYS).toBe(84);
  });

  it('index 0: semana 1, dia 0, fase 0', () => {
    expect(dayInfo(0)).toEqual({ week: 1, weekday: 0, phaseIndex: 0, dayInPhase: 0 });
  });

  it('index 6: ultimo dia de la semana 1', () => {
    expect(dayInfo(6)).toEqual({ week: 1, weekday: 6, phaseIndex: 0, dayInPhase: 6 });
  });

  it('index 7: semana 2, dia 0', () => {
    expect(dayInfo(7)).toEqual({ week: 2, weekday: 0, phaseIndex: 0, dayInPhase: 7 });
  });

  it('index 27: fin de fase 0', () => {
    expect(dayInfo(27)).toEqual({ week: 4, weekday: 6, phaseIndex: 0, dayInPhase: 27 });
  });

  it('index 28: inicio de fase 1', () => {
    expect(dayInfo(28)).toEqual({ week: 5, weekday: 0, phaseIndex: 1, dayInPhase: 0 });
  });

  it('index 83: ultimo dia del plan', () => {
    expect(dayInfo(83)).toEqual({ week: 12, weekday: 6, phaseIndex: 2, dayInPhase: 27 });
  });
});

describe('getPlanDay', () => {
  it('mismo dia de semana en semanas 1 y 2 devuelve el mismo PlanDay (R5)', () => {
    const plan = makePlan(1);
    expect(getPlanDay(plan, 3)).toBe(getPlanDay(plan, 10));
    expect(getPlanDay(plan, 3)).toEqual(plan.phases[0].week_template[3]);
  });

  it('devuelve el dia correcto de la fase', () => {
    const plan = makePlan(3);
    expect(getPlanDay(plan, 28)?.label_es).toBe('f1d0');
    expect(getPlanDay(plan, 83)?.label_es).toBe('f2d6');
  });

  it('devuelve null si la fase aun no fue generada', () => {
    const plan = makePlan(1);
    expect(getPlanDay(plan, 0)).not.toBeNull();
    expect(getPlanDay(plan, 28)).toBeNull();
  });

  it('devuelve null fuera de rango', () => {
    const plan = makePlan(3);
    expect(getPlanDay(plan, -1)).toBeNull();
    expect(getPlanDay(plan, 84)).toBeNull();
  });
});
