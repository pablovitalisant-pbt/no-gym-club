import { useTranslations } from 'next-intl';
import { FOCUS_AREAS, type FocusArea } from '@/lib/assessment/validate';

interface Props {
  value: FocusArea[];
  onChange: (v: FocusArea[]) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}

export function FocusAreas({ value, onChange, notes, onNotesChange }: Props) {
  const t = useTranslations('assessment');
  const inputCls = 'w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface font-mono-data text-body-md';

  function toggle(area: FocusArea) {
    if (value.includes(area)) return onChange(value.filter((a) => a !== area));
    if (value.length >= 3) return;
    onChange([...value, area]);
  }

  return (
    <div className="space-y-xs">
      <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block">
        {t('profile.focusTitle')}
      </label>
      <p className="text-[10px] uppercase opacity-50 font-label-bold">{t('profile.focusHint')}</p>
      <div className="flex flex-wrap gap-base pt-xs">
        {FOCUS_AREAS.map((area) => {
          const selected = value.includes(area);
          return (
            <button
              key={area}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(area)}
              className={`brutalist-border px-3 py-2 font-label-bold text-label-sm uppercase transition-all ${
                selected
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-800 text-on-surface-variant hover:bg-surface-700'
              }`}
            >
              {t(`profile.focus_${area}`)}
            </button>
          );
        })}
      </div>
      <input
        id="focus_notes"
        type="text"
        maxLength={300}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        className={inputCls}
        placeholder={t('profile.focusNotesPlaceholder')}
        aria-label={t('profile.focusNotes')}
      />
    </div>
  );
}
