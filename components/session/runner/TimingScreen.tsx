'use client';

import { useTranslations } from 'next-intl';
import CircularTimer from '@/components/session/CircularTimer';
import { displayExerciseName } from '@/lib/exercises/display-name';
import type { FlatExercise } from '@/lib/session/flatten';

export default function TimingScreen({
  side,
  timingSeconds,
  current,
  nextEx,
}: {
  side: 1 | 2 | null;
  timingSeconds: number;
  current: FlatExercise | undefined;
  nextEx: FlatExercise | undefined;
}) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile">
      <p className="font-label-bold text-label-sm uppercase text-on-surface-variant tracking-widest mb-md">
        {t('timer')}
      </p>

      {side != null && (
        <p className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">
          {t('side', { n: side })}
        </p>
      )}

      <div className="relative flex items-center justify-center">
        <CircularTimer remaining={timingSeconds} total={current?.duration_seconds ?? 0} size={340} />
        <p className="absolute font-display-lg text-[100px] leading-none text-primary countdown-glow tabular-nums translate-y-8">
          {timingSeconds}
        </p>
      </div>

      <p className="font-headline-md text-headline-md text-on-surface mt-md">
        {current && displayExerciseName(current.exercise)}
      </p>

      {nextEx && (
        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
          {t('nextExercise')}: <span className="text-on-surface font-medium">{displayExerciseName(nextEx.exercise)}</span>
        </p>
      )}
    </div>
  );
}
