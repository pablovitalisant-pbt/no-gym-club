import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'me' } as { id: string } | null,
  flag: true,
  rpcs: [] as { fn: string; args: Record<string, unknown> }[],
  inserts: [] as { table: string; payload: Record<string, unknown> }[],
  selects: [] as { table: string; columns: string }[],
  limits: [] as number[],
  rows: {
    community_connections: [] as Record<string, unknown>[],
    community_messages: [] as Record<string, unknown>[],
  },
}));

vi.mock('@/lib/flags', () => ({ getFlag: () => h.flag }));

vi.mock('@/lib/supabase/server', () => {
  const selectChain = (table: string, columns: string) => {
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.select = self;
    chain.eq = self;
    chain.in = self;
    chain.order = self;
    chain.lt = self;
    chain.limit = (n: number) => {
      h.limits.push(n);
      return chain;
    };
    chain.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({
        data: h.rows[table as keyof typeof h.rows] ?? [],
        error: null,
      }).then(resolve);
    return chain;
  };
  return {
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: h.user }, error: null }) },
      from: (table: string) => ({
        select: (columns: string) => {
          h.selects.push({ table, columns });
          return selectChain(table, columns);
        },
        insert: (payload: Record<string, unknown>) => {
          h.inserts.push({ table, payload });
          return Promise.resolve({ error: null });
        },
      }),
      rpc: (fn: string, args: Record<string, unknown>) => {
        h.rpcs.push({ fn, args });
        return Promise.resolve({ error: null });
      },
    }),
  };
});

import {
  requestConnection,
  respondConnection,
  cancelConnection,
  sendMessage,
  markRead,
  listConnections,
  listMessages,
} from '@/app/[locale]/(app)/community/connections-actions';

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';
const UUID_C = '33333333-3333-4333-8333-333333333333';

beforeEach(() => {
  h.user = { id: 'me' };
  h.flag = true;
  h.rpcs = [];
  h.inserts = [];
  h.selects = [];
  h.limits = [];
  h.rows = { community_connections: [], community_messages: [] };
});

describe('v2-23a conexiones y chat — server actions', () => {
  it('con el flag en false no llama a la base de datos', async () => {
    h.flag = false;
    expect(await requestConnection(UUID_A)).toEqual({ success: false, error: 'disabled' });
    expect(await sendMessage(UUID_A, 'hola')).toEqual({ success: false, error: 'disabled' });
    expect(await listMessages(UUID_A)).toEqual({ success: false, error: 'disabled' });
    expect(h.rpcs).toHaveLength(0);
    expect(h.inserts).toHaveLength(0);
  });

  it('sin sesion devuelve Unauthorized', async () => {
    h.user = null;
    expect(await requestConnection(UUID_A)).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('requestConnection valida uuid y no permite solicitarse a si mismo', async () => {
    expect(await requestConnection('no-uuid')).toEqual({ success: false, error: 'invalid_target' });
    expect(await requestConnection('me')).toEqual({ success: false, error: 'invalid_target' });
    expect(h.rpcs).toHaveLength(0);
  });

  it('requestConnection llama a la funcion request_connection con el target', async () => {
    expect(await requestConnection(UUID_A)).toEqual({ success: true });
    expect(h.rpcs).toEqual([{ fn: 'request_connection', args: { target: UUID_A } }]);
  });

  it('respondConnection y cancelConnection llaman a sus funciones', async () => {
    expect(await respondConnection(UUID_B, true)).toEqual({ success: true });
    expect(await cancelConnection(UUID_B)).toEqual({ success: true });
    expect(h.rpcs).toEqual([
      { fn: 'respond_connection', args: { connection_id: UUID_B, accept: true } },
      { fn: 'cancel_connection', args: { connection_id: UUID_B } },
    ]);
  });

  it('sendMessage recorta, exige 1..1000 y escribe con el emisor de la sesion', async () => {
    expect(await sendMessage(UUID_A, '   hola  ')).toEqual({ success: true });
    expect(h.inserts).toEqual([
      {
        table: 'community_messages',
        payload: { connection_id: UUID_A, sender_id: 'me', body: 'hola' },
      },
    ]);
    expect(await sendMessage(UUID_A, '   ')).toEqual({ success: false, error: 'message_empty' });
    expect(await sendMessage(UUID_A, 'x'.repeat(1001))).toEqual({
      success: false,
      error: 'message_too_long',
    });
    expect(h.inserts).toHaveLength(1);
  });

  it('markRead llama a mark_messages_read sin tocar body', async () => {
    expect(await markRead(UUID_C)).toEqual({ success: true });
    expect(h.rpcs).toEqual([
      { fn: 'mark_messages_read', args: { connection_id: UUID_C } },
    ]);
  });

  it('listMessages respeta el tope de 50 y devuelve en orden ascendente', async () => {
    h.rows.community_messages = [
      { id: 'm2', connection_id: UUID_A, sender_id: 'me', body: 'nuevo', created_at: 't2', read_at: null },
      { id: 'm1', connection_id: UUID_A, sender_id: 'me', body: 'viejo', created_at: 't1', read_at: null },
    ];
    const res = await listMessages(UUID_A, undefined, 200);
    expect(res).toMatchObject({ success: true });
    expect(res.success && res.messages.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(h.limits).toEqual([50]);
  });

  it('listConnections separa recibidas, enviadas y aceptadas con ultimo mensaje y no leidos', async () => {
    h.rows.community_connections = [
      { id: 'c-rec', requester_id: UUID_A, addressee_id: 'me', status: 'pending', created_at: 't1', responded_at: null },
      { id: 'c-sent', requester_id: 'me', addressee_id: UUID_B, status: 'pending', created_at: 't2', responded_at: null },
      { id: 'c-ok', requester_id: 'me', addressee_id: UUID_C, status: 'accepted', created_at: 't3', responded_at: 't4' },
    ];
    h.rows.community_messages = [
      { id: 'm3', connection_id: 'c-ok', sender_id: UUID_C, body: 'nuevo', created_at: 't3', read_at: null },
      { id: 'm2', connection_id: 'c-ok', sender_id: 'me', body: 'medio', created_at: 't2', read_at: null },
      { id: 'm1', connection_id: 'c-ok', sender_id: UUID_C, body: 'viejo', created_at: 't1', read_at: 't0' },
    ];
    const res = await listConnections();
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.overview.received.map((s) => s.connection.id)).toEqual(['c-rec']);
    expect(res.overview.sent.map((s) => s.connection.id)).toEqual(['c-sent']);
    expect(res.overview.accepted).toHaveLength(1);
    const chat = res.overview.accepted[0];
    expect(chat.otherUserId).toBe(UUID_C);
    expect(chat.lastMessage?.id).toBe('m3');
    expect(chat.unreadCount).toBe(1);
  });
});
