import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'settings' });

  if (!getFlag('profile_settings')) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-400 text-sm">Unauthorized</p>
      </div>
    );
  }

  const [{ data: profile }, { data: plan }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('training_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  return (
    <SettingsClient
      locale={locale}
      userId={user.id}
      email={user.email ?? null}
      displayName={profile?.display_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      planId={plan?.id ?? null}
      showCommunity={getFlag('community')}
    />
  );
}
