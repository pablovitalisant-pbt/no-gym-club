import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getFlag } from '@/lib/flags';
import { createClient } from '@/lib/supabase/server';
import CommunityProfileView from '@/components/community/CommunityProfileView';
import type { CommunityPerson } from '@/lib/community/types';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CommunityProfilePage({
  params: { locale, userId },
}: {
  params: { locale: string; userId: string };
}) {
  const t = await getTranslations({ locale, namespace: 'community' });

  if (!getFlag('community')) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-text-muted">{t('fallback')}</p>
      </div>
    );
  }

  if (!UUID.test(userId)) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data } = await supabase.rpc('community_profile', { target: userId });
  const person = ((data ?? []) as CommunityPerson[])[0] ?? null;

  // Sin perfil publico propio, sin bloqueo y sin fila visible: 404 generico.
  if (!person) notFound();

  return <CommunityProfileView person={person} />;
}
