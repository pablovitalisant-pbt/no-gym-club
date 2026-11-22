'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { saveTestResults } from '@/app/[locale]/(app)/assessment/test/actions';
import { buildTestResults } from '@/lib/assessment/test-flow';
import { useStopwatch } from './useStopwatch';
import { TestStepBody, type Answers } from './TestStepBody';

type Step = 'pushup' | 'sit' | 'plank' | 'hang' | 'pullup' | 'walk';

const initial: Answers = {
  pushup: 'floor',
  pushupReps: '',
  sit: '',
  plankType: 'knee',
  plankSeconds: '',
  hang: '',
  pullups: '',
  walk: null,
};

const num = (v: string) => (v === '' ? null : Number(v));

export function TestWizard({ hasBar }: { hasBar: boolean }) {
  const t = useTranslations('assessment.test');
  const router = useRouter();
  const [step, setStep] = useState<Step>('pushup');
  const [answers, setAnswers] = useState<Answers>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timers = { sit: useStopwatch(30), plank: useStopwatch(), hang: useStopwatch() };

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function advance() {
    if (step === 'pushup') setStep('sit');
    else if (step === 'sit') setStep('plank');
    else if (step === 'plank') setStep(hasBar ? 'hang' : 'walk');
    else if (step === 'hang') setStep(Number(answers.hang) >= 10 ? 'pullup' : 'walk');
    else if (step === 'pullup') setStep('walk');
  }

  function back() {
    if (step === 'sit') setStep('pushup');
    else if (step === 'plank') setStep('sit');
    else if (step === 'hang') setStep('plank');
    else if (step === 'pullup') setStep('hang');
    else if (step === 'walk') setStep(hasBar ? (Number(answers.hang) >= 10 ? 'pullup' : 'hang') : 'plank');
  }

  function cannot() {
    if (step === 'pushup') set('pushup', 'none');
    else if (step === 'sit') set('sit', '');
    else if (step === 'plank') set('plankSeconds', '');
    else if (step === 'hang') set('hang', '');
    else if (step === 'pullup') set('pullups', '');
    else set('walk', null);
    advance();
  }

  async function submit() {
    setLoading(true);
    setError('');
    const result = await saveTestResults(buildTestResults({
      pushup: answers.pushup,
      pushupReps: Number(answers.pushupReps) || 0,
      sitToStand: num(answers.sit),
      plankType: answers.plankType,
      plankSeconds: num(answers.plankSeconds),
      deadHangSeconds: hasBar ? num(answers.hang) : null,
      maxPullups: hasBar ? num(answers.pullups) : null,
      walk: answers.walk,
    }));
    if (!result.success) {
      setError(result.error || 'Error');
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="mx-auto max-w-lg space-y-lg">
      <header>
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase">{t('title')}</h2>
        <p className="font-body-md text-on-surface-variant">{t('hint')}</p>
      </header>

      <TestStepBody step={step} answers={answers} set={set} timers={timers} />

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex flex-wrap justify-between gap-3 pt-md">
        {step !== 'pushup' ? (
          <Button type="button" variant="ghost" onClick={back}>{t('back')}</Button>
        ) : <span />}
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={cannot}>{t('cannot')}</Button>
          {step !== 'walk' && (
            <Button type="button" variant="primary" onClick={advance}>{t('next')}</Button>
          )}
          {step === 'walk' && (
            <Button type="button" variant="primary" onClick={submit} disabled={loading}>
              {loading ? '...' : t('submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
