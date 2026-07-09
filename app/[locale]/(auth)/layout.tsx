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
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant text-lg">{t('fallback')}</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md antialiased flex items-center justify-center relative">
      <div className="fixed inset-0 z-[1] vignette pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-[400px] px-margin-mobile my-8">
        {/* Brand Identity */}
        <header className="mb-xl text-center">
          <h1 className="font-display-lg text-display-lg text-primary-container tracking-tighter uppercase mb-base">
            NO GYM CLUB
          </h1>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest">
            {t('brandSubtitle')}
          </p>
        </header>

        {/* Card Container */}
        <section className="bg-surface-800 brutalist-border p-md relative overflow-hidden">
          {/* Decorative Accent Corner */}
          <div className="absolute top-0 right-0 w-8 h-8 bg-primary-container" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
          {children}
        </section>

        {/* Tactical Decoration Footer */}
        <footer className="mt-xl flex flex-col items-center gap-gutter">
          <div className="flex items-center gap-base">
            <div className="h-[1px] w-8 bg-outline"></div>
            <span className="font-label-sm text-label-sm text-on-surface-variant/40 uppercase tracking-widest">
              Manual v4.01 — Auth Module
            </span>
            <div className="h-[1px] w-8 bg-outline"></div>
          </div>
        </footer>
      </main>
    </div>
  );
}
