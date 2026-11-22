import type { PlanData, PlanDay } from '../types/plan';
import { dayInfo, getPlanDay } from './plan';

export interface PlanDayView {
  week: number;
  /** 1-7 para mostrar en el encabezado. */
  dayNumber: number;
  phaseIndex: number;
  phaseName: string | null;
  /** null cuando la fase de ese dia todavia no fue generada. */
  day: PlanDay | null;
  isRest: boolean;
}

export function planDayView(
  plan: PlanData,
  idx: number,
  locale: string,
): PlanDayView {
  const { week, weekday, phaseIndex } = dayInfo(idx);
  const phase = plan.phases[phaseIndex];
  const day = getPlanDay(plan, idx);
  return {
    week,
    dayNumber: weekday + 1,
    phaseIndex,
    phaseName: phase
      ? locale === 'en'
        ? phase.name_en
        : phase.name_es
      : null,
    day,
    isRest: day?.type === 'rest',
  };
}
