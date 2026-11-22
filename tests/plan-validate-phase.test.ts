import { describe, it, expect } from 'vitest';
import { validatePhase } from '../lib/plan/validate-phase';

function exercise(overrides: Record<string, unknown> = {}) {
  return { exercise: 'pushup', sets: 3, reps: '8', rest_seconds: 60, work_seconds: 40, ...overrides };
}

function day(type: string, overrides: Record<string, unknown> = {}) {
  const isRest = type === 'rest';
  return {
    type,
    label_es: type,
    label_en: type,
    session: isRest
      ? null
      : {
          title_es: 'Sesion',
          title_en: 'Session',
          warmup: [],
          main: [exercise()],
          cooldown: [],
          rationale_es: '',
          rationale_en: '',
          science_refs: [],
        },
    ...overrides,
  };
}

function validPhase() {
  return {
    index: 0,
    name_es: 'Fase 1',
    name_en: 'Phase 1',
    week_template: [
      day('push'),
      day('pull'),
      day('legs'),
      day('upper'),
      day('lower'),
      day('full'),
      day('rest'),
    ],
    rationale_es: 'Base',
    rationale_en: 'Base',
    science_refs: ['ref-1'],
    generated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('validatePhase', () => {
  it('acepta una fase valida y devuelve el value tipado', () => {
    const out = validatePhase(validPhase());
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.value.week_template).toHaveLength(7);
      expect(out.value.index).toBe(0);
    }
  });

  it('rechaza week_template que no tiene exactamente 7 dias', () => {
    const p = validPhase();
    p.week_template.pop();
    const out = validatePhase(p);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.errors.join(' ')).toMatch(/7/);
  });

  it('rechaza un tipo de dia invalido', () => {
    const p = validPhase();
    (p.week_template[0] as { type: string }).type = 'yoga';
    expect(validatePhase(p).ok).toBe(false);
  });

  it('rechaza un dia no-rest sin session', () => {
    const p = validPhase();
    (p.week_template[0] as { session: unknown }).session = null;
    expect(validatePhase(p).ok).toBe(false);
  });

  it('rechaza un dia no-rest con main vacio', () => {
    const p = validPhase();
    const main = (p.week_template[0].session as { main: unknown[] }).main;
    main.length = 0;
    expect(validatePhase(p).ok).toBe(false);
  });

  it('rechaza sets fuera de 1-10 y rest_seconds fuera de 0-300', () => {
    const p1 = validPhase();
    ((p1.week_template[0].session as { main: unknown[] }).main[0] as { sets: number }).sets = 11;
    expect(validatePhase(p1).ok).toBe(false);

    const p2 = validPhase();
    ((p2.week_template[0].session as { main: unknown[] }).main[0] as { rest_seconds: number }).rest_seconds = 301;
    expect(validatePhase(p2).ok).toBe(false);
  });

  it('rechaza ejercicios sin work_seconds', () => {
    const p = validPhase();
    delete ((p.week_template[0].session as { main: unknown[] }).main[0] as { work_seconds?: number }).work_seconds;
    expect(validatePhase(p).ok).toBe(false);
  });

  it('exige al menos un dia de descanso', () => {
    const p = validPhase();
    p.week_template[6] = day('mobility');
    expect(validatePhase(p).ok).toBe(false);
  });
});
