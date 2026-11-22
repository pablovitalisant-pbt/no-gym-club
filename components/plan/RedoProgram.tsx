'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { abandonActivePlan } from '@/app/[locale]/(app)/dashboard/plan-actions';

export default function RedoProgram({
  planId,
  assessmentHref,
}: {
  planId: string;
  assessmentHref: string;
}) {
  const t = useTranslations('dashboard.plan');
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleRedo() {
    setBusy(true);
    setError(false);
    const res = await abandonActivePlan(planId);
    setBusy(false);
    setConfirm(false);
    if (!res.success) {
      setError(true);
      return;
    }
    router.refresh();
  }

  if (!confirm) {
    return (
      <div className="mt-sm flex flex-wrap items-center gap-sm">
        <Link href={assessmentHref} className="text-label-sm underline text-on-surface-variant">
          {t('updateAssessment')}
        </Link>
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          {t('redoProgram')}
        </Button>
      </div>
    );
  }

  return (
    <div className="brutalist-border bg-surface-800 p-md mt-sm space-y-sm text-center">
      <h3 className="font-label-bold text-label-bold uppercase text-on-surface">
        {t('redoConfirmTitle')}
      </h3>
      <p className="text-on-surface-variant font-body-md">{t('redoConfirmBody')}</p>
      <div className="flex flex-wrap justify-center gap-sm">
        <Button variant="ghost" onClick={() => setConfirm(false)} disabled={busy}>
          {t('redoCancel')}
        </Button>
        <Button onClick={handleRedo} disabled={busy}>
          {t('redoConfirmCta')}
        </Button>
      </div>
      {error && <p className="text-error font-body-md">{t('actionError')}</p>}
    </div>
  );
}
