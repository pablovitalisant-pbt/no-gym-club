'use client';

import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';

interface NavItem {
  href: string;
  label: string;
}

function AvatarBadge({
  displayName,
  avatarUrl,
}: {
  displayName: string | null;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName ?? ''}
        className="w-9 h-9 rounded-full object-cover border border-outline"
      />
    );
  }
  return (
    <span className="w-9 h-9 rounded-full bg-surface-800 border border-outline flex items-center justify-center font-label-bold text-label-sm text-primary uppercase">
      {displayName?.trim().charAt(0) || '·'}
    </span>
  );
}

export default function TopAppBar({
  items,
  displayName = null,
  avatarUrl = null,
  showSettings = false,
}: {
  items: NavItem[];
  displayName?: string | null;
  avatarUrl?: string | null;
  showSettings?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background border-b border-outline flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
      <h1 className="font-display-lg text-headline-md text-primary-container tracking-tighter uppercase">
        NO GYM CLUB
      </h1>

      <div className="flex items-center gap-4">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {items.map((item) => {
            const isAnchor = item.href.startsWith('#');
            const isActive = !isAnchor && (
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            );
            const cls = `font-label-bold text-label-sm uppercase pt-1 transition-colors duration-150 ${
              isActive
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`;
            return isAnchor ? (
              <a key={item.href} href={item.href} className={cls}>{item.label}</a>
            ) : (
              <Link key={item.href} href={item.href} className={cls}>{item.label}</Link>
            );
          })}
        </nav>

        {showSettings ? (
          <Link
            href="/settings"
            aria-label={t('settings')}
            className={`p-1 transition-colors duration-150 ${
              pathname === '/settings'
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Settings size={20} />
          </Link>
        ) : null}

        {displayName || avatarUrl ? (
          showSettings ? (
            <Link href="/settings" aria-label={t('settings')}>
              <AvatarBadge displayName={displayName} avatarUrl={avatarUrl} />
            </Link>
          ) : (
            <AvatarBadge displayName={displayName} avatarUrl={avatarUrl} />
          )
        ) : null}
      </div>
    </header>
  );
}
