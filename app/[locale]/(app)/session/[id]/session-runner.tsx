'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import type { SessionData, SessionExercise } from '@/lib/types/session';
import { saveSessionTimes, saveExerciseReps, type RestTimeEntry, type RepEntry } from './actions';
import { playBeep } from '@/lib/audio';

type RunnerState = 'idle' | 'active' | 'timing' | 'reps' | 'rest' | 'done';
type Section = 'warmup' | 'main' | 'cooldown';

interface FlatExercise extends SessionExercise {
  section: Section;
}

function flattenSession(session: SessionData): FlatExercise[] {
  return [
    ...session.warmup.map((e) => ({ ...e, section: 'warmup' as Section })),
    ...session.main.map((e) => ({ ...e, section: 'main' as Section })),
    ...session.cooldown.map((e) => ({ ...e, section: 'cooldown' as Section })),
  ];
}

const SECTION_BADGES: Record<Section, string> = {
  warmup: 'bg-green-900 text-green-300 border-green-700',
  main: 'bg-accent/20 text-accent border-accent/50',
  cooldown: 'bg-blue-900 text-blue-300 border-blue-700',
};

// ─── Main component ───

export default function SessionRunner({
  sessionId,
  session,
}: {
  sessionId: string;
  session: SessionData;
}) {
  const t = useTranslations('session');
  const router = useRouter();
  const allExercises = flattenSession(session);

  const [state, setState] = useState<RunnerState>('idle');
  const [index, setIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [timingSeconds, setTimingSeconds] = useState(0);
  const [repsInput, setRepsInput] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restStartRef = useRef<number>(0);
  const restInfoRef = useRef<{
    exerciseIndex: number;
    exercise: string;
    prescribedRest: number;
  }>({ exerciseIndex: 0, exercise: '', prescribedRest: 0 });
  const restTimesRef = useRef<RestTimeEntry[]>([]);
  const exerciseLogRef = useRef<RepEntry[]>([]);
  const repsSubmittedRef = useRef(false);

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
      saveSessionTimes(
        sessionId,
        restTimesRef.current,
        exerciseLogRef.current,
      );
    }
  }, [state, sessionId]);

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
      setRestSeconds(seconds);
      setState('rest');
      timerRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            recordActualRest();
            playBeep();
            // Auto-advance to next exercise
            setState('active');
            setIndex((i) => (i < allExercises.length - 1 ? i + 1 : i));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [allExercises.length, recordActualRest],
  );

  const handleDone = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const ex = current;
    // Intercept sets/reps exercises: ask for actual reps before advancing
    if (ex && ex.sets != null && ex.reps) {
      repsSubmittedRef.current = false;
      setRepsInput(ex.reps);
      setState('reps');
      return;
    }
    // Advance directly for non-sets/reps exercises
    if (ex?.rest_seconds && ex.rest_seconds > 0) {
      startRest(ex.rest_seconds, index, ex.exercise);
    } else if (isLast) {
      setState('done');
    } else {
      setIndex((i) => i + 1);
    }
  }, [current, isLast, startRest]);

  const handleConfirmReps = useCallback(() => {
    if (repsSubmittedRef.current) return;
    repsSubmittedRef.current = true;

    const ex = current;
    if (!ex) return;

    const entry: RepEntry = {
      exercise: ex.exercise,
      prescribedSets: ex.sets || 0,
      prescribedReps: ex.reps || '',
      actualReps: repsInput,
    };
    exerciseLogRef.current.push(entry);
    // Optimistic save: fire and forget — manda ref completo, no delta
    // (mergeLogData reemplaza exerciseLog entero; si mandáramos [entry]
    //  solo, se perderían las entradas anteriores en DB)
    saveExerciseReps(sessionId, exerciseLogRef.current).catch(() => {});

    if (ex.rest_seconds && ex.rest_seconds > 0) {
      startRest(ex.rest_seconds, index, ex.exercise);
    } else if (isLast) {
      setState('done');
    } else {
      setIndex((i) => i + 1);
    }
  }, [current, isLast, repsInput, startRest, sessionId]);

  const handleSkipRest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recordActualRest();
    setRestSeconds(0);
    if (isLast) {
      setState('done');
    } else {
      setState('active');
      setIndex((i) => i + 1);
    }
  }, [isLast, recordActualRest]);

  const handleStartTimer = useCallback(() => {
    if (!current?.duration_seconds) return;
    setTimingSeconds(current.duration_seconds);
    setState('timing');
    timerRef.current = setInterval(() => {
      setTimingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          playBeep();
          handleDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [current, handleDone]);

  const nextEx = allExercises[index + 1];

  // ─── Render ───

  return (
    <div className="max-w-lg mx-auto">
      {/* Idle: Start screen */}
      {state === 'idle' && (
        <div className="text-center py-16 space-y-6">
          <h1 className="text-xl font-bold text-text-primary">
            {session.title_es}
          </h1>
          <p className="text-sm text-text-muted">
            {allExercises.length} {t('exercise')}s · {t('warmup')} ({session.warmup.length}) ·{' '}
            {t('main')} ({session.main.length}) · {t('cooldown')} ({session.cooldown.length})
          </p>
          <Button onClick={() => setState('active')}>{t('start')}</Button>
        </div>
      )}

      {/* Active: Current exercise */}
      {state === 'active' && current && (
        <div className="text-center py-12 space-y-6">
          {/* Progress */}
          <p className="text-xs text-text-muted uppercase tracking-widest">
            {t('progress', { current: index + 1, total: allExercises.length })}
          </p>

          {/* Section badge */}
          <span
            className={`inline-block text-xs px-3 py-0.5 rounded border ${SECTION_BADGES[current.section]}`}
          >
            {t(current.section)}
          </span>

          {/* Exercise name */}
          <h2 className="text-2xl font-bold text-text-primary">
            {current.exercise}
          </h2>

          {/* Details */}
          <div className="space-y-1">
            {current.sets != null && current.reps && (
              <p className="text-lg text-text-primary font-semibold">
                {current.sets} × {current.reps}
                {current.rpe != null && (
                  <span className="text-sm text-text-muted font-normal">
                    {' '}· RPE {current.rpe}
                  </span>
                )}
              </p>
            )}
            {current.duration_seconds != null && (
              <p className="text-lg text-text-primary font-semibold">
                {current.duration_seconds}s
              </p>
            )}
            {current.notes_es && (
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                {current.notes_es}
              </p>
            )}
          </div>

          {/* Action button: Vamos! for timed, Done for sets/reps */}
          {current.duration_seconds != null ? (
            <Button onClick={handleStartTimer}>{t('startTimer')}</Button>
          ) : (
            <Button onClick={handleDone}>{t('done')}</Button>
          )}
        </div>
      )}

      {/* Timing: Countdown for timed exercises */}
      {state === 'timing' && (
        <div className="text-center py-16 space-y-6">
          <p className="text-xs text-text-muted uppercase tracking-widest">
            {t('timer')}
          </p>

          {/* Countdown */}
          <p className="text-6xl font-bold tabular-nums text-accent">
            {timingSeconds}
          </p>

          {/* Exercise name */}
          <p className="text-lg text-text-primary font-semibold">
            {current?.exercise}
          </p>

          {/* Next exercise preview */}
          {nextEx && (
            <p className="text-sm text-text-muted">
              {t('nextExercise')}:{' '}
              <span className="text-text-primary font-medium">
                {nextEx.exercise}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Reps: Input actual reps for sets/reps exercises */}
      {state === 'reps' && current && (
        <div className="text-center py-12 space-y-6">
          <p className="text-xs text-text-muted uppercase tracking-widest">
            {t('repsPrompt')}
          </p>

          <h2 className="text-2xl font-bold text-text-primary">
            {current.exercise}
          </h2>

          <p className="text-sm text-text-muted">
            {t('prescribed')}: {current.sets} × {current.reps}
            {current.rpe != null && ` · RPE ${current.rpe}`}
          </p>

          <div className="flex flex-col items-center gap-2">
            <label className="text-sm text-text-muted">
              {t('actualRepsLabel')}
            </label>
            <input
              type="text"
              value={repsInput}
              onChange={(e) => setRepsInput(e.target.value)}
              className="w-24 bg-surface-800 border border-border rounded px-3 py-2 text-xl text-text-primary text-center focus:outline-none focus:border-accent"
              placeholder={current.reps}
              autoFocus
            />
          </div>

          <Button onClick={handleConfirmReps}>
            {t('confirmReps')}
          </Button>
        </div>
      )}

      {/* Rest: Countdown */}
      {state === 'rest' && (
        <div className="text-center py-16 space-y-6">
          <p className="text-xs text-text-muted uppercase tracking-widest">
            {t('rest')}
          </p>

          {/* Countdown */}
          <p
            className={`text-6xl font-bold tabular-nums transition-colors
              ${restSeconds <= 3 ? 'text-green-400 scale-110' : 'text-text-primary'}
            `}
          >
            {restSeconds}
          </p>

          {/* Next exercise preview */}
          {nextEx && (
            <p className="text-sm text-text-muted">
              {t('nextExercise')}:{' '}
              <span className="text-text-primary font-medium">
                {nextEx.exercise}
              </span>
              {nextEx.sets != null &&
                nextEx.reps &&
                ` · ${nextEx.sets}×${nextEx.reps}`}
            </p>
          )}

          {/* Skip button */}
          <Button variant="ghost" onClick={handleSkipRest}>
            {t('skipRest')}
          </Button>
        </div>
      )}

      {/* Done: Complete */}
      {state === 'done' && (
        <div className="text-center py-16 space-y-6">
          <p className="text-green-400 text-lg font-semibold">
            {t('complete')}
          </p>
          <p className="text-sm text-text-muted">{t('completeMessage')}</p>
          <Button onClick={() => router.push('/dashboard')}>
            {t('backToDashboard')}
          </Button>
        </div>
      )}
    </div>
  );
}
