'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Dumbbell } from 'lucide-react';
import { displayExerciseName } from '@/lib/exercises/display-name';
import type { FlatExercise, SessionSection } from '@/lib/session/flatten';

const SECTION_BADGES: Record<SessionSection, string> = {
  warmup: 'bg-green-500/20 text-green-500 border-green-500/40',
  main: 'bg-primary-container text-on-primary-container',
  finisher: 'bg-orange-500/20 text-orange-500 border-orange-500/40',
  cardio: 'bg-purple-500/20 text-purple-500 border-purple-500/40',
  cooldown: 'bg-blue-500/20 text-blue-500 border-blue-500/40',
};

export default function ActiveScreen({
  current,
  index,
  total,
  imageError,
  onImageError,
  onStartTimer,
  onDone,
}: {
  current: FlatExercise;
  index: number;
  total: number;
  imageError: boolean;
  onImageError: () => void;
  onStartTimer: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col px-margin-mobile pt-sm pb-gutter overflow-hidden">
      {/* Progress */}
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">
        {t('progress', { current: index + 1, total })}
      </p>

      {/* Section badge */}
      <span className={`inline-block px-3 py-1 font-label-bold text-label-sm uppercase tracking-tighter mb-sm ${SECTION_BADGES[current.section]}`}>
        {t(current.section)}
      </span>

      {/* Exercise name */}
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase mb-1">
        {displayExerciseName(current.exercise)}
      </h2>

      {/* Exercise image / placeholder */}
      <div className="flex justify-center mb-md">
        {current.gif_url && !imageError ? (
          <img
            src={current.gif_url}
            alt={displayExerciseName(current.exercise)}
            className="w-48 h-48 object-contain rounded-lg"
            onError={onImageError}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-48 h-48 bg-surface-800 rounded-lg">
            <Dumbbell size={48} className="text-on-surface-variant mb-2" />
            <p className="font-label-sm text-label-sm text-on-surface-variant">{t('noImage')}</p>
          </div>
        )}
      </div>

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
        <Button onClick={onStartTimer} className="w-full h-16 !font-label-bold !text-headline-md uppercase">
          {t('startTimer')}
        </Button>
      ) : (
        <Button onClick={onDone} className="w-full h-16 !font-label-bold !text-headline-md uppercase">
          {t('done')}
        </Button>
      )}
    </div>
  );
}
