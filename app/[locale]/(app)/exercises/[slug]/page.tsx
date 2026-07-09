import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Dumbbell } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];

const diffColors: Record<string, string> = {
  beginner: 'border-green-500/50 bg-green-500/10 text-green-500',
  intermediate: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
  advanced: 'border-red-500/50 bg-red-500/10 text-red-500',
};

export default async function ExerciseDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations({ locale, namespace: 'catalog' });
  const supabase = createClient();

  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!exercise) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-body-md text-on-surface-variant">Exercise not found</p>
      </div>
    );
  }

  const name = locale === 'en' ? exercise.name_en : exercise.name_es;
  const description = locale === 'en' ? exercise.description_en : exercise.description_es;
  const instructions = locale === 'en' && exercise.instructions_en?.length
    ? exercise.instructions_en
    : exercise.instructions_es;
  return (
    <div className="max-w-2xl mx-auto space-y-lg">
      {/* Back link */}
      <a
        href={`/${locale}/exercises`}
        className="font-label-bold text-label-sm uppercase text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1"
      >
        ← {t('backToCatalog')}
      </a>

      {/* Image */}
      <div className="aspect-video bg-surface-800 border border-outline-variant overflow-hidden flex items-center justify-center">
        {exercise.gif_url ? (
          <img src={exercise.gif_url} alt={name} className="w-full h-full object-contain" />
        ) : (
          <span className="text-4xl">💪</span>
        )}
      </div>

      {/* Title + badges */}
      <div className="space-y-sm">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
          {name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono-data text-label-sm uppercase border border-primary-container/30 bg-primary-container/10 text-primary-container px-2 py-0.5">
            {exercise.category}
          </span>
          <span className={`font-mono-data text-label-sm uppercase border px-2 py-0.5 ${diffColors[exercise.difficulty]}`}>
            {exercise.difficulty}
          </span>
        </div>
        {description && (
          <p className="font-body-md text-on-surface-variant leading-relaxed">{description}</p>
        )}
      </div>

      {/* Instructions */}
      {instructions && instructions.length > 0 && (
        <div className="space-y-sm">
          <h2 className="font-label-bold text-label-sm uppercase text-primary-container">{t('instructions')}</h2>
          <ol className="list-decimal list-inside space-y-1">
            {instructions.map((step: string, i: number) => (
              <li key={i} className="font-body-md text-on-surface-variant">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Muscles / Equipment grid */}
      <div className="brutalist-border bg-surface-800 p-sm grid grid-cols-2 gap-sm">
        <div>
          <p className="font-label-bold text-label-sm uppercase text-on-surface-variant mb-1">{t('muscles')}</p>
          <p className="font-body-md text-on-surface">{(exercise.muscle_groups || []).join(', ') || '—'}</p>
        </div>
        <div>
          <p className="font-label-bold text-label-sm uppercase text-on-surface-variant mb-1">{t('secondaryMuscles')}</p>
          <p className="font-body-md text-on-surface">{(exercise.secondary_muscles || []).join(', ') || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="font-label-bold text-label-sm uppercase text-on-surface-variant mb-1">{t('equipment')}</p>
          <p className="font-body-md text-on-surface">{(exercise.equipment_required || []).join(', ') || t('bodyweight') || 'Bodyweight'}</p>
        </div>
      </div>

      {/* Progressions / Regressions (count only — fields are ID arrays, not slugs) */}
      {(exercise.progression_ids?.length > 0 || exercise.regression_ids?.length > 0) && (
        <div className="brutalist-border bg-surface-800 p-sm space-y-xs">
          {exercise.progression_ids?.length > 0 && (
            <p className="font-body-md text-on-surface-variant flex items-center gap-1">
              <span className="font-label-bold text-label-sm uppercase text-primary-container">{t('progression')}:</span>
              {t('linkedExercises', { count: exercise.progression_ids.length })}
            </p>
          )}
          {exercise.regression_ids?.length > 0 && (
            <p className="font-body-md text-on-surface-variant flex items-center gap-1">
              <span className="font-label-bold text-label-sm uppercase text-primary-container">{t('regression')}:</span>
              {t('linkedExercises', { count: exercise.regression_ids.length })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
