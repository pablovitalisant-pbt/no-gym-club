'use client';

import { useTranslations } from 'next-intl';
import type { SessionExercise, SessionData } from '@/lib/types/session';

const SECTIONS = ['warmup', 'main', 'finisher', 'cardio', 'cooldown'] as const;

function exerciseAmount(ex: SessionExercise): string {
  if (ex.sets != null && ex.reps) return `${ex.sets} × ${ex.reps}`;
  if (ex.sets != null && ex.duration_seconds != null) return `${ex.sets} × ${ex.duration_seconds}s`;
  if (ex.reps) return ex.reps;
  if (ex.duration_seconds != null) return `${ex.duration_seconds}s`;
  return '';
}

export default function PlanExerciseList({ session }: { session: SessionData }) {
  const t = useTranslations('dashboard.plan');

  return (
    <div className="space-y-md">
      {SECTIONS.map((section) => {
        const items = session[section];
        if (!items?.length) return null;
        return (
          <section key={section}>
            <h3 className="font-label-bold text-label-bold uppercase tracking-widest text-primary mb-sm">
              {t(section)}
            </h3>
            <div className="grid gap-base">
              {items.map((ex, i) => (
                <div
                  key={i}
                  className="bg-surface-800 border border-outline p-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-label-bold text-on-surface">{ex.exercise}</p>
                    <p className="text-label-sm text-on-surface-variant">{exerciseAmount(ex)}</p>
                  </div>
                  {ex.rest_seconds != null && (
                    <p className="text-label-sm text-on-surface-variant">
                      {t('restSeconds', { seconds: ex.rest_seconds })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
