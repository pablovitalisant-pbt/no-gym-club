'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <div className="mb-6 flex gap-1 text-xs text-on-surface-variant">
        {EXERCISES.map((e, i) => (
          <span
            key={e}
            className={
              i === step
                ? 'text-primary font-bold'
                : i < step
                  ? 'opacity-40'
                  : ''
            }
          >
            {i + 1}. {t(e)}
            {i < EXERCISES.length - 1 && ' → '}
          </span>
        ))}
      </div>

      {/* Exercise card */}
      <div className="w-full mb-lg group relative overflow-hidden brutalist-border bg-surface-800">
        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-surface-700 to-surface-800"></div>
      </div>

      {/* Exercise details */}
      <div className="w-full text-center mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight mb-sm">
          {t(`${ex}Title`)}
        </h2>
        <div className="brutalist-border p-4 text-left border-l-4 border-l-primary-container bg-surface-800">
          <p className="font-body-md text-body-md text-on-surface-variant">
            <span className="font-bold text-primary-container mr-2 uppercase">Hint:</span>
            {t(`${ex}Hint`)}
          </p>
        </div>
      </div>

      {/* Input for numeric exercises */}
      {!isPlank && (
        <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-4 mb-xl">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant tracking-widest" htmlFor="reps">
            {t('reps')}
          </label>
          <div className="relative w-full">
            <input
              id="reps"
              type="number"
              min={0}
              value={currentValue()}
              onChange={(e) => setResult(e.target.value)}
              className="w-full bg-surface-900 border-2 border-outline py-6 px-4 text-center font-display-lg text-headline-lg text-primary focus:border-primary-container focus:shadow-[0_0_0_1px_#e8570a] transition-all duration-200 outline-none"
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* Timer for plank */}
      {isPlank && (
        <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-6 mb-xl">
          <div className="text-center">
            <span className="text-5xl font-mono font-bold text-on-surface">
              {timerSeconds}
            </span>
            <span className="text-sm text-on-surface-variant"> s</span>
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

          <p className="text-center text-xs text-on-surface-variant">
            {t('plankManual')}
          </p>
          <input
            type="number"
            min={0}
            value={results.plank}
            onChange={(e) => setResults((prev) => ({ ...prev, plank: e.target.value }))}
            className="w-full bg-surface-900 border-2 border-outline py-6 px-4 text-center font-display-lg text-headline-lg text-primary focus:border-primary-container outline-none"
            placeholder="0"
          />

          {error && (
            <p className="text-center text-sm text-error">{error}</p>
          )}
        </div>
      )}

      {/* Sticky footer bar */}
      <footer className="w-full p-margin-mobile md:px-margin-desktop md:py-lg bg-background border-t border-outline sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto flex gap-4 w-full">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} iconLeft={ArrowLeft} className="flex-1 md:flex-none !py-4">
              {t('back')}
            </Button>
          )}
          {!isLast && (
            <Button type="button" variant="primary" onClick={() => setStep((s) => s + 1)} iconRight={ArrowRight} className="flex-[2] !py-4">
              {t('next')}
            </Button>
          )}
          {isLast && (
            <Button type="button" variant="primary" onClick={handleSubmit} disabled={loading} className="flex-[2] !py-4">
              {loading ? '...' : t('submit')}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
