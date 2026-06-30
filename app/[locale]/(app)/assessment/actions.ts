'use server';

import { createClient } from '@/lib/supabase/server';
import { type Database } from '@/lib/supabase/types';

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
  };

  const { error: insertError } = await supabase
    .from('profiles')
    .upsert(profile);

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, par_q_cleared: data.par_q_cleared };
}
