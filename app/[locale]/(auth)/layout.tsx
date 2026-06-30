import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';

export default async function AuthLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'auth' });
  const showAuth = getFlag('auth');

  if (!showAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-900">
        <p className="text-text-muted text-lg">{t('fallback')}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-sm rounded border border-border bg-surface-800 p-8">
        {children}
      </div>
    </main>
  );
}
