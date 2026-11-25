'use client';

import { useTranslations } from 'next-intl';
import { Pause, Play, SkipForward, Square } from 'lucide-react';

interface Props {
  running: boolean;
  onPauseToggle: () => void;
  onSkip: () => void;
  onStopRequest: () => void;
  /** false en segmentos de reps: saltar perdería la serie sin registrar. */
  canSkip?: boolean;
}

/** Dos filas para caber a 320 px; 64px de alto mínimo y texto de 16px. */
export default function PlayerControls({
  running,
  onPauseToggle,
  onSkip,
  onStopRequest,
  canSkip = true,
}: Props) {
  const t = useTranslations('session');
  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
      <button
        onClick={onPauseToggle}
        className="w-full min-h-[64px] h-16 px-2 border-2 border-control-fg bg-control-bg text-control-fg flex items-center justify-center gap-2 font-label-bold text-base uppercase"
      >
        {running ? <Pause size={22} /> : <Play size={22} />}
        {running ? t('pause') : t('resume')}
      </button>
      <div className="flex w-full gap-2">
        {canSkip && (
          <button
            onClick={onSkip}
            className="flex-1 min-w-0 min-h-[64px] h-16 px-2 border-2 border-control-fg bg-control-bg text-control-fg flex items-center justify-center gap-2 font-label-bold text-base uppercase"
          >
            <SkipForward size={22} />
            {t('skip')}
          </button>
        )}
        <button
          onClick={onStopRequest}
          className="flex-1 min-w-0 min-h-[64px] h-16 px-2 border-2 border-control-fg bg-control-bg text-control-fg flex items-center justify-center gap-2 font-label-bold text-base uppercase"
        >
          <Square size={20} />
          {t('stop')}
        </button>
      </div>
    </div>
  );
}
