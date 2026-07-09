import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getFlag } from '@/lib/flags';
import { ReassessmentBanner, ComparisonTable, HistoryList } from './sections';
import type { Database } from '@/lib/supabase/types';

type AssessmentRow = Database['public']['Tables']['assessment_results']['Row'];

export default async function ProgressPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'progress' });

  if (!getFlag('progress')) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-body-md text-on-surface-variant">{t('fallback')}</p>
      </div>
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-body-md text-on-surface-variant">Unauthorized</p>
      </div>
    );
  }

  const { data: assessments } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', user.id)
    .order('assessed_at', { ascending: false });

  const results = (assessments || []) as AssessmentRow[];

  if (results.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-lg">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
          {t('title')}
        </h1>
        <div className="brutalist-border bg-surface-800 p-sm md:p-md text-center space-y-sm">
          <p className="font-body-md text-on-surface-variant">{t('noData')}</p>
          <a
            href={`/${locale}/assessment/test`}
            className="inline-block font-label-bold text-label-sm uppercase text-primary hover:underline"
          >
            {t('reassessButton')}
          </a>
        </div>
      </div>
    );
  }

  const latest = results[0];
  const previous = results[1] || null;
  const daysAgo = Math.floor(
    (Date.now() - new Date(latest.assessed_at!).getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="max-w-2xl mx-auto space-y-lg">
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
        {t('title')}
      </h1>

      {daysAgo >= 30 && (
        <ReassessmentBanner
          daysAgo={daysAgo}
          reassessHref={`/${locale}/assessment/test`}
          t={t}
        />
      )}

      <ComparisonTable latest={latest} previous={previous} t={t} />

      <HistoryList results={results} t={t} locale={locale} />

      <div className="text-center pt-sm">
        <a
          href={`/${locale}/assessment/test`}
          className="font-label-bold text-label-sm uppercase text-on-surface-variant hover:text-primary transition-colors"
        >
          {t('reassessButton')}
        </a>
      </div>
    </div>
  );
}
