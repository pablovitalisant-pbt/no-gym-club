import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamChatCompletion } from '@/lib/deepseek/client';
import { getEmbedding } from '@/lib/nvidia/client';
import { deriveStartLevel, type StartLevel } from '@/lib/assessment/level';
import { validatePhase } from '@/lib/plan/validate-phase';
import { summarizePhaseLog, type PhaseLogSession } from '@/lib/plan/phase-log';
import { getFlag } from '@/lib/flags';
import {
  buildPhasePrompt,
  type CorpusDoc,
  type PhaseAssessment,
} from '@/lib/prompts/build-phase-prompt';
import type { PlanData, PlanPhase } from '@/lib/types/plan';

// Doc oficial de DeepSeek: deepseek-v4-flash admite hasta 262144 tokens de salida
// (deepseek-v4-flash-0731, docs de Venice API); 16384 queda muy por debajo del
// limite y alcanza para una plantilla semanal de 7 dias.
const MAX_TOKENS = 16384;

// Si el perfil no declara disponibilidad, 3 dias/semana es el minimo viable
// del MVP (evita que el modelo improvise y elige un valor conservador).
const DEFAULT_AVAILABLE_DAYS_PER_WEEK = 3;

// Niveles donde la busqueda semantica puede dejar fuera las regresiones
// basicas: se complementa con el pool de fundamentos del catalogo.
const FOUNDATION_LEVELS: StartLevel[] = ['untrained', 'untrained_extreme', 'beginner'];

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function generatePhaseRaw(messages: ChatMessage[]): Promise<string> {
  let raw = '';
  for await (const token of streamChatCompletion(messages, {
    temperature: 0.7,
    maxTokens: MAX_TOKENS,
    jsonMode: true,
  })) {
    raw += token;
  }
  return raw;
}

