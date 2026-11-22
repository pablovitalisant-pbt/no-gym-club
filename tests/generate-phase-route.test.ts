import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'user-1' },
  profile: null as Record<string, unknown> | null,
  assessment: null as Record<string, unknown> | null,
  plan: null as Record<string, unknown> | null,
  planInserts: [] as Record<string, unknown>[],
  planUpdates: [] as Record<string, unknown>[],
  deepseekResponses: [] as string[],
  deepseekCalls: [] as { messages: { role: string; content: string }[]; options: unknown }[],
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  embeddingCalls: 0,
  embeddingError: null as Error | null,
}));

vi.mock('@/lib/supabase/server', () => {
  const chain = (resolve: () => unknown) => {
    const p: Record<string, unknown> = {
      select: () => p,
      eq: () => p,
      order: () => p,
      limit: () => p,
      not: () => p,
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
        if (table === 'profiles') return chain(() => ({ data: h.profile, error: null }));
        if (table === 'assessment_results') {
          return chain(() => ({ data: h.assessment, error: null }));
        }
        if (table === 'training_plans') {
          const p = chain(() => ({ data: h.plan, error: null })) as Record<string, unknown>;
          p.insert = (row: Record<string, unknown>) => {
            h.planInserts.push(row);
            return chain(() => ({ data: { id: 'plan-1', ...row }, error: null }));
          };
          p.update = (patch: Record<string, unknown>) => {
            h.planUpdates.push(patch);
            return chain(() => ({ data: null, error: null }));
          };
          return p;
        }
        return chain(() => ({ data: null, error: null }));
      },
      rpc: async (name: string, args: Record<string, unknown>) => {
        h.rpcCalls.push({ name, args });
        if (name === 'search_corpus') {
          return {
            data: [
              {
                id: 'doc-1',
                title: 'Overcoming Gravity — Mesocycles',
                content: 'Keep the same exercises for 4 weeks.',
                category: 'overcoming_gravity',
                tags: [],
                similarity: 0.9,
              },
            ],
            error: null,
          };
        }
        return {
          data: [
            { name_en: 'Wall Push-Up', category: 'push', muscle_groups: ['chest'] },
            { name_en: 'Chair Sit-to-Stand', category: 'legs', muscle_groups: ['quads'] },
          ],
          error: null,
        };
      },
    }),
  };
});

vi.mock('@/lib/deepseek/client', () => ({
  streamChatCompletion: async function* (
    messages: { role: string; content: string }[],
    options: unknown,
  ) {
    h.deepseekCalls.push({ messages, options });
    yield h.deepseekResponses.shift() ?? '{}';
  },
  generateChatCompletion: async () => {
    throw new Error('generateChatCompletion should not be used');
  },
}));

vi.mock('@/lib/nvidia/client', () => ({
  getEmbedding: async () => {
    if (h.embeddingError) throw h.embeddingError;
    h.embeddingCalls += 1;
    return [0.1, 0.2, 0.3];
  },
}));

import { POST } from '@/app/api/generate-phase/route';

function exercise(name: string) {
  return {
    exercise: name,
    sets: 3,
    reps: '5-8',
    rpe: 7,
    rest_seconds: 90,
    work_seconds: 45,
    notes_es: '',
    notes_en: '',
  };
}

function session() {
  return {
    title_es: 'Full body',
    title_en: 'Full body',
    warmup: [exercise('Jumping Jacks')],
    main: [exercise('Wall Push-Up')],
    cooldown: [exercise('Cat-Cow')],
    rationale_es: '',
    rationale_en: '',
    science_refs: ['mesocycles'],
  };
}

function validPhase(index = 0) {
  const training = {
    type: 'full',
    label_es: 'Cuerpo completo',
    label_en: 'Full body',
    session: session(),
  };
  const rest = { type: 'rest', label_es: 'Descanso', label_en: 'Rest', session: null };
  return {
    index,
    name_es: 'Fase',
    name_en: 'Phase',
    week_template: [training, training, rest, training, rest, rest, rest],
    rationale_es: '',
    rationale_en: '',
    science_refs: ['mesocycles'],
    generated_at: '2026-11-21T00:00:00.000Z',
  };
}

