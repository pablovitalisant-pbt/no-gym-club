'use server';

import { createClient } from '@/lib/supabase/server';
import { completeDay, TOTAL_DAYS } from '@/lib/plan/plan';

type PlanStateRow = {
  current_day_index: number;
  completed_day_indexes: number[] | null;
};

async function loadOwnPlan(planId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('training_plans')
    .select('current_day_index, completed_day_indexes')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle();
  return { supabase, data: data as PlanStateRow | null, error };
}

function validIndex(idx: number): boolean {
  return Number.isInteger(idx) && idx >= 0 && idx < TOTAL_DAYS;
}

export async function completePlanDay(planId: string, dayIndex: number) {
  if (!validIndex(dayIndex)) return { success: false as const, error: 'Invalid day index' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Unauthorized' };

  const { data: plan, error: loadError } = await loadOwnPlan(planId, user.id);
  if (loadError || !plan) return { success: false as const, error: 'Plan not found' };

  const next = completeDay(
    {
      current_day_index: plan.current_day_index,
      completed_day_indexes: plan.completed_day_indexes ?? [],
    },
    dayIndex,
  );
  const { error } = await supabase
    .from('training_plans')
    .update({
      current_day_index: next.current_day_index,
      completed_day_indexes: next.completed_day_indexes,
    })
    .eq('id', planId)
    .eq('user_id', user.id);
  if (error) return { success: false as const, error: error.message };

  return { success: true as const, ...next };
}

export async function setCurrentPlanDay(planId: string, dayIndex: number) {
  if (!validIndex(dayIndex)) return { success: false as const, error: 'Invalid day index' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Unauthorized' };

  const { data: plan, error: loadError } = await loadOwnPlan(planId, user.id);
  if (loadError || !plan) return { success: false as const, error: 'Plan not found' };

  const { error } = await supabase
    .from('training_plans')
    .update({ current_day_index: dayIndex })
    .eq('id', planId)
    .eq('user_id', user.id);
  if (error) return { success: false as const, error: error.message };

  return { success: true as const, current_day_index: dayIndex };
}
