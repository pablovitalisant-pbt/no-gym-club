'use server';

import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import { normalizeMessageBody } from '@/lib/community/validate';
import type {
  CommunityConnection,
  CommunityMessage,
  ConnectionSummary,
  ConnectionsOverview,
} from '@/lib/community/types';

export type ConnectionActionResult = { success: true } | { success: false; error: string };
export type ConnectionsResult =
  | { success: true; overview: ConnectionsOverview }
  | { success: false; error: string };
export type MessagesResult =
  | { success: true; messages: CommunityMessage[] }
  | { success: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MESSAGE_COLUMNS = 'id, connection_id, sender_id, body, created_at, read_at';

function isUuid(value: string): boolean {
  return UUID.test(value);
}

function disabled(): { success: false; error: string } {
  return { success: false, error: 'disabled' };
}

async function authorizedClient() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export async function requestConnection(targetId: string): Promise<ConnectionActionResult> {
  if (!getFlag('community_chat')) return disabled();
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(targetId) || targetId === auth.user.id) {
    return { success: false, error: 'invalid_target' };
  }

  const { error } = await auth.supabase.rpc('request_connection', { target: targetId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function respondConnection(
  connectionId: string,
  accept: boolean,
): Promise<ConnectionActionResult> {
  if (!getFlag('community_chat')) return disabled();
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(connectionId) || typeof accept !== 'boolean') {
    return { success: false, error: 'invalid_connection' };
  }

  const { error } = await auth.supabase.rpc('respond_connection', {
    connection_id: connectionId,
    accept,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function cancelConnection(connectionId: string): Promise<ConnectionActionResult> {
  if (!getFlag('community_chat')) return disabled();
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(connectionId)) return { success: false, error: 'invalid_connection' };

  const { error } = await auth.supabase.rpc('cancel_connection', { connection_id: connectionId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function sendMessage(
  connectionId: string,
  rawBody: string,
): Promise<ConnectionActionResult> {
  if (!getFlag('community_chat')) return disabled();
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(connectionId)) return { success: false, error: 'invalid_connection' };

  const body = normalizeMessageBody(rawBody);
  if (!body.ok) return { success: false, error: body.error };

  const { error } = await auth.supabase.from('community_messages').insert({
    connection_id: connectionId,
    sender_id: auth.user.id,
    body: body.value,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markRead(connectionId: string): Promise<ConnectionActionResult> {
  if (!getFlag('community_chat')) return disabled();
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(connectionId)) return { success: false, error: 'invalid_connection' };

  const { error } = await auth.supabase.rpc('mark_messages_read', {
    connection_id: connectionId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listConnections(): Promise<ConnectionsResult> {
  if (!getFlag('community_chat')) return disabled();
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };

  const { data, error } = await auth.supabase
    .from('community_connections')
    .select('id, requester_id, addressee_id, status, created_at, responded_at')
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  const me = auth.user.id;
  const connections = (data ?? []) as CommunityConnection[];
  const acceptedIds = connections.filter((c) => c.status === 'accepted').map((c) => c.id);

  let messages: CommunityMessage[] = [];
  if (acceptedIds.length > 0) {
    const { data: messageRows } = await auth.supabase
      .from('community_messages')
      .select(MESSAGE_COLUMNS)
      .in('connection_id', acceptedIds)
      .order('created_at', { ascending: false });
    messages = (messageRows ?? []) as CommunityMessage[];
  }

  const summarize = (connection: CommunityConnection): ConnectionSummary => {
    const own = messages.filter((m) => m.connection_id === connection.id);
    return {
      connection,
      otherUserId:
        connection.requester_id === me ? connection.addressee_id : connection.requester_id,
      lastMessage: own[0] ?? null,
      unreadCount: own.filter((m) => m.sender_id !== me && !m.read_at).length,
    };
  };

  return {
    success: true,
    overview: {
      received: connections
        .filter((c) => c.status === 'pending' && c.addressee_id === me)
        .map(summarize),
      sent: connections
        .filter((c) => c.status === 'pending' && c.requester_id === me)
        .map(summarize),
      accepted: connections.filter((c) => c.status === 'accepted').map(summarize),
    },
  };
}

export async function listMessages(
  connectionId: string,
  before?: string,
  limit = 50,
): Promise<MessagesResult> {
  if (!getFlag('community_chat')) return disabled();
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(connectionId)) return { success: false, error: 'invalid_connection' };

  const capped = Math.max(1, Math.min(Number.isFinite(limit) ? Math.floor(limit) : 50, 50));

  let query = auth.supabase
    .from('community_messages')
    .select(MESSAGE_COLUMNS)
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: false })
    .limit(capped);

  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  return {
    success: true,
    messages: [...((data ?? []) as CommunityMessage[])].reverse(),
  };
}
