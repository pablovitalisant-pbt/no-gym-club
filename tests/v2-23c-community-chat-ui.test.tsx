import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `community.${key}`,
  useLocale: () => 'es',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/app/[locale]/(app)/community/connections-actions', () => ({
  sendMessage: vi.fn(async () => ({ success: true })),
  markRead: vi.fn(async () => ({ success: true })),
  listMessages: vi.fn(async () => ({ success: true, messages: [] })),
}));

vi.mock('@/app/[locale]/(app)/community/actions', () => ({
  blockCommunityUser: vi.fn(async () => ({ success: true })),
  reportCommunityUser: vi.fn(async () => ({ success: true })),
}));

import { dayKey, mergeIncoming, withDays } from '../lib/community/chat';
import ChatRoom from '../components/community/ChatRoom';
import ChatsList from '../components/community/ChatsList';
import type { CommunityMessage } from '../lib/community/types';

const root = resolve(__dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf-8');

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

function msg(id: string, sender: string, body: string, at: string): CommunityMessage {
  return { id, connection_id: 'c1', sender_id: sender, body, created_at: at, read_at: null };
}

const MESSAGES = [
  msg('m1', OTHER, 'hola', '2026-01-05T18:00:00.000Z'),
  msg('m2', ME, 'qué tal', '2026-01-06T12:00:00.000Z'),
];

describe('v2-23c chat 1:1', () => {
  it('burbujas propias a la derecha y ajenas a la izquierda', () => {
    const html = renderToStaticMarkup(
      <ChatRoom
        connectionId="c1"
        myId={ME}
        otherUserId={OTHER}
        otherName="Ana"
        otherAvatarUrl={null}
        initialMessages={MESSAGES}
        canSend
      />,
    );
    expect(html).toContain('data-own="true"');
    expect(html).toContain('data-own="false"');
    expect(html).toContain('qué tal');
    expect(html).toContain('hola');
  });

  it('inserta un separador por cada día distinto', () => {
    expect(dayKey('2026-01-05T18:00:00.000Z')).not.toBe(dayKey('2026-01-06T12:00:00.000Z'));
    const rows = withDays(MESSAGES, 'es');
    expect(rows.filter((r) => r.type === 'day')).toHaveLength(2);
    expect(rows.filter((r) => r.type === 'message')).toHaveLength(2);
    const html = renderToStaticMarkup(
      <ChatRoom
        connectionId="c1"
        myId={ME}
        otherUserId={OTHER}
        otherName="Ana"
        otherAvatarUrl={null}
        initialMessages={MESSAGES}
        canSend
      />,
    );
    expect((html.match(/data-day-separator/g) ?? [])).toHaveLength(2);
  });

  it('dedupe: el mensaje realtime propio reemplaza al optimista, no lo duplica', () => {
    const optimistic = {
      ...msg('tmp-1', ME, 'hola', '2026-01-05T18:00:00.000Z'),
      status: 'sending' as const,
    };
    const real = msg('real-1', ME, 'hola', '2026-01-05T18:00:01.000Z');
    const merged = mergeIncoming([optimistic], real, ME);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('real-1');
    // Un evento repetido tampoco duplica.
    expect(mergeIncoming(merged, real, ME)).toHaveLength(1);
    // Un mensaje ajeno se agrega.
    expect(mergeIncoming(merged, msg('x', OTHER, 'ey', '2026-01-05T18:00:02.000Z'), ME)).toHaveLength(2);
  });

  it('sin conexión aceptada: muestra no disponible y deshabilita el envío', () => {
    const html = renderToStaticMarkup(
      <ChatRoom
        connectionId="c1"
        myId={ME}
        otherUserId={OTHER}
        otherName="Ana"
        otherAvatarUrl={null}
        initialMessages={[]}
        canSend={false}
      />,
    );
    expect(html).toContain('community.chatUnavailable');
    expect(html).toContain('disabled');
  });

  it('renderiza el texto plano: sin HTML ni enlaces clickeables', () => {
    const html = renderToStaticMarkup(
      <ChatRoom
        connectionId="c1"
        myId={OTHER}
        otherUserId={ME}
        otherName="Yo"
        otherAvatarUrl={null}
        initialMessages={[msg('m9', OTHER, '<b>x</b> https://phish.test', '2026-01-05T18:00:00.000Z')]}
        canSend
      />,
    );
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
    expect(html).not.toContain('href="https://phish.test"');
    const src = source('components/community/ChatRoom.tsx');
    expect(src).not.toContain('dangerouslySetInnerHTML');
  });

  it('realtime: se suscribe por connection_id y limpia el canal al desmontar', () => {
    const src = source('components/community/ChatRoom.tsx');
    const hook = source('lib/community/useChatRealtime.ts');
    expect(hook).toContain('postgres_changes');
    expect(hook).toContain('community_messages');
    expect(hook).toContain("event: 'INSERT'");
    expect(hook).toContain('connection_id=eq.');
    expect(hook).toContain('removeChannel');
    expect(hook).toContain('markRead');
    expect(src).toContain('useChatRealtime');
    expect(src).toContain('Enter');
  });

  it('lista de chats: último mensaje, extracto, hora y punto de no leído', () => {
    const html = renderToStaticMarkup(
      <ChatsList
        items={[
          {
            connectionId: 'c1',
            otherUserId: OTHER,
            name: 'Ana',
            avatarUrl: null,
            excerpt: 'nos vemos mañana',
            time: '18:05',
            unread: 2,
          },
        ]}
      />,
    );
    expect(html).toContain('Ana');
    expect(html).toContain('nos vemos mañana');
    expect(html).toContain('18:05');
    expect(html).toContain('/community/chat/c1');
    expect(html).toContain('data-unread="true"');
  });

  it('i18n: las claves nuevas existen en ES y EN', () => {
    const es = JSON.parse(source('messages/es.json'));
    const en = JSON.parse(source('messages/en.json'));
    const keys = [
      'chatsTitle',
      'chatsEmpty',
      'chatUnavailable',
      'loadOlder',
      'messagePlaceholder',
      'sendButton',
      'sending',
      'notSent',
      'retry',
      'menu',
      'noMessages',
    ];
    for (const key of keys) {
      expect(es.community[key], `falta community.${key} en es.json`).toBeTruthy();
      expect(en.community[key], `falta community.${key} en en.json`).toBeTruthy();
    }
  });
});
