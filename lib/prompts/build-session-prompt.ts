import type { Database } from '@/lib/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface CorpusDoc {
  title: string;
  content: string;
  category: string;
  similarity: number;
}

export interface PreviousSession {
  rpe: number | null;
  completedAt: string;
  daysSinceLast: number;
  mainExercises: string[];
}

export interface SessionPrompt {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = `You are a street workout coach for No Gym Club. Your philosophy: discipline over motivation, the street is your gym, progress is brutal and silent.

You generate training sessions anchored in sport science. Rules:
- Output ONLY valid JSON. No markdown, no commentary outside the JSON.
- Every text field must have both "_es" (Spanish) and "_en" (English) variants.
- Use ONLY the equipment the user has available (bodyweight, bar, ground, wall, dumbbell).
- Respect the user's experience level. Beginners get regressions, advanced get progressions.
- RPE targets must be realistic (6-8 for working sets, 8-9 for top sets).
- Rest periods: 60-180s for strength, 30-90s for hypertrophy/endurance.
- Warmup: 3-5 mobility/dynamic exercises. Cooldown: 2-3 static stretches.
- "science_refs" lists the sport science categories that support this session design.
- If the user's goal is general_fitness, balance push/pull/legs/core. If hypertrophy, bias volume. If endurance, bias circuit-style. If master_skills, include skill practice blocks.
- ADAPTATION: if previous session data is provided, rotate muscle groups away from what was trained. Adjust volume: previous RPE ≥ 8 → reduce volume 10-20% (under-recovered). Previous RPE ≤ 5 → increase volume 10-20% (under-stimulated). Days since last > 3 → include re-adaptation phase with reduced intensity. Days since last = 1 → normal progression.`;

function formatCorpusContext(docs: CorpusDoc[]): string {
  if (!docs.length) return '';

  const sections = docs.map(
    (d) => `### ${d.title} (${d.category}, relevance: ${(d.similarity * 100).toFixed(0)}%)
${d.content}`,
  );

  return `\n\n## Sport Science Context (use these principles to design the session)\n${sections.join('\n\n')}`;
}

function formatProfile(profile: ProfileRow): string {
  const parts: string[] = [
    `- Age: ${profile.age}`,
    `- Weight: ${profile.weight_kg} kg`,
    `- Height: ${profile.height_cm} cm`,
    `- Experience: ${profile.experience_level}`,
    `- Goal: ${profile.primary_goal}`,
    `- Days/week: ${profile.available_days_per_week}`,
    `- Equipment: ${(profile.available_equipment || []).join(', ')}`,
  ];
  return parts.join('\n');
}

function formatPreviousSession(prev: PreviousSession): string {
  const rpeText = prev.rpe != null ? `${prev.rpe}/10` : 'not recorded';
  const exerciseList =
    prev.mainExercises.length > 0
      ? prev.mainExercises.join(', ')
      : 'unknown';

  return `## Previous Session Summary
- Completed: ${prev.daysSinceLast} day(s) ago
- Overall RPE: ${rpeText}
- Main exercises performed: ${exerciseList}

Adapt today's session based on this history:
- Rotate to muscle groups NOT trained in the previous session.
- If previous RPE ≥ 8: reduce volume 10-20% (under-recovered).
- If previous RPE ≤ 5: increase volume 10-20% (under-stimulated).
- If days since last > 3: include re-adaptation, reduce intensity.
- If days since last = 1: normal progression, slight overload.`;
}

export function buildSessionPrompt(
  profile: ProfileRow,
  corpusDocs: CorpusDoc[],
  prevSession?: PreviousSession,
): SessionPrompt {
  const profileText = formatProfile(profile);
  const corpusText = formatCorpusContext(corpusDocs);
  const prevText = prevSession ? formatPreviousSession(prevSession) : '';

  const user = `Generate today's training session for this athlete:

## Athlete Profile
${profileText}
${prevText}${corpusText}

## Output Format
{
  "title_es": "...",
  "title_en": "...",
  "warmup": [{ "exercise": "...", "duration_seconds": 60, "notes_es": "...", "notes_en": "..." }],
  "main": [{ "exercise": "...", "sets": 3, "reps": "8-12", "rpe": 7, "rest_seconds": 90, "notes_es": "...", "notes_en": "..." }],
  "cooldown": [{ "exercise": "...", "duration_seconds": 30, "notes_es": "...", "notes_en": "..." }],
  "rationale_es": "...",
  "rationale_en": "...",
  "science_refs": ["category_1", "category_2"]
}

Generate the session now. JSON only.`;

  return { system: SYSTEM_PROMPT, user };
}
