'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Volume2, VolumeX, Check } from 'lucide-react';
import IdleScreen from '@/components/session/runner/IdleScreen';
import ActiveScreen from '@/components/session/runner/ActiveScreen';
import TimingScreen from '@/components/session/runner/TimingScreen';
import RunnerRepsScreen from '@/components/session/runner/RunnerRepsScreen';
import RunnerRestScreen from '@/components/session/runner/RunnerRestScreen';
import RunnerDoneScreen from '@/components/session/runner/RunnerDoneScreen';
import ContinuousPlayer from '@/components/session/ContinuousPlayer';
import ContinuousSummary from '@/components/session/ContinuousSummary';
import SessionDoneScreen from '@/components/session/SessionDoneScreen';
import { greetingText } from '@/lib/settings/greeting';
import type { SessionData } from '@/lib/types/session';
import { displayExerciseName } from '@/lib/exercises/display-name';
import { flattenSession, type SessionSection } from '@/lib/session/flatten';
import { startOptions, resumeRunnerState } from '@/lib/session/continuous-view';
import { buildTimeline } from '@/lib/session/continuous';
import { resolveSessionEntry, snapshotForEntry } from '@/lib/session/entry';
import { computeRestore, applyRestore } from '@/lib/session/restore';
import { saveSessionTimes, saveExerciseReps, type RestTimeEntry, type RepEntry } from './actions';
import { playDone, playTick, playTransition } from '@/lib/audio';
import { useRunnerSnapshot } from '@/lib/session/useRunnerSnapshot';
import { useRunnerAdvance } from '@/lib/session/useRunnerAdvance';
import { startCountdown } from '@/lib/session/startCountdown';
import { useAudioPreference } from '@/lib/useAudioPreference';
import {
  loadSnapshot,
  clearSnapshot,
  loadContinuousSnapshot,
} from '@/lib/session/runner-persistence';

type RunnerState =
  | 'idle'
  | 'active'
  | 'timing'
  | 'reps'
  | 'rest'
  | 'continuous'
  | 'summary'
  | 'done'
  | 'saved';

// ─── Main component ───

