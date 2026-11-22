import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import {
  CARDIO_PREFERENCES,
  type CardioPreference,
} from '@/lib/assessment/validate';

interface Props {
  value: CardioPreference;
  onChange: (value: CardioPreference) => void;
  onBack: () => void;
  onNext: () => void;
}

export function CardioStep({ value, onChange, onBack, onNext }: Props) {
  const t = useTranslations('assessment');

  return (
    <div className="space-y-lg">
      <header>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
          {t('cardio.title')}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('cardio.hint')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
        {CARDIO_PREFERENCES.map((option) => (
          <label key={option} className="relative cursor-pointer group">
            <input type="radio" name="cardio" className="sr-only peer" checked={value === option} onChange={() => onChange(option)} />
            <div className="brutalist-border p-4 bg-surface-800 peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all group-hover:bg-surface-700">
              <span className="font-label-bold text-label-sm uppercase">{t(`cardio.${option}`)}</span>
              <p className="text-[10px] opacity-70 mt-1 uppercase">{t(`cardio.${option}Desc`)}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-between pt-lg">
        <Button type="button" variant="ghost" onClick={onBack}>{t('back')}</Button>
        <Button type="button" variant="primary" onClick={onNext} iconRight={ArrowRight} className="!py-md">{t('next')}</Button>
      </div>
    </div>
  );
}
