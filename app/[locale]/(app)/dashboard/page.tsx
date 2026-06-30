import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
    </div>
  );
}
