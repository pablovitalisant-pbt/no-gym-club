'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { saveSessionLog } from './actions';
import type { SessionData } from '@/lib/types/session';

const RPE_DESCRIPTORS = [
  { value: 1, key: 'rpeVeryEasy' },
  { value: 2, key: 'rpeVeryEasy' },
  { value: 3, key: 'rpeEasy' },
  { value: 4, key: 'rpeEasy' },
  { value: 5, key: 'rpeModerate' },
  { value: 6, key: 'rpeModerate' },
  { value: 7, key: 'rpeHard' },
  { value: 8, key: 'rpeHard' },
  { value: 9, key: 'rpeVeryHard' },
  { value: 10, key: 'rpeMaximal' },
];

type FormState = 'idle' | 'saving' | 'error';

interface LogFormProps {
  sessionId: string;
  session: SessionData;
  onSaved: (rpe: number) => void;
}

export default function LogForm({ sessionId, session, onSaved }: LogFormProps) {
  const t = useTranslations('dashboard');
  const [rpe, setRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSave() {
    if (rpe == null) return;

    setFormState('saving');
    setErrorMsg('');

    const result = await saveSessionLog(sessionId, rpe, notes || undefined);

    if (!result.success) {
      setErrorMsg(result.error || 'Unknown error');
      setFormState('error');
      return;
    }

    onSaved(rpe);
  }

  const selected = rpe == null ? null : RPE_DESCRIPTORS.find((d) => d.value === rpe)!;

  return (
    <div className="w-full max-w-sm space-y-5 text-on-surface">
      <h3 className="text-lg font-bold text-on-surface">{t('logTitle')}</h3>

      {/* RPE: rejilla 5x2, números grandes */}
      <div>
        <p className="text-base text-on-surface mb-2">{t('rpeLabel')}</p>
        <div className="grid grid-cols-5 gap-2">
          {RPE_DESCRIPTORS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setRpe(d.value)}
              aria-pressed={rpe === d.value}
              aria-label={`RPE ${d.value} — ${t(d.key)}`}
              className={`min-h-[56px] border-2 text-xl font-bold transition-colors ${
                rpe === d.value
                  ? 'border-control-bg bg-control-bg text-control-fg'
                  : 'border-outline-variant bg-surface-800 text-on-surface hover:border-control-bg'
              }`}
            >
              {d.value}
            </button>
          ))}
        </div>
        <p className="mt-2 min-h-6 text-base font-bold text-on-surface" aria-live="polite">
          {selected ? t(selected.key) : ''}
        </p>
      </div>

      {/* Notes */}
      <div>
        <p className="text-base text-on-surface mb-1">{t('notesLabel')}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border-2 border-outline-variant bg-surface-800 px-3 py-2 text-base text-on-surface placeholder:text-on-surface/60 focus:outline-none focus:border-control-bg resize-none"
          placeholder={t('notesLabel')}
        />
      </div>

      {formState === 'error' && <p className="text-base text-error">{errorMsg}</p>}

      <Button
        onClick={handleSave}
        disabled={rpe == null || formState === 'saving'}
        className="w-full !min-h-[56px] !text-lg"
      >
        {formState === 'saving' ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
