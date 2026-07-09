export interface DayMarker {
  day: string;
  label: string;
  trained: boolean;
  isFuture: boolean;
}

const MARKER_FIELDS = [
  'max_pushups', 'max_pullups', 'max_squats', 'max_dips', 'plank_seconds',
] as const;

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Monday of a week N weeks ago (0 = current week).
 * Moved from weekly-report/page.tsx into shared helper.
 */
export function getWeekStart(daysAgo = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) - daysAgo * 7;
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Build 7 day-markers (Mon–Sun). Days still-to-come in the current week
 * are marked isFuture=true. Completed past weeks show no future days.
 * Timezone note: uses local timezone (app-wide limitation, not introduced here).
 */
export function getWeeklyDayMarkers(
  sessions: Array<{ completed_at: string }>,
  weekStart: Date,
  today: Date,
): DayMarker[] {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekContainsToday = today >= weekStart && today < weekEnd;

  return DAY_NAMES.map((name, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);

    const dayStr = day.toISOString().split('T')[0];
    const trained = sessions.some((s) => s.completed_at?.split('T')[0] === dayStr);
    const isFuture = weekContainsToday && day > today;

    return { day: name, label: DAY_LABELS[i], trained, isFuture };
  });
}

/**
 * Compute % change in days-trained between two weeks.
 * Returns null when there's no previous week data (division-by-zero guard).
 */
export function computeConsistencyDelta(
  thisWeekDays: number,
  prevWeekDays: number,
): { delta: number; direction: 'up' | 'down' | 'flat'; label: string } | null {
  if (prevWeekDays <= 0) return null;

  const delta = Math.round(((thisWeekDays - prevWeekDays) / prevWeekDays) * 100);
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const sign = delta > 0 ? '+' : '';
  return { delta, direction, label: `${sign}${delta}%` };
}

/**
 * Count how many of the 5 assessment markers improved / declined / stayed.
 * null fields are treated as 0 (not-yet-recorded).
 */
export function countImprovedMarkers(
  curr: Record<string, unknown>,
  prev: Record<string, unknown>,
): { improved: number; declined: number; unchanged: number; total: number } {
  let improved = 0; let declined = 0; let unchanged = 0;

  for (const field of MARKER_FIELDS) {
    const c = (curr[field] as number) ?? 0;
    const p = (prev[field] as number) ?? 0;
    if (c > p) improved++;
    else if (c < p) declined++;
    else unchanged++;
  }

  return { improved, declined, unchanged, total: MARKER_FIELDS.length };
}

/** Count total sets from a session's `main` block. */
export function countSets(sessionData: Record<string, unknown>): number {
  const main = (sessionData?.main as Array<{ sets?: number }>) || [];
  return main.reduce((sum, ex) => sum + (ex.sets || 0), 0);
}

/** Map exercise names to muscle-group categories via keyword matching. */
export function getMuscleGroups(sessionData: Record<string, unknown>): string[] {
  const main = (sessionData?.main as Array<{ exercise?: string }>) || [];
  const map: Record<string, string> = {
    push: 'push', press: 'push', dip: 'push',
    pull: 'pull', row: 'pull', chin: 'pull',
    squat: 'legs', lunge: 'legs', leg: 'legs',
    plank: 'core', crunch: 'core', sit: 'core', core: 'core',
    jack: 'cardio', run: 'cardio', cardio: 'cardio',
    stretch: 'mobility', mobility: 'mobility',
  };
  return main
    .map((ex) => {
      const name = (ex.exercise || '').toLowerCase();
      for (const [kw, g] of Object.entries(map)) {
        if (name.includes(kw)) return g;
      }
      return 'other';
    })
    .filter((g) => g !== 'other');
}
