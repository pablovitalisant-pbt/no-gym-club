'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { communityErrorKey } from '@/lib/community/errors';
import { withDays, type ChatMessage } from '@/lib/community/chat';
import { useChatRealtime } from '@/lib/community/useChatRealtime';
import { MESSAGE_MAX } from '@/lib/community/validate';
import type { CommunityMessage } from '@/lib/community/types';
import ChatComposer from './ChatComposer';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import {
  listMessages,
  sendMessage,
} from '../../app/[locale]/(app)/community/connections-actions';

interface Props {
  connectionId: string;
  myId: string;
  otherUserId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  initialMessages: CommunityMessage[];
  canSend: boolean;
}

export default function ChatRoom({
  connectionId,
  myId,
  otherUserId,
  otherName,
  otherAvatarUrl,
  initialMessages,
  canSend,
}: Props) {
  const t = useTranslations('community');
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(!canSend);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const sendable = canSend && !unavailable;

  useChatRealtime(connectionId, myId, canSend, setMessages);

  async function loadOlder() {
    const oldest = messages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    const res = await listMessages(connectionId, oldest.created_at);
    setLoadingOlder(false);
    if (!res.success) {
      setError(t(communityErrorKey(res.error)));
      return;
    }
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      return [...res.messages.filter((m) => !known.has(m.id)), ...prev];
    });
  }

  async function deliver(tempId: string, body: string) {
    setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m)));
    const res = await sendMessage(connectionId, body);
    if (!res.success) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)));
      setError(t(communityErrorKey(res.error)));
      if (res.error === 'blocked' || res.error === 'not_found' || res.error === 'invalid_connection') {
        setUnavailable(true);
      }
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m)));
  }

  function submit() {
    const body = draft.trim();
    if (!body || !sendable) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      connection_id: connectionId,
      sender_id: myId,
      body: body.slice(0, MESSAGE_MAX),
      created_at: new Date().toISOString(),
      read_at: null,
      status: 'sending',
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setError('');
    void deliver(tempId, optimistic.body);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    // Enter envia solo en escritorio; en movil el Enter hace salto de linea.
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;
    e.preventDefault();
    submit();
  }

  return (
    <div className="max-w-2xl space-y-md">
      <ChatHeader
        otherUserId={otherUserId}
        name={otherName}
        avatarUrl={otherAvatarUrl}
        disabled={!sendable}
      />

      {unavailable && (
        <p role="alert" className="brutalist-border bg-surface-800 p-md text-error font-label-sm">
          {t('chatUnavailable')}
        </p>
      )}

      <ChatMessages
        rows={withDays(messages, locale)}
        myId={myId}
        onLoadOlder={loadOlder}
        loadingOlder={loadingOlder}
        onRetry={deliver}
      />

      {error && <p className="text-error font-label-sm">{error}</p>}

      <ChatComposer
        draft={draft}
        sendable={sendable}
        onChange={setDraft}
        onKeyDown={onKeyDown}
        onSend={submit}
      />
    </div>
  );
}
