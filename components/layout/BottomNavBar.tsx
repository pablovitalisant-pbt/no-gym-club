'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { LayoutDashboard, Dumbbell, TrendingUp, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_BY_HREF: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/exercises': Dumbbell,
  '/progress': TrendingUp,
  '/weekly-report': BarChart3,
};

interface NavItem {
  href: string;
  label: string;
}

export default function BottomNavBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface-800 px-2 pb-safe h-16 border-t border-outline">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = ICON_BY_HREF[item.href] || LayoutDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center pt-1 transition-colors duration-150 w-20
              ${isActive
                ? 'text-primary-container border-t-2 border-primary-container'
                : 'text-on-surface-variant hover:text-primary'
              }
            `}
          >
            <Icon
              size={20}
              className={isActive ? 'fill-primary-container' : ''}
            />
            <span className="font-label-bold text-[10px] uppercase">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
