import type { CommunityMessage } from './types';

export type ChatMessage = CommunityMessage & { status?: 'sending' | 'sent' | 'failed' };

export type ChatRow =
  | { type: 'day'; key: string; label: string }
  | { type: 'message'; message: ChatMessage };

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function withDays(messages: ChatMessage[], locale: string): ChatRow[] {
  const rows: ChatRow[] = [];
  let last = '';
  for (const message of messages) {
    const key = dayKey(message.created_at);
    if (key !== last) {
      rows.push({
        type: 'day',
        key,
        label: new Date(message.created_at).toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });
      last = key;
    }
    rows.push({ type: 'message', message });
  }
  return rows;
}

// El evento realtime del propio INSERT reemplaza al optimista (mismo body),
// en vez de duplicarlo. Un evento repetido del mismo id tampoco duplica.
export function mergeIncoming(
  list: ChatMessage[],
  incoming: CommunityMessage,
  myId: string,
): ChatMessage[] {
  if (list.some((m) => m.id === incoming.id)) return list;
  if (incoming.sender_id === myId) {
    const idx = list.findIndex((m) => m.id.startsWith('tmp-') && m.body === incoming.body);
    if (idx >= 0) return list.map((m, i) => (i === idx ? incoming : m));
  }
  return [...list, incoming];
}

export function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
