import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';

type SessionRow = {
  rpe: number | null;
  completed_at: string;
  session_data: Record<string, unknown>;
};

function getWeekStart(daysAgo = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) - daysAgo * 7;
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function countSets(sessionData: Record<string, unknown>): number {
  const main = (sessionData?.main as Array<{ sets?: number }>) || [];
  return main.reduce((sum, ex) => sum + (ex.sets || 0), 0);
}

function getMuscleGroups(
  sessionData: Record<string, unknown>,
): string[] {
  const main = (sessionData?.main as Array<{ exercise?: string }>) || [];
  // ponytail: simple keyword matching — no NLP needed for ~33 exercises
  const map: Record<string, string> = {
    push: 'push',
    press: 'push',
    dip: 'push',
    pull: 'pull',
    row: 'pull',
    chin: 'pull',
    squat: 'legs',
    lunge: 'legs',
    leg: 'legs',
    plank: 'core',
    crunch: 'core',
    sit: 'core',
    core: 'core',
    jack: 'cardio',
    run: 'cardio',
    cardio: 'cardio',
    stretch: 'mobility',
    mobility: 'mobility',
  };

  return main
    .map((ex) => {
      const name = (ex.exercise || '').toLowerCase();
      for (const [keyword, group] of Object.entries(map)) {
        if (name.includes(keyword)) return group;
      }
      return 'other';
    })
    .filter((g) => g !== 'other');
}

export default async function WeeklyReportPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'weekly' });

  if (!getFlag('weekly_report')) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

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

  const weekStart = getWeekStart(0).toISOString();
  const prevWeekStart = getWeekStart(1).toISOString();
  const prevWeekEnd = getWeekStart(0).toISOString();

  // This week
  const { data: thisWeek } = await supabase
    .from('workout_sessions')
    .select('rpe, completed_at, session_data')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .gte('completed_at', weekStart)
    .order('completed_at', { ascending: false });

  // Previous week
  const { data: prevWeek } = await supabase
    .from('workout_sessions')
    .select('rpe, completed_at, session_data')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .gte('completed_at', prevWeekStart)
    .lt('completed_at', prevWeekEnd)
    .order('completed_at', { ascending: false });

  const thisSessions = (thisWeek || []) as SessionRow[];
  const prevSessions = (prevWeek || []) as SessionRow[];

  const sessionsCompleted = thisSessions.length;
  const rpeValues = thisSessions
    .filter((s) => s.rpe != null)
    .map((s) => s.rpe!);
  const averageRpe =
    rpeValues.length > 0
      ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1)
      : null;

  const totalSets = thisSessions.reduce(
    (sum, s) => sum + countSets(s.session_data),
    0,
  );

  // Muscle distribution
  const muscleCounts: Record<string, number> = {};
  thisSessions.forEach((s) => {
    getMuscleGroups(s.session_data).forEach((g) => {
      muscleCounts[g] = (muscleCounts[g] || 0) + 1;
    });
  });

  // Days trained
  const trainedDays = new Set(
    thisSessions.map((s) => s.completed_at?.split('T')[0]),
  );

  // RPE trend vs previous week
  const prevRpeValues = prevSessions
    .filter((s) => s.rpe != null)
    .map((s) => s.rpe!);
  const prevAvg =
    prevRpeValues.length > 0
      ? prevRpeValues.reduce((a, b) => a + b, 0) / prevRpeValues.length
      : null;

  let rpeTrend = '—';
  if (averageRpe && prevAvg) {
    const diff = parseFloat(averageRpe) - prevAvg;
    if (diff > 0.5) rpeTrend = t('trendUp');
    else if (diff < -0.5) rpeTrend = t('trendDown');
    else rpeTrend = t('trendStable');
  }

  const muscleEntries = Object.entries(muscleCounts).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-800 border border-border rounded p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {sessionsCompleted}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {t('sessionsThisWeek')}
          </p>
        </div>
        <div className="bg-surface-800 border border-border rounded p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {averageRpe || '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">{t('averageRpe')}</p>
        </div>
        <div className="bg-surface-800 border border-border rounded p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{totalSets}</p>
          <p className="text-xs text-text-muted mt-1">{t('totalSets')}</p>
        </div>
        <div className="bg-surface-800 border border-border rounded p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {trainedDays.size}/7
          </p>
          <p className="text-xs text-text-muted mt-1">{t('daysTrained')}</p>
        </div>
      </div>

      {/* Muscle distribution */}
      {muscleEntries.length > 0 && (
        <div className="bg-surface-800 border border-border rounded p-4">
          <p className="text-xs text-text-muted mb-3">
            {t('muscleDistribution')}
          </p>
          <div className="space-y-2">
            {muscleEntries.map(([group, count]) => (
              <div key={group} className="flex items-center gap-3">
                <span className="text-xs text-text-primary w-16 capitalize">
                  {group}
                </span>
                <div className="flex-1 bg-surface-900 rounded h-2">
                  <div
                    className="bg-accent h-2 rounded"
                    style={{
                      width: `${Math.min(100, (count / Math.max(...muscleEntries.map((e) => e[1]))) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-text-muted w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous week comparison */}
      <div className="bg-surface-800 border border-border rounded p-4 space-y-2">
        <p className="text-xs text-text-muted">{t('previousWeek')}</p>
        {prevSessions.length > 0 ? (
          <div className="text-sm text-text-primary space-y-1">
            <p>
              {prevSessions.length} {t('sessionsThisWeek').toLowerCase()} ·{' '}
              {prevAvg?.toFixed(1) || '—'} {t('averageRpe').toLowerCase()}
            </p>
            <p className="text-xs text-accent">{rpeTrend}</p>
          </div>
        ) : (
          <p className="text-sm text-text-muted">{t('noData')}</p>
        )}
      </div>

      {/* Consistency */}
      <div className="bg-surface-800 border border-border rounded p-4">
        <p className="text-xs text-text-muted mb-1">{t('consistency')}</p>
        <p className="text-sm text-text-primary">
          {sessionsCompleted === 0
            ? t('noData')
            : `${trainedDays.size}/7 ${t('daysTrained').toLowerCase()} (${Math.round((trainedDays.size / 7) * 100)}%)`}
        </p>
      </div>
    </div>
  );
}
