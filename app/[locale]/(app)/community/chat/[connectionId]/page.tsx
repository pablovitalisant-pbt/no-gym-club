import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import ChatRoom from '@/components/community/ChatRoom';
import { listMessages } from '../../connections-actions';
import type { CommunityConnection, CommunityPerson } from '@/lib/community/types';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CommunityChatPage({
  params: { locale, connectionId },
}: {
  params: { locale: string; connectionId: string };
}) {
  const t = await getTranslations({ locale, namespace: 'community' });

  if (!getFlag('community') || !getFlag('community_chat')) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

  if (!UUID.test(connectionId)) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: row } = await supabase
    .from('community_connections')
    .select('id, requester_id, addressee_id, status, created_at, responded_at')
    .eq('id', connectionId)
    .maybeSingle();

  const connection = (row as CommunityConnection | null) ?? null;

  if (!connection || connection.status !== 'accepted') {
    return (
      <div className="max-w-2xl space-y-md">
        <p role="alert" className="brutalist-border bg-surface-800 p-md text-error font-label-sm">
          {t('chatUnavailable')}
        </p>
        <Link href="/community/chats" className="text-on-surface-variant font-label-sm underline">
          {t('back')}
        </Link>
      </div>
    );
  }

  const otherUserId =
    connection.requester_id === user.id ? connection.addressee_id : connection.requester_id;

  const { data: profileRows } = await supabase.rpc('community_profile', { target: otherUserId });
  const person = ((profileRows ?? []) as CommunityPerson[])[0] ?? null;
  const messages = await listMessages(connectionId);

  if (!person || !messages.success) {
    return (
      <div className="max-w-2xl space-y-md">
        <p role="alert" className="brutalist-border bg-surface-800 p-md text-error font-label-sm">
          {t('chatUnavailable')}
        </p>
        <Link href="/community/chats" className="text-on-surface-variant font-label-sm underline">
          {t('back')}
        </Link>
      </div>
    );
  }

  return (
    <ChatRoom
      connectionId={connectionId}
      myId={user.id}
      otherUserId={otherUserId}
      otherName={person.display_name?.trim() || '?'}
      otherAvatarUrl={person.avatar_url}
      initialMessages={messages.messages}
      canSend
    />
  );
}
