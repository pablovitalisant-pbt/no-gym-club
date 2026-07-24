'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Volume2, VolumeX, Check } from 'lucide-react';
import LogForm from '@/components/session/LogForm';
import type { SessionData, SessionExercise } from '@/lib/types/session';
import { saveSessionTimes, saveExerciseReps, type RestTimeEntry, type RepEntry } from './actions';
import { playBeep } from '@/lib/audio';
import { useAudioPreference } from '@/lib/useAudioPreference';
import {
  saveSnapshot,
  loadSnapshot,
  clearSnapshot,
} from '@/lib/session/runner-persistence';

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
  warmup: 'bg-green-500/20 text-green-500 border-green-500/40',
  main: 'bg-primary-container text-on-primary-container',
  cooldown: 'bg-blue-500/20 text-blue-500 border-blue-500/40',
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
  const [repsInputs, setRepsInputs] = useState<string[]>([]);
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
  const restEndsAtRef = useRef<number | null>(null);
  const timingEndsAtRef = useRef<number | null>(null);
  const sideRef = useRef<1 | 2 | null>(null);
  const [side, setSide] = useState<1 | 2 | null>(null);
  const [audioEnabled, toggleAudio] = useAudioPreference();
  const audioRef = useRef(audioEnabled);
  audioRef.current = audioEnabled;
  sideRef.current = side;

  // Restore snapshot on mount (page refresh / back navigation)
  useEffect(() => {
    const snapshot = loadSnapshot(sessionId);
    if (!snapshot) return;
    restTimesRef.current = snapshot.restTimes;
    exerciseLogRef.current = snapshot.exerciseLog;
    restInfoRef.current = snapshot.restInfo;
    setState(snapshot.state as RunnerState);
    setIndex(snapshot.index);
    if (snapshot.currentSide != null) {
      sideRef.current = snapshot.currentSide as 1 | 2;
      setSide(sideRef.current);
    }
    if (snapshot.state === 'rest' && snapshot.restEndsAt != null) {
      restEndsAtRef.current = snapshot.restEndsAt;
      const remaining = Math.max(0, Math.round((snapshot.restEndsAt - Date.now()) / 1000));
      if (remaining > 0) {
        setRestSeconds(remaining);
        timerRef.current = setInterval(() => {
          const rem = restEndsAtRef.current
            ? Math.max(0, Math.round((restEndsAtRef.current - Date.now()) / 1000))
            : 0;
          setRestSeconds(rem);
          if (rem <= 0 && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            restEndsAtRef.current = null;
            recordActualRest();
            if (audioRef.current) playBeep();
            setState('active');
            setIndex((i) => (i < allExercises.length - 1 ? i + 1 : i));
          }
        }, 1000);
      } else {
        restEndsAtRef.current = null;
        setRestSeconds(0);
        if (audioRef.current) playBeep();
        if (snapshot.index >= allExercises.length - 1) setState('done');
        else {
          setState('active');
          setIndex((i) => i + 1);
        }
      }
    } else if (snapshot.state === 'timing' && snapshot.timingEndsAt != null) {
      const restoreEx = allExercises[snapshot.index];
      timingEndsAtRef.current = snapshot.timingEndsAt;
      const remaining = Math.max(0, Math.round((snapshot.timingEndsAt - Date.now()) / 1000));
      if (remaining > 0) {
        setTimingSeconds(remaining);
        timerRef.current = setInterval(() => {
          const rem = timingEndsAtRef.current
            ? Math.max(0, Math.round((timingEndsAtRef.current - Date.now()) / 1000))
            : 0;
          setTimingSeconds(rem);
          if (rem <= 0 && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            if (restoreEx?.bilateral && snapshot.currentSide === 1) {
              // Switch to side 2 with new timer
              if (audioRef.current) playBeep();
              timingEndsAtRef.current = Date.now() + (restoreEx.duration_seconds ?? 0) * 1000;
              sideRef.current = 2;
              setSide(2);
              setTimingSeconds(restoreEx.duration_seconds ?? 0);
              timerRef.current = setInterval(() => {
                const rem2 = timingEndsAtRef.current
                  ? Math.max(0, Math.round((timingEndsAtRef.current - Date.now()) / 1000))
                  : 0;
                setTimingSeconds(rem2);
                if (rem2 <= 0 && timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                  timingEndsAtRef.current = null;
                  if (audioRef.current) playBeep();
                  if (snapshot.index >= allExercises.length - 1) setState('done');
                  else { setState('active'); setIndex((i) => i + 1); }
                }
              }, 1000);
              saveSnapshot({
                sessionId, state: 'timing', currentSide: 2, index: snapshot.index,
                restEndsAt: restEndsAtRef.current, timingEndsAt: timingEndsAtRef.current,
                restInfo: restInfoRef.current, restTimes: restTimesRef.current,
                exerciseLog: exerciseLogRef.current, updatedAt: Date.now(),
              });
              return;
            }
            timingEndsAtRef.current = null;
            if (audioRef.current) playBeep();
            if (snapshot.index >= allExercises.length - 1) setState('done');
            else { setState('active'); setIndex((i) => i + 1); }
          }
        }, 1000);
      } else {
        timingEndsAtRef.current = null;
        setTimingSeconds(0);
        if (restoreEx?.bilateral && snapshot.currentSide === 1) {
          // Side 1 expired while away — switch to side 2 immediately
          if (audioRef.current) playBeep();
          timingEndsAtRef.current = Date.now() + (restoreEx.duration_seconds ?? 0) * 1000;
          sideRef.current = 2;
          setSide(2);
          setTimingSeconds(restoreEx.duration_seconds ?? 0);
          timerRef.current = setInterval(() => {
            const rem2 = timingEndsAtRef.current
              ? Math.max(0, Math.round((timingEndsAtRef.current - Date.now()) / 1000))
              : 0;
            setTimingSeconds(rem2);
            if (rem2 <= 0 && timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              timingEndsAtRef.current = null;
              if (audioRef.current) playBeep();
              if (snapshot.index >= allExercises.length - 1) setState('done');
              else { setState('active'); setIndex((i) => i + 1); }
            }
          }, 1000);
          saveSnapshot({
            sessionId, state: 'timing', currentSide: 2, index: snapshot.index,
            restEndsAt: restEndsAtRef.current, timingEndsAt: timingEndsAtRef.current,
            restInfo: restInfoRef.current, restTimes: restTimesRef.current,
            exerciseLog: exerciseLogRef.current, updatedAt: Date.now(),
          });
        } else {
          if (audioRef.current) playBeep();
          if (snapshot.index >= allExercises.length - 1) setState('done');
          else { setState('active'); setIndex((i) => i + 1); }
        }
      }
    }
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
      saveSessionTimes(
        sessionId,
        restTimesRef.current,
        exerciseLogRef.current,
      );
      clearSnapshot(sessionId);
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
      const endsAt = Date.now() + seconds * 1000;
      restEndsAtRef.current = endsAt;
      setRestSeconds(seconds);
      setState('rest');
      timerRef.current = setInterval(() => {
        const remaining = restEndsAtRef.current
          ? Math.max(0, Math.round((restEndsAtRef.current - Date.now()) / 1000))
          : 0;
        setRestSeconds(remaining);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          restEndsAtRef.current = null;
          recordActualRest();
          if (audioRef.current) playBeep();
          // Auto-advance to next exercise
          setState('active');
          setIndex((i) => (i < allExercises.length - 1 ? i + 1 : i));
        }
      }, 1000);
      saveSnapshot({
        sessionId,
        state: 'rest',
        index,
        restEndsAt: endsAt,
        timingEndsAt: timingEndsAtRef.current,
        restInfo: restInfoRef.current,
        restTimes: restTimesRef.current,
        exerciseLog: exerciseLogRef.current,
        updatedAt: Date.now(),
      });
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
      saveSnapshot({
        sessionId,
        state: 'active',
        index: index + 1,
        restEndsAt: null,
        timingEndsAt: null,
        restInfo: restInfoRef.current,
        restTimes: restTimesRef.current,
        exerciseLog: exerciseLogRef.current,
        updatedAt: Date.now(),
      });
      setState('active');
      setIndex((i) => i + 1);
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
    // Optimistic save: fire and forget — manda ref completo, no delta
    // (mergeLogData reemplaza exerciseLog entero; si mandáramos [entry]
    //  solo, se perderían las entradas anteriores en DB)
    saveExerciseReps(sessionId, exerciseLogRef.current).catch(() => {});
    saveSnapshot({
      sessionId,
      state: 'reps',
      index,
      restEndsAt: restEndsAtRef.current,
      timingEndsAt: timingEndsAtRef.current,
      restInfo: restInfoRef.current,
      restTimes: restTimesRef.current,
      exerciseLog: exerciseLogRef.current,
      updatedAt: Date.now(),
    });

    if (ex.rest_seconds && ex.rest_seconds > 0) {
      startRest(ex.rest_seconds, index, ex.exercise);
    } else if (isLast) {
      setState('done');
    } else {
      saveSnapshot({
        sessionId,
        state: 'active',
        index: index + 1,
        restEndsAt: null,
        timingEndsAt: null,
        restInfo: restInfoRef.current,
        restTimes: restTimesRef.current,
        exerciseLog: exerciseLogRef.current,
        updatedAt: Date.now(),
      });
      setState('active');
      setIndex((i) => i + 1);
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
      saveSnapshot({
        sessionId,
        state: 'active',
        index: index + 1,
        restEndsAt: null,
        timingEndsAt: null,
        restInfo: restInfoRef.current,
        restTimes: restTimesRef.current,
        exerciseLog: exerciseLogRef.current,
        updatedAt: Date.now(),
      });
      setState('active');
      setIndex((i) => i + 1);
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
    timerRef.current = setInterval(() => {
      const remaining = timingEndsAtRef.current
        ? Math.max(0, Math.round((timingEndsAtRef.current - Date.now()) / 1000))
        : 0;
      setTimingSeconds(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        if (current?.bilateral && sideRef.current === 1) {
          // Side 1 done — switch to side 2 with new timer
          if (audioRef.current) playBeep();
          timingEndsAtRef.current = Date.now() + (current.duration_seconds ?? 0) * 1000;
          sideRef.current = 2;
          setSide(2);
          setTimingSeconds(current.duration_seconds ?? 0);
          timerRef.current = setInterval(() => {
            const rem = timingEndsAtRef.current
              ? Math.max(0, Math.round((timingEndsAtRef.current - Date.now()) / 1000))
              : 0;
            setTimingSeconds(rem);
            if (rem <= 0 && timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              timingEndsAtRef.current = null;
              if (audioRef.current) playBeep();
              handleDone();
            }
          }, 1000);
          saveSnapshot({
            sessionId,
            state: 'timing',
            currentSide: 2,
            index,
            restEndsAt: restEndsAtRef.current,
            timingEndsAt: timingEndsAtRef.current,
            restInfo: restInfoRef.current,
            restTimes: restTimesRef.current,
            exerciseLog: exerciseLogRef.current,
            updatedAt: Date.now(),
          });
          return;
        }
        timingEndsAtRef.current = null;
        if (audioRef.current) playBeep();
        handleDone();
      }
    }, 1000);
    saveSnapshot({
      sessionId,
      state: 'timing',
      currentSide: newSide,
      index,
      restEndsAt: restEndsAtRef.current,
      timingEndsAt: endsAt,
      restInfo: restInfoRef.current,
      restTimes: restTimesRef.current,
      exerciseLog: exerciseLogRef.current,
      updatedAt: Date.now(),
    });
  }, [current, handleDone, index, sessionId]);

  const nextEx = allExercises[index + 1];
  const restMins = Math.floor(restSeconds / 60);
  const restSecs = restSeconds % 60;
  const restDisplay = `${restMins}:${String(restSecs).padStart(2, '0')}`;

  // ─── Render ───

  return (
    <div className="max-w-lg mx-auto relative overflow-hidden min-h-screen bg-background flex flex-col">
      {/* Audio toggle — visible in active states */}
      {state !== 'idle' && state !== 'done' && (
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
        <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile py-16 space-y-6">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
            {session.title_es}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {allExercises.length} {t('exercise')}s · {t('warmup')} ({session.warmup.length}) ·{' '}
            {t('main')} ({session.main.length}) · {t('cooldown')} ({session.cooldown.length})
          </p>
          <Button onClick={() => setState('active')} className="w-full max-w-xs !py-4 !text-body-md uppercase">
            {t('start')}
          </Button>
        </div>
      )}

      {/* Active: Current exercise */}
      {state === 'active' && current && (
        <div className="flex-grow flex flex-col px-margin-mobile pt-sm pb-gutter overflow-hidden">
          {/* Progress */}
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">
            {t('progress', { current: index + 1, total: allExercises.length })}
          </p>

          {/* Section badge */}
          <span className={`inline-block px-3 py-1 font-label-bold text-label-sm uppercase tracking-tighter mb-sm ${SECTION_BADGES[current.section]}`}>
            {t(current.section)}
          </span>

          {/* Exercise name */}
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase mb-1">
            {current.exercise}
          </h2>

          {/* Prescription */}
          {current.sets != null && current.reps && (
            <p className="font-headline-md text-headline-md text-primary-container tracking-tight mb-md">
              {current.sets} × {current.reps}
              {current.rpe != null && <span className="text-body-md font-normal"> · RPE {current.rpe}</span>}
            </p>
          )}
          {current.duration_seconds != null && (
            <p className="font-headline-md text-headline-md text-primary-container tracking-tight mb-md">
              {current.duration_seconds}s
            </p>
          )}

          {/* Technique notes */}
          {current.notes_es && (
            <div className="brutalist-border p-sm bg-surface-800 mb-md shrink-0">
              <h3 className="font-label-bold text-label-sm text-on-surface-variant uppercase mb-2">
                {t('technique')}
              </h3>
              <p className="font-body-md text-body-md text-on-surface">
                {current.notes_es}
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Action button */}
          {current.duration_seconds != null ? (
            <Button onClick={handleStartTimer} className="w-full h-16 !font-label-bold !text-headline-md uppercase">
              {t('startTimer')}
            </Button>
          ) : (
            <Button onClick={handleDone} className="w-full h-16 !font-label-bold !text-headline-md uppercase">
              {t('done')}
            </Button>
          )}
        </div>
      )}

      {/* Timing: Countdown for timed exercises */}
      {state === 'timing' && (
        <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile">
          <p className="font-label-bold text-label-sm uppercase text-on-surface-variant tracking-widest mb-md">
            {t('timer')}
          </p>

          {side != null && (
            <p className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">
              {t('side', { n: side })}
            </p>
          )}

          <p className="font-display-lg text-[100px] leading-none text-primary countdown-glow tabular-nums">
            {timingSeconds}
          </p>

          <p className="font-headline-md text-headline-md text-on-surface mt-md">
            {current?.exercise}
          </p>

          {nextEx && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              {t('nextExercise')}: <span className="text-on-surface font-medium">{nextEx.exercise}</span>
            </p>
          )}
        </div>
      )}

      {/* Reps: Input actual reps for sets/reps exercises */}
      {state === 'reps' && current && (
        <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile space-y-6">
          <p className="font-label-bold text-label-sm uppercase text-on-surface-variant tracking-widest">
            {t('repsPrompt')}
          </p>

          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
            {current.exercise}
          </h2>

          <p className="font-body-md text-body-md text-on-surface-variant">
            {t('prescribed')}: {current.sets} × {current.reps}
            {current.rpe != null && ` · RPE ${current.rpe}`}
          </p>

          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: current.sets ?? 0 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">
                  {current.bilateral ? `${t('side', { n: 1 })} — ${t('setLabel', { n: i + 1 })}` : t('setLabel', { n: i + 1 })}
                </label>
                <input
                  type="text"
                  value={repsInputs[i] ?? ''}
                  onChange={(e) =>
                    setRepsInputs((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                  }
                  className="w-32 bg-surface-900 brutalist-border border-2 border-outline text-center font-display-lg text-headline-lg text-primary !py-4 focus:border-primary-container focus:shadow-[0_0_0_1px_#e8570a] outline-none transition-all"
                  placeholder={current.reps}
                  autoFocus={i === 0}
                />
              </div>
            ))}
            {current.bilateral && Array.from({ length: current.sets ?? 0 }, (_, i) => {
              const idx = (current.sets ?? 0) + i;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">
                    {t('side', { n: 2 })} — {t('setLabel', { n: i + 1 })}
                  </label>
                  <input
                    type="text"
                    value={repsInputs[idx] ?? ''}
                    onChange={(e) =>
                      setRepsInputs((prev) => prev.map((v, j) => (j === idx ? e.target.value : v)))
                    }
                    className="w-32 bg-surface-900 brutalist-border border-2 border-outline text-center font-display-lg text-headline-lg text-primary !py-4 focus:border-primary-container focus:shadow-[0_0_0_1px_#e8570a] outline-none transition-all"
                    placeholder={current.reps}
                  />
                </div>
              );
            })}
          </div>

          <Button onClick={handleConfirmReps} iconRight={Check} className="w-full max-w-xs !py-4 uppercase">
            {t('confirmReps')}
          </Button>
        </div>
      )}

      {/* Rest: Countdown */}
      {state === 'rest' && (
        <div className="flex-grow flex flex-col items-center justify-center relative px-margin-mobile w-full space-y-md">
          <span className="font-label-bold text-label-sm uppercase text-primary-container mb-2 tracking-widest">
            {t('rest')}
          </span>

          <p className={`font-display-lg text-[100px] leading-none countdown-glow font-extrabold tracking-tighter tabular-nums transition-all ${restSeconds <= 3 ? 'text-green-500 scale-110' : 'text-primary-container'}`}>
            {restDisplay}
          </p>

          {/* Next exercise preview */}
          {nextEx && (
            <div className="bg-surface-800 brutalist-border p-4 w-full max-w-sm">
              <p className="font-label-bold text-label-sm uppercase text-on-surface-variant mb-1">
                {t('nextExercise')}
              </p>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
                {nextEx.exercise}
              </h3>
              {nextEx.sets != null && nextEx.reps && (
                <p className="font-mono-data text-mono-data text-on-surface mt-2">
                  {nextEx.sets}×{nextEx.reps}
                  {nextEx.rpe != null && ` · RPE ${nextEx.rpe}`}
                </p>
              )}
            </div>
          )}

          <Button variant="ghost" onClick={handleSkipRest}>
            {t('skipRest')}
          </Button>
        </div>
      )}

      {/* Done: Complete */}
      {state === 'done' && (
        <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile space-y-6">
          <p className="font-headline-md text-headline-md text-green-500 uppercase">
            {t('complete')}
          </p>
          <LogForm
            sessionId={sessionId}
            session={session}
            onSaved={() => {
              setTimeout(() => {
                router.push('/dashboard');
              }, 1500);
            }}
          />
        </div>
      )}
    </div>
  );
}
