import { type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

const PARQ_QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const;

interface Props {
  parq: Record<string, boolean>;
  setParq: Dispatch<SetStateAction<Record<string, boolean>>>;
  error: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function ParqStep({ parq, setParq, error, loading, onBack, onSubmit }: Props) {
  const t = useTranslations('assessment');

  return (
    <div className="space-y-lg">
      <header>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
          {t('parq.title')}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('parq.description')}</p>
      </header>

      {PARQ_QUESTIONS.map((q) => (
        <div key={q} className="brutalist-border p-4 bg-surface-800 space-y-sm">
          <p className="font-body-md text-on-surface">{t(`parq.${q}`)}</p>
          <div className="grid grid-cols-2 gap-base">
            <label className="relative cursor-pointer group">
              <input type="radio" name={q} className="sr-only peer" checked={parq[q] === true} onChange={() => setParq((prev) => ({ ...prev, [q]: true }))} />
              <div className="brutalist-border p-3 text-center peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all">
                <span className="font-label-bold text-label-sm uppercase">{t('parq.yes')}</span>
              </div>
            </label>
            <label className="relative cursor-pointer group">
              <input type="radio" name={q} className="sr-only peer" checked={parq[q] === false} onChange={() => setParq((prev) => ({ ...prev, [q]: false }))} />
              <div className="brutalist-border p-3 text-center peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all">
                <span className="font-label-bold text-label-sm uppercase">{t('parq.no')}</span>
              </div>
            </label>
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-between pt-lg">
        <Button type="button" variant="ghost" onClick={onBack}>{t('back')}</Button>
        <Button type="button" variant="primary" onClick={onSubmit} disabled={loading || PARQ_QUESTIONS.some((q) => parq[q] === undefined)} className="!py-md">
          {loading ? '...' : t('submit')}
        </Button>
      </div>
    </div>
  );
}
