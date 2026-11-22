'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { CommunityPerson } from '@/lib/community/types';

const LEVELS = ['untrained_extreme', 'untrained', 'beginner', 'intermediate', 'advanced'];
const GOALS = ['lose_weight', 'build_muscle', 'improve_endurance', 'master_skills', 'general_fitness'];

export default function ProfileCard({ person }: { person: CommunityPerson }) {
  const t = useTranslations('community');
  const name = person.display_name?.trim() || '?';
  const level = person.level && LEVELS.includes(person.level) ? t(`levels.${person.level}`) : null;
  const goal = person.primary_goal && GOALS.includes(person.primary_goal) ? t(`goals.${person.primary_goal}`) : null;

  return (
    <Link
      href={`/community/${person.user_id}`}
      className="brutalist-border bg-surface-800 p-md flex items-center gap-md hover:bg-surface-700 transition-colors"
    >
      {person.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.avatar_url}
          alt={name}
          className="w-14 h-14 rounded-full object-cover border-2 border-outline shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-surface-900 border-2 border-outline flex items-center justify-center font-headline-md text-headline-md text-primary uppercase shrink-0">
          {name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 space-y-xs">
        <p className="font-label-bold text-label-bold text-on-surface truncate">{name}</p>
        {level && <p className="text-on-surface-variant text-label-sm">{t('level')}: {level}</p>}
        {goal && <p className="text-on-surface-variant text-label-sm">{t('goal')}: {goal}</p>}
        <p className="text-on-surface-variant text-label-sm truncate">
          {[person.comuna, person.distance_km != null ? t('distance', { km: person.distance_km }) : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </Link>
  );
}
