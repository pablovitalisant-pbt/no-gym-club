import { describe, it, expect } from 'vitest';
import { completeDay, needsNextPhase } from '../lib/plan/plan';
import type { PlanData } from '../lib/types/plan';

const emptyState = { current_day_index: 0, completed_day_indexes: [] as number[] };

describe('completeDay', () => {
  it('marca el dia y avanza el puntero', () => {
    expect(completeDay(emptyState, 0)).toEqual({
      current_day_index: 1,
      completed_day_indexes: [0],
    });
  });

  it('no duplica dias completados (idempotente)', () => {
    const state = { current_day_index: 3, completed_day_indexes: [0, 1, 2] };
    const out = completeDay(state, 2);
    expect(out.completed_day_indexes).toEqual([0, 1, 2]);
    expect(out.current_day_index).toBe(3);
  });

  it('mantiene los completados ordenados', () => {
    const out = completeDay(emptyState, 5);
    expect(out.completed_day_indexes).toEqual([5]);
  });

  it('el puntero tiene tope en 83', () => {
    const out = completeDay({ current_day_index: 83, completed_day_indexes: [] }, 83);
    expect(out.current_day_index).toBe(83);
    expect(out.completed_day_indexes).toEqual([83]);
  });

  it('no muta el estado de entrada', () => {
    const state = { current_day_index: 0, completed_day_indexes: [0] };
    completeDay(state, 1);
    expect(state.completed_day_indexes).toEqual([0]);
    expect(state.current_day_index).toBe(0);
  });
});

describe('isPhaseEnd retirado', () => {
  it('no exporta isPhaseEnd sin uso en produccion', async () => {
    const mod = await import('../lib/plan/plan');
    expect('isPhaseEnd' in mod).toBe(false);
  });
});

describe('needsNextPhase', () => {
  const plan = (count: number) =>
    ({ version: 2, total_weeks: 12, phase_weeks: 4, phases: Array(count).fill({}) }) as unknown as PlanData;

  it('true al inicio de una fase no generada', () => {
    expect(needsNextPhase(plan(1), { current_day_index: 28, completed_day_indexes: [] })).toBe(true);
    expect(needsNextPhase(plan(2), { current_day_index: 56, completed_day_indexes: [] })).toBe(true);
  });

  it('false si la fase ya existe', () => {
    expect(needsNextPhase(plan(3), { current_day_index: 28, completed_day_indexes: [] })).toBe(false);
  });

  it('false en medio de una fase', () => {
    expect(needsNextPhase(plan(1), { current_day_index: 27, completed_day_indexes: [] })).toBe(false);
  });

  it('false al final del plan', () => {
    expect(needsNextPhase(plan(3), { current_day_index: 83, completed_day_indexes: [] })).toBe(false);
  });
});
