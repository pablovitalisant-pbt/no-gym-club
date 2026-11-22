import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validatePhase } from '@/lib/plan/validate-phase';
import { buildPhasePrompt } from '@/lib/prompts/build-phase-prompt';

const REAL_PHASE = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures/fase-qa.intermedio.json'), 'utf8'),
).phase as Record<string, any>;

// Categorias reales de los ejercicios del dia `lower` del fixture.
const REAL_CATEGORIES: Record<string, string> = {
  'high knee against wall': 'cardio',
  'push-up on lower arms': 'push',
  'isometric wipers': 'core',
  'kneeling plank tap shoulder (male)': 'core',
  'bodyweight standing row': 'pull',
  'close-grip push-up': 'push',
  'side push-up': 'push',
  'push-up to side plank': 'push',
  'bodyweight standing close-grip row': 'pull',
  'chin-up': 'pull',
  'close grip chin-up': 'pull',
  'inverted row': 'pull',
  'bodyweight squatting row': 'pull',
  'incline close-grip push-up': 'push',
  'shoulder tap push-up': 'push',
  'bench dip on floor': 'push',
};

describe('v2-12 — validador exige coherencia tipo de dia / categoria', () => {
  it('rechaza la fase real de qa.intermedio por el dia lower sin piernas', () => {
    const out = validatePhase(REAL_PHASE, REAL_CATEGORIES);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.errors.some((e) => e.includes('week_template[3]') && e.includes('legs'))).toBe(
        true,
      );
    }
  });

  it('acepta la fase cuando el dia lower trae al menos 2 ejercicios de legs', () => {
    const phase = structuredClone(REAL_PHASE);
    const ex = (exercise: string) => ({ exercise, sets: 3, work_seconds: 40, rest_seconds: 60 });
    phase.week_template[3].session.main = [ex('bodyweight squat'), ex('glute bridge')];
    const out = validatePhase(phase, {
      ...REAL_CATEGORIES,
      'bodyweight squat': 'legs',
      'glute bridge': 'legs',
    });
    expect(out.ok).toBe(true);
  });

  it('sin mapa de categorias mantiene el comportamiento anterior', () => {
    expect(validatePhase(REAL_PHASE).ok).toBe(true);
  });
});

