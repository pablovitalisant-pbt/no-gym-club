import { Calendar, Dumbbell, Zap, List, Timer, Brain, TrendingUp } from 'lucide-react';
import type { DayMarker } from '@/lib/progress/report-helpers';

interface T { (key: string, params?: Record<string, string | number>): string; }

const METRIC = [Dumbbell, Zap, List, Calendar] as const;
const MUSCLE_LABELS: Record<string, string> = {
  push: 'Push (Chest/Delts/Triceps)', pull: 'Pull (Back/Biceps)',
  legs: 'Legs (Quads/Hams/Glutes)', core: 'Core / Stability',
  cardio: 'Cardio', mobility: 'Mobility',
};

function formatDateRange(weekStart: Date, locale: string): string {
  const loc = locale === 'es' ? 'es-AR' : 'en-US';
  const start = weekStart.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const endStr = end.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} — ${endStr}`;
}

export function HeroHeader({ weekStart, t, locale }: { weekStart: Date; t: T; locale: string }) {
  return (
    <section>
      <p className="font-label-bold text-label-sm text-primary uppercase mb-1 tracking-widest">{t('title')}</p>
      <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase">
        {t('title')}
      </h2>
      <div className="flex items-center text-on-surface-variant gap-1">
        <Calendar size={14} />
        <p className="font-body-md text-body-md">{formatDateRange(weekStart, locale)}</p>
      </div>
    </section>
  );
}

export function MetricCards({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <section className="grid grid-cols-2 gap-sm">
      {items.map(({ label, value }, i) => {
        const Icon = METRIC[i] || Dumbbell;
        return (
          <div key={label} className="brutalist-border bg-surface-800 p-sm flex flex-col justify-between">
            <Icon className="text-primary-container mb-sm" size={20} />
            <div>
              <p className="font-label-bold text-label-sm text-on-surface-variant uppercase">{label}</p>
              <p className="font-headline-md text-on-surface">{value}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function ConsistencyPanel({
  trainedDays,
  trainedRatio,
  consistencyDelta,
  dayMarkers,
  t,
}: {
  trainedDays: number;
  trainedRatio: number;
  consistencyDelta: { delta: number; direction: string; label: string } | null;
  dayMarkers: DayMarker[];
  t: T;
}) {
  return (
    <section className="brutalist-border bg-surface-800 p-md relative overflow-hidden">
      <div className="relative z-10 space-y-sm">
        <div className="flex justify-between items-end">
          <div>
            <p className="font-label-bold text-label-sm text-primary uppercase mb-1">{t('consistency')}</p>
            <h3 className="font-headline-md text-on-surface">
              {trainedDays}/7 {t('daysTrained').toLowerCase()} ({trainedRatio}%)
            </h3>
          </div>
          {consistencyDelta && (
            <div className="text-right">
              <p className="font-mono-data text-primary text-xl">{consistencyDelta.label}</p>
              <p className="font-label-sm text-on-surface-variant">{t('vsLastWeek')}</p>
            </div>
          )}
        </div>
        <div className="w-full h-4 bg-[#2a2a2a]">
          <div className="bg-primary-container h-full" style={{ width: `${trainedRatio}%` }} />
        </div>
        <div className="flex justify-between font-label-sm text-on-surface-variant">
          {dayMarkers.map((m) => (
            <span key={m.day} className={m.isFuture ? 'opacity-30' : m.trained ? 'text-on-surface' : ''}>
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrendAnalysis({
  sessionsCompleted,
  prevSessionsCount,
  averageRpe,
  prevAvg,
  rpeDiff,
  t,
}: {
  sessionsCompleted: number;
  prevSessionsCount: number;
  averageRpe: number | null;
  prevAvg: number | null;
  rpeDiff: number | null;
  t: T;
}) {
  if (sessionsCompleted === 0) return null;

  return (
    <section className="space-y-sm">
      <h3 className="font-label-bold text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
        <TrendingUp size={14} /> {t('previousWeek')}
      </h3>
      <div className="space-y-sm">
        <div className="brutalist-border bg-surface-800 p-sm flex justify-between items-center">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 bg-surface-700 flex items-center justify-center">
              <Timer className="text-on-surface" size={18} />
            </div>
            <div>
              <p className="font-body-md text-on-surface">{t('sessionsThisWeek')}</p>
              <p className="font-label-sm text-on-surface-variant">{t('previous')}: {prevSessionsCount}</p>
            </div>
          </div>
          {prevSessionsCount > 0 && (
            <span className="font-mono-data text-primary-container text-lg">
              {sessionsCompleted > prevSessionsCount ? '+' : ''}{sessionsCompleted - prevSessionsCount}
            </span>
          )}
        </div>
        {averageRpe && (
          <div className="brutalist-border bg-surface-800 p-sm flex justify-between items-center">
            <div className="flex items-center gap-sm">
              <div className="w-10 h-10 bg-surface-700 flex items-center justify-center">
                <Brain className="text-on-surface" size={18} />
              </div>
              <div>
                <p className="font-body-md text-on-surface">{t('averageRpe')}</p>
                <p className="font-label-sm text-on-surface-variant">{t('previous')}: {prevAvg?.toFixed(1) || '—'}</p>
              </div>
            </div>
            {rpeDiff != null && (
              <span className="font-mono-data text-primary-container text-lg">
                {rpeDiff > 0 ? '+' : ''}{rpeDiff.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function MuscleDistribution({
  entries,
  t,
}: {
  entries: [string, number, number][]; // [group, count, percentage]
  t: T;
}) {
  if (entries.length === 0) return null;

  return (
    <section>
      <h3 className="font-label-bold text-label-sm text-on-surface-variant uppercase mb-sm flex items-center gap-1">
        <TrendingUp size={14} /> {t('muscleDistribution')}
      </h3>
      <div className="space-y-lg">
        {entries.map(([group, , pct]) => (
          <div key={group}>
            <div className="flex justify-between font-label-bold text-label-sm uppercase mb-2">
              <span className="text-on-surface">{MUSCLE_LABELS[group] || group}</span>
              <span className="text-primary-container">{pct}%</span>
            </div>
            <div className="h-2 bg-[#2a2a2a]">
              <div className="bg-primary-container h-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
