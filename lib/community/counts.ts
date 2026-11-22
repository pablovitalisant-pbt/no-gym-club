import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityCounts {
  pending: number;
  unread: number;
}

/** v2-23b: conteo liviano para el badge y los accesos. Nunca trae mensajes. */
export async function fetchCommunityCounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<CommunityCounts> {
  const { count: pending } = await supabase
    .from('community_connections')
    .select('id', { count: 'exact', head: true })
    .eq('addressee_id', userId)
    .eq('status', 'pending');

  const { data } = await supabase
    .from('community_connections')
    .select('id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const ids = (data ?? []).map((row) => row.id as string);
  let unread = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from('community_messages')
      .select('id', { count: 'exact', head: true })
      .in('connection_id', ids)
      .neq('sender_id', userId)
      .is('read_at', null);
    unread = count ?? 0;
  }

  return { pending: pending ?? 0, unread };
}
