// v2-22 Comunidad: validacion pura y reglas de privacidad.
// La ubicacion se guarda redondeada a 0.02 grados (~2 km); nunca se exponen
// coordenadas, solo comuna y distancia aproximada.

export const COMMUNITY_MIN_AGE = 18;
export const BIO_MAX = 280;
export const COMUNA_MAX = 60;
export const REPORT_MAX = 500;
export const COORD_STEP = 0.02;
export const RADIUS_OPTIONS = [2, 5, 10, 25] as const;

export type CommunityMode = 'invite' | 'nearby';

export function communityMode(profile: { is_public: boolean } | null | undefined): CommunityMode {
  return profile?.is_public ? 'nearby' : 'invite';
}

export function roundCoord(value: number): number {
  return Number((Math.round(value / COORD_STEP) * COORD_STEP).toFixed(2));
}

export function isAdult(age: number | null | undefined): boolean {
  return typeof age === 'number' && Number.isFinite(age) && age >= COMMUNITY_MIN_AGE;
}

type TextResult =
  | { ok: true; value: string | null }
  | { ok: false; error: 'bio_too_long' | 'comuna_required' | 'comuna_too_long' | 'reason_too_long' };

export function normalizeBio(raw: unknown): TextResult {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value.length > BIO_MAX) return { ok: false, error: 'bio_too_long' };
  return { ok: true, value: value || null };
}

export function normalizeComuna(raw: unknown): TextResult {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return { ok: false, error: 'comuna_required' };
  if (value.length > COMUNA_MAX) return { ok: false, error: 'comuna_too_long' };
  return { ok: true, value };
}

export function normalizeReportReason(raw: unknown): TextResult {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value.length > REPORT_MAX) return { ok: false, error: 'reason_too_long' };
  return { ok: true, value: value || null };
}

export function normalizeCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): { lat: number; lng: number } | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat: roundCoord(lat), lng: roundCoord(lng) };
}
