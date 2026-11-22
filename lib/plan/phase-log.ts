import type { PlanPhase } from '@/lib/types/plan';

/** Formato que escribe el runner en workout_sessions.log_data (RepEntry). */
export interface PhaseLogEntry {
  exercise: string;
  prescribedSets: number;
  prescribedReps: string;
  actualReps: string[];
}

export interface PhaseLogSession {
  plan_day_index: number;
  rpe: number | null;
  completed_at: string | null;
  log_data: { exerciseLog?: PhaseLogEntry[] } | null;
}

const MAX_CHARS = 1500;

function mean(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function topOfRange(prescribed: string): number | null {
  const nums = (prescribed.match(/\d+/g) ?? []).map(Number);
  return nums.length ? Math.max(...nums) : null;
}

function loggedReps(actual: string[]): number[] {
  return actual.map((r) => Number.parseInt(r, 10)).filter((n) => Number.isFinite(n));
}

export function summarizePhaseLog(phase: PlanPhase, sessions: PhaseLogSession[]): string {
  const trainingDays = phase.week_template.filter((d) => d.session).length * 4;
  const done = sessions.filter((s) => s.completed_at).length;
  const pct = trainingDays ? Math.round((done / trainingDays) * 100) : 0;
  const lines = [`Adherence: ${done}/${trainingDays} training days completed (${pct}%).`];

  const sorted = [...sessions].sort((a, b) => a.plan_day_index - b.plan_day_index);

  const rpes = sorted.map((s) => s.rpe).filter((r): r is number => typeof r === 'number');
  const avgRpe = mean(rpes);
  if (avgRpe != null) {
    let trend = 'stable';
    let detail = '';
    if (rpes.length >= 2) {
      const half = Math.ceil(rpes.length / 2);
      const first = mean(rpes.slice(0, half))!;
      const last = mean(rpes.slice(half))!;
      if (last - first >= 0.5) {
        trend = 'rising';
        detail = ` from ${first.toFixed(1)} to ${last.toFixed(1)}`;
      } else if (first - last >= 0.5) {
        trend = 'falling';
        detail = ` from ${first.toFixed(1)} to ${last.toFixed(1)}`;
      }
    }
    lines.push(`Average RPE: ${avgRpe.toFixed(1)} (${trend}${detail}).`);
  }

  // Ejercicios principales prescritos en la plantilla (sin duplicados).
  const prescribed = new Map<string, string>();
  for (const day of phase.week_template) {
    for (const ex of day.session?.main ?? []) {
      if (!prescribed.has(ex.exercise)) prescribed.set(ex.exercise, ex.reps ?? '');
    }
  }

  const exerciseLines: string[] = [];
  for (const [name, templateReps] of prescribed) {
    // ponytail: primera vs ultima sesion logueada; el log no guarda la semana.
    const entries = sorted.flatMap((s) =>
      (s.log_data?.exerciseLog ?? []).filter((e) => e.exercise === name),
    );
    if (!entries.length) continue;
    const first = entries[0];
    const last = entries[entries.length - 1];
    const reps = last.prescribedReps || templateReps;
    const top = topOfRange(reps);
    const logged = loggedReps(last.actualReps);
    const hits = top == null ? 0 : logged.filter((n) => n >= top).length;
    const verdict =
      top == null
        ? 'No rep range to compare.'
        : hits > logged.length / 2
          ? `The athlete reached the top of the prescribed range in ${hits}/${logged.length} sets.`
          : `The athlete did not reach the top of the prescribed range (${hits}/${logged.length} sets).`;
    exerciseLines.push(
      `- ${name}: prescribed ${reps} reps per set. First log: ${first.actualReps.join(', ')}. Latest log: ${last.actualReps.join(', ')}. ${verdict}`,
    );
  }

  if (exerciseLines.length) {
    lines.push('Main exercises:', ...exerciseLines);
  } else if (sessions.length === 0) {
    lines.push('No completed sessions logged.');
  } else {
    lines.push('No exercise logs recorded.');
  }

  const text = lines.join('\n');
  return text.length <= MAX_CHARS ? text : `${text.slice(0, MAX_CHARS - 1)}…`;
}
