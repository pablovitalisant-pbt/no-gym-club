import type { PlanData } from '../types/plan';
import { dayInfo, TOTAL_DAYS } from './plan';

const DAYS_PER_PHASE = 28;

export interface CalendarCell {
  idx: number;
  week: number;
  weekday: number;
  dayInPhase: number;
  completed: boolean;
  current: boolean;
  rest: boolean;
  disabled: boolean;
}

export interface CalendarBlock {
  phaseIndex: number;
  name: string | null;
  generated: boolean;
  cells: CalendarCell[];
}

export function buildCalendar(
  plan: PlanData,
  currentIdx: number,
  completed: number[],
  locale: string,
): CalendarBlock[] {
  return [0, 1, 2].map((phaseIndex) => {
    const phase = plan.phases[phaseIndex];
    const generated = Boolean(phase);
    const cells: CalendarCell[] = Array.from({ length: DAYS_PER_PHASE }, (_, i) => {
      const idx = phaseIndex * DAYS_PER_PHASE + i;
      const { week, weekday, dayInPhase } = dayInfo(idx);
      const day = generated ? phase.week_template[weekday] : null;
      return {
        idx,
        week,
        weekday,
        dayInPhase,
        completed: generated && completed.includes(idx),
        current: generated && idx === currentIdx,
        rest: day?.type === 'rest',
        disabled: !generated,
      };
    });
    return {
      phaseIndex,
      name: phase ? (locale === 'en' ? phase.name_en : phase.name_es) : null,
      generated,
      cells,
    };
  });
}

/** Lee ?day=N; null si falta, no es entero o cae fuera del rango 0..TOTAL_DAYS-1. */
export function parseDayParam(raw: string | undefined | null): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < TOTAL_DAYS ? n : null;
}
