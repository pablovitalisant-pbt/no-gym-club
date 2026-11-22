'use client';

import { useTranslations } from 'next-intl';
import { Dumbbell } from 'lucide-react';
import { resolveExerciseMedia } from '@/lib/exercises/resolve-media';
import { lookupMedia, type MediaIndex } from '@/lib/exercises/media-index';
import { sectionExercises, sectionMinutes, SESSION_SECTIONS } from '@/lib/plan/session-summary';
import type { SessionData, SessionExercise } from '@/lib/types/session';

function exerciseAmount(ex: SessionExercise): string {
  if (ex.sets != null && ex.reps) return `${ex.sets} × ${ex.reps}`;
  if (ex.sets != null && ex.duration_seconds != null) return `${ex.sets} × ${ex.duration_seconds}s`;
  if (ex.reps) return ex.reps;
  if (ex.duration_seconds != null) return `${ex.duration_seconds}s`;
  return '';
}

function ExerciseItem({
  ex,
  locale,
  mediaIndex,
}: {
  ex: SessionExercise;
  locale: string;
  mediaIndex: MediaIndex;
}) {
  const entry = lookupMedia(ex.exercise, mediaIndex);
  const media = resolveExerciseMedia({
    gif_url: entry?.gif_url ?? null,
    image_url: entry?.image_url ?? null,
  });
  const body = (
    <>
      <span className="w-12 h-12 shrink-0 bg-surface-900 border border-outline flex items-center justify-center overflow-hidden">
        {media.src ? (
          <img src={media.src} alt="" className="w-full h-full object-cover" />
        ) : (
          <Dumbbell size={20} className="text-on-surface-variant" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-label-bold text-on-surface">{ex.exercise}</span>
        <span className="block text-label-sm text-on-surface-variant">{exerciseAmount(ex)}</span>
      </span>
    </>
  );

  const className =
    'bg-surface-800 border border-outline p-sm flex items-center gap-sm hover:border-primary transition-colors';
  return entry ? (
    <a href={`/${locale}/exercises/${entry.slug}`} className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default function PlanExerciseList({
  session,
  locale,
  mediaIndex = {},
}: {
  session: SessionData;
  locale: string;
  mediaIndex?: MediaIndex;
}) {
  const t = useTranslations('dashboard.plan');

  return (
    <div className="space-y-sm">
      {SESSION_SECTIONS.map((section) => {
        const items = sectionExercises(session, section);
        if (!items.length) return null;
        const minutes = sectionMinutes(session, section);
        return (
          <details key={section} className="brutalist-border bg-surface-800">
            <summary className="cursor-pointer list-none p-sm flex items-center justify-between gap-sm min-h-[56px]">
              <span className="font-label-bold text-label-bold uppercase tracking-widest text-primary">
                {t(section)}
              </span>
              <span className="text-label-sm text-on-surface-variant">
                {t('sectionSummary', { count: items.length, minutes })}
              </span>
            </summary>
            <div className="grid gap-base p-sm pt-0">
              {items.map((ex, i) => (
                <ExerciseItem key={i} ex={ex} locale={locale} mediaIndex={mediaIndex} />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
