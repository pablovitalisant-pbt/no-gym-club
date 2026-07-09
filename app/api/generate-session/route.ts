import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateChatCompletion,
  streamChatCompletion,
} from '@/lib/deepseek/client';
import { getEmbedding } from '@/lib/nvidia/client';
import { buildSessionPrompt } from '@/lib/prompts/build-session-prompt';
import type { CorpusDoc } from '@/lib/prompts/build-session-prompt';
import type { SessionHistory } from '@/lib/prompts/build-session-prompt';

// ponytail: Fluid Compute is enabled on this Vercel project, which raises
// the Hobby-plan hard timeout from 10s to up to 300s. The full pipeline
// (embedding + corpus search + DeepSeek streaming generation + insert)
// was observed taking 22s in production, well past the 10s default --
// this explicit maxDuration is the actual fix, not just relying on the
// platform default. See BUGS.md.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // ponytail: temporary timing instrumentation for Bug #3 — remove once root cause confirmed
  console.time('generate:total');
  console.time('generate:auth');

  // 1. Auth check
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.timeEnd('generate:auth');
  console.time('generate:profile');

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

    console.timeEnd('generate:profile');
    console.time('generate:history');

    // 4. Fetch training history (last 5 sessions for multi-session analysis)
    let sessionHistory: SessionHistory | undefined;
    let daysSinceLast: number | null = null;

    const { data: recentSessions, error: recentError } = await supabase
      .from('workout_sessions')
      .select('rpe, session_data, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (!recentError && recentSessions && recentSessions.length > 0) {
      // 5. Calculate days_since_last from most recent
      const lastDate = new Date(recentSessions[0].completed_at!);
      const now = new Date();
      daysSinceLast = Math.floor(
        (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Extract exercises for each session
      const sessions = recentSessions.map((s) => {
        const sd = s.session_data as Record<string, unknown>;
        const main = (sd?.main as Array<{ exercise?: string }>) || [];
        return {
          rpe: s.rpe,
          completedAt: s.completed_at!,
          mainExercises: main
            .map((ex) => ex.exercise)
            .filter((e): e is string => typeof e === 'string'),
        };
      });

      // Calculate average RPE
      const rpeValues = sessions
        .filter((s) => s.rpe != null)
        .map((s) => s.rpe!);
      const averageRpe =
        rpeValues.length > 0
          ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
          : null;

      // Calculate RPE trend from last 3
      const last3Rpe = sessions
        .slice(0, 3)
        .filter((s) => s.rpe != null)
        .map((s) => s.rpe!);
      let rpeTrend: SessionHistory['rpeTrend'] = 'insufficient_data';
      if (last3Rpe.length >= 2) {
        const diff = last3Rpe[0] - last3Rpe[last3Rpe.length - 1];
        if (diff >= 2) rpeTrend = 'increasing';
        else if (diff <= -1) rpeTrend = 'decreasing';
        else rpeTrend = 'stable';
      }

      // Count sessions this week
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sessionsThisWeek = recentSessions.filter(
        (s) => new Date(s.completed_at!) >= weekAgo,
      ).length;

      sessionHistory = {
        sessions,
        averageRpe,
        rpeTrend,
        sessionsThisWeek,
        lastSessionDaysAgo: daysSinceLast,
      };
    }

    console.timeEnd('generate:history');
    console.time('generate:embedding');

    // 6. Build semantic query from profile
    const queryText = [
      `training program for ${profile.experience_level} athlete`,
      `primary goal: ${profile.primary_goal?.replace(/_/g, ' ')}`,
      `equipment: ${(profile.available_equipment || []).join(', ')}`,
      `training ${profile.available_days_per_week} days per week`,
    ].join(', ');

    // 7. Get embedding + search corpus
    const embedding = await getEmbedding(queryText, 'query');
    console.timeEnd('generate:embedding');
    console.time('generate:corpus');

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

    // 8. Build prompt
    const { system, user: userPrompt } = buildSessionPrompt(
      profile,
      corpusDocs,
      sessionHistory,
    );

    const messages: Array<{
      role: 'system' | 'user';
      content: string;
    }> = [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ];

    console.timeEnd('generate:corpus');
    console.time('generate:deepseek');

    // ─── Streaming mode ───
    const wantsStreaming =
      request.headers.get('Accept') === 'text/plain';

    if (wantsStreaming) {
      const encoder = new TextEncoder();
      let accumulated = '';

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const token of streamChatCompletion(messages, {
              temperature: 0.7,
              maxTokens: 2048,
              jsonMode: true,
            })) {
              accumulated += token;
              controller.enqueue(encoder.encode(token));
            }

            // DeepSeek stream ended — record time
            console.timeEnd('generate:deepseek');

            // Parse and save
            let sessionData: unknown;
            try {
              sessionData = JSON.parse(accumulated);
            } catch {
              // ponytail: temporary diagnostic logging for invalid-json bug —
              // remove once root cause confirmed (see BUGS.md)
              console.error(
                '[generate-session] invalid-json — raw length:',
                accumulated.length,
                '\n--- first 500 chars ---\n',
                accumulated.slice(0, 500),
                '\n--- last 500 chars ---\n',
                accumulated.slice(-500),
              );
              controller.enqueue(
                encoder.encode('\nSESSION_ID:error:invalid-json'),
              );
              controller.close();
              return;
            }

            const { data: inserted, error: insertError } = await supabase
              .from('workout_sessions')
              .insert({
                user_id: user.id,
                session_data: sessionData as Record<string, unknown>,
                scheduled_date: new Date().toISOString().split('T')[0],
                days_since_last: daysSinceLast,
              })
              .select('id')
              .single();

            if (insertError) {
              controller.enqueue(
                encoder.encode(
                  `\nSESSION_ID:error:${insertError.message}`,
                ),
              );
            } else {
              controller.enqueue(
                encoder.encode(`\nSESSION_ID:${inserted.id}`),
              );
            }
            controller.close();
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : 'stream error';
            controller.enqueue(
              encoder.encode(`\nSESSION_ID:error:${msg}`),
            );
            controller.close();
          }
        },
      });

      console.timeEnd('generate:total');
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // ─── Non-streaming mode (original) ───
    const rawResponse = await generateChatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 2048,
      jsonMode: true,
    });

    // 9. Parse + validate JSON
    let sessionData: unknown;
    try {
      sessionData = JSON.parse(rawResponse);
    } catch {
      // ponytail: temporary diagnostic logging for invalid-json bug —
      // remove once root cause confirmed (see BUGS.md)
      console.error(
        '[generate-session] invalid-json (non-streaming) — raw length:',
        rawResponse.length,
        '\n--- first 500 chars ---\n',
        rawResponse.slice(0, 500),
        '\n--- last 500 chars ---\n',
        rawResponse.slice(-500),
      );
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
    console.timeEnd('generate:total');
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
