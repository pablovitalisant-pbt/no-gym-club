import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n/config';
import TopAppBar from '@/components/layout/TopAppBar';
import BottomNavBar from '@/components/layout/BottomNavBar';

export default async function AppLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  const navItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/exercises', label: t('exercises') },
    { href: '/progress', label: t('progress') },
    { href: '/weekly-report', label: t('report') },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-white pb-16 md:pb-0">
      <TopAppBar items={navItems} />
      <main className="pt-20 pb-24 md:pb-12 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        {children}
      </main>
      <BottomNavBar items={navItems} />
    </div>
  );
}
