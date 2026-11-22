import type { PlanDay, PlanPhase } from '@/lib/types/plan';
import type { StartLevel } from '@/lib/assessment/level';
import type { PushupVariant } from '@/lib/assessment/validate';

export interface PhaseProfile {
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  training_history: string | null;
  health_limitations: string[] | null;
  limitations_notes: string | null;
  cardio_preference: string | null;
  focus_areas: string[] | null;
  focus_notes: string | null;
  available_days_per_week: number;
  available_equipment: string[] | null;
}

export interface PhaseAssessment {
  pushup_variant?: PushupVariant | null;
  pushup_variant_reps?: number | null;
  dead_hang_seconds?: number | null;
  knee_plank_seconds?: number | null;
  sit_to_stand_30s?: number | null;
  walk_minutes?: number | null;
  max_pushups?: number | null;
  max_pullups?: number | null;
  max_squats?: number | null;
  max_dips?: number | null;
  plank_seconds?: number | null;
}

export interface CorpusDoc {
  title: string;
  content: string;
  category: string;
  similarity: number;
}

export interface PhasePromptInput {
  profile: PhaseProfile;
  assessment: PhaseAssessment | null;
  startLevel: StartLevel;
  phaseIndex: 0 | 1 | 2;
  previousPhase?: PlanPhase;
  previousPhaseLog?: string;
  corpusDocs: CorpusDoc[];
  availableExercises: { name_en: string; category: string; muscle_groups: string[] }[];
}

export interface PhasePrompt {
  system: string;
  user: string;
}

const EXTREME_RULE =
  '- untrained_extreme: prescribe regressions only — wall or incline push-up, chair sit-to-stand, knee plank and walking. 1-2 sets per exercise, no jumps, no burpees, long rest periods (90-120s).';

const STARTING_VARIANT_RULE =
  '- STARTING VARIANT: the main exercise of each movement pattern must start at the variant the athlete achieved in the assessment test, or one easier. pushup_variant wall -> wall push-up; knee -> knee push-up; incline -> incline push-up; floor with fewer than 10 reps -> incline or floor with few reps. In phase 1 never prescribe a harder variant than the tested one.';

// Ejemplo real de PlanDay de entrenamiento (valida contra validatePhase).
export const TRAINING_DAY_EXAMPLE: PlanDay = {
  type: 'full',
  label_es: 'Cuerpo completo',
  label_en: 'Full body',
  session: {
    title_es: 'Cuerpo completo',
    title_en: 'Full body',
    warmup: [
      {
        exercise: 'Wall Push-Up',
        duration_seconds: 45,
        rest_seconds: 15,
        work_seconds: 45,
        notes_es: 'Ritmo suave',
        notes_en: 'Easy pace',
      },
    ],
    main: [
      {
        exercise: 'Chair Sit-to-Stand',
        sets: 3,
        reps: '6-10',
        rpe: 7,
        rest_seconds: 90,
        work_seconds: 40,
        notes_es: 'Sube controlado',
        notes_en: 'Controlled tempo',
      },
    ],
    cooldown: [
      {
        exercise: 'Knee Plank',
        duration_seconds: 30,
        rest_seconds: 0,
        work_seconds: 30,
        notes_es: 'Respira',
        notes_en: 'Breathe',
      },
    ],
    rationale_es: 'Base de empuje y piernas',
    rationale_en: 'Push and legs foundation',
    science_refs: ['overcoming_gravity'],
  },
};

const SCHEMA = `{
  "index": 0,
  "name_es": "...", "name_en": "...",
  "week_template": [
    ${JSON.stringify(TRAINING_DAY_EXAMPLE, null, 2)},
    { "type": "rest", "label_es": "...", "label_en": "...", "session": null }
  ],
  "rationale_es": "...", "rationale_en": "...",
  "science_refs": ["..."],
  "generated_at": "ISO-8601 timestamp"
}`;

const SYSTEM_HEAD = `You are a street workout coach for No Gym Club. You design 4-week training phases (mesocycles) anchored in sport science.

Rules:
- Output ONLY valid JSON. No markdown, no commentary outside the JSON.
- week_template must contain exactly 7 days (7-day template) repeated identically for all 4 weeks of the phase.
- Training days = the athlete's available_days_per_week; every other day must be "rest" with "session": null.
- Use the same exercises for the whole phase. Progression inside the phase is expressed through reps/sets/time in notes_es and notes_en; never swap exercises between weeks.
- Phase 1 (index 0) builds the foundation; phases 2 and 3 progress from the previous phase and its training log.
- Every exercise MUST include work_seconds (circuit mode) and rest_seconds.
- The "exercise" field must be the exact name from AVAILABLE EXERCISES (name_en, case-sensitive, character-by-character), except walking or jogging. Do not translate or invent names.
- Use ONLY the equipment the athlete has available.
- LIMITATIONS — knees: no jumps and no deep squat.
- LIMITATIONS — lower back: no loaded spinal flexion.
- LIMITATIONS — shoulders: no dips and no handstand.
- LIMITATIONS — wrists: use fist or forearm variants.
- Rest days have no cardio; cardio only appears inside a training session.`;

const BASE_SCHEMA_DOC = `\n\n## PlanPhase JSON schema (exact fields)\n${SCHEMA}\n- "session" is an object with warmup/main/cooldown on training days and exactly null on rest days.\n- "generated_at" must be an ISO-8601 timestamp.`;

