'use client';

import { useTranslations } from 'next-intl';
import { Pause, Play, SkipForward, Square } from 'lucide-react';
import CircularTimer from './CircularTimer';
import type { FlatExercise } from '@/lib/session/flatten';
import { useContinuousPlayer } from '@/lib/session/useContinuousPlayer';

interface Props {
  sessionId: string;
  exercises: FlatExercise[];
  audioEnabled: boolean;
  onComplete: () => void;
}

export default function ContinuousPlayer({ sessionId, exercises, audioEnabled, onComplete }: Props) {
  const t = useTranslations('session');
  const p = useContinuousPlayer({ sessionId, exercises, audioEnabled, onComplete });

  if (!p.info || !p.segment) return <div className="flex-grow bg-background" />;

  const { info } = p;
  const phaseLabel =
    info.phase === 'ready' ? t('getReady') : info.phase === 'work' ? t('work') : t('rest');

  return (
    <div className="flex-grow flex flex-col items-center px-margin-mobile py-md text-center">
      <p className="font-label-bold text-label-sm uppercase tracking-widest text-primary-container mb-1">
        {phaseLabel}
      </p>
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
        {info.exerciseName}
      </h2>
      {info.phase === 'work' && info.sets > 0 && (
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
          {t('setOf', { current: info.set, total: info.sets })}
          {info.side && ` · ${t('side', { n: info.side === 'left' ? 1 : 2 })}`}
        </p>
      )}

      <div className="relative flex items-center justify-center my-sm">
        <CircularTimer remaining={p.remaining} total={p.segment.seconds} size={320} />
        <p className="absolute font-display-lg text-[96px] leading-none text-primary countdown-glow tabular-nums translate-y-8">
          {p.remaining}
        </p>
      </div>

      <div className="w-full max-w-sm h-2 bg-surface-800 brutalist-border overflow-hidden mb-sm">
        <div className="h-full bg-primary-container" style={{ width: `${info.progress * 100}%` }} />
      </div>
      {info.nextLabel && (
        <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
          {t('nextExercise')}: <span className="text-on-surface font-medium">{info.nextLabel}</span>
        </p>
      )}

      <div className="flex-grow" />

      <div className="flex items-center gap-3 w-full max-w-sm">
        <button
          onClick={p.running ? p.onPause : p.onResume}
          className="flex-1 h-14 brutalist-border bg-surface-800 flex items-center justify-center gap-2 uppercase font-label-bold text-on-surface"
        >
          {p.running ? <Pause size={20} /> : <Play size={20} />}
          {p.running ? t('pause') : t('resume')}
        </button>
        <button
          onClick={p.onSkip}
          className="h-14 px-5 brutalist-border bg-surface-800 flex items-center justify-center uppercase font-label-bold text-on-surface"
          aria-label={t('skip')}
        >
          <SkipForward size={20} />
        </button>
        <button
          onClick={() => p.setConfirmStop(true)}
          className="h-14 px-5 brutalist-border bg-surface-800 flex items-center justify-center uppercase font-label-bold text-red-400"
          aria-label={t('stop')}
        >
          <Square size={18} />
        </button>
      </div>

      {p.confirmStop && (
        <div className="mt-md w-full max-w-sm brutalist-border bg-surface-800 p-sm space-y-2">
          <p className="font-body-md text-body-md text-on-surface">{t('stopConfirm')}</p>
          <div className="flex gap-2">
            <button
              onClick={p.stop}
              className="flex-1 h-12 brutalist-border bg-red-600 text-white uppercase font-label-bold"
            >
              {t('stopConfirmYes')}
            </button>
            <button
              onClick={() => p.setConfirmStop(false)}
              className="flex-1 h-12 brutalist-border bg-surface-900 text-on-surface uppercase font-label-bold"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
