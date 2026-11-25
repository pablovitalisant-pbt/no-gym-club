import { useCallback, type MutableRefObject } from 'react';
import { saveSnapshot, type RunnerSnapshot } from '@/lib/session/runner-persistence';

export interface SnapshotRefs {
  restInfoRef: MutableRefObject<RunnerSnapshot['restInfo']>;
  restTimesRef: MutableRefObject<RunnerSnapshot['restTimes']>;
  exerciseLogRef: MutableRefObject<RunnerSnapshot['exerciseLog']>;
  restEndsAtRef: MutableRefObject<number | null>;
  timingEndsAtRef: MutableRefObject<number | null>;
}

export type SnapshotOver = Partial<
  Pick<
    RunnerSnapshot,
    'restEndsAt' | 'timingEndsAt' | 'currentSide' | 'stage' | 'recordedReps' | 'restTimes' | 'exerciseLog'
  >
>;

/** Arma el snapshot leyendo los refs; `over` pisa cualquier campo derivado. */
export function buildSnapshot(
  sessionId: string,
  refs: SnapshotRefs,
  state: string,
  index: number,
  over: SnapshotOver = {},
): RunnerSnapshot {
  return {
    sessionId,
    state,
    index,
    restEndsAt: refs.restEndsAtRef.current,
    timingEndsAt: refs.timingEndsAtRef.current,
    restInfo: refs.restInfoRef.current,
    restTimes: refs.restTimesRef.current,
    exerciseLog: refs.exerciseLogRef.current,
    updatedAt: Date.now(),
    ...over,
  };
}

export function useRunnerSnapshot(sessionId: string, refs: SnapshotRefs) {
  // refs son estables; solo sessionId cambia la identidad.
  return useCallback(
    (state: string, index: number, over?: SnapshotOver) =>
      saveSnapshot(buildSnapshot(sessionId, refs, state, index, over)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId],
  );
}