function cardioRule(pref: string | null): string {
  if ((pref ?? 'none') === 'none') {
    return '- CARDIO: none. Do not include a cardio section on any day.';
  }
  return `- CARDIO: include an optional "cardio" section with ${pref} intensity, never above the athlete's current condition.`;
}

function focusRule(areas: string[] | null): string {
  const list = (areas ?? []).join(', ') || 'none';
  return `- FOCUS AREAS (${list}): give extra volume to these areas while keeping push/pull balance.`;
}

function formatProfile(p: PhaseProfile): string {
  return [
    `- Age: ${p.age ?? 'unknown'}`,
    `- Weight: ${p.weight_kg ?? 'unknown'} kg`,
    `- Height: ${p.height_cm ?? 'unknown'} cm`,
    `- Training history: ${p.training_history ?? 'never'}`,
    `- Limitations: ${(p.health_limitations ?? []).join(', ') || 'none'}`,
    p.limitations_notes ? `- Limitation notes: ${p.limitations_notes}` : '',
    `- Cardio preference: ${p.cardio_preference ?? 'none'}`,
    `- Focus areas: ${(p.focus_areas ?? []).join(', ') || 'balanced'}`,
    p.focus_notes ? `- Focus notes: ${p.focus_notes}` : '',
    `- Days/week: ${p.available_days_per_week}`,
    `- Equipment: ${(p.available_equipment ?? []).join(', ') || 'bodyweight'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatAssessment(a: PhaseAssessment | null): string {
  if (!a) return 'none';
  const lines: string[] = [];
  if (a.pushup_variant) {
    lines.push(
      `- Push-up test: ${a.pushup_variant} variant${
        a.pushup_variant_reps != null ? `, ${a.pushup_variant_reps} reps` : ''
      }`,
    );
  }
  if (a.dead_hang_seconds != null) lines.push(`- Dead hang: ${a.dead_hang_seconds} s`);
  if (a.knee_plank_seconds != null) lines.push(`- Knee plank: ${a.knee_plank_seconds} s`);
  if (a.sit_to_stand_30s != null) {
    lines.push(`- Sit-to-stand (30 s): ${a.sit_to_stand_30s} reps`);
  }
  if (a.walk_minutes != null) lines.push(`- Walk: ${a.walk_minutes} min`);
  if (a.max_pushups != null) lines.push(`- Max push-ups: ${a.max_pushups}`);
  if (a.max_pullups != null) lines.push(`- Max pull-ups: ${a.max_pullups}`);
  if (a.max_squats != null) lines.push(`- Max squats: ${a.max_squats}`);
  if (a.max_dips != null) lines.push(`- Max dips: ${a.max_dips}`);
  if (a.plank_seconds != null) lines.push(`- Plank: ${a.plank_seconds} s`);
  return lines.length ? lines.join('\n') : 'none';
}

function formatCorpus(docs: CorpusDoc[]): string {
  if (!docs.length) return '';
  const sections = docs.map(
    (d) =>
      `### ${d.title} (${d.category}, relevance: ${(d.similarity * 100).toFixed(0)}%)\n${d.content}`,
  );
  return `\n\n## Sport Science Context (use these principles)\n${sections.join('\n\n')}`;
}

function formatExercises(
  exercises: { name_en: string; category: string; muscle_groups: string[] }[],
): string {
  if (!exercises.length) return '';
  const lines = exercises.map(
    (ex) => `- ${ex.name_en} [${ex.category}] (${(ex.muscle_groups || []).join(', ')})`,
  );
  return `\n\n## AVAILABLE EXERCISES (select "exercise" from this list — name_en only)\n${lines.join('\n')}`;
}

export function buildPhasePrompt(input: PhasePromptInput): PhasePrompt {
  const { profile, assessment, startLevel, phaseIndex } = input;

  const system = [
    SYSTEM_HEAD,
    cardioRule(profile.cardio_preference),
    focusRule(profile.focus_areas),
    startLevel === 'untrained_extreme' ? EXTREME_RULE : '',
    STARTING_VARIANT_RULE,
    BASE_SCHEMA_DOC,
  ]
    .filter(Boolean)
    .join('\n');

  const previous = input.previousPhase
    ? `\n\n## Previous Phase (progress from it)\n${JSON.stringify(input.previousPhase)}`
    : '';
  const previousLog = input.previousPhaseLog
    ? `\n\n## Previous Phase Training Log\n${input.previousPhaseLog}\n\n## Progression Rules\n- If the athlete reached the top of the prescribed rep range in most sets, progress to the next harder variant.\n- Otherwise, keep the same variant and increase volume (sets or reps).\n- If adherence is below 50%, repeat the same difficulty.`
    : '';

  const user = `Generate phase ${phaseIndex + 1} of 3 (phase index: ${phaseIndex}) for this athlete:

## Athlete Profile
${formatProfile(profile)}

## Assessment Results
${formatAssessment(assessment)}

## Start Level
${startLevel}${previous}${previousLog}${formatCorpus(input.corpusDocs)}${formatExercises(input.availableExercises)}

## Output Format
Return ONLY the PlanPhase JSON (index ${phaseIndex}), with exactly 7 days in week_template. JSON only.`;

  return { system, user };
}
