'use client';

import { useTranslations } from 'next-intl';
import NotchGauge from '@/components/session/NotchGauge';

interface Props {
  remaining: number;
  total?: number;
  numberSize?: number;
  nextLabel: string | null;
  /** Serie del segmento siguiente; null si no hay siguiente. */
  nextSet: number | null;
  nextSets: number;
  showSet: boolean;
  manual: boolean;
  waiting: boolean;
  onAddSeconds: () => void;
  onSkip: () => void;
  onContinue: () => void;
}

/** Descanso a pantalla completa: countdown gigante y acciones inmediatas. */
export default function RestScreen({
  remaining,
  total,
  numberSize = 128,
  nextLabel,
  nextSet,
  nextSets,
  showSet,
  manual,
  waiting,
  onAddSeconds,
  onSkip,
  onContinue,
}: Props) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-rest-bg text-rest-fg px-margin-mobile py-md text-center">
      <h2 className="font-headline-lg text-headline-lg uppercase tracking-widest">{t('restTitle')}</h2>

      <div className={remaining <= 0 ? 'rest-blink' : ''} aria-live="polite">
        <NotchGauge numberSize={numberSize} progress={total && total > 0 ? 1 - remaining / total : 0}>{remaining}</NotchGauge>
      </div>

      {nextLabel && (
        <p className="font-body-lg text-body-lg text-rest-fg">
          {t('nextUp')}: {nextLabel}
          {showSet && nextSet !== null && <strong className="font-bold text-[22px]"> · {t('setOf', { current: nextSet, total: nextSets })}</strong>}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mt-md w-full max-w-sm">
        <button
          onClick={onAddSeconds}
          className="flex-1 min-h-[64px] border-2 border-rest-fg bg-transparent text-rest-fg font-label-bold text-label-bold uppercase"
        >
          {t('addSeconds')}
        </button>
        <button
          onClick={onSkip}
          className="flex-1 min-h-[64px] border-2 border-control-bg bg-control-bg text-control-fg font-label-bold text-label-bold uppercase"
        >
          {t('skipRest')}
        </button>
      </div>

      {manual && waiting && (
        <button
          onClick={onContinue}
          className="mt-sm w-full max-w-sm min-h-[64px] border-2 border-rest-fg bg-rest-fg text-rest-bg font-label-bold text-label-bold uppercase"
        >
          {t('continue')}
        </button>
      )}
    </div>
  );
}
