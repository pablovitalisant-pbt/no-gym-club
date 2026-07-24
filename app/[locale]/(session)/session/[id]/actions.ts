'use server';

import { createClient } from '@/lib/supabase/server';

export interface RestTimeEntry {
  exerciseIndex: number;
  exercise: string;
  prescribedRest: number;
  actualRest: number;
}

export interface RepEntry {
  exercise: string;
  prescribedSets: number;
  prescribedReps: string;
  actualReps: string[];
  bilateral?: boolean;
}

async function mergeLogData(
  sessionId: string,
  userId: string,
  updates: Record<string, unknown>,
) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('log_data')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  const existingLog =
    (existing?.log_data as Record<string, unknown>) || {};
  const merged = { ...existingLog, ...updates };

  const { error } = await supabase
    .from('workout_sessions')
    .update({ log_data: merged })
    .eq('id', sessionId)
    .eq('user_id', userId);

  return error;
}

export async function saveSessionTimes(
  sessionId: string,
  times: RestTimeEntry[],
  repEntries?: RepEntry[],
) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const updates: Record<string, unknown> = {
    actualRestTimes: times,
  };
  if (repEntries && repEntries.length > 0) {
    updates.exerciseLog = repEntries;
  }

  const error = await mergeLogData(sessionId, user.id, updates);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveExerciseReps(
  sessionId: string,
  reps: RepEntry[],
) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const error = await mergeLogData(sessionId, user.id, {
    exerciseLog: reps,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
