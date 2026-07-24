export interface SessionExercise {
  exercise: string;
  duration_seconds?: number;
  sets?: number;
  reps?: string;
  rpe?: number;
  rest_seconds?: number;
  notes_es?: string;
  notes_en?: string;
  bilateral?: boolean;
  gif_url?: string | null;
}

export interface SessionData {
  title_es: string;
  title_en: string;
  warmup: SessionExercise[];
  main: SessionExercise[];
  cooldown: SessionExercise[];
  rationale_es: string;
  rationale_en: string;
  science_refs: string[];
}
