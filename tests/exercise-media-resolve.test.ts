import { describe, it, expect } from 'vitest';

let resolveMedia: any;
try {
  resolveMedia = await import('@/lib/exercises/resolve-media');
} catch {
  // módulo no existe — falla explícito
}

function assertModule() {
  expect(
    resolveMedia,
    'FASE B: resolve-media.ts no existe — debe implementarse en Fase C',
  ).toBeTruthy();
}

describe('Exercise media resolve — normalize + match', () => {
  it('normalizeExerciseName despoja tildes: Flexión → flexion', () => {
    assertModule();
    expect(resolveMedia.normalizeExerciseName('Flexión')).toBe('flexion');
  });

  it('normalizeExerciseName es case-insensitive', () => {
    assertModule();
    expect(resolveMedia.normalizeExerciseName('PUSH-UP')).toBe('push-up');
    expect(resolveMedia.normalizeExerciseName('push-up')).toBe('push-up');
  });

  it('normalizeExerciseName colapsa espacios y hace trim', () => {
    assertModule();
    expect(resolveMedia.normalizeExerciseName('  Círculos   de  brazos  ')).toBe('circulos de brazos');
  });

  it('resolveExerciseGif matchea exacto normalizado (name_en)', () => {
    assertModule();
    const catalog = [
      { name_en: 'Flexion de brazos', gif_url: 'https://example.com/flexion.gif' },
      { name_en: 'Dominada', gif_url: 'https://example.com/dominada.gif' },
    ];
    const result = resolveMedia.resolveExerciseGif('Flexión de brazos', catalog);
    expect(result).toBe('https://example.com/flexion.gif');
  });

  it('resolveExerciseGif devuelve null si no hay match', () => {
    assertModule();
    const catalog = [{ name_en: 'Flexion de brazos', gif_url: 'https://example.com/flexion.gif' }];
    expect(resolveMedia.resolveExerciseGif(' inexistente ', catalog)).toBeNull();
  });

  it('resolveExerciseGif no lanza con catálogo vacío', () => {
    assertModule();
    expect(() => resolveMedia.resolveExerciseGif('cualquiera', [])).not.toThrow();
    expect(resolveMedia.resolveExerciseGif('cualquiera', [])).toBeNull();
  });

  it('resolveExerciseGif matchea con/sin tilde (name_en)', () => {
    assertModule();
    const catalog = [
      { name_en: 'Flexion de brazos', gif_url: 'https://example.com/flexion.gif' },
    ];
    expect(resolveMedia.resolveExerciseGif('Flexión de brazos', catalog)).toBe(
      'https://example.com/flexion.gif',
    );
    const catalog2 = [
      { name_en: 'Flexion de brazos', gif_url: 'https://example.com/flexion2.gif' },
    ];
    expect(resolveMedia.resolveExerciseGif('Flexion de brazos', catalog2)).toBe(
      'https://example.com/flexion2.gif',
    );
  });
});
