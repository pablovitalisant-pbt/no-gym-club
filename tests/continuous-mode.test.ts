import { describe, it, expect } from 'vitest';
import {
  buildTimeline,
  estimateWorkSeconds,
  totalSeconds,
  start,
  pause,
  resume,
  skip,
  tick,
} from '../lib/session/continuous';
import type { SessionExercise } from '../lib/types/session';

const mixed: SessionExercise[] = [
  { exercise: 'Sentadillas', sets: 2, reps: '10-12', rest_seconds: 30 },
  { exercise: 'Plancha', duration_seconds: 45, sets: 1, rest_seconds: 15 },
  { exercise: 'Zancadas', sets: 1, work_seconds: 20, bilateral: true, rest_seconds: 20 },
  { exercise: 'Estiramiento', duration_seconds: 60, rest_seconds: 0 },
];

describe('buildTimeline', () => {
  it('aplana una sesión mixta respetando work, rest, bilaterales y sin rest final', () => {
    const tl = buildTimeline(mixed);
    expect(tl.map((s) => [s.kind, s.exerciseIndex, s.set, s.side, s.seconds])).toEqual([
      ['ready', 0, 0, undefined, 10],
      ['work', 0, 1, undefined, 36],
      ['rest', 0, 1, undefined, 30],
      ['work', 0, 2, undefined, 36],
      ['rest', 0, 2, undefined, 30],
      ['work', 1, 1, undefined, 45],
      ['rest', 1, 1, undefined, 15],
      ['work', 2, 1, 'left', 20],
      ['work', 2, 1, 'right', 20],
      ['rest', 2, 1, undefined, 20],
      ['work', 3, 1, undefined, 60],
    ]);
    expect(tl[0].nextLabel).toBe('Sentadillas');
    expect(tl[tl.length - 1].kind).toBe('work');
  });

  it('estima por reps con tope del rango ×3s, mínimo 20', () => {
    expect(estimateWorkSeconds('8-12')).toBe(36);
    expect(estimateWorkSeconds('5')).toBe(20);
    expect(estimateWorkSeconds('20')).toBe(60);
    expect(estimateWorkSeconds('AMRAP')).toBe(20);
    expect(estimateWorkSeconds(undefined)).toBe(20);
  });

  it('no crea rest si falta o es 0', () => {
    const tl = buildTimeline([{ exercise: 'Flexiones', sets: 2, reps: '5' }]);
    expect(tl.map((s) => s.kind)).toEqual(['ready', 'work', 'work']);
  });

  it('totalSeconds suma la línea de tiempo', () => {
    expect(totalSeconds(buildTimeline(mixed))).toBe(322);
  });
});

describe('motor de corrido', () => {
  const tl = buildTimeline([{ exercise: 'Flexiones', sets: 2, reps: '5', rest_seconds: 20 }]);

  it('pausa congela el restante y resume continúa', () => {
    const s = start(0);
    expect(tick(s, tl, 4000)).toMatchObject({ index: 0, remaining: 6, done: false });
    const paused = pause(s, 4000);
    expect(tick(paused, tl, 100000)).toMatchObject({ index: 0, remaining: 6, done: false });
    const resumed = resume(paused, 100000);
    expect(tick(resumed, tl, 101000)).toMatchObject({ index: 0, remaining: 5, done: false });
  });

  it('skip salta el segmento actual', () => {
    const s = start(0);
    expect(tick(s, tl, 2000).index).toBe(0);
    const skipped = skip(s, 2000);
    expect(tick(skipped, tl, 2000)).toMatchObject({ index: 1, remaining: 20, done: false });
  });

  it('catch-up de 5 min avanza todos los segmentos vencidos', () => {
    const s = start(0);
    const result = tick(s, tl, 300000);
    expect(result.done).toBe(true);
    expect(result.index).toBe(tl.length);
    expect(result.remaining).toBe(0);
  });

  it('done solo al terminar el último segmento', () => {
    const s = start(0);
    expect(tick(s, tl, 69000).done).toBe(false);
    expect(tick(s, tl, 70000).done).toBe(true);
  });

  it('no exporta helpers de snapshot sin uso en produccion', async () => {
    const mod = await import('../lib/session/continuous');
    expect('toSnapshot' in mod).toBe(false);
    expect('fromSnapshot' in mod).toBe(false);
  });
});
