import { describe, it, expect } from 'vitest';
import { deriveStartLevel } from '@/lib/assessment/level';

describe('deriveStartLevel', () => {
  it('caso Pablo-test: nunca entreno, wall, 6 silla, 8 min caminata => untrained_extreme', () => {
    const level = deriveStartLevel(
      { training_history: 'never' },
      {
        pushup_variant: 'wall',
        pushup_variant_reps: 3,
        sit_to_stand_30s: 6,
        walk_minutes: 8,
      },
    );
    expect(level).toBe('untrained_extreme');
  });

  it('nunca entreno + pushup none => untrained_extreme', () => {
    expect(
      deriveStartLevel(
        { training_history: 'never' },
        { pushup_variant: 'none', sit_to_stand_30s: 12, walk_minutes: 20 },
      ),
    ).toBe('untrained_extreme');
  });

  it('activo con 20 de suelo, 10 dominadas y plancha 90 => advanced', () => {
    const level = deriveStartLevel(
      { training_history: 'active' },
      {
        pushup_variant: 'floor',
        pushup_variant_reps: 20,
        max_pullups: 10,
        plank_seconds: 90,
        sit_to_stand_30s: 20,
        walk_minutes: 30,
      },
    );
    expect(level).not.toBe('untrained_extreme');
    expect(level).toBe('advanced');
  });

  it('activo con 10 de suelo y 5 dominadas => intermediate', () => {
    expect(
      deriveStartLevel(
        { training_history: 'active' },
        { pushup_variant: 'floor', pushup_variant_reps: 10, max_pullups: 5 },
      ),
    ).toBe('intermediate');
  });

  it('nunca entreno con capacidad normal => untrained (no extremo)', () => {
    expect(
      deriveStartLevel(
        { training_history: 'never' },
        { pushup_variant: 'knee', sit_to_stand_30s: 12, walk_minutes: 20 },
      ),
    ).toBe('untrained');
  });

  it('historial pasado con 8 de suelo => beginner', () => {
    expect(
      deriveStartLevel(
        { training_history: 'past' },
        { pushup_variant: 'floor', pushup_variant_reps: 8 },
      ),
    ).toBe('beginner');
  });

  it('caso Pablo: activo 49, declaró intermedio, incline 30, 8 dominadas, 90s colgado, plancha 120 => intermediate', () => {
    expect(
      deriveStartLevel(
        { training_history: 'active', experience_level: 'intermediate' },
        {
          pushup_variant: 'incline',
          pushup_variant_reps: 30,
          max_pullups: 8,
          dead_hang_seconds: 90,
          plank_seconds: 120,
          sit_to_stand_30s: 30,
          walk_minutes: 30,
        },
      ),
    ).toBe('intermediate');
  });

  it('caso qa.extremo: nunca entrenó, wall 5, silla 6, caminata 8 => untrained_extreme (no cambia)', () => {
    expect(
      deriveStartLevel(
        { training_history: 'never', experience_level: 'beginner' },
        {
          pushup_variant: 'wall',
          pushup_variant_reps: 5,
          sit_to_stand_30s: 6,
          walk_minutes: 8,
          knee_plank_seconds: 10,
          dead_hang_seconds: 0,
        },
      ),
    ).toBe('untrained_extreme');
  });

  it('qa.intermedio (fixture): activo, floor 25, colgado 45 y sin declarar => conservador beginner', () => {
    // Solo cumple el indicador de empuje y el perfil no declaró nivel.
    expect(
      deriveStartLevel(
        { training_history: 'active', experience_level: 'beginner' },
        { pushup_variant: 'floor', pushup_variant_reps: 25, dead_hang_seconds: 45 },
      ),
    ).toBe('beginner');
  });

  it('declaró principiante aunque los tests den intermedio => beginner (conservador)', () => {
    expect(
      deriveStartLevel(
        { training_history: 'active', experience_level: 'beginner' },
        {
          pushup_variant: 'incline',
          pushup_variant_reps: 30,
          max_pullups: 8,
          dead_hang_seconds: 90,
          plank_seconds: 120,
          sit_to_stand_30s: 30,
          walk_minutes: 30,
        },
      ),
    ).toBe('beginner');
  });

  it('declararse intermedio no sube un nivel que los tests no alcanzan', () => {
    expect(
      deriveStartLevel(
        { training_history: 'never', experience_level: 'intermediate' },
        { pushup_variant: 'knee', sit_to_stand_30s: 12, walk_minutes: 20 },
      ),
    ).toBe('untrained');
  });

  it('un solo indicador no alcanza para intermedio', () => {
    expect(
      deriveStartLevel(
        { training_history: 'active', experience_level: 'intermediate' },
        { pushup_variant: 'floor', pushup_variant_reps: 12 },
      ),
    ).toBe('beginner');
  });
});
