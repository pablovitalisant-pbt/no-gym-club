import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Database } from '@/lib/supabase/types';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];

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
        <p className="text-text-muted">Exercise not found</p>
      </div>
    );
  }

  const name = locale === 'en' ? exercise.name_en : exercise.name_es;
  const description = locale === 'en' ? exercise.description_en : exercise.description_es;
  const instructions = locale === 'en' && exercise.instructions_en?.length
    ? exercise.instructions_en
    : exercise.instructions_es;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <a
        href={`/${locale}/exercises`}
        className="text-xs text-text-muted hover:text-accent transition-colors"
      >
        ← {t('backToCatalog')}
      </a>

      {/* Image placeholder */}
      <div className="aspect-video bg-surface-800 rounded flex items-center justify-center text-text-muted overflow-hidden">
        {exercise.gif_url ? (
          <img
            src={exercise.gif_url}
            alt={exercise.name_en}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-4xl">💪</span>
        )}
      </div>

      {/* Title + badges */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded border bg-accent/20 text-accent border-accent/50">
            {exercise.category}
          </span>
          <span className="text-xs px-2 py-0.5 rounded border bg-surface-800 text-text-muted border-border">
            {exercise.difficulty}
          </span>
        </div>
        {description && (
          <p className="text-sm text-text-muted leading-relaxed">{description}</p>
        )}
      </div>

      {/* Instructions */}
      {instructions && instructions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary">{t('instructions')}</h2>
          <ol className="list-decimal list-inside space-y-1">
            {instructions.map((step: string, i: number) => (
              <li key={i} className="text-sm text-text-muted">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Muscles */}
      <div className="grid grid-cols-2 gap-4 bg-surface-800 border border-border rounded p-4">
        <div>
          <p className="text-xs text-text-muted mb-1">{t('muscles')}</p>
          <p className="text-sm text-text-primary">
            {(exercise.muscle_groups || []).join(', ') || '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">{t('secondaryMuscles')}</p>
          <p className="text-sm text-text-primary">
            {(exercise.secondary_muscles || []).join(', ') || '—'}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-text-muted mb-1">{t('equipment')}</p>
          <p className="text-sm text-text-primary">
            {(exercise.equipment_required || []).join(', ') || '—'}
          </p>
        </div>
      </div>

      {/* Progressions / Regressions */}
      <div className="border-t border-border pt-4 space-y-2">
        {exercise.progression_ids?.length > 0 && (
          <p className="text-xs">
            <span className="text-text-muted">{t('progression')}: </span>
            <span className="text-text-muted">
              {(exercise.progression_ids as string[]).length} linked exercise(s)
            </span>
          </p>
        )}
        {exercise.regression_ids?.length > 0 && (
          <p className="text-xs">
            <span className="text-text-muted">{t('regression')}: </span>
            <span className="text-text-muted">
              {(exercise.regression_ids as string[]).length} linked exercise(s)
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
