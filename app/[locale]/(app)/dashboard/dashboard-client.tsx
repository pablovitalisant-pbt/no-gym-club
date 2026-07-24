'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Play, Brain } from 'lucide-react';
import type { SessionData } from '@/lib/types/session';

// ─── Types ───

interface GenerateResponse {
  session_id?: string;
  session?: SessionData;
  error?: string;
}

interface InitialSession {
  id: string;
  session_data: SessionData;
  completed_at: string | null;
}

type ViewState =
  | 'idle'
  | 'has-session'
  | 'loading'
  | 'streaming'
  | 'success'
  | 'error';

// ─── Helpers ───

function pickLocale<T extends string>(
  obj: Record<string, T> | undefined,
  locale: string,
  fallback: string,
): string {
  const key = `${fallback}_${locale}`;
  return (obj as Record<string, string> | undefined)?.[key] ?? '';
}

const SECTION_COLORS: Record<string, { bar: string; text: string }> = {
  warmup: { bar: 'bg-green-500', text: 'text-green-500' },
  main: { bar: 'bg-primary-container', text: 'text-primary-container' },
  cooldown: { bar: 'bg-blue-500', text: 'text-blue-500' },
};

const SECTION_LABELS: Record<string, string> = {
  warmup: 'warmup',
  main: 'main',
  cooldown: 'cooldown',
};

