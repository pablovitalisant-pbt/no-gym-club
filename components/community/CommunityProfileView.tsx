'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import type { CommunityPerson } from '@/lib/community/types';
import { REPORT_MAX } from '@/lib/community/validate';
import CommunityAvatar from './CommunityAvatar';
import { blockCommunityUser, reportCommunityUser } from '../../app/[locale]/(app)/community/actions';

const LEVELS = ['untrained_extreme', 'untrained', 'beginner', 'intermediate', 'advanced'];
const GOALS = ['lose_weight', 'build_muscle', 'improve_endurance', 'master_skills', 'general_fitness'];

export default function CommunityProfileView({ person }: { person: CommunityPerson }) {
  const t = useTranslations('community');
  const router = useRouter();
  const name = person.display_name?.trim() || '?';

  const [blockStep, setBlockStep] = useState<'idle' | 'confirm' | 'saving'>('idle');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [blockError, setBlockError] = useState('');

  async function confirmBlock() {
    setBlockStep('saving');
    const res = await blockCommunityUser(person.user_id);
    if (!res.success) {
      setBlockError(res.error);
      setBlockStep('idle');
      return;
    }
    router.push('/community');
    router.refresh();
  }

  async function sendReport() {
    setReportState('saving');
    const res = await reportCommunityUser(person.user_id, reason);
    setReportState(res.success ? 'done' : 'error');
  }

  const level = person.level && LEVELS.includes(person.level) ? t(`levels.${person.level}`) : null;
  const goal = person.primary_goal && GOALS.includes(person.primary_goal) ? t(`goals.${person.primary_goal}`) : null;

  return (
    <div className="max-w-2xl space-y-lg">
      <Link href="/community" className="text-on-surface-variant font-label-sm underline">
        {t('back')}
      </Link>

      <section className="brutalist-border bg-surface-800 p-md space-y-sm">
        <div className="flex items-center gap-md">
          <CommunityAvatar url={person.avatar_url} name={name} size="md" />
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase">{name}</h1>
        </div>

        {level && <p className="text-on-surface">{t('level')}: {level}</p>}
        {goal && <p className="text-on-surface">{t('goal')}: {goal}</p>}
        {person.focus_areas && person.focus_areas.length > 0 && (
          <p className="text-on-surface">{t('focus')}: {person.focus_areas.join(', ')}</p>
        )}
        {person.comuna && <p className="text-on-surface">{t('comuna')}: {person.comuna}</p>}
        <p className="text-on-surface-variant">
          {person.distance_km != null
            ? t('distance', { km: person.distance_km })
            : t('noDistance')}
        </p>
        {person.bio && (
          <div>
            <h2 className="font-label-bold text-label-sm uppercase text-on-surface-variant">{t('about')}</h2>
            <p className="text-on-surface whitespace-pre-wrap">{person.bio}</p>
          </div>
        )}

        <Button disabled title={t('comingSoon')}>
          {t('sendRequest')} — {t('comingSoon')}
        </Button>
      </section>

      <section className="brutalist-border bg-surface-800 p-md space-y-sm">
        {blockStep === 'idle' ? (
          <Button variant="ghost" onClick={() => setBlockStep('confirm')}>
            {t('block')}
          </Button>
        ) : (
          <div className="space-y-sm">
            <p className="text-on-surface">{t('blockConfirm', { name })}</p>
            <div className="flex gap-sm">
              <Button onClick={confirmBlock} disabled={blockStep === 'saving'}>
                {t('confirm')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setBlockStep('idle')}
                disabled={blockStep === 'saving'}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
        {blockError && <p className="text-error font-label-sm">{blockError}</p>}

        {reportOpen ? (
          <div className="space-y-sm">
            <label htmlFor="report-reason" className="font-label-bold text-label-sm uppercase text-on-surface-variant block">
              {t('reportReason')}
            </label>
            <textarea
              id="report-reason"
              maxLength={REPORT_MAX}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface"
              placeholder={t('reportPlaceholder')}
            />
            {reportState === 'done' ? (
              <p className="text-green-500 font-label-sm">{t('reportDone')}</p>
            ) : (
              <div className="flex gap-sm">
                <Button onClick={sendReport} disabled={reportState === 'saving' || !reason.trim()}>
                  {t('reportSend')}
                </Button>
                <Button variant="ghost" onClick={() => setReportOpen(false)}>
                  {t('cancel')}
                </Button>
              </div>
            )}
            {reportState === 'error' && <p className="text-error font-label-sm">{t('reportError')}</p>}
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setReportOpen(true)}>
            {t('report')}
          </Button>
        )}
      </section>
    </div>
  );
}
