import { getTranslations } from 'next-intl/server';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import { TestWizard } from '@/components/assessment/tests/TestWizard';

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

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let hasBar = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('available_equipment')
      .eq('id', user.id)
      .maybeSingle();
    hasBar = (profile?.available_equipment ?? []).includes('bar');
  }

  return <TestWizard hasBar={hasBar} />;
}
