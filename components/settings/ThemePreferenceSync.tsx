'use client';

import { useEffect } from 'react';
import { applyTheme, type Theme } from '@/lib/theme';

/** Aplica la preferencia guardada en el perfil al cargar la app con sesión. */
export default function ThemePreferenceSync({ theme }: { theme: Theme | null }) {
  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);
  return null;
}
