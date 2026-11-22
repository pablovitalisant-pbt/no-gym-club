import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';
import PlanDashboard, { type PlanRow } from '@/components/plan/PlanDashboard';
import type { PlanData } from '@/lib/types/plan';
import type { SessionData } from '@/lib/types/session';

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const showDashboard = getFlag('dashboard');

  if (!showDashboard) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

  const showAI = getFlag('ai_session_generation');
  const showLog = getFlag('session_log');
  const showPlanV2 = getFlag('training_plan_v2');

  // Buscar sesión de hoy no completada
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let planRow: PlanRow | null = null;
  let hasAssessment = false;

  if (user && showPlanV2) {
    const { data: plan } = await supabase
      .from('training_plans')
      .select('id, plan_data, current_day_index, completed_day_indexes')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (plan) {
      planRow = {
        id: plan.id,
        plan_data: plan.plan_data as unknown as PlanData,
        current_day_index: plan.current_day_index,
        completed_day_indexes: plan.completed_day_indexes ?? [],
      };
    }
    const { data: assessment } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    hasAssessment = Boolean(assessment);
  }

  let initialSession: { id: string; session_data: SessionData; completed_at: string | null } | null = null;

  if (user && !showPlanV2) {
    const today = new Date().toISOString().split('T')[0];
    const { data: rows } = await supabase
      .from('workout_sessions')
      .select('id, session_data, completed_at')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .order('created_at', { ascending: false })
      .limit(1);

    if (rows && rows.length > 0) {
      initialSession = {
        id: rows[0].id,
        session_data: rows[0].session_data as unknown as SessionData,
        completed_at: rows[0].completed_at,
      };
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Dashboard
      </h1>

      {showPlanV2 ? (
        <PlanDashboard locale={locale} plan={planRow} hasAssessment={hasAssessment} />
      ) : showAI ? (
        <DashboardClient locale={locale} showLog={showLog} initialSession={initialSession} />
      ) : (
        <p className="text-text-muted">{t('fallback')}</p>
      )}
    </div>
  );
}
