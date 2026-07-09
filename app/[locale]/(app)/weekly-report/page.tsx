import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import {
  getWeekStart, getWeeklyDayMarkers, computeConsistencyDelta,
  countSets, getMuscleGroups,
} from '@/lib/progress/report-helpers';
import { HeroHeader, MetricCards, ConsistencyPanel, TrendAnalysis, MuscleDistribution } from './sections';

type SessionRow = {
  rpe: number | null;
  completed_at: string;
  session_data: Record<string, unknown>;
};

export default async function WeeklyReportPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'weekly' });

  if (!getFlag('weekly_report')) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-body-md text-on-surface-variant">{t('fallback')}</p>
      </div>
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-body-md text-on-surface-variant">Unauthorized</p>
      </div>
    );
  }

  // ── Query this week & previous week ──
  const weekStart = getWeekStart(0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const prevWeekStart = getWeekStart(1);
  const prevWeekEnd = new Date(prevWeekStart); prevWeekEnd.setDate(prevWeekEnd.getDate() + 7);

  const [thisRes, prevRes] = await Promise.all([
    supabase.from('workout_sessions').select('rpe, completed_at, session_data')
      .eq('user_id', user.id).not('completed_at', 'is', null)
      .gte('completed_at', weekStart.toISOString()).lt('completed_at', weekEnd.toISOString())
      .order('completed_at', { ascending: false }),
    supabase.from('workout_sessions').select('rpe, completed_at, session_data')
      .eq('user_id', user.id).not('completed_at', 'is', null)
      .gte('completed_at', prevWeekStart.toISOString()).lt('completed_at', prevWeekEnd.toISOString())
      .order('completed_at', { ascending: false }),
  ]);

  const thisSessions = (thisRes.data || []) as SessionRow[];
  const prevSessions = (prevRes.data || []) as SessionRow[];

  // ── Compute metrics ──
  const sessionsCompleted = thisSessions.length;
  const rpeValues = thisSessions.filter((s) => s.rpe != null).map((s) => s.rpe!);
  const averageRpe = rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null;
  const totalSets = thisSessions.reduce((sum, s) => sum + countSets(s.session_data), 0);

  const trainedDays = new Set(thisSessions.map((s) => s.completed_at?.split('T')[0]));
  const trainedRatio = sessionsCompleted > 0 ? Math.round((trainedDays.size / 7) * 100) : 0;

  const prevTrainedDays = new Set(prevSessions.map((s) => s.completed_at?.split('T')[0]));
  const consistencyDelta = computeConsistencyDelta(trainedDays.size, prevTrainedDays.size);

  // Muscle distribution
  const muscleCounts: Record<string, number> = {};
  thisSessions.forEach((s) => getMuscleGroups(s.session_data).forEach((g) => { muscleCounts[g] = (muscleCounts[g] || 0) + 1; }));
  const muscleEntries = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1]);
  const totalMuscle = muscleEntries.reduce((sum, [, c]) => sum + c, 0);

  // RPE trend
  const prevRpeValues = prevSessions.filter((s) => s.rpe != null).map((s) => s.rpe!);
  const prevAvg = prevRpeValues.length > 0 ? prevRpeValues.reduce((a, b) => a + b, 0) / prevRpeValues.length : null;
  const rpeDiff = averageRpe && prevAvg ? parseFloat((averageRpe - prevAvg).toFixed(1)) : null;

  const dayMarkers = getWeeklyDayMarkers(thisSessions, weekStart, new Date());

  // Metric cards data (pre-translated)
  const metricItems = [
    { label: t('sessionsThisWeek'), value: sessionsCompleted },
    { label: t('averageRpe'), value: averageRpe?.toFixed(1) || '—' },
    { label: t('totalSets'), value: totalSets },
    { label: t('daysTrained'), value: `${trainedDays.size}/7` },
  ];

  const muscleWithPct = muscleEntries.map(
    ([g, c]) => [g, c, totalMuscle > 0 ? Math.round((c / totalMuscle) * 100) : 0] as [string, number, number],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-lg">
      <HeroHeader weekStart={weekStart} t={t} locale={locale} />
      <MetricCards items={metricItems} />

      {sessionsCompleted > 0 ? (
        <>
          <ConsistencyPanel
            trainedDays={trainedDays.size}
            trainedRatio={trainedRatio}
            consistencyDelta={consistencyDelta}
            dayMarkers={dayMarkers}
            t={t}
          />
          <TrendAnalysis
            sessionsCompleted={sessionsCompleted}
            prevSessionsCount={prevSessions.length}
            averageRpe={averageRpe}
            prevAvg={prevAvg}
            rpeDiff={rpeDiff}
            t={t}
          />
          <MuscleDistribution entries={muscleWithPct} t={t} />
        </>
      ) : (
        <div className="brutalist-border bg-surface-800 p-sm text-center">
          <p className="font-body-md text-on-surface-variant">{t('noData')}</p>
        </div>
      )}
    </div>
  );
}