describe('v2-12 — prompt agrupa por categoria y pide coherencia', () => {
  const profile = {
    age: 30,
    weight_kg: 75,
    height_cm: 178,
    training_history: 'past',
    health_limitations: [],
    limitations_notes: null,
    cardio_preference: 'none',
    focus_areas: ['chest'],
    focus_notes: null,
    available_days_per_week: 3,
    available_equipment: ['bodyweight'],
  };

  it('el system exige que el bloque principal corresponda al tipo de dia', () => {
    const { system } = buildPhasePrompt({
      profile,
      assessment: null,
      startLevel: 'intermediate',
      phaseIndex: 1,
      corpusDocs: [],
      availableExercises: [],
    });
    expect(system).toContain('MAIN BLOCK');
    expect(system.toLowerCase()).toContain('legs');
    expect(system.toLowerCase()).toContain('push');
    expect(system.toLowerCase()).toContain('pull');
  });

  it('el catalogo del user va agrupado por categoria', () => {
    const { user } = buildPhasePrompt({
      profile,
      assessment: null,
      startLevel: 'intermediate',
      phaseIndex: 1,
      corpusDocs: [],
      availableExercises: [
        { name_en: 'Push A', category: 'push', muscle_groups: ['chest'] },
        { name_en: 'Leg A', category: 'legs', muscle_groups: ['quads'] },
        { name_en: 'Pull A', category: 'pull', muscle_groups: ['back'] },
      ],
    });
    expect(user).toMatch(/###\s+push/i);
    expect(user).toMatch(/###\s+legs/i);
    expect(user).toMatch(/###\s+pull/i);
  });
});

// --- Ruta: cobertura de categorias para todos los niveles ---

const h = vi.hoisted(() => ({
  user: { id: 'user-1' },
  profile: null as Record<string, unknown> | null,
  assessment: null as Record<string, unknown> | null,
  deepseekResponses: [] as string[],
  deepseekCalls: [] as { messages: { role: string; content: string }[] }[],
  exerciseFilters: [] as [string, unknown][],
  rag: [] as Record<string, unknown>[],
  catalog: {} as Record<string, Record<string, unknown>[]>,
}));

vi.mock('@/lib/supabase/server', () => {
  const chain = (resolveFn: () => unknown) => {
    const p: Record<string, unknown> = {
      select: () => p,
      eq: () => p,
      in: () => p,
      not: () => p,
      is: () => p,
      overlaps: () => p,
      order: () => p,
      limit: () => p,
      single: () => Promise.resolve(resolveFn()),
      maybeSingle: () => Promise.resolve(resolveFn()),
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(resolveFn()).then(res, rej),
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
          const filters: [string, unknown][] = [];
          const apply = () => {
            const category = filters.find(([c]) => c === 'category')?.[1];
            return { data: category ? (h.catalog[category as string] ?? []) : [], error: null };
          };
          const p: Record<string, unknown> = {
            select: () => p,
            eq: (col: string, val: unknown) => {
              filters.push([col, val]);
              h.exerciseFilters.push([col, val]);
              return p;
            },
            in: (col: string, val: unknown) => {
              filters.push([`in:${col}`, val]);
              h.exerciseFilters.push([`in:${col}`, val]);
              return p;
            },
            overlaps: () => p,
            limit: () => p,
            then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
              Promise.resolve(apply()).then(res, rej),
          };
          return p;
        }
        return chain(() => ({ data: null, error: null }));
      },
      rpc: async (name: string) => {
        if (name === 'search_corpus') return { data: [], error: null };
        return { data: h.rag, error: null };
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

function ex(name: string) {
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

function fullDay() {
  return {
    type: 'full',
    label_es: 'Cuerpo completo',
    label_en: 'Full body',
    session: {
      title_es: 'Full body',
      title_en: 'Full body',
      warmup: [ex('jump')],
      main: [ex('push rag 1')],
      cooldown: [ex('stretch')],
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
    week_template: [fullDay(), fullDay(), rest, fullDay(), rest, rest, rest],
    rationale_es: '',
    rationale_en: '',
    science_refs: ['mesocycles'],
    generated_at: '2026-11-22T00:00:00.000Z',
  };
}

function request() {
  return new Request('http://localhost/api/generate-phase', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  }) as unknown as Parameters<typeof POST>[0];
}

function firstPrompt() {
  return h.deepseekCalls[0].messages.map((m) => m.content).join('\n');
}

const CATALOG_CATEGORIES = ['push', 'pull', 'legs', 'core', 'mobility', 'cardio'];

beforeEach(() => {
  h.profile = {
    id: 'user-1',
    age: 30,
    weight_kg: 75,
    height_cm: 178,
    training_history: 'past',
    health_limitations: [],
    limitations_notes: null,
    cardio_preference: 'none',
    focus_areas: [],
    focus_notes: null,
    available_days_per_week: 3,
    available_equipment: ['bodyweight'],
    par_q_cleared: true,
  };
  h.assessment = {
    pushup_variant: 'floor',
    pushup_variant_reps: 15,
    sit_to_stand_30s: 15,
    walk_minutes: 30,
  };
  h.deepseekResponses = [JSON.stringify(validPhase())];
  h.deepseekCalls.length = 0;
  h.exerciseFilters.length = 0;
  // RAG devuelve solo 2 ejercicios de push (los demas faltan).
  h.rag = [
    { name_en: 'push rag 1', category: 'push', muscle_groups: ['chest'] },
    { name_en: 'push rag 2', category: 'push', muscle_groups: ['chest'] },
  ];
  h.catalog = {};
  for (const category of CATALOG_CATEGORIES) {
    h.catalog[category] = Array.from({ length: 6 }, (_, i) => ({
      name_en: `${category} cat ${i + 1}`,
      category,
      muscle_groups: ['m'],
    }));
  }
});

describe('v2-12 — cobertura de categorias en todos los niveles', () => {
  it('completa desde el catalogo activo las categorias con menos de 6 en el RAG', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    const prompt = firstPrompt();
    expect(prompt).toContain('legs cat 1');
    expect(prompt).toContain('core cat 1');
    expect(prompt).toContain('mobility cat 1');
    expect(prompt).toContain('cardio cat 1');
    expect(prompt).toContain('push cat 6');
    expect(h.exerciseFilters).toContainEqual(['is_active', true]);
    expect(h.exerciseFilters).toContainEqual(['category', 'legs']);
  });

  it('no duplica ejercicios entre RAG y catalogo', async () => {
    h.catalog.legs[0] = {
      name_en: 'push rag 1',
      category: 'legs',
      muscle_groups: ['quads'],
    };
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(firstPrompt().split('- push rag 1 [').length - 1).toBe(1);
  });

  it('el nivel intermedio pide dificultad beginner e intermediate', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(h.exerciseFilters).toContainEqual(['in:difficulty', ['beginner', 'intermediate']]);
  });
});
