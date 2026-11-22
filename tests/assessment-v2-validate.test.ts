import { describe, it, expect } from 'vitest';
import {
  validateProfileV2,
  validateTestResultsV2,
} from '@/lib/assessment/validate';

describe('validateProfileV2', () => {
  it('rechaza training_history fuera del enum', () => {
    const r = validateProfileV2({ training_history: 'sometimes' });
    expect(r.ok).toBe(false);
  });

  it('acepta training_history valido', () => {
    const r = validateProfileV2({ training_history: 'active' });
    expect(r.ok).toBe(true);
  });

  it('rechaza cardio_preference desconocida', () => {
    const r = validateProfileV2({ cardio_preference: 'extreme' });
    expect(r.ok).toBe(false);
  });

  it('cardio_preference ausente toma default none', () => {
    const r = validateProfileV2({});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.cardio_preference).toBe('none');
  });

  it('acepta null en training_history y limitations_notes', () => {
    const r = validateProfileV2({
      training_history: null,
      limitations_notes: null,
    });
    expect(r.ok).toBe(true);
  });

  it('rechaza limitacion desconocida', () => {
    const r = validateProfileV2({ health_limitations: ['knees', 'elbows'] });
    expect(r.ok).toBe(false);
  });

  it('rechaza limitaciones duplicadas', () => {
    const r = validateProfileV2({ health_limitations: ['knees', 'knees'] });
    expect(r.ok).toBe(false);
  });

  it('acepta limitaciones permitidas sin duplicados', () => {
    const r = validateProfileV2({
      health_limitations: ['knees', 'lower_back'],
    });
    expect(r.ok).toBe(true);
  });

  it('rechaza timezone no string', () => {
    const r = validateProfileV2({ timezone: 42 });
    expect(r.ok).toBe(false);
  });
});

describe('validateTestResultsV2', () => {
  it('exige pushup_variant', () => {
    const r = validateTestResultsV2({ sit_to_stand_30s: 10 });
    expect(r.ok).toBe(false);
  });

  it('rechaza pushup_variant invalido', () => {
    const r = validateTestResultsV2({ pushup_variant: 'bar' });
    expect(r.ok).toBe(false);
  });

  it('acepta pushup_variant none', () => {
    const r = validateTestResultsV2({ pushup_variant: 'none' });
    expect(r.ok).toBe(true);
  });

  it('rechaza negativos', () => {
    for (const key of [
      'pushup_variant_reps',
      'dead_hang_seconds',
      'knee_plank_seconds',
      'sit_to_stand_30s',
      'walk_minutes',
      'max_pushups',
      'plank_seconds',
    ]) {
      const r = validateTestResultsV2({ pushup_variant: 'floor', [key]: -1 });
      expect(r.ok, `${key} negativo debe fallar`).toBe(false);
    }
  });

  it('rechaza decimales (enteros)', () => {
    const r = validateTestResultsV2({
      pushup_variant: 'floor',
      walk_minutes: 7.5,
    });
    expect(r.ok).toBe(false);
  });

  it('acepta null en cualquier metrica', () => {
    const r = validateTestResultsV2({
      pushup_variant: 'wall',
      pushup_variant_reps: null,
      dead_hang_seconds: null,
      knee_plank_seconds: null,
      sit_to_stand_30s: null,
      walk_minutes: null,
      max_pushups: null,
    });
    expect(r.ok).toBe(true);
  });

  it('normaliza ausentes a null', () => {
    const r = validateTestResultsV2({ pushup_variant: 'floor' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.sit_to_stand_30s).toBeNull();
      expect(r.value.walk_minutes).toBeNull();
    }
  });
});
