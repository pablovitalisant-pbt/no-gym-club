import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  buildTimeline,
  start,
  tick,
  advance,
  setMode,
  recordReps,
  type ContinuousState,
} from '../lib/session/continuous';
import {
  repsDefaults,
  repsTargets,
  initialRepInputs,
  buildRepEntries,
} from '../lib/session/continuous-view';
import {
  saveContinuousSnapshot,
  loadContinuousSnapshot,
} from '../lib/session/runner-persistence';
import type { SessionExercise } from '../lib/types/session';

// ─── Mock manual de localStorage para entorno node ───
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (_i: number) => null,
};

beforeAll(() => {
  (globalThis as any).localStorage = mockLocalStorage;
});
afterAll(() => {
  delete (globalThis as any).localStorage;
});
beforeEach(() => store.clear());

const pushups: SessionExercise[] = [
  { exercise: 'Flexiones', sets: 3, reps: '10-15', work_seconds: 40 },
];
const plank: SessionExercise[] = [
  { exercise: 'Plancha', duration_seconds: 30, sets: 1 },
];

describe('V3-03 buildTimeline — reps vs cronometrado', () => {
  it('push-up 3x10-15 con work_seconds 40 produce 3 reps y 0 work', () => {
    const tl = buildTimeline(pushups);
    const reps = tl.filter((s) => s.kind === 'reps');
    expect(reps).toHaveLength(3);
    expect(tl.filter((s) => s.kind === 'work')).toHaveLength(0);
    expect(reps.every((s) => s.seconds === 0 && s.waitsForUser === true)).toBe(true);
  });

  it('plank con duration_seconds 30 sigue siendo work cronometrado', () => {
    const tl = buildTimeline(plank);
    const work = tl.filter((s) => s.kind === 'work');
    expect(work).toHaveLength(1);
    expect(work[0].seconds).toBe(30);
  });

  it('estimateWorkSeconds ya no se usa para reps', () => {
    const tl = buildTimeline(pushups);
    expect(tl.some((s) => s.kind === 'work')).toBe(false);
    expect(tl.filter((s) => s.kind === 'reps').map((s) => s.seconds)).toEqual([0, 0, 0]);
  });
});

describe('V3-03 motor — los reps esperan al usuario', () => {
  const tl = buildTimeline(pushups);

  it('tick no pasa de un reps aunque transcurran 10 minutos', () => {
    const result = tick(start(0), tl, 600_000);
    expect(result).toMatchObject({ index: 1, remaining: 0, waiting: true, done: false });
  });

  it('advance sale del reps y avanza al siguiente', () => {
    const atReps: ContinuousState = { ...start(0), index: 1, remaining: 0, updatedAt: 20_000 };
    const next = advance(atReps, tl, 20_000);
    expect(next.index).toBe(2);
    expect(tick(next, tl, 20_000)).toMatchObject({ index: 2, waiting: true, done: false });
  });
});

describe('V3-03 modo auto/manual', () => {
  const timed = buildTimeline([
    { exercise: 'Sentadillas', sets: 2, duration_seconds: 10, rest_seconds: 20 },
  ]);
  // ready(0) work(1) rest(2) work(3)
  const onRest = (mode: 'auto' | 'manual'): ContinuousState => ({
    index: 2,
    remaining: 20,
    running: true,
    updatedAt: 0,
    mode,
    reps: {},
  });

  it('manual detiene al llegar a 0 un rest', () => {
    expect(tick(onRest('manual'), timed, 25_000)).toMatchObject({
      index: 2,
      remaining: 0,
      waiting: true,
      done: false,
    });
  });

  it('auto atraviesa el rest vencido', () => {
    expect(tick(onRest('auto'), timed, 25_000)).toMatchObject({
      index: 3,
      remaining: 5,
      waiting: false,
    });
  });

  it('setMode a auto avanza un segmento vencido', () => {
    const manualExpired: ContinuousState = {
      index: 2,
      remaining: 0,
      running: true,
      updatedAt: 0,
      mode: 'manual',
      reps: {},
    };
    const switched = setMode(manualExpired, 'auto', 0);
    expect(switched.mode).toBe('auto');
    expect(tick(switched, timed, 0)).toMatchObject({ index: 3, remaining: 10, waiting: false });
  });
});

describe('V3-03 registro de reps en el momento', () => {
  const exercises: SessionExercise[] = [
    { exercise: 'Flexiones', sets: 3, reps: '10-15' },
    { exercise: 'Zancadas', sets: 1, reps: '8-12', bilateral: true },
  ];

  it('repsDefaults prellena con el tope del rango por slot', () => {
    expect(repsDefaults(exercises)).toEqual({
      '0:1': '15',
      '0:2': '15',
      '0:3': '15',
      '1:2': '12',
      '1:3': '12',
    });
  });

  it('recordReps guarda por clave sin mutar el estado', () => {
    const base = start(0);
    const next = recordReps(base, '0:1', '12');
    expect(next.reps).toEqual({ '0:1': '12' });
    expect(base.reps).toEqual({});
  });

  it('buildRepEntries reutiliza lo registrado', () => {
    const targets = repsTargets(exercises);
    const inputs = initialRepInputs(targets);
    const entries = buildRepEntries(targets, inputs, { '0:1': '12', '1:3': '9' });
    expect(entries[0].actualReps).toEqual(['12', '10-15', '10-15']);
    expect(entries[1].actualReps).toEqual(['8-12', '9']);
  });
});

describe('V3-03 persistencia — compatibilidad', () => {
  it('snapshot viejo sin mode/reps carga con defaults', () => {
    localStorage.setItem(
      'ngc-continuous:old',
      JSON.stringify({
        sessionId: 'old',
        updatedAt: Date.now(),
        state: { index: 0, remaining: 10, running: true, updatedAt: Date.now() },
      }),
    );
    const loaded = loadContinuousSnapshot('old');
    expect(loaded?.state.mode).toBe('auto');
    expect(loaded?.state.reps).toEqual({});
  });

  it('round-trip preserva mode y reps', () => {
    const state: ContinuousState = {
      index: 1,
      remaining: 0,
      running: true,
      updatedAt: Date.now(),
      mode: 'manual',
      reps: { '0:1': '12' },
    };
    saveContinuousSnapshot({ sessionId: 'new', state, updatedAt: Date.now() });
    const loaded = loadContinuousSnapshot('new');
    expect(loaded?.state.mode).toBe('manual');
    expect(loaded?.state.reps).toEqual({ '0:1': '12' });
  });
});
