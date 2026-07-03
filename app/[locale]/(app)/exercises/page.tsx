import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import Link from 'next/link';
import type { Database } from '@/lib/supabase/types';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];

const CATEGORIES = ['push', 'pull', 'core', 'legs', 'cardio', 'mobility', 'skill'] as const;
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

const difficultyBadge: Record<string, string> = {
  beginner: 'bg-green-900 text-green-300 border-green-700',
  intermediate: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  advanced: 'bg-red-900 text-red-300 border-red-700',
};

export default async function ExercisesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; difficulty?: string };
}) {
  const t = await getTranslations({ locale, namespace: 'catalog' });

  if (!getFlag('exercises_catalog')) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

  const supabase = createClient();

  let query = supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .order('category');

  if (searchParams.category && CATEGORIES.includes(searchParams.category as typeof CATEGORIES[number])) {
    query = query.eq('category', searchParams.category);
  }
  if (searchParams.difficulty && DIFFICULTIES.includes(searchParams.difficulty as typeof DIFFICULTIES[number])) {
    query = query.eq('difficulty', searchParams.difficulty);
  }

  const { data: exercises } = await query;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <p className="text-xs text-text-muted">{t('filterCategory')}</p>
          <div className="flex flex-wrap gap-1">
            <a
              href={`/${locale}/exercises`}
              className={`text-xs px-2 py-1 rounded border transition-colors
                ${!searchParams.category ? 'bg-accent/20 text-accent border-accent/50' : 'bg-surface-800 text-text-muted border-border hover:bg-surface-700'}`}
            >
              {t('allCategories')}
            </a>
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/${locale}/exercises?category=${cat}`}
                className={`text-xs px-2 py-1 rounded border transition-colors
                  ${searchParams.category === cat ? 'bg-accent/20 text-accent border-accent/50' : 'bg-surface-800 text-text-muted border-border hover:bg-surface-700'}`}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-text-muted">{t('filterDifficulty')}</p>
          <div className="flex flex-wrap gap-1">
            <a
              href={`/${locale}/exercises${searchParams.category ? `?category=${searchParams.category}` : ''}`}
              className={`text-xs px-2 py-1 rounded border transition-colors
                ${!searchParams.difficulty ? 'bg-accent/20 text-accent border-accent/50' : 'bg-surface-800 text-text-muted border-border hover:bg-surface-700'}`}
            >
              {t('allDifficulties')}
            </a>
            {DIFFICULTIES.map((diff) => (
              <a
                key={diff}
                href={`/${locale}/exercises?${searchParams.category ? `category=${searchParams.category}&` : ''}difficulty=${diff}`}
                className={`text-xs px-2 py-1 rounded border transition-colors
                  ${searchParams.difficulty === diff ? 'bg-accent/20 text-accent border-accent/50' : 'bg-surface-800 text-text-muted border-border hover:bg-surface-700'}`}
              >
                {diff}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(exercises || []).map((ex: ExerciseRow) => (
          <a
            key={ex.id}
            href={`/${locale}/exercises/${ex.slug}`}
            className="block bg-surface-800 border border-border rounded p-4 hover:border-accent/50 transition-colors"
          >
            <div className="aspect-video bg-surface-900 rounded mb-3 flex items-center justify-center text-text-muted overflow-hidden">
              {ex.gif_url ? (
                <img
                  src={ex.gif_url}
                  alt={ex.name_en}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-2xl">💪</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              {locale === 'en' ? ex.name_en : ex.name_es}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded border ${difficultyBadge[ex.difficulty]}`}>
                {ex.difficulty}
              </span>
              <span className="text-xs text-text-muted">{ex.category}</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {(ex.muscle_groups || []).join(', ')}
            </p>
          </a>
        ))}
      </div>

      {(exercises || []).length === 0 && (
        <p className="text-text-muted text-center py-16 text-sm">
          No exercises found.
        </p>
      )}
    </div>
  );
}
