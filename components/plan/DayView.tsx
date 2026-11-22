'use client';

import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Check, Moon, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TOTAL_DAYS } from '@/lib/plan/plan';
import type { PlanDayView } from '@/lib/plan/day-view';
import type { MediaIndex } from '@/lib/exercises/media-index';
import PlanExerciseList from './PlanExerciseList';
import TodayCard from './TodayCard';

export default function DayView({
  view,
  idx,
  currentDayIndex,
  completedDayIndexes,
  locale,
  mediaIndex = {},
  todayCard = false,
  onPrev,
  onNext,
  onComplete,
  onSetCurrent,
  onGoToCurrent,
  onStart,
  completing,
}: {
  view: PlanDayView;
  idx: number;
  currentDayIndex: number;
  completedDayIndexes: number[];
  locale: string;
  mediaIndex?: MediaIndex;
  todayCard?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
  onSetCurrent: () => void;
  onGoToCurrent: () => void;
  onStart?: () => void;
  completing: boolean;
}) {
  const t = useTranslations('dashboard.plan');
  const isCurrent = idx === currentDayIndex;
  const isCompleted = completedDayIndexes.includes(idx);
  const session = view.day?.session;

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between gap-sm">
        <button
          type="button"
          onClick={onPrev}
          disabled={idx === 0}
          aria-label={t('previousDay')}
          className="p-2 border border-border text-text-primary disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-label-bold text-label-bold uppercase text-primary">
            {t('weekDay', { week: view.week, day: view.dayNumber })}
          </p>
          {view.phaseName && <p className="text-label-sm text-text-muted">{view.phaseName}</p>}
          {view.day && (
            <span className="inline-block mt-1 px-3 py-1 bg-surface-800 border border-outline font-label-bold text-label-sm uppercase text-on-surface-variant">
              {t(`dayTypes.${view.day.type}`)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={idx >= TOTAL_DAYS - 1}
          aria-label={t('nextDay')}
          className="p-2 border border-border text-text-primary disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {!view.day && (
        <div className="brutalist-border bg-surface-800 p-md text-center">
          <p className="text-on-surface-variant font-body-md">{t('phaseNotGenerated')}</p>
        </div>
      )}

      {view.day && todayCard && (
        <TodayCard
          view={view}
          isCurrent={isCurrent}
          isCompleted={isCompleted}
          startEnabled={Boolean(onStart)}
          completing={completing}
          onStart={onStart}
          onGoToCurrent={onGoToCurrent}
          onComplete={onComplete}
        />
      )}

      {view.day && !todayCard && view.isRest && (
        <div className="brutalist-border bg-surface-800 p-md text-center space-y-sm">
          <Moon className="mx-auto text-primary" size={28} />
          <h2 className="font-headline-md text-headline-md text-on-surface">{t('restDay')}</h2>
          <p className="text-on-surface-variant font-body-md">{t('restBody')}</p>
        </div>
      )}

      {session && <PlanExerciseList session={session} locale={locale} mediaIndex={mediaIndex} />}

      <div className="flex flex-wrap items-center gap-sm pt-sm">
        {isCurrent ? (
          <span className="font-label-bold text-label-bold uppercase text-primary">
            ● {t('currentDay')}
          </span>
        ) : (
          view.day && (
            <Button variant="ghost" onClick={onSetCurrent} className="uppercase">
              {t('markCurrentDay')}
            </Button>
          )
        )}

        {view.day && (!todayCard || !view.isRest) && (
          <Button variant="ghost" onClick={onComplete} disabled={completing || isCompleted} className="uppercase">
            {isCompleted ? t('completedDay') : completing ? t('completing') : t('completeWithoutLog')}
            {isCompleted && <Check size={18} className="ml-2" />}
          </Button>
        )}

        {session && !todayCard && (
          onStart ? (
            <Button onClick={onStart} disabled={completing} iconRight={Play} className="uppercase">
              {t('startSessionComingSoon')}
            </Button>
          ) : (
            <Button variant="ghost" disabled iconRight={Play} className="uppercase opacity-50">
              {t('startSessionComingSoon')}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
