'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import type { PushupVariant } from '@/lib/assessment/validate';
import type { WalkRangeKey } from '@/lib/assessment/test-flow';
import type { useStopwatch } from './useStopwatch';

export interface Answers {
  pushup: PushupVariant;
  pushupReps: string;
  sit: string;
  plankType: 'knee' | 'full';
  plankSeconds: string;
  hang: string;
  pullups: string;
  walk: WalkRangeKey | null;
}

type Set = <K extends keyof Answers>(key: K, value: Answers[K]) => void;
type Stopwatch = ReturnType<typeof useStopwatch>;

const VARIANTS: PushupVariant[] = ['floor', 'knee', 'incline', 'wall', 'none'];
const WALKS: WalkRangeKey[] = ['0', '5', '10', '20', '30'];

const inputClass =
  'w-full bg-surface-900 border-2 border-outline py-4 px-4 text-center font-display-lg text-headline-lg text-primary focus:border-primary-container outline-none';

export function TestStepBody({
  step, answers, set, timers,
}: {
  step: string;
  answers: Answers;
  set: Set;
  timers: { sit: Stopwatch; plank: Stopwatch; hang: Stopwatch };
}) {
  const t = useTranslations('assessment.test');

  function Timer({ s }: { s: Stopwatch }) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-4xl font-mono font-bold text-on-surface">{s.seconds}</span>
        <span className="text-on-surface-variant">{t('seconds')}</span>
        {!s.running ? (
          <Button type="button" variant="primary" onClick={s.start}>{t('start')}</Button>
        ) : (
          <Button type="button" variant="ghost" onClick={s.stop}>{t('stop')}</Button>
        )}
      </div>
    );
  }

  if (step === 'pushup') {
    return (
      <section className="space-y-md">
        <h3 className="font-label-bold uppercase text-primary">{t('pushupTitle')}</h3>
        <p className="text-body-md text-on-surface-variant">{t('pushupHint')}</p>
        <div className="grid grid-cols-2 gap-base">
          {VARIANTS.map((v) => (
            <button key={v} type="button" onClick={() => set('pushup', v)}
              className={`brutalist-border p-3 text-center font-label-bold text-label-sm uppercase ${answers.pushup === v ? 'bg-primary-container text-on-primary-container' : 'bg-surface-800'}`}>
              {t(`pushup_${v}`)}
            </button>
          ))}
        </div>
        {answers.pushup !== 'none' && (
          <label className="block text-label-sm uppercase text-on-surface-variant">
            {t('reps')}
            <input type="number" min={0} value={answers.pushupReps} onChange={(e) => set('pushupReps', e.target.value)} className={`mt-2 ${inputClass}`} placeholder="0" />
          </label>
        )}
      </section>
    );
  }

  if (step === 'sit') {
    return (
      <section className="space-y-md">
        <h3 className="font-label-bold uppercase text-primary">{t('sitTitle')}</h3>
        <p className="text-body-md text-on-surface-variant">{t('sitHint')}</p>
        <Timer s={timers.sit} />
        <label className="block text-label-sm uppercase text-on-surface-variant">
          {t('sitResult')}
          <input type="number" min={0} value={answers.sit} onChange={(e) => set('sit', e.target.value)} className={`mt-2 ${inputClass}`} placeholder="0" />
        </label>
      </section>
    );
  }

  if (step === 'plank') {
    return (
      <section className="space-y-md">
        <h3 className="font-label-bold uppercase text-primary">{t('plankTitle')}</h3>
        <p className="text-body-md text-on-surface-variant">{t('plankHint')}</p>
        <div className="grid grid-cols-2 gap-base">
          {(['knee', 'full'] as const).map((p) => (
            <button key={p} type="button" onClick={() => set('plankType', p)}
              className={`brutalist-border p-3 text-center font-label-bold text-label-sm uppercase ${answers.plankType === p ? 'bg-primary-container text-on-primary-container' : 'bg-surface-800'}`}>
              {p === 'knee' ? t('plankKnee') : t('plankFull')}
            </button>
          ))}
        </div>
        <Timer s={timers.plank} />
        <input type="number" min={0} value={answers.plankSeconds} onChange={(e) => set('plankSeconds', e.target.value)} className={inputClass} placeholder={t('manualSeconds')} />
      </section>
    );
  }

  if (step === 'hang') {
    return (
      <section className="space-y-md">
        <h3 className="font-label-bold uppercase text-primary">{t('hangTitle')}</h3>
        <p className="text-body-md text-on-surface-variant">{t('hangHint')}</p>
        <Timer s={timers.hang} />
        <input type="number" min={0} value={answers.hang} onChange={(e) => set('hang', e.target.value)} className={inputClass} placeholder={t('manualSeconds')} />
      </section>
    );
  }

  if (step === 'pullup') {
    return (
      <section className="space-y-md">
        <h3 className="font-label-bold uppercase text-primary">{t('pullupTitle')}</h3>
        <p className="text-body-md text-on-surface-variant">{t('pullupHint')}</p>
        <label className="block text-label-sm uppercase text-on-surface-variant">
          {t('reps')}
          <input type="number" min={0} value={answers.pullups} onChange={(e) => set('pullups', e.target.value)} className={`mt-2 ${inputClass}`} placeholder="0" />
        </label>
      </section>
    );
  }

  return (
    <section className="space-y-md">
      <h3 className="font-label-bold uppercase text-primary">{t('walkTitle')}</h3>
      <p className="text-body-md text-on-surface-variant">{t('walkHint')}</p>
      <div className="grid grid-cols-2 gap-base">
        {WALKS.map((w) => (
          <button key={w} type="button" onClick={() => set('walk', w)}
            className={`brutalist-border p-3 text-center font-label-bold text-label-sm uppercase ${answers.walk === w ? 'bg-primary-container text-on-primary-container' : 'bg-surface-800'}`}>
            {t(`walk_${w}`)}
          </button>
        ))}
      </div>
    </section>
  );
}
