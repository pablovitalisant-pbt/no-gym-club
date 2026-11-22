'use server';

import { createClient } from '@/lib/supabase/server';
import { completeDay, getPlanDay, TOTAL_DAYS } from '@/lib/plan/plan';
import type { PlanData } from '@/lib/types/plan';

type PlanStateRow = {
  current_day_index: number;
  completed_day_indexes: number[] | null;
  plan_data?: PlanData;
};

async function loadOwnPlan(planId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('training_plans')
    .select('current_day_index, completed_day_indexes, plan_data')
    .eq('id', planId)
    .eq('user_id', userId)
    .eq('is_active', true)
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

export async function startPlanSession(planId: string, dayIndex: number) {
  if (!validIndex(dayIndex)) return { success: false as const, error: 'Invalid day index' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Unauthorized' };

  const { data: plan, error: loadError } = await loadOwnPlan(planId, user.id);
  if (loadError || !plan?.plan_data) return { success: false as const, error: 'Plan not found' };

  const day = getPlanDay(plan.plan_data, dayIndex);
  if (!day?.session) return { success: false as const, error: 'Day has no session' };

  const { data: open } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .eq('plan_day_index', dayIndex)
    .is('completed_at', null)
    .maybeSingle();
  if (open) return { success: true as const, sessionId: open.id as string };

  const { data: inserted, error: insertError } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      plan_id: planId,
      plan_day_index: dayIndex,
      scheduled_date: new Date().toISOString().slice(0, 10),
      session_data: day.session,
    })
    .select('id')
    .single();
  if (insertError || !inserted) {
    return { success: false as const, error: insertError?.message ?? 'Insert failed' };
  }

  return { success: true as const, sessionId: inserted.id as string };
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
