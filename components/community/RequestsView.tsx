'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { communityErrorKey } from '@/lib/community/errors';
import CommunityAvatar from './CommunityAvatar';
import {
  cancelConnection,
  respondConnection,
} from '../../app/[locale]/(app)/community/connections-actions';

export interface RequestItem {
  connectionId: string;
  otherUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: string | null;
  comuna: string | null;
}

interface Props {
  received: RequestItem[];
  sent: RequestItem[];
}

const LEVELS = ['untrained_extreme', 'untrained', 'beginner', 'intermediate', 'advanced'];

export default function RequestsView({ received, sent }: Props) {
  const t = useTranslations('community');
  const router = useRouter();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function run(id: string, action: () => Promise<{ success: boolean; error?: string }>) {
    setBusyId(id);
    setError('');
    const res = await action();
    setBusyId('');
    if (!res.success) {
      setError(t(communityErrorKey(res.error ?? '')));
      return;
    }
    router.refresh();
  }

  const items = tab === 'received' ? received : sent;
  const empty = tab === 'received' ? t('emptyReceived') : t('emptySent');

  return (
    <div className="space-y-lg max-w-2xl">
      <div className="flex items-center justify-between gap-sm">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
          {t('requestsTitle')}
        </h1>
        <Link href="/community" className="text-on-surface-variant font-label-sm underline">
          {t('back')}
        </Link>
      </div>

      <div role="tablist" className="flex gap-sm">
        {(['received', 'sent'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 border-2 font-semibold ${
              tab === key
                ? 'bg-accent text-surface-900 border-accent'
                : 'border-outline text-on-surface hover:bg-surface-700'
            }`}
          >
            {key === 'received' ? t('tabReceived') : t('tabSent')}
          </button>
        ))}
      </div>

      {error && <p className="text-error font-label-sm">{error}</p>}

      {items.length === 0 ? (
        <p className="brutalist-border bg-surface-800 p-md text-on-surface-variant">{empty}</p>
      ) : (
        <ul className="space-y-sm">
          {items.map((item) => {
            const name = item.displayName?.trim() || '?';
            const level = item.level && LEVELS.includes(item.level) ? t(`levels.${item.level}`) : null;
            return (
              <li key={item.connectionId} className="brutalist-border bg-surface-800 p-md flex flex-wrap items-center gap-md">
                <CommunityAvatar url={item.avatarUrl} name={name} />
                <div className="min-w-0 flex-1 space-y-xs">
                  <Link href={`/community/${item.otherUserId}`} className="font-label-bold text-label-bold text-on-surface truncate block">
                    {name}
                  </Link>
                  {level && <p className="text-on-surface-variant text-label-sm">{t('level')}: {level}</p>}
                  {item.comuna && <p className="text-on-surface-variant text-label-sm truncate">{item.comuna}</p>}
                </div>
                <div className="flex gap-sm">
                  {tab === 'received' ? (
                    <>
                      <Button
                        onClick={() => run(item.connectionId, () => respondConnection(item.connectionId, true))}
                        disabled={busyId === item.connectionId}
                      >
                        {t('accept')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => run(item.connectionId, () => respondConnection(item.connectionId, false))}
                        disabled={busyId === item.connectionId}
                      >
                        {t('reject')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => run(item.connectionId, () => cancelConnection(item.connectionId))}
                      disabled={busyId === item.connectionId}
                    >
                      {t('cancelRequest')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
