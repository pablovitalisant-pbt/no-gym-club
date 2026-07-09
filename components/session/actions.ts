'use server';

import { createClient } from '@/lib/supabase/server';

export async function saveSessionLog(
  sessionId: string,
  rpe: number,
  notes?: string,
) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!sessionId) {
    return { success: false, error: 'Missing session ID' };
  }

  if (rpe < 1 || rpe > 10 || !Number.isInteger(rpe)) {
    return { success: false, error: 'RPE must be an integer between 1 and 10' };
  }

  const { error: updateError } = await supabase
    .from('workout_sessions')
    .update({
      rpe,
      notes: notes || null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
