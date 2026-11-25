'use client';

import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { SessionData } from '@/lib/types/session';
import { sessionOutcome } from '@/lib/session/entry';

interface Props {
  session: SessionData;
  rpe: number | null;
  planDayIndex?: number | null;
}

/** Pantalla de sesión guardada: check grande y resumen del día. */
export default function SessionDoneScreen({ session, rpe, planDayIndex = null }: Props) {
  const t = useTranslations('session');
  const out = sessionOutcome(session, rpe, planDayIndex);

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center text-center px-margin-mobile py-10 space-y-6 bg-background text-on-surface">
      <CheckCircle size={96} strokeWidth={2} className="text-on-surface" aria-hidden="true" />

      <h1 className="text-3xl font-bold break-words text-on-surface">{t('doneTitle')}</h1>

      <div className="w-full max-w-sm border-2 border-outline-variant bg-card rounded-xl p-4 space-y-2 text-lg text-on-surface">
        <p>{t('doneExerciseCount', { count: out.exerciseCount })}</p>
        <p>{t('doneMinutes', { minutes: out.minutes })}</p>
        {out.rpe != null && <p>{t('doneRpeLabel')}: {out.rpe}/10</p>}
        {out.dayNumber != null && (
          <p>{t('doneDay', { day: out.dayNumber, total: out.totalDays })}</p>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full min-h-[56px] border-2 border-control-bg bg-control-bg text-control-fg text-lg font-bold uppercase"
        >
          {t('backToPanel')}
        </Link>
        {planDayIndex != null && (
          <Link
            href={`/dashboard?day=${planDayIndex}`}
            className="flex items-center justify-center w-full min-h-[56px] border-2 border-outline-variant text-on-surface text-lg font-bold uppercase"
          >
            {t('viewCalendar')}
          </Link>
        )}
      </div>
    </div>
  );
}
