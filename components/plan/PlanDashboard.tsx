'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { planDayView } from '@/lib/plan/day-view';
import type { PlanData } from '@/lib/types/plan';
import DayView from './DayView';
import CreatePlanCard from './CreatePlanCard';
import { completePlanDay, setCurrentPlanDay } from '@/app/[locale]/(app)/dashboard/plan-actions';

export interface PlanRow {
  id: string;
  plan_data: PlanData;
  current_day_index: number;
  completed_day_indexes: number[];
}

export default function PlanDashboard({
  locale,
  plan,
  hasAssessment,
}: {
  locale: string;
  plan: PlanRow | null;
  hasAssessment: boolean;
}) {
  const t = useTranslations('dashboard.plan');
  const router = useRouter();
  const [current, setCurrent] = useState(plan?.current_day_index ?? 0);
  const [viewIdx, setViewIdx] = useState(plan?.current_day_index ?? 0);
  const [completed, setCompleted] = useState<number[]>(plan?.completed_day_indexes ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!hasAssessment) {
    return (
      <div className="brutalist-border bg-surface-800 p-md text-center space-y-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface">{t('assessmentTitle')}</h2>
        <p className="text-on-surface-variant font-body-md">{t('assessmentBody')}</p>
        <Link href="/assessment" className="inline-block">
          <Button className="uppercase">{t('assessmentCta')}</Button>
        </Link>
      </div>
    );
  }

  if (!plan || plan.plan_data.phases.length === 0) {
    return <CreatePlanCard locale={locale} />;
  }

  const planId = plan.id;
  const view = planDayView(plan.plan_data, viewIdx, locale);

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
      <DayView
        view={view}
        idx={viewIdx}
        currentDayIndex={current}
        completedDayIndexes={completed}
        onPrev={() => setViewIdx((i) => Math.max(0, i - 1))}
        onNext={() => setViewIdx((i) => Math.min(83, i + 1))}
        onComplete={handleComplete}
        onSetCurrent={handleSetCurrent}
        completing={busy}
      />
      {error && <p className="text-error font-body-md mt-sm">{t('actionError')}</p>}
      <p className="text-label-sm text-on-surface-variant mt-md">
        {t('completedCount', { done: completed.length, total: 84 })}
      </p>
    </div>
  );
}
