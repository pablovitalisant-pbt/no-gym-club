'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import LogForm from './log-form';
import type { SessionData, SessionExercise } from '@/lib/types/session';

// ─── Types ───

interface GenerateResponse {
  session_id?: string;
  session?: SessionData;
  error?: string;
}

type ViewState = 'idle' | 'loading' | 'success' | 'completed' | 'error';

// ─── Helpers ───

function pickLocale<T extends string>(
  obj: Record<string, T> | undefined,
  locale: string,
  fallback: string,
): string {
  const key = `${fallback}_${locale}`;
  return (obj as Record<string, string> | undefined)?.[key] ?? '';
}

const SECTION_COLORS: Record<string, string> = {
  warmup: 'border-l-green-500',
  main: 'border-l-accent',
  cooldown: 'border-l-blue-500',
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
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
          {t('sessionTitle')}
        </p>
        <h2 className="text-xl font-bold text-text-primary">
          {pickLocale(session as unknown as Record<string, string>, locale, 'title') ||
            session.title_es}
        </h2>
      </div>

      {/* Sections */}
      {(['warmup', 'main', 'cooldown'] as const).map((section) => {
        const items = session[section];
        if (!items?.length) return null;

        return (
          <div key={section}>
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <span
                className={`w-1 h-4 block rounded ${SECTION_COLORS[section].replace('border-l-', 'bg-')}`}
              />
              {t(SECTION_LABELS[section])}
            </h3>
            <ul className="space-y-2">
              {items.map((ex, i) => (
                <li
                  key={i}
                  className={`border-l-2 ${SECTION_COLORS[section]} pl-3 py-2 bg-surface-800`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-text-primary">
                      {ex.exercise}
                    </span>
                    <span className="text-xs text-text-muted shrink-0">
                      {ex.sets != null && ex.reps
                        ? `${ex.sets}×${ex.reps}`
                        : ex.duration_seconds != null
                          ? `${ex.duration_seconds}s`
                          : ''}
                      {ex.rpe != null && ` · RPE ${ex.rpe}`}
                      {ex.rest_seconds != null && ` · ${ex.rest_seconds}s`}
                    </span>
                  </div>
                  {ex.notes_es && (
                    <p className="text-xs text-text-muted mt-1">
                      {locale === 'en' && ex.notes_en ? ex.notes_en : ex.notes_es}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* Rationale */}
      <div className="border-t border-border pt-4">
        <p className="text-xs uppercase tracking-widest text-text-muted mb-1">
          {t('rationale')}
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          {locale === 'en' ? session.rationale_en : session.rationale_es}
        </p>
      </div>

      {/* Science refs */}
      {session.science_refs?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted">{t('scienceRefs')}:</span>
          {session.science_refs.map((ref) => (
            <span
              key={ref}
              className="text-xs px-2 py-0.5 bg-surface-800 border border-border rounded"
            >
              {ref}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───

export default function DashboardClient({ locale }: { locale: string }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGenerate() {
    setViewState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/generate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data: GenerateResponse = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Unknown error');
        setViewState('error');
        return;
      }

      if (!data.session) {
        setErrorMsg('No session data in response');
        setViewState('error');
        return;
      }

      setSession(data.session);
      setSessionId(data.session_id ?? null);
      setViewState('success');
    } catch {
      setErrorMsg(t('error'));
      setViewState('error');
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Idle state */}
      {viewState === 'idle' && (
        <div className="text-center py-16 space-y-4">
          <p className="text-text-muted text-sm">{t('idleHint')}</p>
          <Button onClick={handleGenerate}>{t('generate')}</Button>
        </div>
      )}

      {/* Loading state */}
      {viewState === 'loading' && (
        <div className="text-center py-16 space-y-4">
          <div className="flex justify-center">
            <Spinner />
          </div>
          <p className="text-text-muted text-sm">{t('generating')}</p>
        </div>
      )}

      {/* Error state */}
      {viewState === 'error' && (
        <div className="text-center py-16 space-y-4">
          <p className="text-red-400 text-sm">{errorMsg}</p>
          <Button variant="ghost" onClick={handleGenerate}>
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Success state */}
      {viewState === 'success' && session && (
        <div className="space-y-6">
          <SessionCard session={session} locale={locale} />

          {sessionId && (
            <>
              <div className="text-center pt-4">
                <Button
                  onClick={() => router.push(`/session/${sessionId}`)}
                >
                  {t('startSession')}
                </Button>
              </div>

              <LogForm
                sessionId={sessionId}
                onSaved={() => setViewState('completed')}
              />
            </>
          )}

          <div className="text-center pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleGenerate}>
              {t('regenerate')}
            </Button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {viewState === 'completed' && session && (
        <div className="space-y-6">
          <SessionCard session={session} locale={locale} />

          <div className="border-t border-border pt-6 mt-6 text-center space-y-4">
            <p className="text-green-400 text-sm font-medium">
              {t('saved')}
            </p>
            <Button variant="ghost" onClick={handleGenerate}>
              {t('regenerate')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
