'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import CommunityAvatar from './CommunityAvatar';

export interface ChatItem {
  connectionId: string;
  otherUserId: string;
  name: string;
  avatarUrl: string | null;
  excerpt: string;
  time: string;
  unread: number;
}

interface Props {
  items: ChatItem[];
}

export default function ChatsList({ items }: Props) {
  const t = useTranslations('community');

  return (
    <div className="max-w-2xl space-y-lg">
      <div className="flex items-center justify-between gap-sm">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
          {t('chatsTitle')}
        </h1>
        <Link href="/community" className="text-on-surface-variant font-label-sm underline">
          {t('back')}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="brutalist-border bg-surface-800 p-md text-on-surface-variant">
          {t('chatsEmpty')}
        </p>
      ) : (
        <ul className="space-y-sm">
          {items.map((item) => (
            <li key={item.connectionId}>
              <Link
                href={`/community/chat/${item.connectionId}`}
                className="brutalist-border bg-surface-800 p-md flex items-center gap-md"
              >
                <CommunityAvatar url={item.avatarUrl} name={item.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-label-bold text-label-bold text-on-surface truncate">
                    {item.name}
                  </p>
                  <p className="text-on-surface-variant text-label-sm truncate">{item.excerpt}</p>
                </div>
                <div className="flex flex-col items-end gap-xs shrink-0">
                  <span className="text-on-surface-variant text-label-sm">{item.time}</span>
                  {item.unread > 0 && (
                    <span
                      data-unread="true"
                      aria-label={t('messagesLink', { count: item.unread })}
                      className="min-w-[20px] h-5 px-1 rounded-full bg-accent text-surface-900 text-label-sm font-bold flex items-center justify-center"
                    >
                      {item.unread}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
