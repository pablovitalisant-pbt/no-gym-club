import { describe, it, expect } from 'vitest';

let filter: any;
try {
  filter = await import('@/lib/exercises/calisthenics-filter');
} catch {
  // módulo no existe — falla explícito
}

function assertModule() {
  expect(
    filter,
    'FASE B: calisthenics-filter.ts no existe — debe implementarse en Fase C',
  ).toBeTruthy();
}

describe('isCalisthenics — solo calistenia', () => {
  it('dumbbell en equipment_required → false', () => {
    assertModule();
    expect(filter.isCalisthenics({ name_en: 'bicep curl', equipment_required: ['dumbbell'] })).toBe(false);
  });

  it('"exercise ball on the wall calf raise" → false', () => {
    assertModule();
    expect(
      filter.isCalisthenics({
        name_en: 'exercise ball on the wall calf raise',
        equipment_required: ['bodyweight'],
      }),
    ).toBe(false);
  });

  it('"bench dip (knees bent)" → true (bench es calistenia)', () => {
    assertModule();
    expect(
      filter.isCalisthenics({ name_en: 'bench dip (knees bent)', equipment_required: ['bodyweight'] }),
    ).toBe(true);
  });

  it('"pull-up" → true (barra es calistenia)', () => {
    assertModule();
    expect(filter.isCalisthenics({ name_en: 'pull-up', equipment_required: ['bar'] })).toBe(true);
  });

  it('"run (equipment)" → false', () => {
    assertModule();
    expect(filter.isCalisthenics({ name_en: 'run (equipment)', equipment_required: [] })).toBe(false);
  });

  it('"push-up (wall)" → true', () => {
    assertModule();
    expect(filter.isCalisthenics({ name_en: 'push-up (wall)', equipment_required: ['wall'] })).toBe(true);
  });

  it('case-insensitive: "Dumbbell Bench Press" → false', () => {
    assertModule();
    expect(filter.isCalisthenics({ name_en: 'Dumbbell Bench Press', equipment_required: [] })).toBe(false);
  });
});
