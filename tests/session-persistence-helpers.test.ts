import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// ─── Mock manual de localStorage para entorno node ───
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem(key: string): string | null {
    return store.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    store.set(key, value);
  },
  removeItem(key: string): void {
    store.delete(key);
  },
  clear(): void {
    store.clear();
  },
  get length() {
    return store.size;
  },
  key(_index: number): string | null {
    return null; // no usado en tests
  },
};

beforeAll(() => {
  (globalThis as any).localStorage = mockLocalStorage;
});

afterAll(() => {
  delete (globalThis as any).localStorage;
});

// Import del módulo a testear (no existe todavía — debe fallar)
let persistence: any;
try {
  persistence = await import('@/lib/session/runner-persistence');
} catch {
  // El módulo no existe — falla explícita en cada test
}

function assertModuleExists() {
  expect(
    persistence,
    'FASE B: runner-persistence.ts no existe — debe implementarse en Fase C',
  ).toBeTruthy();
}

describe('Persistence helpers — runner-persistence.ts', () => {
  const SESSION_A = 'session-111';
  const SESSION_B = 'session-222';
  const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 horas

  beforeEach(() => {
    store.clear();
  });

  // ─── Round-trip básico ───
  it('saveSnapshot + loadSnapshot round-trip preserva datos', () => {
    assertModuleExists();
    const snapshot = {
      sessionId: SESSION_A,
      state: 'rest',
      index: 3,
      restEndsAt: Date.now() + 90_000,
      timingEndsAt: null,
      restInfo: {
        exerciseIndex: 3,
        exercise: 'Flexiones',
        prescribedRest: 90,
      },
      restTimes: [{ exerciseIndex: 0, exercise: 'Dominadas', prescribedRest: 60, actualRest: 55 }],
      exerciseLog: [{ exercise: 'Flexiones', prescribedSets: 3, prescribedReps: '15', actualReps: '12' }],
      updatedAt: Date.now(),
    };
    persistence.saveSnapshot(snapshot);
    const loaded = persistence.loadSnapshot(SESSION_A);
    expect(loaded).not.toBeNull();
    expect(loaded?.sessionId).toBe(SESSION_A);
    expect(loaded?.state).toBe('rest');
    expect(loaded?.index).toBe(3);
    expect(loaded?.restEndsAt).toBeCloseTo(snapshot.restEndsAt!, -2);
    expect(loaded?.restTimes).toHaveLength(1);
    expect(loaded?.exerciseLog).toHaveLength(1);
  });

  // ─── loadSnapshot devuelve null si no hay nada ───
  it('loadSnapshot devuelve null para sessionId sin snapshot', () => {
    assertModuleExists();
    expect(persistence.loadSnapshot('nonexistent')).toBeNull();
  });

  // ─── loadSnapshot no lanza excepción si JSON corrupto ───
  it('loadSnapshot devuelve null (sin excepción) si JSON está corrupto', () => {
    assertModuleExists();
    store.set('ngc-runner:nonexistent', '{esto-no-es-json!!!');
    expect(() => persistence.loadSnapshot('nonexistent')).not.toThrow();
    expect(persistence.loadSnapshot('nonexistent')).toBeNull();
  });

  // ─── loadSnapshot respeta umbral de 6h ───
  it('loadSnapshot devuelve null si el snapshot venció (>6h)', () => {
    assertModuleExists();
    const old = {
      sessionId: SESSION_A,
      state: 'active',
      index: 0,
      restEndsAt: null,
      timingEndsAt: null,
      restInfo: { exerciseIndex: 0, exercise: '', prescribedRest: 0 },
      restTimes: [],
      exerciseLog: [],
      updatedAt: Date.now() - STALE_THRESHOLD_MS - 1,
    };
    persistence.saveSnapshot(old);
    expect(persistence.loadSnapshot(SESSION_A)).toBeNull();
  });

  it('loadSnapshot devuelve el snapshot si no venció (<6h)', () => {
    assertModuleExists();
    const fresh = {
      sessionId: SESSION_A,
      state: 'active',
      index: 0,
      restEndsAt: null,
      timingEndsAt: null,
      restInfo: { exerciseIndex: 0, exercise: '', prescribedRest: 0 },
      restTimes: [],
      exerciseLog: [],
      updatedAt: Date.now() - STALE_THRESHOLD_MS + 1,
    };
    persistence.saveSnapshot(fresh);
    expect(persistence.loadSnapshot(SESSION_A)).not.toBeNull();
  });

  // ─── Dos sessionId no colisionan ───
  it('snapshots de sessionId A y B no colisionan', () => {
    assertModuleExists();
    const snapA = {
      sessionId: SESSION_A,
      state: 'active',
      index: 2,
      restEndsAt: null,
      timingEndsAt: null,
      restInfo: { exerciseIndex: 0, exercise: '', prescribedRest: 0 },
      restTimes: [],
      exerciseLog: [],
      updatedAt: Date.now(),
    };
    const snapB = {
      sessionId: SESSION_B,
      state: 'rest',
      index: 5,
      restEndsAt: Date.now() + 60000,
      timingEndsAt: null,
      restInfo: { exerciseIndex: 5, exercise: 'Sentadillas', prescribedRest: 60 },
      restTimes: [],
      exerciseLog: [],
      updatedAt: Date.now(),
    };
    persistence.saveSnapshot(snapA);
    persistence.saveSnapshot(snapB);
    expect(persistence.loadSnapshot(SESSION_A)?.index).toBe(2);
    expect(persistence.loadSnapshot(SESSION_B)?.state).toBe('rest');
  });

  // ─── clearSnapshot solo limpia su propio key ───
  it('clearSnapshot no toca ngc-audio-enabled ni otro sessionId', () => {
    assertModuleExists();
    store.set('ngc-audio-enabled', 'true');
    const snapA = {
      sessionId: SESSION_A,
      state: 'active',
      index: 0,
      restEndsAt: null,
      timingEndsAt: null,
      restInfo: { exerciseIndex: 0, exercise: '', prescribedRest: 0 },
      restTimes: [],
      exerciseLog: [],
      updatedAt: Date.now(),
    };
    persistence.saveSnapshot(snapA);
    persistence.clearSnapshot(SESSION_A);
    // ngc-audio-enabled debe seguir intacto
    expect(store.get('ngc-audio-enabled')).toBe('true');
    // El snapshot de SESSION_A debe haberse ido
    expect(persistence.loadSnapshot(SESSION_A)).toBeNull();
  });
});
