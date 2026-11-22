import type { SessionData } from './session';

export type DayType =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full'
  | 'skill'
  | 'cardio'
  | 'metabolic'
  | 'mobility'
  | 'rest';

export interface PlanDay {
  type: DayType;
  label_es: string;
  label_en: string;
  /** null solo si type === 'rest'. */
  session: SessionData | null;
}

export interface PlanPhase {
  index: 0 | 1 | 2;
  name_es: string;
  name_en: string;
  /** Plantilla semanal de exactamente 7 dias; se repite 4 veces por fase. */
  week_template: PlanDay[];
  rationale_es: string;
  rationale_en: string;
  science_refs: string[];
  generated_at: string;
}

export interface PlanData {
  version: 2;
  total_weeks: 12;
  phase_weeks: 4;
  /** Se agregan a medida que se generan (1 a 3). */
  phases: PlanPhase[];
}

/** Fila de training_plans tal como la consume el dashboard. */
export interface PlanRow {
  id: string;
  plan_data: PlanData;
  current_day_index: number;
  completed_day_indexes: number[];
}
