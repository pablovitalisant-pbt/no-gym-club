'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import type { SessionData, SessionExercise } from '@/lib/types/session';

type RunnerState = 'idle' | 'active' | 'rest' | 'done';
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const current = allExercises[index];
  const isLast = index >= allExercises.length - 1;

  // ─── Actions ───

  const startRest = useCallback(
    (seconds: number) => {
      setRestSeconds(seconds);
      setState('rest');
      timerRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            // Auto-advance to next exercise
            setState('active');
            setIndex((i) => (i < allExercises.length - 1 ? i + 1 : i));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [allExercises.length],
  );

  const handleDone = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const ex = current;
    if (ex?.rest_seconds && ex.rest_seconds > 0) {
      startRest(ex.rest_seconds);
    } else if (isLast) {
      setState('done');
    } else {
      setIndex((i) => i + 1);
    }
  }, [current, isLast, startRest]);

  const handleSkipRest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRestSeconds(0);
    if (isLast) {
      setState('done');
    } else {
      setState('active');
      setIndex((i) => i + 1);
    }
  }, [isLast]);

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

          {/* Done button */}
          <Button onClick={handleDone}>{t('done')}</Button>
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
