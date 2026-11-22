import { describe, it, expect } from 'vitest';
import {
  BIO_MAX,
  COMUNA_MAX,
  COORD_STEP,
  RADIUS_OPTIONS,
  communityMode,
  isAdult,
  normalizeBio,
  normalizeComuna,
  normalizeCoordinates,
  normalizeReportReason,
  roundCoord,
} from '../lib/community/validate';

describe('v2-22 comunidad — privacidad y validacion', () => {
  it('redondea coordenadas a 0.02 grados (~2 km)', () => {
    expect(COORD_STEP).toBe(0.02);
    expect(roundCoord(-33.4489)).toBeCloseTo(-33.44, 2);
    expect(roundCoord(-70.6693)).toBeCloseTo(-70.66, 2);
    expect(roundCoord(0.03)).toBeCloseTo(0.04, 2);
    expect(roundCoord(0.009)).toBeCloseTo(0, 2);
  });

  it('exige mayoria de edad del perfil (edad >= 18)', () => {
    expect(isAdult(17)).toBe(false);
    expect(isAdult(18)).toBe(true);
    expect(isAdult(52)).toBe(true);
    expect(isAdult(null)).toBe(false);
    expect(isAdult(undefined)).toBe(false);
  });

  it('bio: maximo 280 y se recorta; vacia queda null', () => {
    expect(normalizeBio('  hola  ')).toEqual({ ok: true, value: 'hola' });
    expect(normalizeBio('')).toEqual({ ok: true, value: null });
    expect(normalizeBio('x'.repeat(BIO_MAX))).toMatchObject({ ok: true });
    expect(normalizeBio('x'.repeat(BIO_MAX + 1))).toEqual({
      ok: false,
      error: 'bio_too_long',
    });
  });

  it('comuna: requerida y maximo 60', () => {
    expect(normalizeComuna('  Nunoa ')).toEqual({ ok: true, value: 'Nunoa' });
    expect(normalizeComuna('')).toEqual({ ok: false, error: 'comuna_required' });
    expect(normalizeComuna('x'.repeat(COMUNA_MAX + 1))).toEqual({
      ok: false,
      error: 'comuna_too_long',
    });
  });

  it('coordenadas invalidas o incompletas se descartan juntas', () => {
    expect(normalizeCoordinates(19.436, -99.131)).toEqual({
      lat: 19.44,
      lng: -99.14,
    });
    expect(normalizeCoordinates(null, -99.13)).toBeNull();
    expect(normalizeCoordinates(19.43, null)).toBeNull();
    expect(normalizeCoordinates(120, 10)).toBeNull();
    expect(normalizeCoordinates(10, 200)).toBeNull();
  });

  it('motivo de reporte: maximo 500', () => {
    expect(normalizeReportReason('spam')).toEqual({ ok: true, value: 'spam' });
    expect(normalizeReportReason('x'.repeat(501))).toEqual({
      ok: false,
      error: 'reason_too_long',
    });
  });

  it('sin perfil publico la vista es la invitacion (C1)', () => {
    expect(communityMode(null)).toBe('invite');
    expect(communityMode({ is_public: false })).toBe('invite');
    expect(communityMode({ is_public: true })).toBe('nearby');
  });

  it('radios permitidos: 2, 5, 10 y 25 km', () => {
    expect([...RADIUS_OPTIONS]).toEqual([2, 5, 10, 25]);
  });
});
