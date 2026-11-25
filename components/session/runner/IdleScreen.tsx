'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import { startOptions } from '@/lib/session/continuous-view';
import type { SessionData } from '@/lib/types/session';

export default function IdleScreen({
  locale,
  session,
  exerciseCount,
  continuousEnabled,
  onStart,
}: {
  locale: string;
  session: SessionData;
  exerciseCount: number;
  continuousEnabled: boolean;
  onStart: (option: ReturnType<typeof startOptions>[number]) => void;
}) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col">
      <div className="px-margin-mobile pt-4">
        <BackButton
          fallbackHref={`/${locale}/dashboard`}
          className="inline-flex items-center min-h-[44px] text-base font-bold text-on-surface"
        >
          ← {t('backToPanel')}
        </BackButton>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile pb-16 space-y-6">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase">
          {session.title_es}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {exerciseCount} {t('exercise')}s · {t('warmup')} ({session.warmup.length}) ·{' '}
          {t('main')} ({session.main.length}) · {t('cooldown')} ({session.cooldown.length})
        </p>
        {startOptions(continuousEnabled).map((option) => (
          <Button
            key={option}
            onClick={() => onStart(option)}
            className="w-full max-w-xs !py-4 !text-body-md uppercase"
          >
            {t(
              option === 'continuous'
                ? 'continuousStart'
                : continuousEnabled
                  ? 'stepByStep'
                  : 'start',
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
