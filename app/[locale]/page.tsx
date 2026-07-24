import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import { Dumbbell } from 'lucide-react';
import TopAppBar from '@/components/layout/TopAppBar';

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Si hay sesión activa, redirigir al dashboard — evita mostrar landing/login
  // a usuarios ya autenticados (crítico para PWA donde start_url = /es)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: 'landing' });
  const tAuth = await getTranslations({ locale, namespace: 'auth' });
  const showLanding = getFlag('landing_page');

  if (!showLanding) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant text-lg">{t('fallback')}</p>
      </main>
    );
  }

  const navItems = [
    { href: '#manifiesto', label: t('viewManifesto') },
    { href: '/login', label: tAuth('login') },
  ];

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen relative pb-16 md:pb-0">
      <TopAppBar items={navItems} />

      <main className="relative pt-16 min-h-screen flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full min-h-[795px] flex flex-col items-center justify-center text-center px-margin-mobile overflow-hidden">
          <div className="scanline"></div>
          <div className="z-10 max-w-5xl space-y-xl">
            <div className="space-y-sm">
              <p className="font-label-bold text-label-sm uppercase tracking-[0.4em] text-primary-container">
                {t('protocol')}
              </p>
              <h1 className="font-display-lg text-[12vw] md:text-[10rem] leading-[0.85] text-on-surface uppercase select-none">
                NO GYM<br />
                <span className="text-outline">CLUB</span>
              </h1>
            </div>
            <div className="max-w-xl mx-auto space-y-lg">
              <h2 className="font-headline-md text-headline-md italic text-primary-container">
                &quot;{t('tagline')}&quot;
              </h2>
              <p id="manifiesto" className="font-body-lg text-body-lg text-on-surface-variant opacity-80 uppercase tracking-wider leading-relaxed">
                {t('manifesto')}
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-gutter justify-center pt-lg max-w-md mx-auto md:max-w-none">
              <Link
                href="/signup"
                className="bg-primary-container text-on-primary-container font-label-bold text-label-bold px-12 py-6 uppercase hover:brightness-110 active:scale-95 transition-all w-full md:w-auto text-center"
              >
                {t('cta')}
              </Link>
              <a
                href="#manifiesto"
                className="border border-outline text-on-surface font-label-bold text-label-bold px-12 py-6 uppercase hover:bg-surface-800 transition-all w-full md:w-auto text-center"
              >
                {t('viewManifesto')}
              </a>
            </div>

            {/* Login link — visible on all sizes (mobile fallback since TopAppBar nav is desktop-only) */}
            <div className="pt-4">
              <Link
                href="/login"
                className="font-label-bold text-label-sm uppercase text-on-surface-variant/60 hover:text-primary transition-colors"
              >
                {tAuth('login')} →
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="absolute bottom-0 left-0 w-full brutalist-border grid grid-cols-2 md:grid-cols-4 divide-x divide-outline bg-background/80 backdrop-blur-md">
            <div className="p-md text-center">
              <p className="font-mono-data text-headline-md text-primary">1</p>
              <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">{t('members')}</p>
            </div>
            <div className="p-md text-center">
              <p className="font-mono-data text-headline-md text-primary">0</p>
              <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">{t('comfort')}</p>
            </div>
            <div className="p-md text-center">
              <p className="font-mono-data text-headline-md text-primary">24/7</p>
              <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">{t('availability')}</p>
            </div>
            <div className="p-md text-center">
              <p className="font-mono-data text-headline-md text-primary">∞</p>
              <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">{t('statsProgress')}</p>
            </div>
          </div>
        </section>

        {/* Bento Grid Feature Section */}
        <section className="w-full max-w-7xl px-margin-mobile md:px-margin-desktop py-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter auto-rows-[300px]">
            {/* Big visual card */}
            <div className="md:col-span-2 md:row-span-2 relative brutalist-border overflow-hidden group bg-surface-800">
              <div className="absolute inset-0 bg-gradient-to-br from-surface-700 to-surface-800"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-lg w-full">
                <span className="inline-block bg-primary-container text-on-primary-container font-label-bold text-[10px] px-2 py-1 mb-md">
                  {t('environment')}
                </span>
                <h3 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase mb-xs">
                  {t('anywhereTitle')}
                </h3>
                <p className="font-body-md text-on-surface-variant max-w-md opacity-80">
                  {t('anywhereDesc')}
                </p>
              </div>
            </div>

            {/* Secondary focus card */}
            <div className="brutalist-border bg-surface-800 p-lg flex flex-col justify-between">
              <Dumbbell className="text-primary" size={36} />
              <div>
                <h4 className="font-label-bold text-label-bold uppercase text-on-surface mb-xs">
                  {t('brutalWorkouts')}
                </h4>
                <p className="font-body-md text-label-sm text-on-surface-variant">
                  {t('brutalWorkoutsDesc')}
                </p>
              </div>
            </div>

            {/* Dark visual card */}
            <div className="brutalist-border relative overflow-hidden group bg-surface-700">
              <div className="absolute inset-0 bg-gradient-to-br from-surface-700 to-surface-800"></div>
              <div className="absolute inset-0 bg-primary-container/10 group-hover:bg-transparent transition-colors"></div>
            </div>

            {/* Info card */}
            <div className="brutalist-border bg-surface p-lg flex flex-col justify-center gap-md border-l-4 border-l-primary-container">
              <h4 className="font-headline-md text-primary uppercase">{t('noExcuses')}</h4>
              <p className="font-body-md text-on-surface-variant opacity-80">
                {t('noExcusesDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Strip */}
        <section className="w-full bg-primary-container py-xl text-on-primary-container overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 select-none">
            <span className="font-display-lg text-[20vw] whitespace-nowrap uppercase font-bold">
              NO GYM CLUB NO GYM CLUB
            </span>
          </div>
          <div className="max-w-7xl mx-auto px-margin-mobile relative z-10 flex flex-col md:flex-row items-center justify-between gap-lg">
            <h2 className="font-display-lg text-headline-lg text-center md:text-left uppercase whitespace-pre-line">
              {t('readyTitle')}
            </h2>
            <Link
              href="/signup"
              className="bg-on-primary-container text-primary-container font-label-bold text-label-bold px-16 py-8 uppercase text-xl hover:scale-105 active:scale-95 transition-all text-center"
            >
              {t('joinClub')}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-outline bg-background py-xl px-margin-mobile">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-xl">
          <div className="space-y-md">
            <span className="font-display-lg text-headline-md text-primary-container tracking-tighter uppercase">
              NO GYM CLUB
            </span>
            <p className="font-body-md text-on-surface-variant max-w-xs opacity-60">
              {t('footerDesc')}
            </p>
            <div className="flex gap-md">
              <a className="w-10 h-10 brutalist-border flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors" href="#" aria-label="X (Twitter)">𝕏</a>
              <a className="w-10 h-10 brutalist-border flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors" href="#" aria-label="Instagram">IG</a>
              <a className="w-10 h-10 brutalist-border flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors" href="#" aria-label="YouTube">YT</a>
            </div>
          </div>
          <div className="text-left md:text-right space-y-xs">
            <p className="font-label-bold text-label-sm uppercase text-on-surface-variant opacity-40">
              {t('founded')}
            </p>
            <p className="font-label-bold text-label-bold text-on-surface uppercase">
              No Gym Club © 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
