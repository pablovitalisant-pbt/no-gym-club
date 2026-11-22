import { describe, it, expect } from 'vitest';
import { buildPhasePrompt } from '@/lib/prompts/build-phase-prompt';

const profile = {
  age: 49,
  weight_kg: 80,
  height_cm: 178,
  training_history: 'active' as const,
  health_limitations: [],
  limitations_notes: null,
  cardio_preference: 'moderate' as const,
  focus_areas: ['chest'],
  focus_notes: null,
  available_days_per_week: 4,
  available_equipment: ['bodyweight', 'bar', 'ground'],
};

function build(assessment: Record<string, unknown>) {
  return buildPhasePrompt({
    profile,
    assessment: assessment as never,
    startLevel: 'intermediate',
    phaseIndex: 0,
    corpusDocs: [],
    availableExercises: [],
  });
}

describe('build-phase-prompt — variantes iniciales por patrón (v2-18)', () => {
  it('con 5+ dominadas indica dominadas como variante inicial de tracción', () => {
    const { system } = build({
      pushup_variant: 'incline',
      pushup_variant_reps: 30,
      max_pullups: 8,
    });
    expect(system.toLowerCase()).toContain('starting variants by pattern');
    expect(system.toLowerCase()).toContain('pull-up');
    expect(system.toLowerCase()).not.toContain('australian pull-up');
  });

  it('sin 5 dominadas indica australianas o negativas', () => {
    const { system } = build({
      pushup_variant: 'floor',
      pushup_variant_reps: 12,
      max_pullups: 2,
    });
    expect(system.toLowerCase()).toContain('australian');
    expect(system.toLowerCase()).toContain('negative');
  });
});
