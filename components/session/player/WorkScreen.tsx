'use client';

import { useTranslations } from 'next-intl';

interface Props {
  exerciseName: string;
  set: number;
  sets: number;
  side?: 'left' | 'right';
  remaining: number;
  progress: number;
  waiting: boolean;
  onContinue: () => void;
}

/** Bloque cronometrado: cuenta atrás y "Continuar" solo cuando se detiene en 0. */
export default function WorkScreen({
  exerciseName,
  set,
  sets,
  side,
  remaining,
  progress,
  waiting,
  onContinue,
}: Props) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-surface-800 text-on-surface px-margin-mobile py-md text-center">
      <p className="font-label-bold text-label-bold uppercase tracking-widest text-primary-container">
        {t('work')}
      </p>
      <h2 className="font-headline-lg text-headline-lg uppercase mt-1">{exerciseName}</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
        {t('setOf', { current: set, total: sets })}
        {side && ` · ${t('side', { n: side === 'left' ? 1 : 2 })}`}
      </p>

      <p className="font-display-lg text-[112px] leading-none text-primary tabular-nums my-md" aria-live="polite">
        {remaining}
      </p>

      <div className="w-full max-w-sm h-2 bg-surface-700 overflow-hidden">
        <div className="h-full bg-primary-container" style={{ width: `${progress * 100}%` }} />
      </div>

      {waiting && (
        <button
          onClick={onContinue}
          className="mt-md min-h-[64px] px-lg border-2 border-control-bg bg-control-bg text-control-fg font-label-bold text-label-bold uppercase"
        >
          {t('continue')}
        </button>
      )}
    </div>
  );
}
