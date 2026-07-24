import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';
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

  // Buscar sesión de hoy no completada
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialSession: { id: string; session_data: SessionData; completed_at: string | null } | null = null;

  if (user) {
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

      {showAI ? (
        <DashboardClient locale={locale} showLog={showLog} initialSession={initialSession} />
      ) : (
        <p className="text-text-muted">{t('fallback')}</p>
      )}
    </div>
  );
}
