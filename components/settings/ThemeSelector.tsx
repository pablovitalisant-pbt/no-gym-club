'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { applyTheme, readTheme, type Theme } from '@/lib/theme';

const OPTIONS: { value: Theme; key: string }[] = [
  { value: 'light', key: 'themeLight' },
  { value: 'dark', key: 'themeDark' },
  { value: 'system', key: 'themeSystem' },
];

export default function ThemeSelector({ onSelect }: { onSelect?: (theme: Theme) => void }) {
  const t = useTranslations('settings');
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(readTheme());
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readTheme() === 'system') applyTheme('system');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function select(value: Theme) {
    setTheme(value);
    applyTheme(value);
    onSelect?.(value);
  }

  return (
    <div role="group" aria-label="Tema" className="flex gap-xs">
      {OPTIONS.map(({ value, key }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => select(value)}
          className={`border px-sm py-xs font-label-sm text-label-sm ${
            theme === value
              ? 'border-primary text-primary'
              : 'border-outline text-on-surface-variant'
          }`}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
