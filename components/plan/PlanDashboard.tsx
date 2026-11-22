'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { planDayView } from '@/lib/plan/day-view';
import { needsNextPhase, TOTAL_DAYS } from '@/lib/plan/plan';
import type { PlanRow } from '@/lib/types/plan';
export type { PlanRow };
import type { MediaIndex } from '@/lib/exercises/media-index';
import DayView from './DayView';
import PlanCalendar from './PlanCalendar';
import CreatePlanCard from './CreatePlanCard';
import { completePlanDay, setCurrentPlanDay, startPlanSession } from '@/app/[locale]/(app)/dashboard/plan-actions';

export default function PlanDashboard({
  locale,
  plan,
  hasAssessment,
  assessmentHref = '/assessment',
  initialDay,
  startEnabled = false, todayCardEnabled = false, mediaIndex = {},
}: {
  locale: string;
  plan: PlanRow | null;
  hasAssessment: boolean;
  assessmentHref?: string; initialDay?: number | null;
  startEnabled?: boolean;
  todayCardEnabled?: boolean;
  mediaIndex?: MediaIndex;
}) {
  const t = useTranslations('dashboard.plan');
  const router = useRouter();
  const [current, setCurrent] = useState(plan?.current_day_index ?? 0);
  const [viewIdx, setViewIdx] = useState(initialDay ?? plan?.current_day_index ?? 0);
  const [completed, setCompleted] = useState<number[]>(plan?.completed_day_indexes ?? []);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!hasAssessment) {
    return (
      <div className="brutalist-border bg-surface-800 p-md text-center space-y-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface">{t('assessmentTitle')}</h2>
        <p className="text-on-surface-variant font-body-md">{t('assessmentBody')}</p>
        <Link href={assessmentHref} className="inline-block"><Button className="uppercase">{t('assessmentCta')}</Button></Link>
      </div>
    );
  }

  if (!plan || plan.plan_data.phases.length === 0) {
    return <CreatePlanCard />;
  }

  const planId = plan.id;
  const view = planDayView(plan.plan_data, viewIdx, locale);
  const nextPhase = needsNextPhase(plan.plan_data, { current_day_index: current, completed_day_indexes: completed });

  async function handleSetCurrent() {
    setBusy(true);
    setError(false);
    const res = await setCurrentPlanDay(planId, viewIdx);
    setBusy(false);
    if (!res.success) {
      setError(true);
      return;
    }
    setCurrent(res.current_day_index);
    router.refresh();
  }

  async function handleStart() {
    setBusy(true);
    setError(false);
    const res = await startPlanSession(planId, viewIdx);
    setBusy(false);
    if (!res.success) {
      setError(true);
      return;
    }
    router.push(`/session/${res.sessionId}`);
  }

  async function handleComplete() {
    setBusy(true);
    setError(false);
    const res = await completePlanDay(planId, viewIdx);
    setBusy(false);
    if (!res.success) {
      setError(true);
      return;
    }
    setCurrent(res.current_day_index);
    setCompleted(res.completed_day_indexes);
    setViewIdx(res.current_day_index);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-sm">
        <h2 className="font-label-bold text-label-bold uppercase text-primary">
          {t('programTitle')}
        </h2>
        <Button variant="ghost" onClick={() => setCalendarOpen(true)} iconRight={CalendarDays}>
          {t('calendar')}
        </Button>
      </div>
      <DayView
        view={view}
        idx={viewIdx}
        currentDayIndex={current}
        completedDayIndexes={completed}
        locale={locale}
        mediaIndex={mediaIndex}
        todayCard={todayCardEnabled}
        onGoToCurrent={() => setViewIdx(current)}
        onPrev={() => setViewIdx((i) => Math.max(0, i - 1))}
        onNext={() => setViewIdx((i) => Math.min(TOTAL_DAYS - 1, i + 1))}
        onComplete={handleComplete} onSetCurrent={handleSetCurrent}
        onStart={startEnabled ? handleStart : undefined} completing={busy}
      />
      {nextPhase && (
        <div className="mt-md"><CreatePlanCard phaseIndex={plan.plan_data.phases.length} /></div>
      )}
      {error && <p className="text-error font-body-md mt-sm">{t('actionError')}</p>}
      <p className="text-label-sm text-on-surface-variant mt-md">
        {t('completedCount', { done: completed.length, total: TOTAL_DAYS })}
      </p>
      {calendarOpen && plan && (
        <PlanCalendar
          plan={plan.plan_data}
          viewedIdx={viewIdx}
          currentDayIndex={current}
          completedDayIndexes={completed}
          locale={locale}
          onSelect={(idx) => {
            setViewIdx(idx);
            setCalendarOpen(false);
          }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
