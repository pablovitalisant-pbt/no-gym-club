import type { PlanData, PlanDay } from '../types/plan';

export const TOTAL_DAYS = 84;
const DAYS_PER_WEEK = 7;
const DAYS_PER_PHASE = 28;

export interface DayInfo {
  /** 1-12 */
  week: number;
  /** 0-6 */
  weekday: number;
  /** 0-2 */
  phaseIndex: number;
  /** 0-27 */
  dayInPhase: number;
}

export interface PlanState {
  current_day_index: number;
  completed_day_indexes: number[];
}

export function dayInfo(idx: number): DayInfo {
  return {
    week: Math.floor(idx / DAYS_PER_WEEK) + 1,
    weekday: idx % DAYS_PER_WEEK,
    phaseIndex: Math.floor(idx / DAYS_PER_PHASE),
    dayInPhase: idx % DAYS_PER_PHASE,
  };
}

export function getPlanDay(plan: PlanData, idx: number): PlanDay | null {
  if (!Number.isInteger(idx) || idx < 0 || idx >= TOTAL_DAYS) return null;
  const { phaseIndex, weekday } = dayInfo(idx);
  return plan.phases[phaseIndex]?.week_template[weekday] ?? null;
}

export function completeDay(state: PlanState, idx: number): PlanState {
  const completed = Array.from(new Set([...state.completed_day_indexes, idx])).sort((a, b) => a - b);
  return {
    current_day_index: Math.min(idx + 1, TOTAL_DAYS - 1),
    completed_day_indexes: completed,
  };
}

export function isPhaseEnd(idx: number): boolean {
  return idx === 27 || idx === 55 || idx === 83;
}

export function needsNextPhase(plan: PlanData, state: PlanState): boolean {
  const idx = state.current_day_index;
  if (idx < 0 || idx >= TOTAL_DAYS) return false;
  return plan.phases.length <= dayInfo(idx).phaseIndex;
}
