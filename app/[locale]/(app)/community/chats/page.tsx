import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import ChatsList, { type ChatItem } from '@/components/community/ChatsList';
import { listConnections } from '../connections-actions';
import type { CommunityPerson, ConnectionSummary } from '@/lib/community/types';

export const dynamic = 'force-dynamic';

export default async function CommunityChatsPage({
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

  const accepted = [...res.overview.accepted].sort((a, b) => {
    const at = a.lastMessage?.created_at ?? a.connection.created_at;
    const bt = b.lastMessage?.created_at ?? b.connection.created_at;
    return bt.localeCompare(at);
  });

  const profiles = new Map<string, CommunityPerson>();
  await Promise.all(
    [...new Set(accepted.map((s) => s.otherUserId))].map(async (id) => {
      const { data } = await supabase.rpc('community_profile', { target: id });
      const person = ((data ?? []) as CommunityPerson[])[0];
      if (person) profiles.set(id, person);
    }),
  );

  const toItem = (summary: ConnectionSummary): ChatItem => {
    const person = profiles.get(summary.otherUserId);
    return {
      connectionId: summary.connection.id,
      otherUserId: summary.otherUserId,
      name: person?.display_name?.trim() || '?',
      avatarUrl: person?.avatar_url ?? null,
      excerpt: summary.lastMessage?.body ?? t('noMessages'),
      time: summary.lastMessage
        ? new Date(summary.lastMessage.created_at).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
      unread: summary.unreadCount,
    };
  };

  return <ChatsList items={accepted.map(toItem)} />;
}
