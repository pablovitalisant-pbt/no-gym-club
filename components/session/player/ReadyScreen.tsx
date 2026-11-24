'use client';

import { useTranslations } from 'next-intl';

interface Props {
  exerciseName: string;
  remaining: number;
  nextLabel: string | null;
}

/** Cuenta previa "Prepárate" antes del primer bloque. */
export default function ReadyScreen({ exerciseName, remaining, nextLabel }: Props) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-surface-900 text-on-surface px-margin-mobile py-md text-center">
      <p className="font-label-bold text-label-bold uppercase tracking-widest text-primary-container mb-2">
        {t('getReady')}
      </p>
      <h2 className="font-headline-lg text-headline-lg uppercase">{exerciseName}</h2>
      <p className="font-display-lg text-[96px] leading-none text-primary tabular-nums my-md" aria-live="polite">
        {remaining}
      </p>
      {nextLabel && (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t('nextExercise')}: {nextLabel}
        </p>
      )}
    </div>
  );
}
