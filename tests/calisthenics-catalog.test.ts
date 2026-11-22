import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

let resolveMedia: any;
try {
  resolveMedia = await import('@/lib/exercises/resolve-media');
} catch {
  // módulo no existe — falla explícito
}

const exercisesPagePath = resolve(root, 'app/[locale]/(app)/exercises/page.tsx');

describe('resolve-media — placeholder cuando no hay media', () => {
  it('gif_url e image_url null → placeholder', () => {
    expect(
      resolveMedia,
      'FASE B: resolve-media.ts no existe',
    ).toBeTruthy();
    expect(resolveMedia.resolveExerciseMedia({ gif_url: null, image_url: null })).toEqual({
      src: null,
      placeholder: true,
    });
  });

  it('gif_url presente → sin placeholder', () => {
    expect(
      resolveMedia.resolveExerciseMedia({ gif_url: 'https://x/a.gif', image_url: null }),
    ).toEqual({ src: 'https://x/a.gif', placeholder: false });
  });

  it('solo image_url → usa la imagen, sin placeholder', () => {
    expect(
      resolveMedia.resolveExerciseMedia({ gif_url: null, image_url: 'https://x/a.png' }),
    ).toEqual({ src: 'https://x/a.png', placeholder: false });
  });
});

describe('/exercises — la consulta filtra is_active', () => {
  it('page.tsx contiene .eq(is_active, true) en la query del catálogo', () => {
    const src = readFileSync(exercisesPagePath, 'utf-8');
    expect(src).toContain(".eq('is_active', true)");
  });
});

describe('scripts/curate-calisthenics-catalog.ts — nunca borra', () => {
  const scriptPath = resolve(root, 'scripts/curate-calisthenics-catalog.ts');

  it('existe y hace dry-run por defecto', () => {
    expect(existsSync(scriptPath), 'FASE B: script no existe').toBe(true);
    const src = readFileSync(scriptPath, 'utf-8');
    expect(src).toContain('--apply');
    expect(src).not.toMatch(/method:\s*['"]DELETE['"]/i);
    expect(src).toContain('is_active: false');
    expect(src).toContain('gif_url: null');
  });
});
