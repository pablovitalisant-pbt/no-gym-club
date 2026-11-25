'use client';

import { useTranslations } from 'next-intl';
import LogForm from '@/components/session/LogForm';
import { greetingText } from '@/lib/settings/greeting';
import type { SessionData } from '@/lib/types/session';

export default function RunnerDoneScreen({
  displayName,
  sessionId,
  session,
  onSaved,
}: {
  displayName: string | null;
  sessionId: string;
  session: SessionData;
  onSaved: (value: number) => void;
}) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center px-margin-mobile py-8 space-y-6">
      <p className="text-2xl font-bold break-words text-on-surface">
        {greetingText(t.raw('completeGreeting'), displayName) ?? t('complete')}
      </p>
      <LogForm sessionId={sessionId} session={session} onSaved={onSaved} />
    </div>
  );
}
