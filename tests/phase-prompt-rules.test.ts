import { describe, it, expect } from 'vitest';
import { buildPhasePrompt } from '@/lib/prompts/build-phase-prompt';

const extremeProfile = {
  age: 52,
  weight_kg: 95,
  height_cm: 170,
  training_history: 'never' as const,
  health_limitations: ['knees'],
  limitations_notes: 'dolor al agacharse',
  cardio_preference: 'none' as const,
  focus_areas: ['chest', 'shoulders'],
  focus_notes: 'quiere hombros mas grandes',
  available_days_per_week: 3,
  available_equipment: ['bodyweight', 'ground', 'wall'],
};

const assessment = {
  pushup_variant: 'wall' as const,
  pushup_variant_reps: 2,
  sit_to_stand_30s: 6,
  walk_minutes: 8,
};

const corpusDocs = [
  {
    title: 'Overcoming Gravity — Mesocycles',
    content: 'Keep the same exercises for 4-6 weeks and progress volume.',
    category: 'overcoming_gravity',
    similarity: 0.9,
  },
];

const availableExercises = [
  { name_en: 'Wall Push-Up', category: 'push', muscle_groups: ['chest'] },
  { name_en: 'Chair Sit-to-Stand', category: 'legs', muscle_groups: ['quads'] },
  { name_en: 'Knee Plank', category: 'core', muscle_groups: ['abs'] },
];

function build(overrides: Record<string, unknown> = {}) {
  return buildPhasePrompt({
    profile: extremeProfile,
    assessment,
    startLevel: 'untrained_extreme',
    phaseIndex: 0,
    corpusDocs,
    availableExercises,
    ...overrides,
  });
}

describe('build-phase-prompt — reglas obligatorias', () => {
  it('plantilla de 7 dias repetida 4 semanas y dias de entrenamiento segun perfil', () => {
    const { system, user } = build();
    const all = `${system}\n${user}`.toLowerCase();
    expect(all).toContain('7-day');
    expect(all).toContain('4 weeks');
    expect(all).toContain('3');
    expect(all).toContain('rest');
  });

  it('mismos ejercicios toda la fase; progresion por reps/series/tiempo en notes', () => {
    const { system } = build();
    expect(system.toLowerCase()).toContain('same exercises');
    expect(system.toLowerCase()).toContain('notes_es');
    expect(system.toLowerCase()).toContain('notes_en');
  });

  it('fase 1 fundamento, fases 2-3 progresan de la anterior y su log', () => {
    const { system } = build();
    expect(system.toLowerCase()).toContain('foundation');
    expect(system.toLowerCase()).toContain('previous phase');
    expect(system.toLowerCase()).toContain('log');
  });

  it('untrained_extreme exige regresiones y restricciones', () => {
    const { system } = build();
    expect(system.toLowerCase()).toContain('incline push-up');
    expect(system.toLowerCase()).toContain('chair sit-to-stand');
    expect(system.toLowerCase()).toContain('knee plank');
    expect(system.toLowerCase()).toContain('walking');
    expect(system.toLowerCase()).toContain('1-2 sets');
    expect(system.toLowerCase()).toContain('no jumps');
    expect(system.toLowerCase()).toContain('burpee');
    expect(system.toLowerCase()).toContain('long rest');
  });

  it('limitaciones: rodillas sin saltos ni sentadilla profunda', () => {
    const { system } = build();
    expect(system.toLowerCase()).toContain('knees');
    expect(system.toLowerCase()).toContain('deep squat');
  });

  it('cardio none: sin seccion cardio', () => {
    const { system } = build();
    expect(system.toLowerCase()).toContain('cardio');
    expect(system.toLowerCase()).toContain('do not include');
  });

  it('cardio moderate: incluye seccion cardio acorde y acotada a la condicion', () => {
    const { system } = build({
      profile: { ...extremeProfile, cardio_preference: 'moderate' },
    });
    expect(system.toLowerCase()).toContain('"cardio"');
    expect(system.toLowerCase()).toContain('never above');
  });

  it('focus_areas da mas volumen manteniendo equilibrio empuje/traccion', () => {
    const { system } = build();
    expect(system.toLowerCase()).toContain('chest');
    expect(system.toLowerCase()).toContain('shoulders');
    expect(system.toLowerCase()).toContain('push/pull');
  });

  it('todo ejercicio lleva work_seconds y rest_seconds y nombres del catalogo', () => {
    const { system } = build();
    expect(system).toContain('work_seconds');
    expect(system).toContain('rest_seconds');
    expect(system).toContain('name_en');
    expect(system.toLowerCase()).toContain('walking or jogging');
  });

  it('documenta el schema PlanPhase y pide JSON exacto', () => {
    const { system } = build();
    expect(system).toContain('week_template');
    expect(system).toContain('rationale_es');
    expect(system).toContain('science_refs');
    expect(system).toContain('generated_at');
    expect(system.toLowerCase()).toContain('json');
  });

  it('incluye perfil, assessment, nivel, fase, corpus y catalogo en el user prompt', () => {
    const { user } = build();
    expect(user).toContain('52');
    expect(user.toLowerCase()).toContain('wall');
    expect(user).toContain('untrained_extreme');
    expect(user).toContain('Wall Push-Up');
    expect(user).toContain('Overcoming Gravity');
    expect(user).toContain('dolor al agacharse');
  });
});
