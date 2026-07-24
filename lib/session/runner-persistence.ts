const STORAGE_PREFIX = 'ngc-runner:';
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 horas

export interface RunnerSnapshot {
  sessionId: string;
  state: string;
  index: number;
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
    actualReps: string;
  }>;
  updatedAt: number;
}

function key(sessionId: string): string {
  return STORAGE_PREFIX + sessionId;
}

export function saveSnapshot(snapshot: RunnerSnapshot): void {
  localStorage.setItem(key(snapshot.sessionId), JSON.stringify(snapshot));
}

export function loadSnapshot(sessionId: string): RunnerSnapshot | null {
  try {
    const raw = localStorage.getItem(key(sessionId));
    if (!raw) return null;
    const data = JSON.parse(raw) as RunnerSnapshot;
    if (Date.now() - data.updatedAt > STALE_THRESHOLD_MS) {
      localStorage.removeItem(key(sessionId));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSnapshot(sessionId: string): void {
  localStorage.removeItem(key(sessionId));
}
