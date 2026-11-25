'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import CircularTimer from '@/components/session/CircularTimer';
import { displayExerciseName } from '@/lib/exercises/display-name';
import type { FlatExercise } from '@/lib/session/flatten';

export default function RunnerRestScreen({
  restSeconds,
  prescribedRest,
  restDisplay,
  nextEx,
  onSkip,
}: {
  restSeconds: number;
  prescribedRest: number;
  restDisplay: string;
  nextEx: FlatExercise | undefined;
  onSkip: () => void;
}) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center relative px-margin-mobile w-full space-y-md">
      <span className="font-label-bold text-label-sm uppercase text-primary-container mb-2 tracking-widest">
        {t('rest')}
      </span>

      <div className="relative flex items-center justify-center">
        <CircularTimer remaining={restSeconds} total={prescribedRest} size={340} />
        <p className={`absolute font-display-lg text-[100px] leading-none countdown-glow font-extrabold tracking-tighter tabular-nums transition-all translate-y-8 ${restSeconds <= 3 ? 'text-green-500 scale-110' : 'text-primary-container'}`}>
          {restDisplay}
        </p>
      </div>

      {/* Next exercise preview */}
      {nextEx && (
        <div className="bg-surface-800 brutalist-border p-4 w-full max-w-sm">
          <p className="font-label-bold text-label-sm uppercase text-on-surface-variant mb-1">
            {t('nextExercise')}
          </p>
          <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
            {displayExerciseName(nextEx.exercise)}
          </h3>
          {nextEx.sets != null && nextEx.reps && (
            <p className="font-mono-data text-mono-data text-on-surface mt-2">
              {nextEx.sets}×{nextEx.reps}
              {nextEx.rpe != null && ` · RPE ${nextEx.rpe}`}
            </p>
          )}
        </div>
      )}

      <Button variant="ghost" onClick={onSkip}>
        {t('skipRest')}
      </Button>
    </div>
  );
}
