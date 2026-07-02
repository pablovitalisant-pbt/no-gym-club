import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChatCompletion } from '@/lib/deepseek/client';
import { getEmbedding } from '@/lib/nvidia/client';
import { buildSessionPrompt } from '@/lib/prompts/build-session-prompt';
import type { CorpusDoc } from '@/lib/prompts/build-session-prompt';
import type { PreviousSession } from '@/lib/prompts/build-session-prompt';

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Complete the assessment first.' },
        { status: 400 },
      );
    }

    // 3. Validate PAR-Q
    if (!profile.par_q_cleared) {
      return NextResponse.json(
        { error: 'PAR-Q not cleared. Complete the safety screening first.' },
        { status: 400 },
      );
    }

    // 4. Fetch previous completed session (for adaptation)
    let prevSession: PreviousSession | undefined;
    let daysSinceLast: number | null = null;

    const { data: lastSession, error: lastError } = await supabase
      .from('workout_sessions')
      .select('rpe, session_data, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastError && lastSession) {
      // 5. Calculate days_since_last
      const prevDate = new Date(lastSession.completed_at!);
      const now = new Date();
      daysSinceLast = Math.floor(
        (now.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Extract main exercises from previous session
      const sessionData = lastSession.session_data as Record<string, unknown>;
      const main = (sessionData?.main as Array<{ exercise?: string }>) || [];
      const mainExercises = main
        .map((ex) => ex.exercise)
        .filter((e): e is string => typeof e === 'string');

      prevSession = {
        rpe: lastSession.rpe,
        completedAt: lastSession.completed_at!,
        daysSinceLast,
        mainExercises,
      };
    }

    // 6. Build semantic query from profile
    const queryText = [
      `training program for ${profile.experience_level} athlete`,
      `primary goal: ${profile.primary_goal?.replace(/_/g, ' ')}`,
      `equipment: ${(profile.available_equipment || []).join(', ')}`,
      `training ${profile.available_days_per_week} days per week`,
    ].join(', ');

    // 7. Get embedding + search corpus
    const embedding = await getEmbedding(queryText, 'query');

    const { data: corpusResults, error: corpusError } = await supabase.rpc(
      'search_corpus',
      {
        query_embedding: embedding,
        match_count: 5,
        filter_category: null,
      },
    );

    if (corpusError) {
      return NextResponse.json(
        { error: `Corpus search failed: ${corpusError.message}` },
        { status: 500 },
      );
    }

    const corpusDocs: CorpusDoc[] = (corpusResults || []).map(
      (r: {
        id: string;
        title: string;
        content: string;
        category: string;
        tags: string[];
        similarity: number;
      }) => ({
        title: r.title,
        content: r.content,
        category: r.category,
        similarity: r.similarity,
      }),
    );

    // 8. Build prompt + call DeepSeek
    const { system, user: userPrompt } = buildSessionPrompt(
      profile,
      corpusDocs,
      prevSession,
    );

    const rawResponse = await generateChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 2048, jsonMode: true },
    );

    // 9. Parse + validate JSON
    let sessionData: unknown;
    try {
      sessionData = JSON.parse(rawResponse);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 },
      );
    }

    // 10. Insert session
    const { data: inserted, error: insertError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        session_data: sessionData as Record<string, unknown>,
        scheduled_date: new Date().toISOString().split('T')[0],
        days_since_last: daysSinceLast,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save session: ${insertError.message}` },
        { status: 500 },
      );
    }

    // 11. Return session
    return NextResponse.json({
      session_id: inserted.id,
      created_at: inserted.created_at,
      session: sessionData,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
