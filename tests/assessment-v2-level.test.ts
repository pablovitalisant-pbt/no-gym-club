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

  it('activo con 20 push-ups de suelo => no extremo', () => {
    const level = deriveStartLevel(
      { training_history: 'active' },
      {
        pushup_variant: 'floor',
        pushup_variant_reps: 20,
        sit_to_stand_30s: 20,
        walk_minutes: 30,
      },
    );
    expect(level).not.toBe('untrained_extreme');
    expect(level).toBe('advanced');
  });

  it('activo con 10 de suelo => intermediate', () => {
    expect(
      deriveStartLevel(
        { training_history: 'active' },
        { pushup_variant: 'floor', pushup_variant_reps: 10 },
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
});
