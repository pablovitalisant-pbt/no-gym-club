'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatTime, type ChatRow } from '@/lib/community/chat';

interface Props {
  rows: ChatRow[];
  myId: string;
  onLoadOlder: () => void;
  loadingOlder: boolean;
  onRetry: (id: string, body: string) => void;
}

export default function ChatMessages({ rows, myId, onLoadOlder, loadingOlder, onRetry }: Props) {
  const t = useTranslations('community');
  const locale = useLocale();

  if (rows.length === 0) {
    return <p className="text-on-surface-variant font-label-sm">{t('noMessages')}</p>;
  }

  return (
    <div className="space-y-sm">
      <button
        type="button"
        onClick={onLoadOlder}
        disabled={loadingOlder}
        className="text-on-surface-variant font-label-sm underline disabled:opacity-50"
      >
        {t('loadOlder')}
      </button>
      <ol className="space-y-sm">
        {rows.map((row) =>
          row.type === 'day' ? (
            <li
              key={`day-${row.key}`}
              data-day-separator
              className="text-center text-on-surface-variant font-label-sm"
            >
              {row.label}
            </li>
          ) : (
            <li
              key={row.message.id}
              data-own={row.message.sender_id === myId ? 'true' : 'false'}
              className={`flex flex-col ${row.message.sender_id === myId ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2 border-2 whitespace-pre-wrap break-words ${
                  row.message.sender_id === myId
                    ? 'bg-accent text-surface-900 border-accent'
                    : 'bg-surface-800 text-on-surface border-outline'
                }`}
              >
                {row.message.body}
              </div>
              <span className="text-on-surface-variant text-label-sm">
                {formatTime(row.message.created_at, locale)}
                {row.message.status === 'sending' && ` · ${t('sending')}`}
              </span>
              {row.message.status === 'failed' && (
                <span className="text-error text-label-sm">
                  {t('notSent')} ·{' '}
                  <button
                    type="button"
                    onClick={() => onRetry(row.message.id, row.message.body)}
                    className="underline"
                  >
                    {t('retry')}
                  </button>
                </span>
              )}
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