const baseProfile = {
  id: 'user-1',
  age: 52,
  weight_kg: 95,
  height_cm: 170,
  training_history: 'never',
  health_limitations: ['knees'],
  limitations_notes: null,
  cardio_preference: 'none',
  focus_areas: ['chest', 'shoulders'],
  focus_notes: null,
  available_days_per_week: 3,
  available_equipment: ['bodyweight', 'ground', 'wall'],
  experience_level: 'beginner',
  primary_goal: 'general_fitness',
  par_q_cleared: true,
};

const baseAssessment = {
  pushup_variant: 'wall',
  pushup_variant_reps: 2,
  sit_to_stand_30s: 6,
  walk_minutes: 8,
};

function request() {
  return new Request('http://localhost/api/generate-phase', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  h.profile = { ...baseProfile };
  h.assessment = { ...baseAssessment };
  h.plan = null;
  h.planInserts.length = 0;
  h.planUpdates.length = 0;
  h.deepseekResponses.length = 0;
  h.deepseekCalls.length = 0;
  h.rpcCalls.length = 0;
  h.embeddingCalls = 0;
  h.embeddingError = null;
});

describe('POST /api/generate-phase', () => {
  it('400 si PAR-Q no esta aprobado y no llama a DeepSeek', async () => {
    h.profile = { ...baseProfile, par_q_cleared: false };
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(h.deepseekCalls).toHaveLength(0);
  });

  it('409 si la fase ya existe en el plan activo', async () => {
    h.plan = {
      id: 'plan-1',
      start_level: 'untrained_extreme',
      plan_data: { version: 2, total_weeks: 12, phase_weeks: 4, phases: [validPhase(0)] },
    };
    const res = await POST(request());
    expect(res.status).toBe(409);
    expect(h.deepseekCalls).toHaveLength(0);
  });

  it('crea el plan si no existe y guarda la fase 0', async () => {
    h.deepseekResponses = [JSON.stringify(validPhase(0))];
    const res = await POST(request());
    expect(res.status).toBe(200);

    expect(h.planInserts).toHaveLength(1);
    expect(h.planInserts[0].plan_data).toEqual({
      version: 2,
      total_weeks: 12,
      phase_weeks: 4,
      phases: [],
    });
    expect(h.planInserts[0].start_level).toBe('untrained_extreme');

    expect(h.planUpdates).toHaveLength(1);
    const saved = h.planUpdates[0].plan_data as { phases: { index: number }[] };
    expect(saved.phases).toHaveLength(1);
    expect(saved.phases[0].index).toBe(0);

    const body = (await res.json()) as { phase: { index: number } };
    expect(body.phase.index).toBe(0);
  });

  it('reintenta una vez enviando los errores de validacion y luego guarda', async () => {
    h.deepseekResponses = [JSON.stringify({ index: 0 }), JSON.stringify(validPhase(0))];
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(h.deepseekCalls).toHaveLength(2);
    expect(JSON.stringify(h.deepseekCalls[1].messages)).toContain('week_template');
    expect(h.planUpdates).toHaveLength(1);
  });

  it('502 si el segundo intento tambien es invalido y no guarda', async () => {
    h.deepseekResponses = ['not json', JSON.stringify({ index: 0 })];
    const res = await POST(request());
    expect(res.status).toBe(502);
    expect(h.deepseekCalls).toHaveLength(2);
    expect(h.planUpdates).toHaveLength(0);
  });

  it('error interno devuelve mensaje generico y loguea el detalle', async () => {
    h.embeddingError = new Error('detalle sensible de NVIDIA');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(request());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('detalle sensible');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('usa dos consultas RAG cuando el nivel es untrained_extreme', async () => {
    h.deepseekResponses = [JSON.stringify(validPhase(0))];
    await POST(request());
    const corpusCalls = h.rpcCalls.filter((c) => c.name === 'search_corpus');
    expect(corpusCalls).toHaveLength(2);
    expect(h.embeddingCalls).toBe(2);
    expect(h.rpcCalls.some((c) => c.name === 'search_exercises')).toBe(true);
  });
});
