import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { TestForm } from './test-form';

export default async function TestPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'assessment' });
  const showAssessment = getFlag('assessment');

  if (!showAssessment) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

  return <TestForm />;
}
