'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import CommunityAvatar from './CommunityAvatar';
import { blockCommunityUser, reportCommunityUser } from '../../app/[locale]/(app)/community/actions';
import { REPORT_MAX } from '@/lib/community/validate';

interface Props {
  otherUserId: string;
  name: string;
  avatarUrl: string | null;
  disabled: boolean;
}

export default function ChatHeader({ otherUserId, name, avatarUrl, disabled }: Props) {
  const t = useTranslations('community');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function confirmBlock() {
    const res = await blockCommunityUser(otherUserId);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.push('/community');
    router.refresh();
  }

  async function sendReport() {
    setReportState('saving');
    const res = await reportCommunityUser(otherUserId, reason);
    setReportState(res.success ? 'done' : 'error');
  }

  return (
    <header className="brutalist-border bg-surface-800 p-md space-y-sm">
      <div className="flex items-center gap-md">
        <Link href="/community/chats" className="text-on-surface-variant font-label-sm underline">
          {t('back')}
        </Link>
        <CommunityAvatar url={avatarUrl} name={name} />
        <Link
          href={`/community/${otherUserId}`}
          className="font-label-bold text-label-bold text-on-surface truncate"
        >
          {name}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto px-3 py-2 border-2 border-outline text-on-surface"
          aria-expanded={open}
        >
          {t('menu')}
        </button>
      </div>

      {open && (
        <div className="space-y-sm">
          {reportOpen ? (
            <div className="space-y-sm">
              <label htmlFor="chat-report" className="font-label-bold text-label-sm uppercase text-on-surface-variant block">
                {t('reportReason')}
              </label>
              <textarea
                id="chat-report"
                maxLength={REPORT_MAX}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface"
                placeholder={t('reportPlaceholder')}
              />
              {reportState === 'done' ? (
                <p className="text-green-500 font-label-sm">{t('reportDone')}</p>
              ) : (
                <button
                  type="button"
                  onClick={sendReport}
                  disabled={reportState === 'saving' || !reason.trim()}
                  className="px-4 py-2 border-2 border-text-primary text-text-primary font-semibold disabled:opacity-50"
                >
                  {t('reportSend')}
                </button>
              )}
              {reportState === 'error' && <p className="text-error font-label-sm">{t('reportError')}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="px-4 py-2 border-2 border-outline text-on-surface font-semibold"
            >
              {t('report')}
            </button>
          )}

          {blocking ? (
            <div className="space-y-sm">
              <p className="text-on-surface">{t('blockConfirm', { name })}</p>
              <div className="flex gap-sm">
                <button
                  type="button"
                  onClick={confirmBlock}
                  className="px-4 py-2 bg-accent text-surface-900 font-semibold"
                >
                  {t('confirm')}
                </button>
                <button
                  type="button"
                  onClick={() => setBlocking(false)}
                  className="px-4 py-2 border-2 border-outline text-on-surface font-semibold"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setBlocking(true)}
              disabled={disabled}
              className="px-4 py-2 border-2 border-outline text-on-surface font-semibold disabled:opacity-50"
            >
              {t('block')}
            </button>
          )}
          {error && <p className="text-error font-label-sm">{error}</p>}
        </div>
      )}
    </header>
  );
}
