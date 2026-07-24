'use client';

import { Link, usePathname } from '@/i18n/navigation';

interface NavItem {
  href: string;
  label: string;
}

export default function TopAppBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background border-b border-outline flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
      <h1 className="font-display-lg text-headline-md text-primary-container tracking-tighter uppercase">
        NO GYM CLUB
      </h1>

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
    </header>
  );
}
