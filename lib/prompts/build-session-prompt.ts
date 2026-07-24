import type { Database } from '@/lib/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface CorpusDoc {
  title: string;
  content: string;
  category: string;
  similarity: number;
}

export interface SessionHistory {
  sessions: {
    rpe: number | null;
    completedAt: string;
    mainExercises: string[];
  }[];
  averageRpe: number | null;
  rpeTrend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  sessionsThisWeek: number;
  lastSessionDaysAgo: number;
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
- Warmup: 3-5 mobility/dynamic exercises. Assign rest_seconds to warmup exercises too, calibrated to age and experience (beginners 30-60s, intermediate 15-30s, advanced 0-15s). Cooldown: 2-3 static stretches.
- "science_refs" lists the sport science categories that support this session design.
- If the user's goal is general_fitness, balance push/pull/legs/core. If hypertrophy, bias volume. If endurance, bias circuit-style. If master_skills, include skill practice blocks.
- ADAPTATION: if training history is provided, use trends to adjust. RPE trending up ≥2 points over last 3 sessions → reduce volume 15-25% (accumulated fatigue). RPE trending down → increase volume progressively. Fewer than 2 sessions this week → prioritize full-body, moderate intensity. Rotate muscle groups away from last 2 sessions.
- BILATERAL EXERCISES: exercises that work one limb at a time (arm circles, leg swings, unilateral arm/leg work) MUST have "bilateral": true. For bilateral exercises, duration_seconds and sets represent the value PER SIDE, not total. Example: 30s arm circles bilateral = 30s side 1 + 30s side 2 = 60s real work. 3 sets bilateral = 3 sets per side (6 total). Non-bilateral exercises omit this field or set it to false.`;

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

function formatSessionHistory(history: SessionHistory): string {
  const rpeValues = history.sessions
    .filter((s) => s.rpe != null)
    .map((s) => s.rpe!)
    .slice(0, 3)
    .join(', ');

  const recentMuscles = new Set<string>();
  history.sessions.slice(0, 2).forEach((s) => {
    s.mainExercises.forEach((ex) => recentMuscles.add(ex));
  });

  return `## Training History (last ${history.sessions.length} sessions)
- Completed sessions in history: ${history.sessions.length}
- Sessions this week: ${history.sessionsThisWeek}
- Average RPE: ${history.averageRpe != null ? history.averageRpe.toFixed(1) : 'N/A'}
- RPE trend: ${history.rpeTrend}${rpeValues ? ` (${rpeValues})` : ''}
- Days since last session: ${history.lastSessionDaysAgo}
- Recent exercises: ${[...recentMuscles].join(', ') || 'none'}

Adapt today's session considering:
- If RPE trend is "increasing" with ≥2 point rise: reduce volume 15-25%.
- If RPE trend is "decreasing": progressive overload is working, continue.
- If sessionsThisWeek < 2: full-body session, moderate intensity (re-adaptation).
- Rotate away from muscle groups targeted by recent exercises listed above.`;
}

export function buildSessionPrompt(
  profile: ProfileRow,
  corpusDocs: CorpusDoc[],
  sessionHistory?: SessionHistory,
): SessionPrompt {
  const profileText = formatProfile(profile);
  const corpusText = formatCorpusContext(corpusDocs);
  const historyText = sessionHistory
    ? formatSessionHistory(sessionHistory)
    : '';

  const user = `Generate today's training session for this athlete:

## Athlete Profile
${profileText}
${historyText}${corpusText}

## Output Format
{
  "title_es": "...",
  "title_en": "...",
  "warmup": [{ "exercise": "...", "duration_seconds": 60, "rest_seconds": 30, "bilateral": false, "notes_es": "...", "notes_en": "..." }],
  "main": [{ "exercise": "...", "sets": 3, "reps": "8-12", "rpe": 7, "rest_seconds": 90, "bilateral": false, "notes_es": "...", "notes_en": "..." }],
  "cooldown": [{ "exercise": "...", "duration_seconds": 30, "bilateral": false, "notes_es": "...", "notes_en": "..." }],
  "rationale_es": "...",
  "rationale_en": "...",
  "science_refs": ["category_1", "category_2"]
}

Generate the session now. JSON only.`;

  return { system: SYSTEM_PROMPT, user };
}
