export const DISPLAY_NAME_MAX = 40;
export const AVATAR_MAX_BYTES = 1024 * 1024;

export type DisplayNameResult =
  | { ok: true; value: string | null }
  | { ok: false; error: 'too_long' };

/** Nombre opcional: trim, espacios colapsados, vacío = null, máximo 40. */
export function normalizeDisplayName(raw: unknown): DisplayNameResult {
  const value = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  if (!value) return { ok: true, value: null };
  if (value.length > DISPLAY_NAME_MAX) return { ok: false, error: 'too_long' };
  return { ok: true, value };
}

export type AvatarFileResult =
  | { ok: true }
  | { ok: false; error: 'type' | 'empty' | 'size' };

export function validateAvatarFile(file: { type: string; size: number }): AvatarFileResult {
  if (!file.type.startsWith('image/')) return { ok: false, error: 'type' };
  if (file.size <= 0) return { ok: false, error: 'empty' };
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: 'size' };
  return { ok: true };
}

export const THEMES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEMES)[number];

export function isTheme(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}
