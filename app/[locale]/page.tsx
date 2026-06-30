import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getFlag } from '@/lib/flags';

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'landing' });
  const showLanding = getFlag('landing_page');

  if (!showLanding) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-900">
        <p className="text-text-muted text-lg">{t('fallback')}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-900 px-6 text-center">
      <h1 className="text-6xl font-bold tracking-tight text-text-primary">
        {t('hero')}
      </h1>

      <p className="mt-6 max-w-lg text-xl text-text-muted">
        {t('tagline')}
      </p>

      <p className="mt-10 max-w-md text-sm leading-relaxed text-text-muted">
        {t('manifesto')}
      </p>

      <div className="mt-12">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {t('cta')}
        </Link>
      </div>

      <footer className="mt-24 text-xs text-text-muted">
        No Gym Club © 2026
      </footer>
    </main>
  );
}
