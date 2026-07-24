import { describe, it, expect } from 'vitest';

// Estas pruebas fallarán hasta que exista lib/exercises/resolve-media.ts
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
  // ─── 1: NFD despoja tildes ───
  it('normalizeExerciseName despoja tildes: Flexión → flexion', () => {
    assertModule();
    expect(resolveMedia.normalizeExerciseName('Flexión')).toBe('flexion');
  });

  // ─── 2: Case insensitive ───
  it('normalizeExerciseName es case-insensitive', () => {
    assertModule();
    expect(resolveMedia.normalizeExerciseName('PUSH-UP')).toBe('push-up');
    expect(resolveMedia.normalizeExerciseName('push-up')).toBe('push-up');
  });

  // ─── 3: Colapsa espacios y trim ───
  it('normalizeExerciseName colapsa espacios y hace trim', () => {
    assertModule();
    expect(resolveMedia.normalizeExerciseName('  Círculos   de  brazos  ')).toBe('circulos de brazos');
  });

  // ─── 4: Match exacto normalizado devuelve gif_url ───
  it('resolveExerciseGif matchea exacto normalizado', () => {
    assertModule();
    const catalog = [
      { name_es: 'Flexión de brazos', gif_url: 'https://example.com/flexion.gif' },
      { name_es: 'Dominada', gif_url: 'https://example.com/dominada.gif' },
    ];
    const result = resolveMedia.resolveExerciseGif('Flexión de brazos', catalog);
    expect(result).toBe('https://example.com/flexion.gif');
  });

  // ─── 5: Sin match devuelve null ───
  it('resolveExerciseGif devuelve null si no hay match', () => {
    assertModule();
    const catalog = [{ name_es: 'Flexión de brazos', gif_url: 'https://example.com/flexion.gif' }];
    expect(resolveMedia.resolveExerciseGif(' inexistente ', catalog)).toBeNull();
  });

  // ─── 6: Catálogo vacío no lanza excepción ───
  it('resolveExerciseGif no lanza con catálogo vacío', () => {
    assertModule();
    expect(() => resolveMedia.resolveExerciseGif('cualquiera', [])).not.toThrow();
    expect(resolveMedia.resolveExerciseGif('cualquiera', [])).toBeNull();
  });

  // ─── 7: Match cruzado con/sin tilde ───
  it('resolveExerciseGif matchea aunque input tenga tilde y catálogo no (o viceversa)', () => {
    assertModule();
    const catalog = [
      { name_es: 'Flexion de brazos', gif_url: 'https://example.com/flexion.gif' },
    ];
    // Input con tilde, catálogo sin tilde
    expect(resolveMedia.resolveExerciseGif('Flexión de brazos', catalog)).toBe(
      'https://example.com/flexion.gif',
    );
    // Input sin tilde, catálogo con tilde
    const catalog2 = [
      { name_es: 'Flexión de brazos', gif_url: 'https://example.com/flexion2.gif' },
    ];
    expect(resolveMedia.resolveExerciseGif('Flexion de brazos', catalog2)).toBe(
      'https://example.com/flexion2.gif',
    );
  });
});
