const STORAGE_PREFIX = 'ngc-runner:';
const CONTINUOUS_PREFIX = 'ngc-continuous:';
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 horas

export interface RunnerSnapshot {
  sessionId: string;
  state: string;
  index: number;
  currentSide?: number | null;
  restEndsAt: number | null;
  timingEndsAt: number | null;
  restInfo: {
    exerciseIndex: number;
    exercise: string;
    prescribedRest: number;
  };
  restTimes: Array<{
    exerciseIndex: number;
    exercise: string;
    prescribedRest: number;
    actualRest: number;
  }>;
  exerciseLog: Array<{
    exercise: string;
    prescribedSets: number;
    prescribedReps: string;
    actualReps: string[];
  }>;
  /** Etapa de cierre persistida hasta guardar el RPE. */
  stage?: 'summary' | 'rpe';
  recordedReps?: Record<string, string>;
  updatedAt: number;
}

interface StoredSnapshot {
  sessionId: string;
  updatedAt: number;
}

function saveWithPrefix<T extends StoredSnapshot>(prefix: string, snapshot: T): void {
  try {
    localStorage.setItem(prefix + snapshot.sessionId, JSON.stringify(snapshot));
  } catch {
    // Sin storage (modo privado o cuota llena): la sesión sigue en memoria.
  }
}

function loadWithPrefix<T extends StoredSnapshot>(
  prefix: string,
  sessionId: string,
): T | null {
  const key = prefix + sessionId;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as T;
    if (Date.now() - data.updatedAt > STALE_THRESHOLD_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearWithPrefix(prefix: string, sessionId: string): void {
  localStorage.removeItem(prefix + sessionId);
}

export function saveSnapshot(snapshot: RunnerSnapshot): void {
  saveWithPrefix(STORAGE_PREFIX, snapshot);
}

export function loadSnapshot(sessionId: string): RunnerSnapshot | null {
  return loadWithPrefix<RunnerSnapshot>(STORAGE_PREFIX, sessionId);
}

export function clearSnapshot(sessionId: string): void {
  clearWithPrefix(STORAGE_PREFIX, sessionId);
}

export interface ContinuousRunnerSnapshot extends StoredSnapshot {
  state: import('./continuous').ContinuousState;
}

export function saveContinuousSnapshot(snapshot: ContinuousRunnerSnapshot): void {
  saveWithPrefix(CONTINUOUS_PREFIX, snapshot);
}

export function loadContinuousSnapshot(sessionId: string): ContinuousRunnerSnapshot | null {
  const snapshot = loadWithPrefix<ContinuousRunnerSnapshot>(CONTINUOUS_PREFIX, sessionId);
  if (!snapshot) return null;
  // Snapshots previos a v3-03 no traen mode/reps.
  const { state } = snapshot;
  return {
    ...snapshot,
    state: {
      ...state,
      mode: state.mode === 'manual' ? 'manual' : 'auto',
      reps: state.reps ?? {},
    },
  };
}

export function clearContinuousSnapshot(sessionId: string): void {
  clearWithPrefix(CONTINUOUS_PREFIX, sessionId);
}
