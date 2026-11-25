'use client';

import { useTranslations } from 'next-intl';
import NotchGauge from '@/components/session/NotchGauge';

interface Props {
  exerciseName: string;
  set: number;
  sets: number;
  showSet: boolean;
  side?: 'left' | 'right';
  remaining: number;
  total: number;
  waiting: boolean;
  onContinue: () => void;
}

/** Bloque cronometrado: cuenta atrás y "Continuar" solo cuando se detiene en 0. */
export default function WorkScreen({
  exerciseName,
  set,
  sets,
  showSet,
  side,
  remaining,
  total,
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
      {(showSet || side) && (
        <p className="font-label-bold text-[32px] text-on-surface mt-1">
          {showSet && t('setOf', { current: set, total: sets })}
          {side && `${showSet ? ' · ' : ''}${t('side', { n: side === 'left' ? 1 : 2 })}`}
        </p>
      )}

      <NotchGauge progress={total > 0 ? 1 - remaining / total : 0}>{remaining}</NotchGauge>

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
