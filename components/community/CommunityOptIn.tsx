'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { OwnCommunityProfile } from '@/lib/community/types';
import { BIO_MAX, COMUNA_MAX } from '@/lib/community/validate';
import LocationButton from './LocationButton';
import { deactivateCommunityProfile, saveCommunityProfile } from '../../app/[locale]/(app)/community/actions';

const inputCls =
  'w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface font-mono-data text-body-md';
const labelCls = 'font-label-bold text-label-sm uppercase text-on-surface-variant block';

export default function CommunityOptIn({
  initial,
  isPublic,
}: {
  initial: OwnCommunityProfile | null;
  isPublic: boolean;
}) {
  const t = useTranslations('community');
  const router = useRouter();
  const [consent, setConsent] = useState(isPublic);
  const [comuna, setComuna] = useState(initial?.comuna ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [showPhoto, setShowPhoto] = useState(initial?.show_photo ?? true);
  const [showLevel, setShowLevel] = useState(initial?.show_level ?? true);
  const [showGoal, setShowGoal] = useState(initial?.show_goal ?? true);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(
    initial?.geo_lat != null && initial?.geo_lng != null
      ? { lat: initial.geo_lat, lng: initial.geo_lng }
      : null,
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');  const [error, setError] = useState('');

  const errorKey: Record<string, string> = {
    'La comunidad es para mayores de 18': 'minAgeError',
    comuna_required: 'comunaRequired',
    comuna_too_long: 'comunaTooLong',
    bio_too_long: 'bioTooLong',
  };
  const translateError = (code: string) => (errorKey[code] ? t(errorKey[code]) : code);

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setStatus('saving');
    setError('');
    const res = await action();
    if (!res.success) {
      setStatus('error');
      setError(translateError(res.error ?? ''));
      return;
    }
    setStatus('idle');
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-lg">
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
        {isPublic ? t('editTitle') : t('inviteTitle')}
      </h1>
      <section className="brutalist-border bg-surface-800 p-md space-y-sm">
        <p className="text-on-surface">{isPublic ? t('editBody') : t('inviteBody')}</p>
        <p className="text-on-surface-variant font-label-sm">{t('privacyNote')}</p>

        {!isPublic && (
          <label className="flex items-start gap-sm text-sm text-on-surface">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>{t('consent')}</span>
          </label>
        )}

        <LocationButton onLocated={setGeo} />

        <div className="space-y-xs">
          <label htmlFor="community-comuna" className={labelCls}>{t('comunaLabel')}</label>
          <input
            id="community-comuna"
            type="text"
            maxLength={COMUNA_MAX}
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className={inputCls}
            placeholder={t('comunaPlaceholder')}
          />
        </div>

        <div className="space-y-xs">
          <label htmlFor="community-bio" className={labelCls}>{t('bioLabel')}</label>
          <textarea
            id="community-bio"
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={inputCls}
            rows={4}
            placeholder={t('bioPlaceholder')}
          />
          <p className="text-right text-on-surface-variant font-label-sm">{bio.length}/{BIO_MAX}</p>
        </div>

        <fieldset className="space-y-xs">
          <legend className={labelCls}>{t('visibilityTitle')}</legend>
          {([
            ['showPhoto', showPhoto, setShowPhoto],
            ['showLevel', showLevel, setShowLevel],
            ['showGoal', showGoal, setShowGoal],
          ] as const).map(([key, value, set]) => (
            <label key={key} className="flex items-center gap-sm text-sm text-on-surface">
              <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} />
              {t(key)}
            </label>
          ))}
        </fieldset>

        {status === 'error' && <p className="text-error font-label-sm">{error}</p>}
        <div className="flex flex-wrap gap-sm">
          <Button
            onClick={() =>
              run(() =>
                saveCommunityProfile({
                  comuna,
                  bio,
                  showPhoto,
                  showLevel,
                  showGoal,
                  lat: geo?.lat ?? null,
                  lng: geo?.lng ?? null,
                }),
              )
            }
            disabled={status === 'saving' || (!isPublic && !consent)}
          >
            {status === 'saving' ? t('saving') : t('activate')}
          </Button>
          {isPublic && (
            <Button variant="ghost" onClick={() => run(deactivateCommunityProfile)} disabled={status === 'saving'}>
              {t('deactivate')}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
