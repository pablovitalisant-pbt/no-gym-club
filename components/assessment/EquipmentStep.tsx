import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

// calistenia pura: el selector no ofrece pesas (PRD §10.5)
const EQUIPMENT_OPTIONS = ['bodyweight', 'bar', 'ground', 'wall'] as const;

interface Props {
  equipment: string[];
  onToggle: (eq: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function EquipmentStep({ equipment, onToggle, onBack, onNext }: Props) {
  const t = useTranslations('assessment');

  return (
    <div className="space-y-lg">
      <header>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
          {t('equipment.title')}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('equipment.hint')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
        {EQUIPMENT_OPTIONS.map((eq) => (
          <label key={eq} className="relative cursor-pointer group">
            <input type="checkbox" className="sr-only peer" checked={equipment.includes(eq)} onChange={() => onToggle(eq)} />
            <div className="brutalist-border p-4 bg-surface-800 peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all group-hover:bg-surface-700">
              <span className="font-label-bold text-label-sm uppercase">{t(`equipment.${eq}`)}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-between pt-lg">
        <Button type="button" variant="ghost" onClick={onBack}>{t('back')}</Button>
        <Button type="button" variant="primary" onClick={onNext} disabled={equipment.length === 0} iconRight={ArrowRight} className="!py-md">{t('next')}</Button>
      </div>
    </div>
  );
}
