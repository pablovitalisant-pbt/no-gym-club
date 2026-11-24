'use client';

import { useTranslations } from 'next-intl';
import { Pause, Play, SkipForward, Square } from 'lucide-react';

interface Props {
  running: boolean;
  onPauseToggle: () => void;
  onSkip: () => void;
  onStopRequest: () => void;
}

/** Controles sólidos y visibles en ambos temas; 64px de alto mínimo. */
export default function PlayerControls({ running, onPauseToggle, onSkip, onStopRequest }: Props) {
  const t = useTranslations('session');
  return (
    <div className="w-full max-w-sm flex items-center gap-2">
      <button
        onClick={onPauseToggle}
        className="flex-1 min-h-[64px] h-16 border-2 border-control-fg bg-control-bg text-control-fg flex items-center justify-center gap-2 font-label-bold text-label-bold uppercase"
      >
        {running ? <Pause size={22} /> : <Play size={22} />}
        {running ? t('pause') : t('resume')}
      </button>
      <button
        onClick={onSkip}
        className="min-h-[64px] h-16 px-4 border-2 border-control-fg bg-control-bg text-control-fg flex items-center justify-center gap-2 font-label-bold text-label-bold uppercase"
      >
        <SkipForward size={22} />
        {t('skip')}
      </button>
      <button
        onClick={onStopRequest}
        className="min-h-[64px] h-16 px-4 border-2 border-control-fg bg-control-bg text-control-fg flex items-center justify-center gap-2 font-label-bold text-label-bold uppercase"
      >
        <Square size={20} />
        {t('stop')}
      </button>
    </div>
  );
}
