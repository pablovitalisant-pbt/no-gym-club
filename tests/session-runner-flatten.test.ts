import { describe, it, expect } from 'vitest';
import { flattenSession } from '../lib/session/flatten';
import type { SessionData } from '../lib/types/session';

function makeSession(extra: Partial<SessionData> = {}): SessionData {
  return {
    title_es: 'Sesión',
    title_en: 'Session',
    warmup: [{ exercise: 'movilidad', duration_seconds: 300 }],
    main: [{ exercise: 'flexiones', sets: 3, reps: '8' }],
    cooldown: [{ exercise: 'estiramiento', duration_seconds: 120 }],
    rationale_es: '',
    rationale_en: '',
    science_refs: [],
    ...extra,
  };
}

describe('flattenSession', () => {
  it('mantiene el orden v1 sin finisher ni cardio', () => {
    const flat = flattenSession(makeSession());
    expect(flat.map((e) => e.exercise)).toEqual([
      'movilidad',
      'flexiones',
      'estiramiento',
    ]);
    expect(flat.map((e) => e.section)).toEqual(['warmup', 'main', 'cooldown']);
  });

  it('inserta finisher y cardio entre principal y vuelta a la calma', () => {
    const flat = flattenSession(
      makeSession({
        finisher: [{ exercise: 'plancha', duration_seconds: 60 }],
        cardio: [{ exercise: 'burpees', sets: 2, reps: '10' }],
      }),
    );
    expect(flat.map((e) => e.exercise)).toEqual([
      'movilidad',
      'flexiones',
      'plancha',
      'burpees',
      'estiramiento',
    ]);
    expect(flat.map((e) => e.section)).toEqual([
      'warmup',
      'main',
      'finisher',
      'cardio',
      'cooldown',
    ]);
  });

  it('acepta finisher/cardio vacíos sin romper', () => {
    const flat = flattenSession(makeSession({ finisher: [], cardio: [] }));
    expect(flat).toHaveLength(3);
  });
});
