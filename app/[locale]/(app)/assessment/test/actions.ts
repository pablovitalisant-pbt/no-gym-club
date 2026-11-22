'use server';

import { createClient } from '@/lib/supabase/server';
import { validateTestResultsV2 } from '@/lib/assessment/validate';
import type { PushupVariant } from '@/lib/assessment/validate';

interface TestResults {
  max_pushups: number;
  max_pullups: number;
  max_squats: number;
  max_dips: number;
  plank_seconds: number;
  notes?: string;
  // v2 (opcionales: el form actual no los manda)
  pushup_variant?: PushupVariant;
  pushup_variant_reps?: number | null;
  dead_hang_seconds?: number | null;
  knee_plank_seconds?: number | null;
  sit_to_stand_30s?: number | null;
  walk_minutes?: number | null;
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

  const hasV2 =
    data.pushup_variant !== undefined ||
    data.pushup_variant_reps !== undefined ||
    data.dead_hang_seconds !== undefined ||
    data.knee_plank_seconds !== undefined ||
    data.sit_to_stand_30s !== undefined ||
    data.walk_minutes !== undefined;

  const v2 = hasV2 ? validateTestResultsV2(data) : null;
  if (v2 && !v2.ok) {
    return { success: false, error: v2.error };
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
      ...(v2?.ok ? v2.value : {}),
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
