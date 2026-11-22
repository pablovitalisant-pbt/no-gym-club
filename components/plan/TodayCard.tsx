'use client';

import { useTranslations } from 'next-intl';
import { Check, Moon, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { estimateSessionMinutes, sessionExercises } from '@/lib/plan/session-summary';
import type { PlanDayView } from '@/lib/plan/day-view';

export default function TodayCard({
  view,
  isCurrent,
  isCompleted,
  startEnabled,
  completing,
  onStart,
  onGoToCurrent,
  onComplete,
}: {
  view: PlanDayView;
  isCurrent: boolean;
  isCompleted: boolean;
  startEnabled: boolean;
  completing: boolean;
  onStart?: () => void;
  onGoToCurrent: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations('dashboard.plan');
  if (!view.day) return null;

  if (view.isRest || !view.day.session) {
    return (
      <div className="brutalist-border bg-surface-800 p-md text-center space-y-sm">
        <p className="font-label-bold text-label-sm uppercase text-primary">{t('restDay')}</p>
        <Moon className="mx-auto text-primary" size={28} />
        <h2 className="font-headline-md text-headline-md text-on-surface">{t('todayRestTitle')}</h2>
        <p className="text-on-surface-variant font-body-md">{t('restBody')}</p>
        <Button onClick={onComplete} disabled={completing || isCompleted} className="w-full uppercase">
          {isCompleted ? t('completedDay') : t('markRestDone')}
          {isCompleted && <Check size={18} className="ml-2" />}
        </Button>
      </div>
    );
  }

  const session = view.day.session;
  const minutes = estimateSessionMinutes(session);
  const count = sessionExercises(session).length;

  return (
    <div className="brutalist-border bg-surface-800 p-md space-y-sm border-l-4 border-l-primary">
      <span className="inline-block px-3 py-1 bg-surface-900 border border-outline font-label-bold text-label-sm uppercase text-primary">
        {t(`dayTypes.${view.day.type}`)}
      </span>
      <h2 className="font-headline-md text-headline-md text-on-surface">{t('todayTitle')}</h2>
      <p className="text-on-surface-variant font-body-md">
        {t('estimatedMinutes', { minutes })} · {t('exerciseCount', { count })}
      </p>
      {isCurrent ? (
        onStart && startEnabled ? (
          <Button onClick={onStart} disabled={completing} iconRight={Play} className="w-full uppercase !py-5 !text-body-lg">
            {t('startTraining')}
          </Button>
        ) : (
          <Button disabled iconRight={Play} className="w-full uppercase opacity-50">
            {t('startSessionComingSoon')}
          </Button>
        )
      ) : (
        <Button onClick={onGoToCurrent} className="w-full uppercase !py-5 !text-body-lg">
          {t('goToCurrentDay')}
        </Button>
      )}
    </div>
  );
}
