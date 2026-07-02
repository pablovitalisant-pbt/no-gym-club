import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChatCompletion } from '@/lib/deepseek/client';
import { getEmbedding } from '@/lib/nvidia/client';
import { buildSessionPrompt } from '@/lib/prompts/build-session-prompt';
import type { CorpusDoc } from '@/lib/prompts/build-session-prompt';

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

    // 4. Build semantic query from profile
    const queryText = [
      `training program for ${profile.experience_level} athlete`,
      `primary goal: ${profile.primary_goal?.replace(/_/g, ' ')}`,
      `equipment: ${(profile.available_equipment || []).join(', ')}`,
      `training ${profile.available_days_per_week} days per week`,
    ].join(', ');

    // 5. Get embedding + search corpus
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

    // 6. Build prompt + call DeepSeek
    const { system, user: userPrompt } = buildSessionPrompt(profile, corpusDocs);

    const rawResponse = await generateChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 2048, jsonMode: true },
    );

    // 7. Parse + validate JSON
    let sessionData: unknown;
    try {
      sessionData = JSON.parse(rawResponse);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 },
      );
    }

    // 8. Insert session
    const { data: inserted, error: insertError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        session_data: sessionData as Record<string, unknown>,
        scheduled_date: new Date().toISOString().split('T')[0],
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save session: ${insertError.message}` },
        { status: 500 },
      );
    }

    // 9. Return session
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
