import { RefreshCw } from 'lucide-react';
import { countImprovedMarkers } from '@/lib/progress/report-helpers';
import type { Database } from '@/lib/supabase/types';

type AssessmentRow = Database['public']['Tables']['assessment_results']['Row'];

/** Minimal t() shape (pass from parent page — never call getTranslations in sub-components). */
interface T {
  (key: string, params?: Record<string, string | number>): string;
}

const EXERCISES = [
  { key: 'max_pushups', label: 'pushups', isSeconds: false },
  { key: 'max_pullups', label: 'pullups', isSeconds: false },
  { key: 'max_squats', label: 'squats', isSeconds: false },
  { key: 'max_dips', label: 'dips', isSeconds: false },
  { key: 'plank_seconds', label: 'plank', isSeconds: true },
] as const;

function formatDateBox(date: Date, locale: string): string {
  const loc = locale === 'es' ? 'es-AR' : 'en-US';
  return date.toLocaleDateString(loc, { month: 'short', day: 'numeric' }).toUpperCase().replace(',', '');
}

/** Re-assessment prompt banner (shown when 30+ days since last assessment). */
export function ReassessmentBanner({
  daysAgo,
  reassessHref,
  t,
}: {
  daysAgo: number;
  reassessHref: string;
  t: T;
}) {
  return (
    <section className="brutalist-border bg-surface-800 p-sm flex flex-col md:flex-row md:items-center justify-between gap-sm overflow-hidden relative">
      <div className="space-y-base relative z-10">
        <div className="flex items-center gap-xs">
          <RefreshCw className="text-primary-container" size={18} />
          <span className="font-label-bold text-label-bold text-primary-container uppercase tracking-widest">
            {t('reassessmentLabel')}
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface">
          {t('reassessmentPrompt', { days: daysAgo })}
        </p>
      </div>
      <a
        href={reassessHref}
        className="shrink-0 bg-primary-container text-on-primary-container font-label-bold text-label-bold uppercase py-3 px-lg hover:brightness-110 active:scale-95 transition-all w-full md:w-auto text-center"
      >
        {t('reassessButton')}
      </a>
    </section>
  );
}

/** Assessment comparison table: Exercise / Previous / Current / Delta. */
export function ComparisonTable({
  latest,
  previous,
  t,
}: {
  latest: AssessmentRow;
  previous: AssessmentRow | null;
  t: T;
}) {
  if (!previous) return null;

  return (
    <section className="space-y-sm">
      <h2 className="font-headline-md text-headline-md-mobile md:text-headline-md uppercase tracking-tight text-primary">
        {t('comparison')}
      </h2>
      <div className="brutalist-border bg-surface-800 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-700 border-b border-outline-variant">
              <th className="text-left p-sm font-label-bold text-label-sm uppercase text-on-surface-variant">{t('exercise')}</th>
              <th className="text-right p-sm font-label-bold text-label-sm uppercase text-on-surface-variant">{t('previous')}</th>
              <th className="text-right p-sm font-label-bold text-label-sm uppercase text-on-surface-variant">{t('current')}</th>
              <th className="text-right p-sm font-label-bold text-label-sm uppercase text-on-surface-variant">{t('change')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {EXERCISES.map(({ key, label, isSeconds }) => {
              const cur = (latest[key as keyof AssessmentRow] as number) || 0;
              const prev = (previous[key as keyof AssessmentRow] as number) || 0;
              const delta = cur - prev;
              const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;
              const deltaColor = delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-on-surface-variant';
              const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
              const labelText = t(label as keyof typeof t extends infer _T ? _T : never)?.toString() || label;
              return (
                <tr key={key} className="hover:bg-surface-700/50 transition-colors">
                  <td className="p-sm font-body-md text-on-surface font-bold">{labelText}</td>
                  <td className="p-sm text-right font-mono-data text-on-surface-variant">
                    {isSeconds ? `${prev}s` : prev}
                  </td>
                  <td className="p-sm text-right font-mono-data text-on-surface">
                    {isSeconds ? `${cur}s` : cur}
                  </td>
                  <td className={`p-sm text-right ${deltaColor}`}>
                    <span className="font-mono-data text-label-sm">{arrow} {pct >= 0 ? '+' : ''}{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** History list: date-box + name + improved summary per assessment. */
export function HistoryList({
  results,
  t,
  locale,
}: {
  results: AssessmentRow[];
  t: T;
  locale: string;
}) {
  if (results.length === 0) return null;

  return (
    <section className="space-y-sm">
      <h2 className="font-headline-md text-headline-md-mobile md:text-headline-md uppercase tracking-tight text-primary">
        {t('history')}
      </h2>
      <div className="space-y-xs">
        {results.map((a, i) => {
          const isFirst = i === results.length - 1;
          const isLatest = i === 0;
          const nextA = results[i + 1];
          const date = new Date(a.assessed_at!);

          let summary = '';
          if (nextA) {
            const markers = countImprovedMarkers(a, nextA);
            if (markers.improved === markers.total) {
              summary = t('historyImprovedAll', { total: markers.total });
            } else if (markers.improved > markers.declined && markers.improved > 0) {
              summary = t('historyImproved', { count: markers.improved, total: markers.total });
            } else if (markers.declined > markers.improved && markers.improved === 0) {
              summary = t('historyDeclined', { count: markers.declined, total: markers.total });
            } else if (markers.declined > 0 && markers.improved > 0) {
              summary = t('historyMixed', { up: markers.improved, down: markers.declined });
            }
          }

          const name = isFirst
            ? t('historyInitialBaseline')
            : t('historyAssessmentNumber', { number: results.length - i });

          return (
            <div
              key={a.id}
              className={`brutalist-border bg-surface-800 p-sm flex items-center justify-between group transition-colors ${isLatest ? 'border-primary-container/40' : ''}`}
            >
              <div className="flex items-center gap-sm">
                <div className="w-12 h-12 brutalist-border flex items-center justify-center bg-surface-700 font-mono-data text-primary text-xs leading-tight text-center">
                  {formatDateBox(date, locale)}
                </div>
                <div>
                  <p className="font-label-bold text-on-surface uppercase text-sm">{name}</p>
                  {summary && <p className="font-body-md text-label-sm text-on-surface-variant">{summary}</p>}
                </div>
              </div>
              <span className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform text-lg">›</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
