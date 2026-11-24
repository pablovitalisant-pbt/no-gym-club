'use client';

import { useTranslations } from 'next-intl';

interface Props {
  remaining: number;
  nextLabel: string | null;
  set: number;
  sets: number;
  manual: boolean;
  waiting: boolean;
  onAddSeconds: () => void;
  onSkip: () => void;
  onContinue: () => void;
}

/** Descanso a pantalla completa: countdown gigante y acciones inmediatas. */
export default function RestScreen({
  remaining,
  nextLabel,
  set,
  sets,
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

      <p
        className={`font-display-lg text-[128px] leading-none tabular-nums my-sm ${
          remaining <= 0 ? 'rest-blink' : ''
        }`}
        aria-live="polite"
      >
        {remaining}
      </p>

      {nextLabel && (
        <p className="font-body-lg text-body-lg text-rest-fg">
          {t('nextUp')}: {nextLabel} · {t('setOf', { current: set, total: sets })}
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
