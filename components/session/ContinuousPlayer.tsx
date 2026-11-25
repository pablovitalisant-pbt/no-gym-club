'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { FlatExercise } from '@/lib/session/flatten';
import { useContinuousPlayer } from '@/lib/session/useContinuousPlayer';
import { displayExerciseName } from '@/lib/exercises/display-name';
import {
  repsKeyForSegment,
  repsTopOfRange,
} from '@/lib/session/continuous-view';
import ReadyScreen from './player/ReadyScreen';
import WorkScreen from './player/WorkScreen';
import RepsScreen from './player/RepsScreen';
import RestScreen from './player/RestScreen';
import PlayerControls from './player/PlayerControls';
import ModeToggle from './player/ModeToggle';

interface Props {
  sessionId: string;
  exercises: FlatExercise[];
  audioEnabled: boolean;
  onComplete: (reps: Record<string, string>) => void;
}

export default function ContinuousPlayer({ sessionId, exercises, audioEnabled, onComplete }: Props) {
  const t = useTranslations('session');

  // El resumen es la única vía de guardado del corrido: guarda las reps finales.
  const handleComplete = useCallback(
    (reps: Record<string, string>) => onComplete(reps),
    [onComplete],
  );

  const p = useContinuousPlayer({ sessionId, exercises, audioEnabled, onComplete: handleComplete });

  if (!p.info || !p.segment) return <div className="flex-grow bg-background" />;

  const { info, segment } = p;
  const name = displayExerciseName(info.exerciseName);
  const nextName = info.nextLabel ? displayExerciseName(info.nextLabel) : null;
  const repsEntry = segment.kind === 'reps' ? segment : null;
  const repsKey = repsEntry ? repsKeyForSegment(repsEntry) : null;
  const prescribed = exercises[repsEntry?.exerciseIndex ?? -1]?.reps ?? '';
  const repsValue = repsKey ? (p.reps[repsKey] ?? repsTopOfRange(prescribed)) : '';

  return (
    <div className="flex-grow flex flex-col min-h-0">
      {info.phase === 'ready' && (
        <ReadyScreen exerciseName={name} remaining={p.remaining} nextLabel={nextName} />
      )}
      {info.phase === 'work' && (
        <WorkScreen
          exerciseName={name}
          set={info.set}
          sets={info.sets}
          showSet={info.showSet}
          side={info.side}
          remaining={p.remaining}
          progress={info.progress}
          waiting={p.waiting}
          onContinue={p.onAdvance}
        />
      )}
      {info.phase === 'reps' && repsKey && (
        <RepsScreen
          exerciseName={name}
          set={info.set}
          sets={info.sets}
          showSet={info.showSet}
          side={info.side}
          prescribed={prescribed}
          value={repsValue}
          onChange={(value) => p.onRecordReps(repsKey, value)}
          onDone={() => {
            p.onRecordReps(repsKey, repsValue);
            p.onAdvance();
          }}
        />
      )}
      {info.phase === 'rest' && (
        <RestScreen
          remaining={p.remaining}
          nextLabel={nextName}
          nextSet={info.nextSet}
          nextSets={info.nextSets}
          showSet={info.nextShowSet}
          manual={p.mode === 'manual'}
          waiting={p.waiting}
          onAddSeconds={() => p.extendRest(15)}
          onSkip={p.onSkip}
          onContinue={p.onAdvance}
        />
      )}

      <div className="bg-background px-margin-mobile py-sm space-y-2 border-t-2 border-outline-variant">
        <div className="flex items-center justify-between gap-2">
          <ModeToggle mode={p.mode} onChange={p.onSetMode} />
          {info.phase === 'rest' && (
            <span className="font-body-md text-body-md text-on-surface-variant tabular-nums">
              {p.remaining}s
            </span>
          )}
        </div>
        <PlayerControls
          running={p.running}
          onPauseToggle={p.running ? p.onPause : p.onResume}
          onSkip={p.onSkip}
          canSkip={info.phase !== 'reps'}
          onStopRequest={() => p.setConfirmStop(true)}
        />
        {p.confirmStop && (
          <div className="border-2 border-error bg-surface-900 p-sm space-y-2">
            <p className="font-body-md text-body-md text-on-surface">{t('stopConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={p.stop}
                className="flex-1 min-h-[64px] border-2 border-error bg-error text-on-error font-label-bold text-label-bold uppercase"
              >
                {t('stopConfirmYes')}
              </button>
              <button
                onClick={() => p.setConfirmStop(false)}
                className="flex-1 min-h-[64px] border-2 border-control-bg bg-control-bg text-control-fg font-label-bold text-label-bold uppercase"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
