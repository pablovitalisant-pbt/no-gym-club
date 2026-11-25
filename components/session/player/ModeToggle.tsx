'use client';

import { useTranslations } from 'next-intl';
import type { RunMode } from '@/lib/session/continuous';

interface Props {
  mode: RunMode;
  onChange: (mode: RunMode) => void;
}

/** Auto (corre sola) | Manual (espera "Continuar"), cambiable en medio de la sesión. */
export default function ModeToggle({ mode, onChange }: Props) {
  const t = useTranslations('session');
  const options: { value: RunMode; label: string }[] = [
    { value: 'auto', label: t('modeAuto') },
    { value: 'manual', label: t('modeManual') },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-label-bold uppercase tracking-wider text-on-surface-variant">{t('modeLabel')}</span>
      <div role="radiogroup" aria-label={t('modeLabel')} className="flex gap-1 rounded-full border border-outline-variant bg-surface-900 p-1">
      {options.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            aria-checked={active}
            className={`min-h-[44px] rounded-full px-4 font-label-bold text-label-bold uppercase tracking-wide transition-colors motion-reduce:transition-none ${active ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
          >
            {option.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