// ─── Sub-components ───

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-accent"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function SessionCard({
  session,
  locale,
}: {
  session: SessionData;
  locale: string;
}) {
  const t = useTranslations('dashboard');

  return (
    <div className="brutalist-border bg-surface-800 p-sm md:p-md">
      {/* Header */}
      <div className="mb-md">
        <p className="font-label-bold text-label-bold uppercase text-primary mb-1">
          {t('sessionTitle')}
        </p>
        <h2 className="font-headline-md text-headline-md text-on-surface">
          {pickLocale(session as unknown as Record<string, string>, locale, 'title') ||
            session.title_es}
        </h2>
      </div>

      {/* Sections */}
      {(['warmup', 'main', 'cooldown'] as const).map((section, idx) => {
        const items = session[section];
        if (!items?.length) return null;
        const colors = SECTION_COLORS[section];
        const isLast = idx === 2;
          return (
          <div key={section} className={!isLast ? 'mb-md' : ''}>
            <div className="flex items-center gap-2 mb-sm">
              <span className={`w-2 h-6 ${colors.bar}`} />
              <h3 className={`font-label-bold text-label-bold ${colors.text} uppercase tracking-widest`}>
                {t(SECTION_LABELS[section])}
              </h3>
            </div>
            <div className="grid gap-base">
              {items.map((ex, i) => (
                <div key={i} className="bg-surface-800 border border-outline p-sm flex justify-between items-center">
                  <div>
                    <p className="font-label-bold text-on-surface">{ex.exercise}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {ex.sets != null && ex.reps
                        ? `${ex.sets} × ${ex.reps}`
                        : ex.duration_seconds != null
                          ? `${ex.duration_seconds}s`
                          : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {ex.rpe != null && (
                      <p className={`font-mono-data ${section === 'main' ? 'text-primary' : 'text-on-surface'}`}>
                        RPE: {ex.rpe}
                      </p>
                    )}
                    {ex.rest_seconds != null && (
                      <p className="text-label-sm text-on-surface-variant">
                        {ex.rest_seconds}s
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───

export default function DashboardClient({
  locale,
  showLog: _showLog,
  initialSession,
}: {
  locale: string;
  showLog: boolean;
  initialSession?: InitialSession | null;
}) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const initialView: ViewState = initialSession && !initialSession.completed_at ? 'has-session' : 'idle';
  const [viewState, setViewState] = useState<ViewState>(initialView);
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [streamText, setStreamText] = useState('');

  async function handleGenerate() {
    setViewState('loading');
    setErrorMsg('');
    setStreamText('');

    try {
      const res = await fetch('/api/generate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
        body: JSON.stringify({ locale }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        setErrorMsg(data.error || `HTTP ${res.status}`);
        setViewState('error');
        return;
      }

      // Streaming: read chunks
      setViewState('streaming');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamText(fullText);
      }

      // Parse: split SESSION_ID marker from JSON
      const metaIdx = fullText.lastIndexOf('\nSESSION_ID:');
      let jsonText: string;
      let metaValue: string | null = null;

      if (metaIdx !== -1) {
        jsonText = fullText.slice(0, metaIdx);
        metaValue = fullText.slice(metaIdx + '\nSESSION_ID:'.length).trim();
      } else {
        jsonText = fullText;
      }

      // Validate meta
      if (!metaValue || metaValue.startsWith('error:')) {
        const errDetail = metaValue?.replace('error:', '') || 'stream failed';
        setErrorMsg(errDetail);
        setViewState('error');
        return;
      }

      // Parse JSON
      let sessionData: SessionData;
      try {
        sessionData = JSON.parse(jsonText);
      } catch {
        setErrorMsg('Failed to parse AI response');
        setViewState('error');
        return;
      }

      setSession(sessionData);
      setSessionId(metaValue);
      setViewState('success');
    } catch {
      setErrorMsg(t('error'));
      setViewState('error');
    }
  }

  return (
    <div>
      {/* Idle header */}
      {viewState === 'idle' && (
        <header className="mb-lg">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">
            {t('idleHint')}
          </h2>
          <div className="hud-line w-full opacity-30"></div>
        </header>
      )}

      {/* Idle state */}
      {viewState === 'idle' && (
        <div className="text-center py-24 space-y-4">
          <p className="text-on-surface-variant font-body-md">{t('idleHint')}</p>
          <Button onClick={handleGenerate}>{t('generate')}</Button>
        </div>
      )}

      {/* Has existing session */}
      {viewState === 'has-session' && initialSession && (
        <div className="text-center py-24 space-y-4">
          <header className="mb-lg">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">
              {t('sessionTitle')}
            </h2>
            <div className="hud-line w-full opacity-30"></div>
          </header>
          <SessionCard session={initialSession.session_data} locale={locale} />
          <div className="flex flex-col md:flex-row gap-gutter justify-center pt-md">
            <Button
              onClick={() => router.push(`/session/${initialSession.id}`)}
              iconRight={Play}
              className="flex-1 max-w-xs uppercase !py-5"
            >
              {t('startSession')}
            </Button>
            <Button variant="ghost" onClick={handleGenerate} className="max-w-xs uppercase !py-5">
              {t('regenerate')}
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {viewState === 'loading' && (
        <div className="text-center py-24 space-y-4">
          <div className="flex justify-center">
            <Spinner />
          </div>
          <p className="text-on-surface-variant font-body-md">{t('generating')}</p>
        </div>
      )}

      {/* Streaming state */}
      {viewState === 'streaming' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Spinner />
            <span>{t('streaming')}</span>
          </div>
          <pre className="bg-surface-800 brutalist-border p-4 text-xs text-on-surface font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
            {streamText}
          </pre>
        </div>
      )}

      {/* Error state */}
      {viewState === 'error' && (
        <div className="text-center py-24 space-y-4">
          <p className="text-error font-body-md">{errorMsg}</p>
          <Button variant="ghost" onClick={handleGenerate}>
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Success state */}
      {viewState === 'success' && session && (
        <>
          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Main Session Card (8 Cols) */}
            <section className="lg:col-span-8 flex flex-col gap-sm">
              <SessionCard session={session} locale={locale} />
            </section>

            {/* Sidebar (4 Cols) */}
            <aside className="lg:col-span-4 flex flex-col gap-sm">
              {/* AI Reasoning Card */}
              <div className="brutalist-border bg-surface-800 p-sm md:p-md border-l-2 border-l-primary-container">
                <div className="flex items-center gap-2 mb-sm">
                  <Brain className="text-primary" size={20} />
                  <h3 className="font-label-bold text-label-bold uppercase text-on-surface">
                    {t('rationale')}
                  </h3>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed mb-md">
                  {locale === 'en' ? session.rationale_en : session.rationale_es}
                </p>
                {session.science_refs?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {session.science_refs.map((ref) => (
                      <span
                        key={ref}
                        className="bg-surface-800 px-3 py-1 font-label-bold text-label-sm uppercase border border-outline text-on-surface-variant"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Action Buttons */}
          {sessionId && (
            <div className="mt-lg flex flex-col md:flex-row gap-gutter">
              <Button
                onClick={() => router.push(`/session/${sessionId}`)}
                iconRight={Play}
                className="flex-1 uppercase !py-5 !text-body-lg"
              >
                {t('startSession')}
              </Button>
              <Button
                variant="ghost"
                onClick={handleGenerate}
                className="md:w-1/3 uppercase !py-5"
              >
                {t('regenerate')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
