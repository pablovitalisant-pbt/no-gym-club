import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import { resolveExerciseGif } from '@/lib/exercises/resolve-media';
import SessionRunner from './session-runner';
import SessionDoneScreen from '@/components/session/SessionDoneScreen';
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
    .select('id, session_data, completed_at, rpe, plan_day_index')
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
    .select('name_en, gif_url')
    .not('gif_url', 'is', null);

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  const sessionData = session.session_data as unknown as SessionData;

  function enrich(exercises: SessionExercise[]): SessionExercise[] {
    return exercises.map((ex) => ({
      ...ex,
      gif_url: catalog ? resolveExerciseGif(ex.exercise, catalog) : null,
    }));
  }

  const enriched: SessionData = {
    ...sessionData,
    warmup: enrich(sessionData.warmup),
    main: enrich(sessionData.main),
    finisher: sessionData.finisher ? enrich(sessionData.finisher) : undefined,
    cardio: sessionData.cardio ? enrich(sessionData.cardio) : undefined,
    cooldown: enrich(sessionData.cooldown),
  };

  if (getFlag('session_done_screen') && session.completed_at != null) {
    return (
      <SessionDoneScreen
        session={enriched}
        rpe={session.rpe ?? null}
        planDayIndex={session.plan_day_index ?? null}
      />
    );
  }

  return (
    <SessionRunner
      sessionId={session.id}
      continuousEnabled={getFlag('continuous_session_mode')}
      displayName={profile?.display_name ?? null}
      planDayIndex={session.plan_day_index ?? null}
      serverRow={{ completed_at: session.completed_at ?? null, rpe: session.rpe ?? null }}
      session={enriched}
    />
  );
}
