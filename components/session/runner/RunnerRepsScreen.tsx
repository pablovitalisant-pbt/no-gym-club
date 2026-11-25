'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { displayExerciseName } from '@/lib/exercises/display-name';
import type { FlatExercise } from '@/lib/session/flatten';

export default function RunnerRepsScreen({
  current,
  repsInputs,
  setRepsInputs,
  onConfirm,
}: {
  current: FlatExercise;
  repsInputs: string[];
  setRepsInputs: Dispatch<SetStateAction<string[]>>;
  onConfirm: () => void;
}) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile space-y-6">
      <p className="font-label-bold text-label-sm uppercase text-on-surface-variant tracking-widest">
        {t('repsPrompt')}
      </p>

      <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
        {displayExerciseName(current.exercise)}
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
              className="w-32 bg-surface-900 brutalist-border border-2 border-outline text-center font-display-lg text-headline-lg text-primary !py-4 focus:border-primary-container focus:shadow-[0_0_0_1px_rgb(var(--c-accent))] outline-none transition-all"
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
                className="w-32 bg-surface-900 brutalist-border border-2 border-outline text-center font-display-lg text-headline-lg text-primary !py-4 focus:border-primary-container focus:shadow-[0_0_0_1px_rgb(var(--c-accent))] outline-none transition-all"
                placeholder={current.reps}
              />
            </div>
          );
        })}
      </div>

      <Button onClick={onConfirm} iconRight={Check} className="w-full max-w-xs !py-4 uppercase">
        {t('confirmReps')}
      </Button>
    </div>
  );
}
