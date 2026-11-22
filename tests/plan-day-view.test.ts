import { describe, it, expect } from 'vitest';
import { planDayView } from '../lib/plan/day-view';
import type { PlanData, PlanDay } from '../lib/types/plan';

function makeDay(type: PlanDay['type'], label: string, withSession = true): PlanDay {
  return {
    type,
    label_es: label,
    label_en: label,
    session: withSession
      ? {
          title_es: label,
          title_en: label,
          warmup: [{ exercise: 'movilidad', duration_seconds: 300 }],
          main: [{ exercise: 'flexiones', sets: 3, reps: '8', rest_seconds: 60 }],
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

describe('planDayView — encabezado y estado del dia', () => {
  it('idx 0: semana 1, dia 1', () => {
    const v = planDayView(makePlan(3), 0, 'es');
    expect(v.week).toBe(1);
    expect(v.dayNumber).toBe(1);
    expect(v.phaseName).toBe('fase 0');
    expect(v.day).not.toBeNull();
  });

  it('idx 8: semana 2, dia 2', () => {
    const v = planDayView(makePlan(3), 8, 'es');
    expect(v.week).toBe(2);
    expect(v.dayNumber).toBe(2);
  });

  it('idx 83: semana 12, dia 7', () => {
    const v = planDayView(makePlan(3), 83, 'en');
    expect(v.week).toBe(12);
    expect(v.dayNumber).toBe(7);
    expect(v.phaseName).toBe('phase 2');
  });

  it('dia rest se expone como rest con session null', () => {
    const v = planDayView(makePlan(3), 6, 'es');
    expect(v.day?.type).toBe('rest');
    expect(v.day?.session).toBeNull();
    expect(v.isRest).toBe(true);
  });

  it('fase no generada: day null e isRest false', () => {
    const v = planDayView(makePlan(1), 28, 'es');
    expect(v.day).toBeNull();
    expect(v.isRest).toBe(false);
    expect(v.phaseName).toBeNull();
  });
});
