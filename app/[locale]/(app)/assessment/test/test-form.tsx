'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { saveTestResults } from './actions';

const EXERCISES = [
  'pushups',
  'pullups',
  'squats',
  'dips',
  'plank',
] as const;

type Exercise = (typeof EXERCISES)[number];

export function TestForm() {
  const t = useTranslations('assessment.test');
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<Record<Exercise, string>>({
    pushups: '',
    pullups: '',
    squats: '',
    dips: '',
    plank: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // plank timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  function startTimer() {
    setTimerRunning(true);
  }

  function stopTimer() {
    setTimerRunning(false);
    setResults((prev) => ({ ...prev, plank: String(timerSeconds) }));
  }

  // reset timer when entering plank step
  useEffect(() => {
    if (EXERCISES[step] === 'plank') {
      setTimerSeconds(0);
      setTimerRunning(false);
    }
  }, [step]);

  function setResult(value: string) {
    const ex = EXERCISES[step];
    setResults((prev) => ({ ...prev, [ex]: value }));
  }

  function currentValue(): string {
    return results[EXERCISES[step]];
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    const result = await saveTestResults({
      max_pushups: Number(results.pushups) || 0,
      max_pullups: Number(results.pullups) || 0,
      max_squats: Number(results.squats) || 0,
      max_dips: Number(results.dips) || 0,
      plank_seconds: Number(results.plank) || 0,
    });

    if (!result.success) {
      setError(result.error || 'Error saving results');
      setLoading(false);
      return;
    }

    router.push('/dashboard?test=done');
  }

  const ex = EXERCISES[step];
  const isPlank = ex === 'plank';
  const isLast = step === EXERCISES.length - 1;

  return (
    <div className="mx-auto max-w-lg">
      {/* Step indicator */}
      <div className="mb-6 flex gap-1 text-xs text-text-muted">
        {EXERCISES.map((e, i) => (
          <span
            key={e}
            className={
              i === step
                ? 'text-accent'
                : i < step
                  ? 'text-text-muted/40'
                  : ''
            }
          >
            {i + 1}. {t(e)}
            {i < EXERCISES.length - 1 && ' → '}
          </span>
        ))}
      </div>

      {/* Exercise instructions */}
      <div className="mb-6 border border-border p-4">
        <h2 className="text-lg font-bold text-text-primary">
          {t(`${ex}Title`)}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {t(`${ex}Hint`)}
        </p>
      </div>

      {/* Input for numeric exercises */}
      {!isPlank && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-muted">
              {t('reps')}
            </label>
            <input
              type="number"
              min={0}
              value={currentValue()}
              onChange={(e) => setResult(e.target.value)}
              className="mt-1 w-full border border-border bg-surface-900 px-3 py-3 text-center text-2xl text-text-primary outline-none focus:border-accent"
              placeholder="0"
            />
          </div>

          <div className="flex justify-between">
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                {t('back')}
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="primary"
              onClick={() => setStep((s) => s + 1)}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Timer for plank */}
      {isPlank && (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-5xl font-mono font-bold text-text-primary">
              {timerSeconds}
            </span>
            <span className="text-sm text-text-muted"> s</span>
          </div>

          <div className="flex justify-center gap-4">
            {!timerRunning ? (
              <Button type="button" variant="primary" onClick={startTimer}>
                {t('plankStart')}
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={stopTimer}>
                {t('plankStop')}
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-text-muted">
            {t('plankManual')}
          </p>
          <input
            type="number"
            min={0}
            value={results.plank}
            onChange={(e) => setResults((prev) => ({ ...prev, plank: e.target.value }))}
            className="w-full border border-border bg-surface-900 px-3 py-3 text-center text-2xl text-text-primary outline-none focus:border-accent"
            placeholder="0"
          />

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
            >
              {t('back')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '...' : t('submit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
