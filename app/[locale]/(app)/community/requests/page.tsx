import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import RequestsView, { type RequestItem } from '@/components/community/RequestsView';
import { listConnections } from '../connections-actions';
import type { CommunityPerson, ConnectionSummary } from '@/lib/community/types';

export const dynamic = 'force-dynamic';

export default async function CommunityRequestsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'community' });

  if (!getFlag('community') || !getFlag('community_chat')) {
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

  const res = await listConnections();
  if (!res.success) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-400 text-sm">{t('errors.generic')}</p>
      </div>
    );
  }

  const summaries = [...res.overview.received, ...res.overview.sent];
  const profiles = new Map<string, CommunityPerson>();
  await Promise.all(
    [...new Set(summaries.map((s) => s.otherUserId))].map(async (id) => {
      const { data } = await supabase.rpc('community_profile', { target: id });
      const person = ((data ?? []) as CommunityPerson[])[0];
      if (person) profiles.set(id, person);
    }),
  );

  const toItem = (summary: ConnectionSummary): RequestItem => {
    const person = profiles.get(summary.otherUserId);
    return {
      connectionId: summary.connection.id,
      otherUserId: summary.otherUserId,
      displayName: person?.display_name ?? null,
      avatarUrl: person?.avatar_url ?? null,
      level: person?.level ?? null,
      comuna: person?.comuna ?? null,
    };
  };

  return (
    <RequestsView
      received={res.overview.received.map(toItem)}
      sent={res.overview.sent.map(toItem)}
    />
  );
}
