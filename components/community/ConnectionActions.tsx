'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { communityErrorKey } from '@/lib/community/errors';
import type { CommunityConnection } from '@/lib/community/types';
import {
  cancelConnection,
  requestConnection,
  respondConnection,
} from '../../app/[locale]/(app)/community/connections-actions';

interface Props {
  myId: string;
  targetUserId: string;
  name: string;
  connection: CommunityConnection | null;
}

export default function ConnectionActions({ myId, targetUserId, name, connection }: Props) {
  const t = useTranslations('community');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setBusy(true);
    setError('');
    const res = await action();
    setBusy(false);
    if (!res.success) {
      setError(t(communityErrorKey(res.error ?? '')));
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (!connection) {
    return (
      <div className="space-y-sm">
        <Button onClick={() => run(() => requestConnection(targetUserId))} disabled={busy}>
          {t('sendRequest')}
        </Button>
        {error && <p className="text-error font-label-sm">{error}</p>}
      </div>
    );
  }

  if (connection.status === 'pending' && connection.requester_id === myId) {
    return (
      <div className="space-y-sm">
        <p className="text-on-surface">{t('requestSent')}</p>
        <Button variant="ghost" onClick={() => run(() => cancelConnection(connection.id))} disabled={busy}>
          {t('cancelRequest')}
        </Button>
        {error && <p className="text-error font-label-sm">{error}</p>}
      </div>
    );
  }

  if (connection.status === 'pending') {
    return (
      <div className="space-y-sm">
        <div className="flex gap-sm">
          <Button onClick={() => run(() => respondConnection(connection.id, true))} disabled={busy}>
            {t('accept')}
          </Button>
          <Button variant="ghost" onClick={() => run(() => respondConnection(connection.id, false))} disabled={busy}>
            {t('reject')}
          </Button>
        </div>
        {error && <p className="text-error font-label-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-sm">
      <Link
        href={`/community/chat/${connection.id}`}
        className="inline-flex items-center justify-center px-6 py-3 min-h-[56px] text-base font-semibold bg-accent text-surface-900 hover:bg-accent/90"
      >
        {t('sendMessage')}
      </Link>
      {confirming ? (
        <div className="space-y-sm">
          <p className="text-on-surface">{t('disconnectConfirm', { name })}</p>
          <div className="flex gap-sm">
            <Button onClick={() => run(() => cancelConnection(connection.id))} disabled={busy}>
              {t('confirm')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirming(true)} disabled={busy}>
          {t('disconnect')}
        </Button>
      )}
      {error && <p className="text-error font-label-sm">{error}</p>}
    </div>
  );
}
