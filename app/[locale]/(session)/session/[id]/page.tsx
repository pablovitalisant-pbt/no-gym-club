import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import { resolveExerciseGif } from '@/lib/exercises/resolve-media';
import SessionRunner from './session-runner';
import type { SessionData, SessionExercise } from '@/lib/types/session';

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

  // Enrich exercises with GIFs from catalog
  const { data: catalog } = await supabase
    .from('exercises')
    .select('name_es, gif_url')
    .not('gif_url', 'is', null);

  const sessionData = session.session_data as unknown as SessionData;

  function enrich(exercises: SessionExercise[]): SessionExercise[] {
    return exercises.map((ex) => ({
      ...ex,
      gif_url: catalog ? resolveExerciseGif(ex.exercise, catalog) : null,
    }));
  }

  return (
    <SessionRunner
      sessionId={session.id}
      session={{
        ...sessionData,
        warmup: enrich(sessionData.warmup),
        main: enrich(sessionData.main),
        cooldown: enrich(sessionData.cooldown),
      }}
    />
  );
}
