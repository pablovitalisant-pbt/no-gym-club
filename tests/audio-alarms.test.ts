import { describe, it, expect } from 'vitest';
import {
  planTone,
  resolveOverlap,
  TICK_MS,
  TICK_HZ,
  TRANSITION_HZ,
  PRIORITY_GAP_MS,
} from '@/lib/audio';

const totalMs = (kind: Parameters<typeof planTone>[0], now = 0) => {
  const pulses = planTone(kind, now);
  const last = pulses[pulses.length - 1];
  return (last.start + last.duration - now) * 1000;
};

describe('planTone — alarmas que no se pisan', () => {
  it('tick: un solo pulso de 80 ms a 880 Hz', () => {
    const pulses = planTone('tick', 0);
    expect(pulses).toHaveLength(1);
    expect(pulses[0].freq).toBe(TICK_HZ);
    expect(pulses[0].duration * 1000).toBe(TICK_MS);
  });

  it('transition: dos pulsos distintos, total <= 0.5 s', () => {
    const pulses = planTone('transition', 10);
    expect(pulses).toHaveLength(2);
    expect(pulses.map((p) => p.freq)).toEqual([...TRANSITION_HZ]);
    expect(totalMs('transition', 10)).toBeLessThanOrEqual(500);
    // arranca en `now`
    expect(pulses[0].start).toBe(10);
  });

  it('done: tres pulsos ascendentes, total <= 1 s', () => {
    const pulses = planTone('done', 3);
    expect(pulses).toHaveLength(3);
    const freqs = pulses.map((p) => p.freq);
    expect(freqs[0]).toBeLessThan(freqs[1]);
    expect(freqs[1]).toBeLessThan(freqs[2]);
    expect(totalMs('done', 3)).toBeLessThanOrEqual(1000);
  });
});

describe('resolveOverlap — prioridad ante solape', () => {
  it('fuera de la ventana de 250 ms siempre suena', () => {
    expect(resolveOverlap('tick', 'tick', PRIORITY_GAP_MS)).toBe('play');
    expect(resolveOverlap('transition', 'tick', 400)).toBe('play');
  });

  it('transition y done cortan al previo (< 250 ms)', () => {
    expect(resolveOverlap('tick', 'transition', 100)).toBe('play');
    expect(resolveOverlap('tick', 'done', 100)).toBe('play');
    expect(resolveOverlap('transition', 'done', 10)).toBe('play');
  });

  it('tick se descarta si hay una transicion/done sonando', () => {
    expect(resolveOverlap('transition', 'tick', 100)).toBe('skip');
    expect(resolveOverlap('done', 'tick', 249)).toBe('skip');
  });

  it('sin sonido previo, tick suena', () => {
    expect(resolveOverlap(null, 'tick', Infinity)).toBe('play');
  });
});
