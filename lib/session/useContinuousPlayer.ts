'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SessionExercise } from '@/lib/types/session';
import {
  buildTimeline,
  start,
  tick,
  pause,
  resume,
  skip,
  advance as advanceEngine,
  recordReps as recordRepsEngine,
  setMode as setModeEngine,
  extend as extendEngine,
  type ContinuousState,
  type RunMode,
  type TickResult,
} from './continuous';
import { segmentView } from './continuous-view';
import {
  saveContinuousSnapshot,
  loadContinuousSnapshot,
  clearContinuousSnapshot,
} from './runner-persistence';
import { loadRunMode, saveRunMode } from './run-mode';
import { alarmForFrame, playAlarm, stopAll, type SoundFrame } from './player-sound';

type WakeLock = { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };

interface Input {
  sessionId: string;
  exercises: SessionExercise[];
  audioEnabled: boolean;
  onComplete: (reps: Record<string, string>) => void;
}

function frameOf(state: ContinuousState, result: TickResult): SoundFrame {
  return {
    index: result.index,
    remaining: result.remaining,
    running: state.running,
    waiting: Boolean(result.waiting),
    done: result.done,
  };
}

/** Motor + persistencia + wake lock del modo de corrido. La UI solo dibuja. */
export function useContinuousPlayer({ sessionId, exercises, audioEnabled, onComplete }: Input) {
  const timeline = useMemo(() => buildTimeline(exercises), [exercises]);
  const [view, setView] = useState<TickResult | null>(null);
  const [running, setRunning] = useState(true);
  const [mode, setModeState] = useState<RunMode>('auto');
  const [reps, setReps] = useState<Record<string, string>>({});
  const [confirmStop, setConfirmStop] = useState(false);
  const stateRef = useRef<ContinuousState | null>(null);
  const prevFrameRef = useRef<SoundFrame | null>(null);
  const finishedRef = useRef(false);
  const audioRef = useRef(audioEnabled);
  audioRef.current = audioEnabled;
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const persist = useCallback(
    (state: ContinuousState) => {
      saveContinuousSnapshot({ sessionId, state, updatedAt: Date.now() });
    },
    [sessionId],
  );

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearContinuousSnapshot(sessionId);
    completeRef.current(stateRef.current?.reps ?? {});
  }, [sessionId]);

  /** Estado autoritativo con el restante real de ahora. */
  const realState = useCallback(() => {
    const state = stateRef.current!;
    const result = tick(state, timeline, Date.now());
    const next = { ...state, index: result.index, remaining: result.remaining, updatedAt: Date.now() };
    stateRef.current = next;
    return next;
  }, [timeline]);

  // Montaje: retoma snapshot (con su modo) o arranca con la preferencia guardada.
  useEffect(() => {
    const snapshot = loadContinuousSnapshot(sessionId);
    const savedMode = snapshot ? snapshot.state.mode : loadRunMode();
    const initial = snapshot ? snapshot.state : start(Date.now(), savedMode);
    const now = Date.now();
    const result = tick(initial, timeline, now);
    stateRef.current = { ...initial, index: result.index, remaining: result.remaining, updatedAt: now };
    prevFrameRef.current = frameOf(initial, result);
    setView(result);
    setRunning(initial.running);
    setModeState(initial.mode);
    setReps(initial.reps);
    if (result.done) finish();
  }, [sessionId, timeline, finish]);

  // Tick del reloj. El estado autoritativo solo se reescribe al cambiar de segmento.
  const done = view?.done ?? false;
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const state = stateRef.current;
      if (!state) return;
      const now = Date.now();
      const result = tick(state, timeline, now);
      const prev = prevFrameRef.current;
      const cur = frameOf(state, result);

      if (result.index !== state.index) {
        stateRef.current = { ...state, index: result.index, remaining: result.remaining, updatedAt: now };
        persist(stateRef.current);
      }
      prevFrameRef.current = cur;
      setView(result);
      playAlarm(alarmForFrame(prev, cur, audioRef.current));
      if (result.done) finish();
    }, 250);
    return () => clearInterval(id);
  }, [timeline, persist, finish, done]);

  // Wake lock solo mientras corre.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    let cancelled = false;
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLock }).wakeLock;
    if (running && wakeLock) {
      wakeLock
        .request('screen')
        .then((l) => {
          if (cancelled) l.release().catch(() => {});
          else lock = l;
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      lock?.release().catch(() => {});
    };
  }, [running]);

  // Al desmontar no debe quedar ninguna alarma sonando.
  useEffect(() => () => stopAll(), []);

  const onPause = useCallback(() => {
    stopAll();
    const next = pause(realState(), Date.now());
    stateRef.current = next;
    setRunning(false);
    setView(tick(next, timeline, Date.now()));
    prevFrameRef.current = frameOf(next, tick(next, timeline, Date.now()));
    persist(next);
  }, [realState, timeline, persist]);

  const onResume = useCallback(() => {
    const now = Date.now();
    const next = resume(realState(), now);
    stateRef.current = next;
    setRunning(true);
    const result = tick(next, timeline, now);
    prevFrameRef.current = frameOf(next, result);
    setView(result);
    persist(next);
  }, [realState, timeline, persist]);

  const onSkip = useCallback(() => {
    const now = Date.now();
    const next = skip(realState(), now);
    const result = tick(next, timeline, now);
    if (result.done) return finish();
    stateRef.current = { ...next, index: result.index, remaining: result.remaining, updatedAt: now };
    prevFrameRef.current = frameOf(stateRef.current, result);
    setView(result);
    persist(stateRef.current);
  }, [realState, timeline, persist, finish]);

  /** "Continuar": sale del segmento que espera (o de un descanso manual a 0). */
  const onAdvance = useCallback(() => {
    const now = Date.now();
    const next = advanceEngine(realState(), timeline, now);
    if (next.index >= timeline.length) {
      stateRef.current = next;
      setView({ index: timeline.length, remaining: 0, done: true });
      finish();
      return;
    }
    const result = tick(next, timeline, now);
    stateRef.current = { ...next, index: result.index, remaining: result.remaining, updatedAt: now };
    prevFrameRef.current = frameOf(stateRef.current, result);
    setView(result);
    persist(stateRef.current);
    if (result.done) finish();
  }, [realState, timeline, persist, finish]);

  const onRecordReps = useCallback(
    (key: string, value: string) => {
      const next = recordRepsEngine(realState(), key, value);
      stateRef.current = next;
      setReps(next.reps);
      persist(next);
    },
    [realState, persist],
  );

  const onSetMode = useCallback(
    (nextMode: RunMode) => {
      const now = Date.now();
      const next = setModeEngine(realState(), nextMode, now);
      saveRunMode(nextMode);
      stateRef.current = next;
      setModeState(nextMode);
      const result = tick(next, timeline, now);
      const prev = prevFrameRef.current;
      prevFrameRef.current = frameOf(next, result);
      setView(result);
      persist(next);
      playAlarm(alarmForFrame(prev, prevFrameRef.current, audioRef.current));
      if (result.done) finish();
    },
    [realState, timeline, persist, finish],
  );

  const onExtendRest = useCallback(
    (seconds: number) => {
      const now = Date.now();
      const next = extendEngine(realState(), seconds, now);
      stateRef.current = next;
      const result = tick(next, timeline, now);
      prevFrameRef.current = frameOf(next, result);
      setView(result);
      persist(next);
    },
    [realState, timeline, persist],
  );

  const stop = useCallback(() => {
    stopAll();
    finish();
  }, [finish]);

  const segment = view && !view.done ? timeline[view.index] : undefined;
  const info = view && !view.done ? segmentView(timeline, exercises, view.index, view.remaining) : null;

  return {
    info,
    segment,
    remaining: view?.remaining ?? 0,
    running,
    waiting: Boolean(view?.waiting),
    mode,
    reps,
    confirmStop,
    setConfirmStop,
    onPause,
    onResume,
    onSkip,
    onAdvance,
    onRecordReps,
    onSetMode,
    extendRest: onExtendRest,
    stop,
  };
}
