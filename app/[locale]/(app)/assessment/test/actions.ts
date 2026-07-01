'use server';

import { createClient } from '@/lib/supabase/server';

interface TestResults {
  max_pushups: number;
  max_pullups: number;
  max_squats: number;
  max_dips: number;
  plank_seconds: number;
  notes?: string;
}

export async function saveTestResults(data: TestResults) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error: insertError } = await supabase
    .from('assessment_results')
    .insert({
      user_id: user.id,
      max_pushups: data.max_pushups,
      max_pullups: data.max_pullups,
      max_squats: data.max_squats,
      max_dips: data.max_dips,
      plank_seconds: data.plank_seconds,
      notes: data.notes || null,
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // marcar assessment como completado
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ assessment_completed: true })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
