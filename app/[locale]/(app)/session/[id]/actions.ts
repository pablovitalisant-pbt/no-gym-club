'use server';

import { createClient } from '@/lib/supabase/server';

export interface RestTimeEntry {
  exerciseIndex: number;
  exercise: string;
  prescribedRest: number;
  actualRest: number;
}

export async function saveSessionTimes(
  sessionId: string,
  times: RestTimeEntry[],
) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error: updateError } = await supabase
    .from('workout_sessions')
    .update({
      log_data: { actualRestTimes: times },
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
