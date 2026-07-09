'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { Menu, Bell } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
}

export default function TopAppBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background border-b border-outline flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
      <div className="flex items-center gap-4">
        <button className="hover:bg-surface-800 p-2 transition-colors duration-150 rounded" aria-label="Menu">
          <Menu className="text-primary" size={24} />
        </button>
        <h1 className="font-display-lg text-headline-md text-primary-container tracking-tighter uppercase">
          NO GYM CLUB
        </h1>
      </div>

      {/* Desktop Navigation */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-8 items-center">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-label-bold text-label-sm uppercase pt-1 transition-colors duration-150
                  ${isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button className="hover:bg-surface-800 p-2 transition-colors duration-150 rounded" aria-label="Notifications">
          <Bell className="text-primary" size={24} />
        </button>
      </div>
    </header>
  );
}
