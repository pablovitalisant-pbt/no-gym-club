'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mergeIncoming, type ChatMessage } from './chat';
import type { CommunityMessage } from './types';
import { markRead } from '@/app/[locale]/(app)/community/connections-actions';

// Suscribe el hilo a los INSERT realtime y limpia el canal al desmontar.
export function useChatRealtime(
  connectionId: string,
  myId: string,
  enabled: boolean,
  setMessages: (update: (prev: ChatMessage[]) => ChatMessage[]) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    void markRead(connectionId);
    const supabase = createClient();
    const channel = supabase
      .channel(`community-messages-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const incoming = payload.new as CommunityMessage;
          setMessages((prev) => mergeIncoming(prev, incoming, myId));
          if (incoming.sender_id !== myId) void markRead(connectionId);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [connectionId, myId, enabled, setMessages]);
}
