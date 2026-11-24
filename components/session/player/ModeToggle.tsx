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
    <div className="flex gap-1 border-2 border-control-bg bg-background">
      {options.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`min-h-[44px] px-4 font-label-bold text-label-bold uppercase bg-control-bg text-control-fg ${
              active ? 'underline underline-offset-4 decoration-[4px]' : 'border-2 border-transparent'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
