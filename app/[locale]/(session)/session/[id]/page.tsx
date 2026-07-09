import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import SessionRunner from './session-runner';
import type { SessionData } from '@/lib/types/session';

export default async function SessionPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const showRunner = getFlag('session_runner');

  if (!showRunner) {
    const t = await getTranslations({ locale: 'es', namespace: 'session' });
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-400 text-sm">Unauthorized</p>
      </div>
    );
  }

  const { data: session, error } = await supabase
    .from('workout_sessions')
    .select('id, session_data')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !session) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-400 text-sm">
          Session not found
        </p>
      </div>
    );
  }

  return (
    <SessionRunner
      sessionId={session.id}
      session={session.session_data as unknown as SessionData}
    />
  );
}
