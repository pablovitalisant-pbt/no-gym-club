import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import { Dumbbell } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];

const CATEGORIES = ['push', 'pull', 'core', 'legs', 'cardio', 'mobility', 'skill'] as const;
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

const difficultyBadge: Record<string, string> = {
  beginner: 'border-green-500/50 bg-green-500/10 text-green-500',
  intermediate: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
  advanced: 'border-red-500/50 bg-red-500/10 text-red-500',
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
        <p className="font-body-md text-on-surface-variant">{t('fallback')}</p>
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
    <div className="max-w-[1280px] mx-auto space-y-lg">
      <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase border-l-4 border-primary-container pl-4">
        {t('title')}
      </h2>

      {/* Filters (Stitch spec: pill buttons with active state) */}
      <div className="space-y-lg">
        <div>
          <span className="font-label-bold text-label-bold uppercase text-on-surface-variant mb-3 block">{t('filterCategory')}</span>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/${locale}/exercises`}
              className={`px-4 py-2 font-label-bold text-label-bold uppercase transition-all active:scale-95
                ${!searchParams.category ? 'bg-primary-container text-on-primary-container' : 'border border-outline-variant text-on-surface hover:border-primary'}`}
            >
              {t('allCategories')}
            </a>
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/${locale}/exercises?category=${cat}`}
                className={`px-4 py-2 font-label-bold text-label-bold uppercase transition-all active:scale-95
                  ${searchParams.category === cat ? 'bg-primary-container text-on-primary-container' : 'border border-outline-variant text-on-surface hover:border-primary'}`}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
        <div>
          <span className="font-label-bold text-label-bold uppercase text-on-surface-variant mb-3 block">{t('filterDifficulty')}</span>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/${locale}/exercises${searchParams.category ? `?category=${searchParams.category}` : ''}`}
              className={`px-4 py-2 font-label-bold text-label-bold uppercase transition-all active:scale-95
                ${!searchParams.difficulty ? 'bg-primary-container text-on-primary-container' : 'border border-outline-variant text-on-surface hover:border-primary'}`}
            >
              {t('allDifficulties')}
            </a>
            {DIFFICULTIES.map((diff) => (
              <a
                key={diff}
                href={`/${locale}/exercises?${searchParams.category ? `category=${searchParams.category}&` : ''}difficulty=${diff}`}
                className={`px-4 py-2 font-label-bold text-label-bold uppercase transition-all active:scale-95
                  ${searchParams.difficulty === diff ? 'bg-primary-container text-on-primary-container' : 'border border-outline-variant text-on-surface hover:border-primary'}`}
              >
                {diff}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise grid (Stitch spec: 3-col, cards with image overlay + badge) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter md:gap-md">
        {(exercises || []).map((ex: ExerciseRow) => {
          const name = locale === 'en' ? ex.name_en : ex.name_es;
          return (
            <a
              key={ex.id}
              href={`/${locale}/exercises/${ex.slug}`}
              className="bg-surface-800 border border-outline-variant hover:border-primary-container transition-all group p-sm flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-sm">
                  <span className={`border px-2 py-0.5 font-mono-data text-label-sm uppercase ${difficultyBadge[ex.difficulty]}`}>
                    {ex.difficulty}
                  </span>
                </div>
                <div className="w-full aspect-video bg-surface-700 mb-sm overflow-hidden relative border border-outline-variant">
                  {ex.gif_url ? (
                    <>
                      <img src={ex.gif_url} alt={name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">💪</div>
                  )}
                </div>
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface mb-1">{name}</h3>
                <p className="font-label-bold text-label-bold text-primary-container uppercase mb-2">{ex.category}</p>
              </div>
              <div className="border-t border-outline-variant pt-sm">
                <div className="flex items-center gap-2">
                  <Dumbbell className="text-on-surface-variant shrink-0" size={16} />
                  <p className="font-body-md text-on-surface-variant text-sm">
                    {(ex.muscle_groups || []).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {(exercises || []).length === 0 && (
        <p className="font-body-md text-on-surface-variant text-center py-16">No exercises found.</p>
      )}
    </div>
  );
}
