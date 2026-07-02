import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import DashboardClient from './dashboard-client';

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Dashboard
      </h1>

      {showAI ? (
        <DashboardClient locale={locale} showLog={showLog} />
      ) : (
        <p className="text-text-muted">{t('fallback')}</p>
      )}
    </div>
  );
}
