import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Database } from '@/lib/supabase/types';

type AssessmentRow = Database['public']['Tables']['assessment_results']['Row'];

const EXERCISES = [
  { key: 'max_pushups', label: 'pushups' },
  { key: 'max_pullups', label: 'pullups' },
  { key: 'max_squats', label: 'squats' },
  { key: 'max_dips', label: 'dips' },
  { key: 'plank_seconds', label: 'plank' },
] as const;

function formatDiff(current: number, previous: number, isSeconds = false): string {
  const diff = current - previous;
  if (diff === 0) return '→ 0';
  const arrow = diff > 0 ? '↑' : '↓';
  const pct = previous > 0 ? ` (${Math.round((Math.abs(diff) / previous) * 100)}%)` : '';
  const unit = isSeconds ? 's' : '';
  return `${arrow} ${diff > 0 ? '+' : ''}${diff}${unit}${pct}`;
}

function diffColor(diff: number): string {
  if (diff > 0) return 'text-green-400';
  if (diff < 0) return 'text-red-400';
  return 'text-text-muted';
}

export default async function ProgressPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'progress' });
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-text-muted">Unauthorized</p>
      </div>
    );
  }

  const { data: assessments } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user.id)
    .order('assessed_at', { ascending: false });

  const results = (assessments || []) as AssessmentRow[];

  if (results.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <div className="bg-surface-800 border border-border rounded p-6 text-center space-y-4">
          <p className="text-text-muted text-sm">{t('noData')}</p>
          <Link
            href={`/${locale}/assessment/test`}
            className="inline-block"
          >
            <span className="text-accent text-sm hover:underline">
              {t('reassessButton')}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const latest = results[0];
  const previous = results[1] || null;
  const latestDate = new Date(latest.assessed_at!);
  const now = new Date();
  const daysAgo = Math.floor(
    (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>

      {/* Re-assessment prompt */}
      {daysAgo >= 30 && (
        <div className="bg-accent/10 border border-accent/30 rounded p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-accent">
            {t('reassessmentPrompt', { days: daysAgo })}
          </p>
          <Link
            href={`/${locale}/assessment/test`}
            className="shrink-0 text-xs px-3 py-2 bg-accent text-white rounded font-semibold hover:bg-accent/90 transition-colors"
          >
            {t('reassessButton')}
          </Link>
        </div>
      )}

      {/* Comparison table */}
      {previous && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">
            {t('comparison')}
          </h2>
          <div className="bg-surface-800 border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted">
                  <th className="text-left px-4 py-2">{t('exercise')}</th>
                  <th className="text-center px-2 py-2">{t('current')}</th>
                  <th className="text-center px-2 py-2">{t('previous')}</th>
                  <th className="text-right px-4 py-2">{t('change')}</th>
                </tr>
              </thead>
              <tbody>
                {EXERCISES.map(({ key, label }) => {
                  const cur = (latest[key as keyof AssessmentRow] as number) || 0;
                  const prev = (previous[key as keyof AssessmentRow] as number) || 0;
                  const isSeconds = key === 'plank_seconds';
                  return (
                    <tr key={key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-text-primary">
                        {t(label as keyof typeof t extends infer T ? T : never)?.toString() || label}
                      </td>
                      <td className="text-center px-2 py-2 text-text-primary">
                        {isSeconds ? `${cur}s` : cur}
                      </td>
                      <td className="text-center px-2 py-2 text-text-muted">
                        {isSeconds ? `${prev}s` : prev}
                      </td>
                      <td className={`text-right px-4 py-2 text-xs font-medium ${diffColor(cur - prev)}`}>
                        {formatDiff(cur, prev, isSeconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">
          {t('history')}
        </h2>
        <div className="space-y-2">
          {results.map((a, i) => (
            <div
              key={a.id}
              className={`bg-surface-800 border border-border rounded p-3 flex items-center justify-between text-sm
                ${i === 0 ? 'border-accent/30' : ''}`}
            >
              <span className="text-text-primary">
                {new Date(a.assessed_at!).toLocaleDateString(
                  locale === 'es' ? 'es-AR' : 'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' },
                )}
                {i === 0 && (
                  <span className="text-xs text-accent ml-2">{t('current')}</span>
                )}
              </span>
              <span className="text-text-muted text-xs">
                {a.max_pushups || 0}/{a.max_pullups || 0}/{a.max_squats || 0}/
                {a.max_dips || 0}/{a.plank_seconds || 0}s
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Retest link */}
      <div className="text-center pt-4">
        <Link
          href={`/${locale}/assessment/test`}
          className="text-xs text-text-muted hover:text-accent transition-colors"
        >
          {t('reassessButton')}
        </Link>
      </div>
    </div>
  );
}
