'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';
import GeneratingMessages from './GeneratingMessages';

export default function CreatePlanCard({
  phaseIndex = 0,
  messagesEnabled = false,
}: {
  phaseIndex?: number;
  messagesEnabled?: boolean;
}) {
  const t = useTranslations('dashboard.plan');
  const router = useRouter();
  const sending = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function createPlan() {
    if (sending.current) return;
    sending.current = true;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/generate-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase_index: phaseIndex }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.refresh();
    } catch {
      setError(true);
    } finally {
      sending.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="brutalist-border bg-surface-800 p-md text-center space-y-sm">
      <Sparkles className="mx-auto text-primary" size={28} />
      <h2 className="font-headline-md text-headline-md text-on-surface">
        {phaseIndex > 0
          ? t('nextPhaseTitle', { n: phaseIndex, next: phaseIndex + 1 })
          : t('createTitle')}
      </h2>
      <p className="text-on-surface-variant font-body-md">
        {phaseIndex > 0 ? t('nextPhaseBody') : t('createBody')}
      </p>
      {loading ? (
        messagesEnabled ? (
          <GeneratingMessages />
        ) : (
          <div className="space-y-2">
            <p className="font-label-bold text-primary">{t('creating')}</p>
            <p className="text-label-sm text-on-surface-variant">{t('createHint')}</p>
          </div>
        )
      ) : (
        <Button onClick={createPlan} className="uppercase">
          {t('createCta')}
        </Button>
      )}
      {error && <p className="text-error font-body-md">{t('createError')}</p>}
    </div>
  );
}
