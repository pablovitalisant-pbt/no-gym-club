'use client';

import { useEffect, useState } from 'react';
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
  nextGifUrl: string | null;
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
  nextGifUrl,
  showSet,
  manual,
  waiting,
  onAddSeconds,
  onSkip,
  onContinue,
}: Props) {
  const t = useTranslations('session');
  const [showNext, setShowNext] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);
  useEffect(() => {
    setShowNext(false);
    setGifFailed(false);
  }, [nextLabel]);
  return (
    <div className="flex-grow min-h-0 overflow-y-auto flex flex-col items-center justify-center bg-rest-bg text-rest-fg px-margin-mobile py-md text-center">
      <h2 className="font-headline-lg text-headline-lg uppercase tracking-widest">{t('restTitle')}</h2>

      <div className={remaining <= 0 ? 'rest-blink' : ''} aria-live="polite">
        <NotchGauge numberSize={numberSize} progress={total && total > 0 ? 1 - remaining / total : 0}>{remaining}</NotchGauge>
      </div>

      {nextLabel && (
        <div className="mt-4 font-body-lg text-body-lg text-rest-fg">
          <p className="flex flex-wrap items-baseline justify-center gap-x-2">
            <span>{t('nextUp')}: {nextLabel}</span>
            {showSet && nextSet !== null && <strong className="font-bold text-[22px]">· {t('setOf', { current: nextSet, total: nextSets })}</strong>}
          </p>
          {nextGifUrl && (
            <>
              <button type="button" onClick={() => setShowNext((open) => !open)} aria-expanded={showNext} aria-controls="next-exercise-gif" className="mt-3 min-h-[56px] border-2 border-rest-fg bg-transparent px-5 text-base font-label-bold uppercase">
                {showNext ? t('hideNextExercise') : t('showNextExercise')}
              </button>
              {showNext && (
                <div id="next-exercise-gif" className="mt-3">
                  {gifFailed ? (
                    <p>{t('noImage')}</p>
                  ) : (
                    <img src={nextGifUrl} loading="lazy" alt={t('nextExerciseGifAlt', { name: nextLabel })} className="max-h-[40vh] object-contain bg-surface-900" onError={() => setGifFailed(true)} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
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
