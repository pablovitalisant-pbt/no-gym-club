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
  type ContinuousState,
} from './continuous';
import { segmentView } from './continuous-view';
import {
  saveContinuousSnapshot,
  loadContinuousSnapshot,
  clearContinuousSnapshot,
} from './runner-persistence';
import { playBeep } from '@/lib/audio';

type WakeLock = { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };

interface Input {
  sessionId: string;
  exercises: SessionExercise[];
  audioEnabled: boolean;
  onComplete: () => void;
}

/** Motor + persistencia + wake lock del modo de corrido. La UI solo dibuja. */
export function useContinuousPlayer({ sessionId, exercises, audioEnabled, onComplete }: Input) {
  const timeline = useMemo(() => buildTimeline(exercises), [exercises]);
  const [view, setView] = useState<{ index: number; remaining: number; done: boolean } | null>(null);
  const [running, setRunning] = useState(true);
  const [confirmStop, setConfirmStop] = useState(false);
  const stateRef = useRef<ContinuousState | null>(null);
  const prevIndexRef = useRef(-1);
  const prevRemainingRef = useRef(-1);
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

  const stop = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearContinuousSnapshot(sessionId);
    completeRef.current();
  }, [sessionId]);

  // Montaje: retoma snapshot con catch-up o arranca de cero.
  useEffect(() => {
    const snapshot = loadContinuousSnapshot(sessionId);
    const initial = snapshot ? snapshot.state : start(Date.now());
    const now = Date.now();
    const result = tick(initial, timeline, now);
    stateRef.current = { ...initial, index: result.index, remaining: result.remaining, updatedAt: now };
    prevIndexRef.current = result.index;
    prevRemainingRef.current = result.remaining;
    setView(result);
    setRunning(initial.running);
    if (result.done) stop();
  }, [sessionId, timeline, stop]);

  // Tick del reloj. El estado autoritativo solo se reescribe al cambiar de segmento.
  const done = view?.done ?? false;
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const state = stateRef.current;
      if (!state) return;
      const now = Date.now();
      const result = tick(state, timeline, now);

      if (result.index !== prevIndexRef.current) {
        stateRef.current = { ...state, index: result.index, remaining: result.remaining, updatedAt: now };
        persist(stateRef.current);
        if (audioRef.current) playBeep();
      } else if (
        state.running &&
        result.remaining !== prevRemainingRef.current &&
        result.remaining >= 1 &&
        result.remaining <= 3 &&
        audioRef.current
      ) {
        playBeep();
      }
      prevIndexRef.current = result.index;
      prevRemainingRef.current = result.remaining;
      setView(result);
      if (result.done) stop();
    }, 250);
    return () => clearInterval(id);
  }, [timeline, persist, stop, done]);

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

  // Acciones: parten del restante real en pantalla, no del original del segmento.
  const realState = useCallback(() => {
    const state = stateRef.current!;
    const result = tick(state, timeline, Date.now());
    return { ...state, index: result.index, remaining: result.remaining, updatedAt: Date.now() };
  }, [timeline]);

  const onPause = useCallback(() => {
    const next = pause(realState(), Date.now());
    stateRef.current = next;
    setRunning(false);
    setView(tick(next, timeline, Date.now()));
    persist(next);
  }, [realState, timeline, persist]);

  const onResume = useCallback(() => {
    const next = resume(realState(), Date.now());
    stateRef.current = next;
    setRunning(true);
    setView(tick(next, timeline, Date.now()));
    persist(next);
  }, [realState, timeline, persist]);

  const onSkip = useCallback(() => {
    const now = Date.now();
    const next = skip(realState(), now);
    const result = tick(next, timeline, now);
    if (result.done) return stop();
    stateRef.current = { ...next, index: result.index, remaining: result.remaining, updatedAt: now };
    prevIndexRef.current = result.index;
    prevRemainingRef.current = result.remaining;
    setView(result);
    persist(stateRef.current);
  }, [realState, timeline, persist, stop]);

  const segment = view && !view.done ? timeline[view.index] : undefined;
  const info = view && !view.done ? segmentView(timeline, exercises, view.index, view.remaining) : null;

  return {
    info,
    segment,
    remaining: view?.remaining ?? 0,
    running,
    confirmStop,
    setConfirmStop,
    onPause,
    onResume,
    onSkip,
    stop,
  };
}
