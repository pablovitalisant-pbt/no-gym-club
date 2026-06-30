import { type Locale } from '@/i18n/config';

export default function AppLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-border px-6 py-4">
        <span className="text-sm font-bold tracking-wide text-text-primary">
          NO GYM CLUB
        </span>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