function parseAndValidate(raw: string) {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false as const, errors: ['response is not valid JSON'] };
  }
  return validatePhase(json);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
    }
    if (!profile.par_q_cleared) {
      return NextResponse.json(
        { error: 'PAR-Q not cleared. Complete the safety screening first.' },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      phase_index?: number;
    };
    const phaseIndex = body.phase_index ?? 0;
    if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex > 2) {
      return NextResponse.json(
        { error: 'phase_index must be 0, 1 or 2' },
        { status: 400 },
      );
    }
    const phaseSlot = phaseIndex as 0 | 1 | 2;

    const { data: assessment } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', user.id)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const startLevel = deriveStartLevel(profile, assessment as PhaseAssessment | null);

    // Plan activo (se crea vacio si el usuario no tiene ninguno)
    const { data: existingPlan } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const initialPlanData: PlanData = {
      version: 2,
      total_weeks: 12,
      phase_weeks: 4,
      phases: [],
    };
    let planId: string;
    let planData: PlanData;

    if (existingPlan) {
      planId = existingPlan.id as string;
      const raw = (existingPlan.plan_data ?? {}) as Partial<PlanData>;
      planData = {
        ...initialPlanData,
        ...raw,
        phases: Array.isArray(raw.phases) ? raw.phases : [],
      };
    } else {
      const { data: created, error: createError } = await supabase
        .from('training_plans')
        .insert({
          user_id: user.id,
          plan_data: initialPlanData,
          start_level: startLevel,
          is_active: true,
        })
        .select('*')
        .single();
      if (createError || !created) {
        return NextResponse.json(
          { error: `Failed to create plan: ${createError?.message ?? 'unknown'}` },
          { status: 500 },
        );
      }
      planId = created.id as string;
      planData = initialPlanData;
    }

    if (planData.phases[phaseSlot]) {
      return NextResponse.json(
        { error: `Phase ${phaseSlot} already exists` },
        { status: 409 },
      );
    }

    const previousPhase = phaseSlot > 0 ? planData.phases[phaseSlot - 1] : undefined;
    if (phaseSlot > 0 && !previousPhase) {
      return NextResponse.json(
        { error: `Phase ${phaseSlot - 1} must exist before phase ${phaseSlot}` },
        { status: 409 },
      );
    }

    let previousPhaseLog: string | undefined;
    if (previousPhase && getFlag('phase_generation_evidence_adjustment')) {
      const start = (phaseSlot - 1) * 28;
      const { data: logSessions } = await supabase
        .from('workout_sessions')
        .select('plan_day_index, log_data, rpe, completed_at')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .not('completed_at', 'is', null)
        .gte('plan_day_index', start)
        .lte('plan_day_index', start + 27);
      previousPhaseLog = summarizePhaseLog(
        previousPhase,
        (logSessions ?? []) as PhaseLogSession[],
      );
    }

    // RAG: corpus (6 docs; segunda query para niveles no entrenados)
    const queryText = [
      `4-week training phase for a ${startLevel} athlete`,
      `age ${profile.age}`,
      `training history: ${profile.training_history ?? 'never'}`,
      `limitations: ${(profile.health_limitations ?? []).join(', ') || 'none'}`,
      `focus: ${(profile.focus_areas ?? []).join(', ') || 'balanced'}`,
      `equipment: ${(profile.available_equipment ?? []).join(', ')}`,
    ].join(', ');

    const embedding = await getEmbedding(queryText, 'query');
    const { data: corpusPrimary, error: corpusError } = await supabase.rpc(
      'search_corpus',
      { query_embedding: embedding, match_count: 6, filter_category: null },
    );
    if (corpusError) {
      return NextResponse.json(
        { error: `Corpus search failed: ${corpusError.message}` },
        { status: 500 },
      );
    }

    let corpusRows = corpusPrimary ?? [];
    if (startLevel === 'untrained' || startLevel === 'untrained_extreme') {
      const beginnerEmbedding = await getEmbedding(
        'untrained beginner, older or overweight adults',
        'query',
      );
      const { data: corpusBeginner, error: beginnerError } = await supabase.rpc(
        'search_corpus',
        { query_embedding: beginnerEmbedding, match_count: 6, filter_category: null },
      );
      if (beginnerError) {
        return NextResponse.json(
          { error: `Corpus search failed: ${beginnerError.message}` },
          { status: 500 },
        );
      }
      corpusRows = [...corpusRows, ...(corpusBeginner ?? [])];
    }

    const seen = new Set<string>();
    const corpusDocs: CorpusDoc[] = corpusRows
      .filter((r: { title: string }) => {
        if (seen.has(r.title)) return false;
        seen.add(r.title);
        return true;
      })
      .map(
        (r: {
          title: string;
          content: string;
          category: string;
          similarity: number;
        }) => ({
          title: r.title,
          content: r.content,
          category: r.category,
          similarity: r.similarity,
        }),
      );

    const { data: exerciseRows, error: exerciseError } = await supabase.rpc(
      'search_exercises',
      {
        query_embedding: embedding,
        match_count: 60,
        filter_equipment: profile.available_equipment,
        filter_category: null,
      },
    );
    const availableExercises = !exerciseError
      ? (exerciseRows ?? []).map(
          (r: { name_en: string; category: string; muscle_groups: string[] }) => ({
            name_en: r.name_en,
            category: r.category,
            muscle_groups: r.muscle_groups,
          }),
        )
      : [];

    // Pool de fundamentos: regresiones que el RAG puede no devolver en los 60
    // resultados (p.ej. push-up en pared para un principiante extremo).
    let foundationExercises: typeof availableExercises = [];
    if (FOUNDATION_LEVELS.includes(startLevel)) {
      let foundationQuery = supabase
        .from('exercises')
        .select('name_en, category, muscle_groups')
        .eq('is_active', true)
        .eq('difficulty', 'beginner')
        .limit(40);
      const equipment = profile.available_equipment;
      if (Array.isArray(equipment) && equipment.length) {
        foundationQuery = foundationQuery.overlaps(
          'equipment_required',
          equipment,
        );
      }
      const { data: foundationRows } = await foundationQuery;
      foundationExercises = (foundationRows ?? []) as typeof availableExercises;
    }

    const seenExercises = new Set<string>();
    const mergedExercises = [...availableExercises, ...foundationExercises].filter(
      (ex) => {
        if (seenExercises.has(ex.name_en)) return false;
        seenExercises.add(ex.name_en);
        return true;
      },
    );

    const { system, user: userPrompt } = buildPhasePrompt({
      profile: {
        ...profile,
        available_days_per_week:
          profile.available_days_per_week ?? DEFAULT_AVAILABLE_DAYS_PER_WEEK,
      },
      assessment: assessment as PhaseAssessment | null,
      startLevel,
      phaseIndex: phaseSlot,
      previousPhase,
      previousPhaseLog,
      corpusDocs,
      availableExercises: mergedExercises,
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ];

    // Un reintento enviando los errores de validacion
    let result = parseAndValidate(await generatePhaseRaw(messages));
    if (!result.ok) {
      const retryMessages: ChatMessage[] = [
        ...messages,
        {
          role: 'user',
          content: `Your previous output failed validation:\n- ${result.errors.join('\n- ')}\nReturn ONLY the corrected PlanPhase JSON.`,
        },
      ];
      result = parseAndValidate(await generatePhaseRaw(retryMessages));
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: 'AI phase failed validation after retry', details: result.errors },
        { status: 502 },
      );
    }
    const phase = result.value as PlanPhase;

    const phases = [...planData.phases];
    phases[phaseSlot] = phase;
    const nextPlanData: PlanData = { ...planData, phases };
    const { error: saveError } = await supabase
      .from('training_plans')
      .update({ plan_data: nextPlanData })
      .eq('id', planId)
      .eq('user_id', user.id);
    if (saveError) {
      return NextResponse.json(
        { error: `Failed to save phase: ${saveError.message}` },
        { status: 500 },
      );
    }

    // ponytail: el reintento exige la salida completa, asi que el stream emite
    // el JSON ya validado (no token a token como generate-session).
    if (request.headers.get('Accept') === 'text/plain') {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(JSON.stringify(phase)));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return NextResponse.json({
      plan_id: planId,
      phase_index: phaseSlot,
      phase,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
