'use server';

import { createClient } from '@/lib/supabase/server';

export interface ExerciseLogEntry {
  exercise: string;
  prescribedSets: number;
  prescribedReps: string;
  actualReps: string;
}

export async function saveSessionLog(
  sessionId: string,
  rpe: number,
  notes?: string,
  exerciseLog?: ExerciseLogEntry[],
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

  // Merge exerciseLog with existing log_data (preserves actualRestTimes)
  let mergedLog: Record<string, unknown> | null = null;

  if (exerciseLog && exerciseLog.length > 0) {
    const { data: existing } = await supabase
      .from('workout_sessions')
      .select('log_data')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    const existingLog =
      (existing?.log_data as Record<string, unknown>) || {};
    mergedLog = { ...existingLog, exerciseLog };
  }

  const updatePayload: Record<string, unknown> = {
    rpe,
    notes: notes || null,
    completed_at: new Date().toISOString(),
  };

  if (mergedLog) {
    updatePayload.log_data = mergedLog;
  }

  const { error: updateError } = await supabase
    .from('workout_sessions')
    .update(updatePayload)
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
