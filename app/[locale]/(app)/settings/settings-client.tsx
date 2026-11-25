'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter as useIntlRouter } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import ThemeSelector from '@/components/settings/ThemeSelector';
import RedoProgram from '@/components/plan/RedoProgram';
import { useAudioPreference } from '@/lib/useAudioPreference';
import {
  AVATAR_MAX_BYTES,
  isTheme,
  validateAvatarFile,
} from '@/lib/settings/validate';
import { createClient } from '@/lib/supabase/client';
import {
  saveAvatarUrl,
  saveDisplayName,
  saveThemePreference,
  signOutAction,
} from './actions';

interface Props {
  locale: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  planId: string | null;
  redoEnabled: boolean;
  showCommunity: boolean;
}

function Avatar({ url, name }: { url: string | null; name: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? 'Avatar'}
        className="w-20 h-20 rounded-full object-cover border-2 border-outline"
      />
    );
  }
  return (
    <div className="w-20 h-20 rounded-full bg-surface-800 border-2 border-outline flex items-center justify-center font-headline-md text-headline-md text-primary uppercase">
      {(name?.trim().charAt(0) || '?')}
    </div>
  );
}

async function resizeAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    512,
    512,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!blob || blob.size > AVATAR_MAX_BYTES) throw new Error('size');
  return blob;
}

export default function SettingsClient(p: Props) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const pathname = usePathname();
  const intlRouter = useIntlRouter();
  const router = useRouter();
  const [audioEnabled, toggleAudio] = useAudioPreference();

  const [name, setName] = useState(p.displayName ?? '');
  const [avatar, setAvatar] = useState(p.avatarUrl);
  const [nameState, setNameState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [avatarState, setAvatarState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function handleSaveName() {
    setNameState('saving');
    const res = await saveDisplayName(name);
    if (!res.success) {
      setNameState('error');
      return;
    }
    setNameState('saved');
    router.refresh();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    // La foto original puede pesar varios MB: se valida el JPEG de 512 px resultante.
    if (!file.type.startsWith('image/') || file.size <= 0) {
      setAvatarState('error');
      return;
    }
    setAvatarState('saving');
    try {
      const blob = await resizeAvatar(file);
      if (!validateAvatarFile(blob).ok) {
        setAvatarState('error');
        return;
      }
      const supabase = createClient();
      const path = `${p.userId}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) {
        setAvatarState('error');
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const res = await saveAvatarUrl(url);
      if (!res.success) {
        setAvatarState('error');
        return;
      }
      setAvatar(url);
      setAvatarState('saved');
      router.refresh();
    } catch {
      setAvatarState('error');
    }
  }

  const sectionCls = 'brutalist-border bg-surface-800 p-md space-y-sm';
  const titleCls = 'font-label-bold text-label-bold uppercase text-primary';
  const inputCls =
    'w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface font-mono-data text-body-md';

  return (
    <div className="max-w-2xl space-y-lg">
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
        {t('title')}
      </h1>

      <section className={sectionCls}>
        <h2 className={titleCls}>{t('profileSection')}</h2>
        <div className="flex items-center gap-md">
          <Avatar url={avatar} name={name} />
          <div className="space-y-xs">
            <div className="flex flex-wrap gap-xs">
              <label className="inline-flex items-center justify-center px-6 py-3 min-h-[56px] text-base border-2 border-text-primary text-text-primary font-semibold cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2">
                {avatarState === 'saving' ? t('saving') : t('takePhoto')}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  disabled={avatarState === 'saving'}
                  className="sr-only"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              <label className="inline-flex items-center justify-center px-6 py-3 min-h-[56px] text-base border-2 border-text-primary text-text-primary font-semibold cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2">
                {avatarState === 'saving' ? t('saving') : t('chooseFromGallery')}
                <input
                  type="file"
                  accept="image/*"
                  disabled={avatarState === 'saving'}
                  className="sr-only"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <p className="text-on-surface-variant text-label-sm">{t('photoHint')}</p>
            {avatarState === 'error' && (
              <p className="text-error font-label-sm">{t('imageError')}</p>
            )}
          </div>
        </div>

        <div className="space-y-xs">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="display-name">
            {t('nameLabel')}
          </label>
          <input
            id="display-name"
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameState('idle');
            }}
            className={inputCls}
            placeholder={t('namePlaceholder')}
          />
          <div className="flex items-center gap-sm">
            <Button onClick={handleSaveName} disabled={nameState === 'saving'}>
              {nameState === 'saving' ? t('saving') : t('saveName')}
            </Button>
            {nameState === 'saved' && (
              <span className="text-green-500 font-label-sm">{t('saved')}</span>
            )}
            {nameState === 'error' && (
              <span className="text-error font-label-sm">{t('nameError')}</span>
            )}
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className={titleCls}>{t('appearanceSection')}</h2>
        <ThemeSelector
          onSelect={(theme) => {
            if (isTheme(theme)) void saveThemePreference(theme);
          }}
        />
      </section>

      <section className={sectionCls}>
        <h2 className={titleCls}>{t('languageSection')}</h2>
        <div className="flex gap-xs">
          {(['es', 'en'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={locale === value}
              onClick={() => intlRouter.replace(pathname, { locale: value })}
              className={`border px-sm py-xs font-label-sm text-label-sm ${
                locale === value
                  ? 'border-primary text-primary'
                  : 'border-outline text-on-surface-variant'
              }`}
            >
              {value === 'es' ? t('spanish') : t('english')}
            </button>
          ))}
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className={titleCls}>{t('soundSection')}</h2>
        <button
          type="button"
          aria-pressed={audioEnabled}
          onClick={toggleAudio}
          className={`border px-sm py-xs font-label-sm text-label-sm ${
            audioEnabled ? 'border-primary text-primary' : 'border-outline text-on-surface-variant'
          }`}
        >
          {audioEnabled ? t('soundOn') : t('soundOff')}
        </button>
      </section>

      <section className={sectionCls}>
        <h2 className={titleCls}>{t('programSection')}</h2>
        {p.redoEnabled && p.planId ? (
          <RedoProgram planId={p.planId} assessmentHref="/assessment" />
        ) : (
          <Link href="/assessment" className="text-label-sm underline text-on-surface-variant">
            {t('updateAssessment')}
          </Link>
        )}
      </section>

      {p.showCommunity && (
        <section className={sectionCls}>
          <h2 className={titleCls}>{t('communitySection')}</h2>
          <p className="text-on-surface-variant text-label-sm">{t('communityHint')}</p>
          <Link href="/community" className="text-label-sm underline text-on-surface-variant">
            {t('manageCommunity')}
          </Link>
        </section>
      )}

      <section className={sectionCls}>
        <h2 className={titleCls}>{t('accountSection')}</h2>
        <div className="space-y-xs">
          <p className="font-label-bold text-label-sm uppercase text-on-surface-variant">
            {t('emailLabel')}
          </p>
          <p className="font-mono-data text-body-md text-on-surface break-all">{p.email}</p>
        </div>
        <Button variant="ghost" onClick={() => void signOutAction(p.locale)}>
          {t('signOut')}
        </Button>
      </section>
    </div>
  );
}
