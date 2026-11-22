import { describe, it, expect, vi, beforeEach } from 'vitest';

// El enriquecimiento con logs esta detras del flag (false por defecto).
process.env.FEATURE_PHASE_GENERATION_EVIDENCE_ADJUSTMENT = 'true';

const h = vi.hoisted(() => ({
  user: { id: 'user-1' },
  plan: null as Record<string, unknown> | null,
  sessions: [] as Record<string, unknown>[],
  sessionFilters: [] as [string, unknown][],
  deepseekCalls: [] as { messages: { role: string; content: string }[] }[],
  deepseekResponses: [] as string[],
}));

vi.mock('@/lib/supabase/server', () => {
  const chain = (resolve: () => unknown) => {
    const p: Record<string, unknown> = {
      select: () => p,
      eq: (col: string, val: unknown) => {
        h.sessionFilters.push([col, val]);
        return p;
      },
      not: () => p,
      gte: (col: string, val: unknown) => {
        h.sessionFilters.push([`gte:${col}`, val]);
        return p;
      },
      lte: (col: string, val: unknown) => {
        h.sessionFilters.push([`lte:${col}`, val]);
        return p;
      },
      order: () => p,
      limit: () => p,
      overlaps: () => p,
      single: () => Promise.resolve(resolve()),
      maybeSingle: () => Promise.resolve(resolve()),
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(resolve()).then(res, rej),
    };
    return p;
  };

  return {
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: h.user }, error: null }) },
      from: (table: string) => {
        if (table === 'profiles') return chain(() => ({ data: profile(), error: null }));
        if (table === 'assessment_results') return chain(() => ({ data: null, error: null }));
        if (table === 'training_plans') {
          const p = chain(() => ({ data: h.plan, error: null })) as Record<string, unknown>;
          p.insert = (row: Record<string, unknown>) =>
            chain(() => ({ data: { id: 'plan-1', ...row }, error: null }));
          p.update = () => chain(() => ({ data: null, error: null }));
          return p;
        }
        if (table === 'workout_sessions') return chain(() => ({ data: h.sessions, error: null }));
        return chain(() => ({ data: null, error: null }));
      },
      rpc: async () => ({ data: [{ name_en: 'Wall Push-Up', category: 'push', muscle_groups: ['chest'] }], error: null }),
    }),
  };
});

vi.mock('@/lib/deepseek/client', () => ({
  streamChatCompletion: async function* (messages: { role: string; content: string }[]) {
    h.deepseekCalls.push({ messages });
    yield h.deepseekResponses.shift() ?? '{}';
  },
}));

vi.mock('@/lib/nvidia/client', () => ({ getEmbedding: async () => [0.1, 0.2, 0.3] }));

import { POST } from '@/app/api/generate-phase/route';

function profile() {
  return {
    id: 'user-1',
    age: 30,
    weight_kg: 75,
    height_cm: 178,
    training_history: 'beginner',
    health_limitations: ['knees'],
    limitations_notes: null,
    cardio_preference: 'none',
    focus_areas: [],
    focus_notes: null,
    available_days_per_week: 3,
    available_equipment: ['bodyweight', 'ground'],
    experience_level: 'beginner',
    par_q_cleared: true,
  };
}

function exercise(name: string) {
  return { exercise: name, sets: 3, reps: '8-12', rpe: 7, rest_seconds: 90, work_seconds: 45, notes_es: '', notes_en: '' };
}

function validPhase(index: number) {
  const training = {
    type: 'full',
    label_es: 'Cuerpo completo',
    label_en: 'Full body',
    session: {
      title_es: 'Full body',
      title_en: 'Full body',
      warmup: [exercise('Jumping Jacks')],
      main: [exercise('Wall Push-Up')],
      cooldown: [exercise('Cat-Cow')],
      rationale_es: '',
      rationale_en: '',
      science_refs: [],
    },
  };
  const rest = { type: 'rest', label_es: 'Descanso', label_en: 'Rest', session: null };
  return {
    index,
    name_es: 'Fase',
    name_en: 'Phase',
    week_template: [training, training, rest, training, rest, rest, rest],
    rationale_es: '',
    rationale_en: '',
    science_refs: [],
    generated_at: '2026-11-22T00:00:00.000Z',
  };
}

function request(phaseIndex: number) {
  return new Request('http://localhost/api/generate-phase', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phase_index: phaseIndex }),
  }) as unknown as Parameters<typeof POST>[0];
}

function firstPrompt() {
  return h.deepseekCalls[0].messages.map((m) => m.content).join('\n');
}

beforeEach(() => {
  h.plan = null;
  h.sessions = [
    {
      plan_day_index: 0,
      rpe: 6,
      completed_at: '2026-11-01T00:00:00.000Z',
      log_data: {
        exerciseLog: [
          { exercise: 'Wall Push-Up', prescribedSets: 3, prescribedReps: '8-12', actualReps: ['8', '8', '7'] },
        ],
      },
    },
    {
      plan_day_index: 27,
      rpe: 8,
      completed_at: '2026-11-28T00:00:00.000Z',
      log_data: {
        exerciseLog: [
          { exercise: 'Wall Push-Up', prescribedSets: 3, prescribedReps: '8-12', actualReps: ['12', '12', '12'] },
        ],
      },
    },
  ];
  h.sessionFilters.length = 0;
  h.deepseekCalls.length = 0;
  h.deepseekResponses = [JSON.stringify(validPhase(1))];
});

const plannedPhase0 = () =>
  ({ id: 'plan-1', plan_data: { version: 2, total_weeks: 12, phase_weeks: 4, phases: [validPhase(0)] } });

describe('Slice v2-08 — generate-phase con el log de la fase anterior', () => {
  it('409 al pedir fase 1 si la fase 0 no existe', async () => {
    h.plan = { id: 'plan-1', plan_data: { version: 2, total_weeks: 12, phase_weeks: 4, phases: [] } };
    const res = await POST(request(1));
    expect(res.status).toBe(409);
    expect(h.deepseekCalls).toHaveLength(0);
  });

  it('carga solo las sesiones completadas de los dias de la fase anterior', async () => {
    h.plan = plannedPhase0();
    await POST(request(1));
    expect(h.sessionFilters).toContainEqual(['plan_id', 'plan-1']);
    expect(h.sessionFilters).toContainEqual(['gte:plan_day_index', 0]);
    expect(h.sessionFilters).toContainEqual(['lte:plan_day_index', 27]);
  });

  it('el prompt de la fase 1 incluye el resumen del log y las reglas de progresion', async () => {
    h.plan = plannedPhase0();
    const res = await POST(request(1));
    expect(res.status).toBe(200);
    const prompt = firstPrompt();
    expect(prompt).toContain('## Previous Phase (progress from it)');
    expect(prompt).toContain('## Previous Phase Training Log');
    expect(prompt).toContain('Adherence: 2/12 training days completed (17%)');
    expect(prompt).toContain('Latest log: 12, 12, 12');
    expect(prompt).toContain('reached the top of the prescribed range');
    expect(prompt).toContain('## Progression Rules');
    expect(prompt).toContain('adherence is below 50%');
  });

  it('sin el flag activo no adjunta el log (rollback)', async () => {
    process.env.FEATURE_PHASE_GENERATION_EVIDENCE_ADJUSTMENT = 'false';
    h.plan = plannedPhase0();
    const res = await POST(request(1));
    process.env.FEATURE_PHASE_GENERATION_EVIDENCE_ADJUSTMENT = 'true';
    expect(res.status).toBe(200);
    expect(firstPrompt()).not.toContain('## Previous Phase Training Log');
  });
});
