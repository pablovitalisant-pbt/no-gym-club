'use client';
import { useEffect, useState } from 'react';
import { applyTheme, readTheme, type Theme } from '@/lib/theme';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
];

export default function ThemeSelector() {
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
  }

  return (
    <div role="group" aria-label="Tema" className="flex gap-xs">
      {OPTIONS.map(({ value, label }) => (
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
          {label}
        </button>
      ))}
    </div>
  );
}
