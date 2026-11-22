import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildPhasePrompt } from '@/lib/prompts/build-phase-prompt';

const h = vi.hoisted(() => ({
  user: { id: 'user-1' },
  profile: null as Record<string, unknown> | null,
  assessment: null as Record<string, unknown> | null,
  deepseekResponses: [] as string[],
  deepseekCalls: [] as { messages: { role: string; content: string }[] }[],
  deletes: [] as string[],
  exerciseFilters: [] as [string, unknown][],
  exerciseLimit: 0,
  exerciseRows: [] as Record<string, unknown>[],
}));

vi.mock('@/lib/supabase/server', () => {
  const chain = (resolve: () => unknown) => {
    const p: Record<string, unknown> = {
      select: () => p,
      eq: (col: string, val: unknown) => {
        h.exerciseFilters.push([col, val]);
        return p;
      },
      in: () => p,
      not: () => p,
      is: () => p,
      overlaps: (col: string, val: unknown) => {
        h.exerciseFilters.push([`overlaps:${col}`, val]);
        return p;
      },
      order: () => p,
      limit: (n: number) => {
        h.exerciseLimit = n;
        return p;
      },
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
          const p = chain(() => ({ data: null, error: null })) as Record<string, unknown>;
          p.insert = (row: Record<string, unknown>) =>
            chain(() => ({ data: { id: 'plan-1', ...row }, error: null }));
          p.update = () => chain(() => ({ data: null, error: null }));
          return p;
        }
        if (table === 'exercises') {
          return chain(() => ({ data: h.exerciseRows, error: null }));
        }
        h.deletes.push(table);
        return chain(() => ({ data: null, error: null }));
      },
      rpc: async (name: string) => {
        if (name === 'search_corpus') {
          return { data: [], error: null };
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
  streamChatCompletion: async function* (messages: { role: string; content: string }[]) {
    h.deepseekCalls.push({ messages });
    yield h.deepseekResponses.shift() ?? '{}';
  },
}));

vi.mock('@/lib/nvidia/client', () => ({ getEmbedding: async () => [0.1, 0.2, 0.3] }));

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

function trainingDay() {
  return {
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
      science_refs: ['mesocycles'],
    },
  };
}

function validPhase() {
  const rest = { type: 'rest', label_es: 'Descanso', label_en: 'Rest', session: null };
  return {
    index: 0,
    name_es: 'Fase',
    name_en: 'Phase',
    week_template: [trainingDay(), trainingDay(), rest, trainingDay(), rest, rest, rest],
    rationale_es: '',
    rationale_en: '',
    science_refs: ['mesocycles'],
    generated_at: '2026-11-22T00:00:00.000Z',
  };
}

const baseProfile = {
  id: 'user-1',
  age: 52,
  weight_kg: 118,
  height_cm: 172,
  training_history: 'never',
  health_limitations: ['knees'],
  limitations_notes: null,
  cardio_preference: 'none',
  focus_areas: ['chest'],
  focus_notes: null,
  available_days_per_week: null,
  available_equipment: ['bodyweight', 'wall', 'ground'],
  experience_level: 'beginner',
  par_q_cleared: true,
};

const baseAssessment = {
  pushup_variant: 'wall' as const,
  pushup_variant_reps: 5,
  sit_to_stand_30s: 6,
  walk_minutes: 8,
  knee_plank_seconds: 10,
  dead_hang_seconds: 0,
};

function request() {
  return new Request('http://localhost/api/generate-phase', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  }) as unknown as Parameters<typeof POST>[0];
}

function firstPrompt() {
  const call = h.deepseekCalls[0];
  return call.messages.map((m) => m.content).join('\n');
}

beforeEach(() => {
  h.profile = { ...baseProfile };
  h.assessment = { ...baseAssessment };
  h.deepseekResponses = [JSON.stringify(validPhase())];
  h.deepseekCalls.length = 0;
  h.exerciseFilters.length = 0;
  h.exerciseLimit = 0;
  h.exerciseRows = [
    { name_en: 'Wall Push-Up', category: 'push', muscle_groups: ['chest'] },
    { name_en: 'Incline Push-Up', category: 'push', muscle_groups: ['chest'] },
    { name_en: 'Chair Squat', category: 'legs', muscle_groups: ['quads'] },
  ];
});

describe('v2-05b — defaults y pool de fundamentos', () => {
  it('usa 3 dias por semana cuando el perfil no los define', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(firstPrompt()).toContain('Days/week: 3');
  });

  it('suma el pool de fundamentos del catalogo activo, sin duplicados', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);

    expect(h.exerciseFilters).toContainEqual(['is_active', true]);
    expect(h.exerciseFilters).toContainEqual(['difficulty', 'beginner']);
    expect(h.exerciseFilters).toContainEqual([
      'overlaps:equipment_required',
      ['bodyweight', 'wall', 'ground'],
    ]);
    expect(h.exerciseLimit).toBe(40);

    const prompt = firstPrompt();
    expect(prompt).toContain('Incline Push-Up');
    expect(prompt).toContain('Chair Squat');
    // cuenta solo el catalogo: el ejemplo de PlanDay del schema tambien lo nombra
    expect(prompt.split('- Wall Push-Up [').length - 1).toBe(1);
  });
});

describe('v2-05b — variante inicial segun el test', () => {
  const profile = {
    age: 52,
    weight_kg: 118,
    height_cm: 172,
    training_history: 'never',
    health_limitations: ['knees'],
    limitations_notes: null,
    cardio_preference: 'none',
    focus_areas: [],
    focus_notes: null,
    available_days_per_week: 3,
    available_equipment: ['bodyweight', 'wall', 'ground'],
  };
  const assessment = { ...baseAssessment };

  function build() {
    return buildPhasePrompt({
      profile,
      assessment,
      startLevel: 'untrained_extreme',
      phaseIndex: 0,
      corpusDocs: [],
      availableExercises: [
        { name_en: 'Wall Push-Up', category: 'push', muscle_groups: ['chest'] },
      ],
    });
  }

  it('el system contiene la regla de variante inicial y no mas dificil en fase 1', () => {
    const system = build().system.toLowerCase();
    expect(system).toContain('starting variant');
    expect(system).toContain('wall push-up');
    expect(system).toContain('knee push-up');
    expect(system).toContain('never prescribe a harder variant');
  });

  it('el user incluye el test completo de forma legible', () => {
    const user = build().user;
    expect(user).toContain('Push-up test: wall variant, 5 reps');
    expect(user).toContain('Sit-to-stand (30 s): 6 reps');
    expect(user).toContain('Walk: 8 min');
    expect(user).toContain('Knee plank: 10 s');
  });
});
