'use server';

import { createClient } from '@/lib/supabase/server';
import { type Database } from '@/lib/supabase/types';
import { validateProfileV2, profileRangeError } from '@/lib/assessment/validate';
import { normalizeDisplayName } from '@/lib/settings/validate';
import type {
  CardioPreference,
  FocusArea,
  HealthLimitation,
  TrainingHistory,
} from '@/lib/assessment/validate';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

interface ProfileData {
  age: number;
  weight_kg: number;
  height_cm: number;
  experience_level: string;
  primary_goal: string;
  available_days_per_week: number;
  available_equipment: string[];
  par_q_cleared: boolean;
  // v2 (opcionales: el form actual no los manda)
  training_history?: TrainingHistory | null;
  health_limitations?: HealthLimitation[];
  limitations_notes?: string | null;
  cardio_preference?: CardioPreference | null;
  timezone?: string | null;
  focus_areas?: FocusArea[];
  focus_notes?: string | null;
  display_name?: string | null;
}

export async function saveProfile(data: ProfileData) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // validar campos requeridos
  if (!data.age || !data.weight_kg || !data.height_cm) {
    return { success: false, error: 'Missing required fields' };
  }

  const outOfRange = profileRangeError({
    age: data.age,
    weight_kg: data.weight_kg,
    height_cm: data.height_cm,
  });
  if (outOfRange) {
    return { success: false, error: `${outOfRange} out of range` };
  }

  const v2 = validateProfileV2(data);
  if (!v2.ok) {
    return { success: false, error: v2.error };
  }

  const displayName = normalizeDisplayName(data.display_name);
  if (!displayName.ok) {
    return { success: false, error: 'display_name too long' };
  }

  const hasV2 =
    data.training_history !== undefined ||
    data.health_limitations !== undefined ||
    data.limitations_notes !== undefined ||
    data.cardio_preference !== undefined ||
    data.timezone !== undefined ||
    data.focus_areas !== undefined ||
    data.focus_notes !== undefined;

  const profile: ProfileInsert = {
    id: user.id,
    age: data.age,
    weight_kg: data.weight_kg,
    height_cm: data.height_cm,
    experience_level: data.experience_level as ProfileInsert['experience_level'],
    primary_goal: data.primary_goal as ProfileInsert['primary_goal'],
    available_days_per_week: data.available_days_per_week,
    available_equipment: data.available_equipment,
    par_q_cleared: data.par_q_cleared,
    par_q_answered_at: new Date().toISOString(),
    // no pisar datos v2 existentes cuando el form legado no los manda
    ...(hasV2 ? v2.value : {}),
    ...(data.display_name !== undefined ? { display_name: displayName.value } : {}),
  };

  const { error: insertError } = await supabase
    .from('profiles')
    .upsert(profile);

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, par_q_cleared: data.par_q_cleared };
}
