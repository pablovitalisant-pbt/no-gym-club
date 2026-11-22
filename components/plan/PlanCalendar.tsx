'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { buildCalendar } from '@/lib/plan/calendar';
import type { PlanData } from '@/lib/types/plan';

export default function PlanCalendar({
  plan,
  viewedIdx,
  currentDayIndex,
  completedDayIndexes,
  locale,
  onSelect,
  onClose,
}: {
  plan: PlanData;
  viewedIdx: number;
  currentDayIndex: number;
  completedDayIndexes: number[];
  locale: string;
  onSelect: (idx: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations('dashboard.plan');
  const blocks = buildCalendar(plan, currentDayIndex, completedDayIndexes, locale);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 overflow-y-auto p-sm md:p-md"
    >
      <div className="max-w-3xl mx-auto bg-surface-800 brutalist-border p-sm md:p-md">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-headline-md text-headline-md uppercase text-on-surface">
            {t('calendar')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeCalendar')}
            className="p-2 border border-border text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {blocks.map((block) => (
          <section key={block.phaseIndex} className="mb-md last:mb-0">
            <h3 className="font-label-bold text-label-bold uppercase text-primary mb-sm">
              {block.name
                ? t('phaseHeader', { n: block.phaseIndex + 1, name: block.name })
                : t('phaseFallback', { n: block.phaseIndex + 1 })}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {block.cells.map((cell) => {
                const status = cell.completed
                  ? t('statusDone')
                  : cell.current
                    ? t('statusCurrent')
                    : cell.rest
                      ? t('statusRest')
                      : t('statusPending');
                return (
                  <button
                    key={cell.idx}
                    type="button"
                    disabled={cell.disabled}
                    onClick={() => onSelect(cell.idx)}
                    aria-label={t('calendarAria', {
                      week: cell.week,
                      day: cell.weekday + 1,
                      status,
                    })}
                    aria-current={cell.current ? 'step' : undefined}
                    className={[
                      'aspect-square border text-label-sm font-label-bold',
                      cell.completed ? 'bg-primary text-on-primary' : 'bg-surface-800 text-on-surface',
                      cell.current ? 'border-2 border-primary' : 'border-border',
                      cell.idx === viewedIdx ? 'border-accent' : '',
                      cell.rest && !cell.completed ? 'opacity-40' : '',
                      cell.disabled ? 'opacity-30 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    {cell.dayInPhase + 1}
                  </button>
                );
              })}
            </div>
            {!block.generated && (
              <p className="text-label-sm text-on-surface-variant mt-sm">
                {t('phaseNotGenerated')}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
