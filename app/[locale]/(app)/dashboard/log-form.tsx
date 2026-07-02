'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { saveSessionLog } from './actions';

const RPE_DESCRIPTORS = [
  { value: 1, key: 'rpeVeryEasy', color: 'bg-green-700 hover:bg-green-600' },
  { value: 2, key: 'rpeVeryEasy', color: 'bg-green-700 hover:bg-green-600' },
  { value: 3, key: 'rpeEasy', color: 'bg-green-600 hover:bg-green-500' },
  { value: 4, key: 'rpeEasy', color: 'bg-green-600 hover:bg-green-500' },
  { value: 5, key: 'rpeModerate', color: 'bg-yellow-600 hover:bg-yellow-500' },
  { value: 6, key: 'rpeModerate', color: 'bg-yellow-600 hover:bg-yellow-500' },
  { value: 7, key: 'rpeHard', color: 'bg-orange-600 hover:bg-orange-500' },
  { value: 8, key: 'rpeHard', color: 'bg-orange-600 hover:bg-orange-500' },
  { value: 9, key: 'rpeVeryHard', color: 'bg-red-700 hover:bg-red-600' },
  { value: 10, key: 'rpeMaximal', color: 'bg-red-800 hover:bg-red-700' },
];

type FormState = 'idle' | 'saving' | 'saved' | 'error';

interface LogFormProps {
  sessionId: string;
  onSaved: () => void;
}

export default function LogForm({ sessionId, onSaved }: LogFormProps) {
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

    setFormState('saved');
    onSaved();
  }

  if (formState === 'saved') {
    return (
      <div className="border-t border-border pt-6 mt-6 text-center">
        <p className="text-green-400 text-sm font-medium">
          {t('saved')}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-6 mt-6 space-y-5">
      <h3 className="text-sm font-semibold text-text-primary">
        {t('logTitle')}
      </h3>

      {/* RPE selector */}
      <div>
        <p className="text-xs text-text-muted mb-2">{t('rpeLabel')}</p>
        <div className="flex gap-1 flex-wrap">
          {RPE_DESCRIPTORS.map((d) => {
            const firstInGroup = RPE_DESCRIPTORS.find(
              (x) => x.key === d.key,
            )!;
            const showLabel = firstInGroup.value === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setRpe(d.value)}
                className={`w-9 h-9 text-xs font-semibold rounded transition-all
                  ${rpe === d.value ? `${d.color} text-white ring-2 ring-white/30 scale-110` : 'bg-surface-800 text-text-muted hover:bg-surface-700'}
                `}
                title={showLabel ? t(d.key) : undefined}
                aria-label={`RPE ${d.value}${showLabel ? ` — ${t(d.key)}` : ''}`}
              >
                {d.value}
              </button>
            );
          })}
        </div>
        {rpe != null && (
          <p className="text-xs text-accent mt-1">
            {t(RPE_DESCRIPTORS.find((d) => d.value === rpe)!.key)}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs text-text-muted mb-1">{t('notesLabel')}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-surface-800 border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none"
          placeholder={t('notesLabel')}
        />
      </div>

      {/* Error */}
      {formState === 'error' && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={rpe == null || formState === 'saving'}
      >
        {formState === 'saving' ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
