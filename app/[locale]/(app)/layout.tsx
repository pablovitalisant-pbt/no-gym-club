import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n/config';
import { createClient } from '@/lib/supabase/server';
import TopAppBarGate from '@/components/layout/TopAppBarGate';
import BottomNavBar from '@/components/layout/BottomNavBar';
import ThemePreferenceSync from '@/components/settings/ThemePreferenceSync';
import { isTheme } from '@/lib/settings/validate';
import { getFlag } from '@/lib/flags';
import { fetchCommunityCounts } from '@/lib/community/counts';

export default async function AppLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  const navItems: { href: string; label: string; badge?: number }[] = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/exercises', label: t('exercises') },
    { href: '/progress', label: t('progress') },
    { href: '/weekly-report', label: t('report') },
  ];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let themePreference: string | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, theme_preference')
      .eq('id', user.id)
      .maybeSingle();
    displayName = data?.display_name ?? null;
    avatarUrl = data?.avatar_url ?? null;
    themePreference = data?.theme_preference ?? null;
  }

  const showCommunity = getFlag('community');
  let communityBadge = 0;
  if (showCommunity && user && getFlag('community_chat')) {
    const counts = await fetchCommunityCounts(supabase, user.id);
    communityBadge = counts.pending + counts.unread;
  }
  if (showCommunity) {
    navItems.push({
      href: '/community',
      label: t('community'),
      ...(communityBadge > 0 ? { badge: communityBadge } : {}),
    });
  }

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-white pb-16 md:pb-0">
      <ThemePreferenceSync theme={isTheme(themePreference) ? themePreference : null} />
      <TopAppBarGate
        items={navItems}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />
      <main className="pt-20 pb-24 md:pb-12 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        {children}
      </main>
      <BottomNavBar items={navItems} />
    </div>
  );
}
