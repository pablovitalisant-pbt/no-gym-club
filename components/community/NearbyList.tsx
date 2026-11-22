'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { RADIUS_OPTIONS } from '@/lib/community/validate';
import type { CommunityPerson } from '@/lib/community/types';
import ProfileCard from './ProfileCard';

interface Props {
  people: CommunityPerson[];
  radius: number;
}

export default function NearbyList({ people, radius }: Props) {
  const t = useTranslations('community');

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
            {t('nearbyTitle')}
          </h1>
          <p className="text-on-surface-variant text-sm">{t('nearbySubtitle')}</p>
        </div>
        <Link
          href="/community?edit=1"
          className="border-2 border-text-primary text-text-primary px-4 py-2 font-semibold"
        >
          {t('edit')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-sm" role="group" aria-label={t('radiusLabel')}>
        <span className="font-label-bold text-label-sm uppercase text-on-surface-variant">
          {t('radiusLabel')}:
        </span>
        {RADIUS_OPTIONS.map((option) => (
          <Link
            key={option}
            href={`/community?radio=${option}`}
            className={`px-4 py-2 border-2 font-semibold ${
              option === radius
                ? 'bg-accent text-surface-900 border-accent'
                : 'border-outline text-on-surface hover:bg-surface-700'
            }`}
          >
            {option} {t('km')}
          </Link>
        ))}
      </div>

      {people.length === 0 ? (
        <p className="brutalist-border bg-surface-800 p-md text-on-surface-variant">{t('noResults')}</p>
      ) : (
        <div className="grid gap-sm md:grid-cols-2">
          {people.map((person) => (
            <ProfileCard key={person.user_id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
