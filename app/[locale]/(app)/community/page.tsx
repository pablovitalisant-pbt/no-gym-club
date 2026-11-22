import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import CommunityOptIn from '@/components/community/CommunityOptIn';
import NearbyList from '@/components/community/NearbyList';
import { RADIUS_OPTIONS, communityMode } from '@/lib/community/validate';
import { fetchCommunityCounts } from '@/lib/community/counts';
import type { CommunityPerson, OwnCommunityProfile } from '@/lib/community/types';

export const dynamic = 'force-dynamic';

export default async function CommunityPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { radio?: string; edit?: string };
}) {
  const t = await getTranslations({ locale, namespace: 'community' });

  if (!getFlag('community')) {
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

  const { data: own } = await supabase
    .from('community_profiles')
    .select('is_public, comuna, bio, show_photo, show_level, show_goal, geo_lat, geo_lng')
    .eq('user_id', user.id)
    .maybeSingle();

  const profile = (own as OwnCommunityProfile | null) ?? null;
  const mode = communityMode(profile);

  if (mode === 'invite' || searchParams.edit === '1') {
    return <CommunityOptIn initial={profile} isPublic={mode === 'nearby'} />;
  }

  const requested = Number(searchParams.radio);
  const radius = (RADIUS_OPTIONS as readonly number[]).includes(requested) ? requested : 5;

  const { data } = await supabase.rpc('nearby_community_profiles', { radius_km: radius });
  const people = (data ?? []) as CommunityPerson[];

  const counts = getFlag('community_chat')
    ? await fetchCommunityCounts(supabase, user.id)
    : null;

  return <NearbyList people={people} radius={radius} counts={counts} />;
}
