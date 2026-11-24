'use client';

import { useTranslations } from 'next-intl';

interface Props {
  exerciseName: string;
  set: number;
  sets: number;
  side?: 'left' | 'right';
  prescribed: string;
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
}

function bump(value: string, delta: number): string {
  const n = Number.parseInt(value, 10);
  const next = Number.isFinite(n) ? Math.max(0, n + delta) : Math.max(0, delta);
  return String(next);
}

/** Serie por repeticiones: el usuario registra en el momento y marca "Serie hecha". */
export default function RepsScreen({
  exerciseName,
  set,
  sets,
  side,
  prescribed,
  value,
  onChange,
  onDone,
}: Props) {
  const t = useTranslations('session');
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-background text-on-surface px-margin-mobile py-md text-center">
      <h2 className="font-headline-lg text-headline-lg uppercase">{exerciseName}</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
        {t('setOf', { current: set, total: sets })}
        {side && ` · ${t('side', { n: side === 'left' ? 1 : 2 })}`}
      </p>

      <p className="font-label-bold text-label-bold uppercase tracking-widest text-primary-container mt-md">
        {t('objective')}
      </p>
      <p className="font-display-lg text-[96px] leading-none text-primary">{prescribed}</p>

      <div className="flex items-center gap-4 my-md">
        <button
          onClick={() => onChange(bump(value, -1))}
          className="min-h-[64px] w-16 border-2 border-control-bg bg-control-bg text-control-fg font-display-lg text-[32px] leading-none"
          aria-label={t('repsMinus')}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('repsDone')}
          className="w-28 h-16 text-center font-display-lg text-[40px] leading-none border-2 border-outline-variant bg-surface-900 text-on-surface tabular-nums"
        />
        <button
          onClick={() => onChange(bump(value, 1))}
          className="min-h-[64px] w-16 border-2 border-control-bg bg-control-bg text-control-fg font-display-lg text-[32px] leading-none"
          aria-label={t('repsPlus')}
        >
          +
        </button>
      </div>

      <button
        onClick={onDone}
        className="w-full max-w-sm min-h-[96px] border-2 border-primary bg-primary text-on-primary font-display-lg text-[32px] uppercase leading-none"
      >
        {t('repsDone')}
      </button>
    </div>
  );
}