export default function SessionRunner({
  sessionId,
  session,
  continuousEnabled = false,
  displayName = null,
  planDayIndex = null,
  serverRow = { completed_at: null, rpe: null },
}: {
  sessionId: string;
  session: SessionData;
  continuousEnabled?: boolean;
  displayName?: string | null;
  planDayIndex?: number | null;
  serverRow?: { completed_at: string | null; rpe: number | null };
}) {
  const t = useTranslations('session');
  const locale = useLocale();
  const router = useRouter();
  const allExercises = flattenSession(session);

  const [state, setState] = useState<RunnerState>('idle');
  const [index, setIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [timingSeconds, setTimingSeconds] = useState(0);
  const [repsInputs, setRepsInputs] = useState<string[]>([]);
  const [imageError, setImageError] = useState(false);
  const [recordedReps, setRecordedReps] = useState<Record<string, string> | null>(null);
  const [savedRpe, setSavedRpe] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedRepsRef = useRef<Record<string, string> | null>(null);
  const restStartRef = useRef<number>(0);
  const restInfoRef = useRef<{
    exerciseIndex: number;
    exercise: string;
    prescribedRest: number;
  }>({ exerciseIndex: 0, exercise: '', prescribedRest: 0 });
  const restTimesRef = useRef<RestTimeEntry[]>([]);
  const exerciseLogRef = useRef<RepEntry[]>([]);
  const repsSubmittedRef = useRef(false);
  const restEndsAtRef = useRef<number | null>(null);
  const timingEndsAtRef = useRef<number | null>(null);
  const sideRef = useRef<1 | 2 | null>(null);
  const [side, setSide] = useState<1 | 2 | null>(null);
  const saveSnap = useRunnerSnapshot(sessionId, {
    restInfoRef, restTimesRef, exerciseLogRef, restEndsAtRef, timingEndsAtRef,
  });
  const [audioEnabled, toggleAudio] = useAudioPreference();
  const audioRef = useRef(audioEnabled);
  audioRef.current = audioEnabled;
  const { advance, finishExercise } = useRunnerAdvance({
    saveSnap, setState, setIndex, playDone, playTransition, audioRef, total: allExercises.length,
  });
  sideRef.current = side;

  // Reset image error on exercise change
  useEffect(() => {
    setImageError(false);
  }, [index]);

  // Restore snapshot on mount (page refresh / back navigation)
  useEffect(() => {
    const snapshot = loadSnapshot(sessionId);
    const continuous = continuousEnabled ? loadContinuousSnapshot(sessionId) : null;
    const continuousDone =
      continuous != null &&
      resumeRunnerState(continuous, buildTimeline(allExercises), Date.now()) === 'summary';
    const entry = resolveSessionEntry(
      serverRow,
      snapshotForEntry(snapshot, continuous, continuousDone),
    );
    const action = computeRestore(snapshot, Date.now(), {
      entry,
      exercises: allExercises,
      serverRpe: serverRow.rpe,
    });
    applyRestore(action, {
      total: allExercises.length,
      timerRef,
      restEndsAtRef,
      timingEndsAtRef,
      sideRef,
      recordedRepsRef,
      restInfoRef,
      restTimesRef,
      exerciseLogRef,
      audioRef,
      recordActualRest,
      finishExercise,
      saveSnap,
      setState: (next) => setState(next as RunnerState),
      setIndex,
      setRestSeconds,
      setTimingSeconds,
      setSide,
      setRecordedReps,
      setSavedRpe,
      playTick,
      playTransition,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Flush accumulated data when session completes
  useEffect(() => {
    if (
      state === 'done' &&
      (restTimesRef.current.length > 0 || exerciseLogRef.current.length > 0)
    ) {
      void saveSessionTimes(
        sessionId,
        restTimesRef.current,
        exerciseLogRef.current,
      ).then((res) => {
        if (res.success) clearSnapshot(sessionId);
      });
    }
    // El RPE aún no se guardó: persistir la etapa para reanudar acá tras recargar.
    if (state === 'done') {
      saveSnap('done', index, {
        restEndsAt: null,
        timingEndsAt: null,
        stage: 'rpe',
        recordedReps: recordedRepsRef.current ?? undefined,
      });
    }
  }, [state, sessionId, index]);

  // Refrescar para que la pantalla de guardado lea la sesión completada.
  useEffect(() => {
    if (state === 'saved') router.refresh();
  }, [state, router]);

  const current = allExercises[index];
  const isLast = index >= allExercises.length - 1;

  // ─── Actions ───

  const recordActualRest = useCallback(() => {
    const elapsed = Math.round((Date.now() - restStartRef.current) / 1000);
    restTimesRef.current.push({
      exerciseIndex: restInfoRef.current.exerciseIndex,
      exercise: restInfoRef.current.exercise,
      prescribedRest: restInfoRef.current.prescribedRest,
      actualRest: elapsed,
    });
  }, []);

  const startRest = useCallback(
    (seconds: number, exIndex: number, exName: string) => {
      restStartRef.current = Date.now();
      restInfoRef.current = {
        exerciseIndex: exIndex,
        exercise: exName,
        prescribedRest: seconds,
      };
      const endsAt = Date.now() + seconds * 1000;
      restEndsAtRef.current = endsAt;
      setRestSeconds(seconds);
      setState('rest');
      startCountdown(timerRef, restEndsAtRef, {
        onTick: setRestSeconds,
        onEnd: () => {
          restEndsAtRef.current = null;
          recordActualRest();
          if (audioRef.current) playTransition();
          // Auto-advance to next exercise
          setState('active');
          setIndex((i) => (i < allExercises.length - 1 ? i + 1 : i));
        },
      });
      saveSnap('rest', index, { restEndsAt: endsAt });
    },
    [allExercises.length, index, recordActualRest, sessionId],
  );

  const handleDone = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const ex = current;
    // Intercept sets/reps exercises: ask for actual reps before advancing
    setSide(null);
    if (ex && ex.sets != null && ex.reps) {
      repsSubmittedRef.current = false;
      const totalSets = current?.bilateral ? (ex.sets ?? 0) * 2 : (ex.sets ?? 0);
      setRepsInputs(Array(totalSets).fill(ex.reps));
      setState('reps');
      return;
    }
    // Advance directly for non-sets/reps exercises
    if (ex?.rest_seconds && ex.rest_seconds > 0) {
      startRest(ex.rest_seconds, index, ex.exercise);
    } else if (isLast) {
      setState('done');
    } else {
      advance(index);
    }
  }, [current, index, isLast, sessionId, startRest]);

  const handleConfirmReps = useCallback(() => {
    if (repsSubmittedRef.current) return;
    repsSubmittedRef.current = true;

    const ex = current;
    if (!ex) return;

    const entry: RepEntry = {
      exercise: ex.exercise,
      prescribedSets: ex.sets || 0,
      prescribedReps: ex.reps || '',
      actualReps: repsInputs,
      bilateral: ex.bilateral ?? false,
    };
    exerciseLogRef.current.push(entry);
    // Manda ref completo, no delta (mergeLogData reemplaza exerciseLog entero).
    // Si falla, un reintento; el guardado final vuelve a mandar la lista completa.
    void saveExerciseReps(sessionId, exerciseLogRef.current)
      .then((res) => {
        if (!res.success) return saveExerciseReps(sessionId, exerciseLogRef.current);
      })
      .catch(() => {});
    saveSnap('reps', index);

    if (ex.rest_seconds && ex.rest_seconds > 0) {
      startRest(ex.rest_seconds, index, ex.exercise);
    } else if (isLast) {
      setState('done');
    } else {
      advance(index);
    }
  }, [current, index, isLast, repsInputs, startRest, sessionId]);

  const handleSkipRest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      restEndsAtRef.current = null;
    }
    setSide(null);
    recordActualRest();
    setRestSeconds(0);
    if (isLast) {
      setState('done');
    } else {
      advance(index);
    }
  }, [index, isLast, recordActualRest, sessionId]);

  const handleStartTimer = useCallback(() => {
    if (!current?.duration_seconds) return;
    const newSide: 1 | null = current.bilateral ? 1 : null;
    sideRef.current = newSide;
    setSide(newSide);
    const endsAt = Date.now() + current.duration_seconds * 1000;
    timingEndsAtRef.current = endsAt;
    setTimingSeconds(current.duration_seconds);
    setState('timing');
    startCountdown(timerRef, timingEndsAtRef, {
      onTick: (remaining) => {
        setTimingSeconds(remaining);
        if (audioRef.current && remaining <= 3 && remaining >= 1) playTick();
      },
      onEnd: () => {
        if (current?.bilateral && sideRef.current === 1) {
          // Side 1 done — switch to side 2 with new timer
          if (audioRef.current) playTransition();
          timingEndsAtRef.current = Date.now() + (current.duration_seconds ?? 0) * 1000;
          sideRef.current = 2;
          setSide(2);
          setTimingSeconds(current.duration_seconds ?? 0);
          startCountdown(timerRef, timingEndsAtRef, {
            onTick: setTimingSeconds,
            onEnd: () => {
              timingEndsAtRef.current = null;
              if (audioRef.current) playDone();
              handleDone();
            },
          });
          saveSnap('timing', index, { currentSide: 2 });
          return;
        }
        timingEndsAtRef.current = null;
        if (audioRef.current) playDone();
        handleDone();
      },
    });
    saveSnap('timing', index, { currentSide: newSide, timingEndsAt: endsAt });
  }, [current, handleDone, index, sessionId]);

  const nextEx = allExercises[index + 1];
  const restMins = Math.floor(restSeconds / 60);
  const restSecs = restSeconds % 60;
  const restDisplay = `${restMins}:${String(restSecs).padStart(2, '0')}`;

  // ─── Render ───

  return (
    <div className="max-w-lg mx-auto relative overflow-hidden min-h-screen bg-background flex flex-col">
      {/* Audio toggle — visible in active states */}
      {state !== 'idle' && state !== 'done' && state !== 'saved' && state !== 'summary' && (
        <button
          onClick={toggleAudio}
          className="absolute top-4 right-4 z-50 bg-surface-800 brutalist-border px-3 py-2 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-xs"
          aria-label={audioEnabled ? t('mute') : t('unmute')}
          title={audioEnabled ? t('mute') : t('unmute')}
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      )}

      {/* Idle: Start screen */}
      {state === 'idle' && (
        <IdleScreen
          locale={locale}
          session={session}
          exerciseCount={allExercises.length}
          continuousEnabled={continuousEnabled}
          onStart={(option) => setState(option === 'continuous' ? 'continuous' : 'active')}
        />
      )}

      {/* Continuous: modo de corrido */}
      {state === 'continuous' && (
        <ContinuousPlayer
          sessionId={sessionId}
          exercises={allExercises}
          audioEnabled={audioEnabled}
          onComplete={(reps) => {
            recordedRepsRef.current = reps;
            setRecordedReps(reps);
            setState('summary');
            const base = loadSnapshot(sessionId);
            saveSnap('summary', base?.index ?? index, {
              restEndsAt: null,
              timingEndsAt: null,
              restTimes: base?.restTimes ?? restTimesRef.current,
              exerciseLog: base?.exerciseLog ?? exerciseLogRef.current,
              stage: 'summary',
              recordedReps: reps,
            });
          }}
        />
      )}

      {/* Continuous summary: reps opcionales antes del RPE */}
      {state === 'summary' && (
        <ContinuousSummary
          sessionId={sessionId}
          exercises={allExercises}
          displayName={displayName}
          recorded={recordedReps}
          onDone={() => setState('done')}
        />
      )}

      {/* Active: Current exercise */}
      {state === 'active' && current && (
        <ActiveScreen
          current={current}
          index={index}
          total={allExercises.length}
          imageError={imageError}
          onImageError={() => setImageError(true)}
          onStartTimer={handleStartTimer}
          onDone={handleDone}
        />
      )}

      {/* Timing: Countdown for timed exercises */}
      {state === 'timing' && (
        <TimingScreen side={side} timingSeconds={timingSeconds} current={current} nextEx={nextEx} />
      )}

      {/* Reps: Input actual reps for sets/reps exercises */}
      {state === 'reps' && current && (
        <RunnerRepsScreen
          current={current}
          repsInputs={repsInputs}
          setRepsInputs={setRepsInputs}
          onConfirm={handleConfirmReps}
        />
      )}

      {/* Rest: Countdown */}
      {state === 'rest' && (
        <RunnerRestScreen
          restSeconds={restSeconds}
          prescribedRest={restInfoRef.current.prescribedRest}
          restDisplay={restDisplay}
          nextEx={nextEx}
          onSkip={handleSkipRest}
        />
      )}

      {/* Done: RPE */}
      {state === 'done' && (
        <RunnerDoneScreen
          displayName={displayName}
          sessionId={sessionId}
          session={session}
          onSaved={(value) => {
            clearSnapshot(sessionId);
            setSavedRpe(value);
            setState('saved');
          }}
        />
      )}

      {/* Saved: Sesión guardada */}
      {state === 'saved' && (
        <SessionDoneScreen session={session} rpe={savedRpe} planDayIndex={planDayIndex} />
      )}
    </div>
  );
}
