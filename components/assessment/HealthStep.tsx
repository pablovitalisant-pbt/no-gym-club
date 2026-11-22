import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import {
  HEALTH_LIMITATIONS,
  type HealthLimitation,
} from '@/lib/assessment/validate';

interface Props {
  limitations: HealthLimitation[];
  onToggle: (limitation: HealthLimitation) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function HealthStep({ limitations, onToggle, notes, onNotesChange, onBack, onNext }: Props) {
  const t = useTranslations('assessment');
  const inputCls = 'w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface font-mono-data text-body-md';

  return (
    <div className="space-y-lg">
      <header>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
          {t('health.title')}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('health.hint')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
        {HEALTH_LIMITATIONS.map((limitation) => (
          <label key={limitation} className="relative cursor-pointer group">
            <input type="checkbox" className="sr-only peer" checked={limitations.includes(limitation)} onChange={() => onToggle(limitation)} />
            <div className="brutalist-border p-4 bg-surface-800 peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all group-hover:bg-surface-700">
              <span className="font-label-bold text-label-sm uppercase">{t(`health.${limitation}`)}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="space-y-xs">
        <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="limitations-notes">
          {t('health.notes')}
        </label>
        <textarea
          id="limitations-notes"
          maxLength={300}
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className={inputCls}
          placeholder={t('health.notesPlaceholder')}
        />
        <p className="text-right text-[10px] opacity-50 font-mono-data">
          {t('profile.charCount', { count: notes.length })}
        </p>
      </div>

      <div className="flex justify-between pt-lg">
        <Button type="button" variant="ghost" onClick={onBack}>{t('back')}</Button>
        <Button type="button" variant="primary" onClick={onNext} iconRight={ArrowRight} className="!py-md">{t('next')}</Button>
      </div>
    </div>
  );
}
