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
  const [audioEnabled, toggleAudio] = useAudioPreference();
  const audioRef = useRef(audioEnabled);
  audioRef.current = audioEnabled;

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
            if (audioRef.current) playBeep();
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
      setState('active');
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
      setState('active');
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
          if (audioRef.current) playBeep();
          handleDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [current, handleDone]);

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

          <div className="flex flex-col items-center gap-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant">
              {t('actualRepsLabel')}
            </label>
            <input
              type="text"
              value={repsInput}
              onChange={(e) => setRepsInput(e.target.value)}
              className="w-32 bg-surface-900 brutalist-border border-2 border-outline text-center font-display-lg text-headline-lg text-primary !py-4 focus:border-primary-container focus:shadow-[0_0_0_1px_#e8570a] outline-none transition-all"
              placeholder={current.reps}
              autoFocus
            />
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
