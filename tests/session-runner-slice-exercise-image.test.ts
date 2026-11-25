import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice imagen de ejercicio — runner + page + types + i18n', () => {
  const runnerPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/session-runner.tsx',
  );
  const runner = readFileSync(runnerPath, 'utf-8');
  const pagePath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/page.tsx',
  );
  const page = readFileSync(pagePath, 'utf-8');
  const typesPath = resolve(root, 'lib/types/session.ts');
  const types = readFileSync(typesPath, 'utf-8');
  const mediaPath = resolve(root, 'lib/exercises/resolve-media.ts');

  // ─── Riesgo 1: runner no importa supabase (regresión guard) ───
  it('session-runner.tsx no importa supabase (Server Component only)', () => {
    expect(runner).not.toContain('@/lib/supabase/server');
    expect(runner).not.toContain('@/lib/supabase/client');
  });

  // ─── Riesgo 2: runner renderiza imagen con fallback a placeholder ───
  it('runner renderiza imagen condicionada con gif_url y imageError, con placeholder', () => {
    const active = readFileSync(resolve(root, 'components/session/runner/ActiveScreen.tsx'), 'utf-8');
    expect(active).toContain('gif_url');
    // El render debe condicionar sobre gif_url Y imageError (no solo gif_url)
    const hasBothConditions = active.includes('gif_url && !imageError');
    expect(hasBothConditions).toBe(true);
    // Debe tener un placeholder (texto o ícono)
    expect(active).toContain('noImage');
    // El placeholder se muestra cuando no hay gif_url O cuando imageError es true
    expect(active).toContain('imageError');
  });

  // ─── Riesgo 3: imagen tiene useState imageError + onError con setter ───
  it('useState imageError existe y onError llama setImageError(true)', () => {
    expect(runner).toContain('imageError');
    expect(runner).toContain('setImageError');
    // onError debe llamar al setter, no manipular DOM directamente
    const active = readFileSync(resolve(root, 'components/session/runner/ActiveScreen.tsx'), 'utf-8');
    expect(active).toContain('onError={onImageError}');
    expect(runner).toContain('onImageError={() => setImageError(true)}');
    // imageError se resetea en useEffect con dependencia [index]
    expect(runner).toContain('setImageError(false)');
    expect(runner).toContain('}, [index]);');
  });

  // ─── Riesgo 4: page.tsx importa resolve-media y hace query a exercises ───
  it('page.tsx importa resolveExerciseGif y consulta catálogo', () => {
    expect(page).toContain('resolveExerciseGif');
    expect(page).toContain('@/lib/exercises/resolve-media');
    // Debe hacer query a la tabla exercises
    expect(page).toContain('.from(\'exercises\')');
    expect(page).toContain('gif_url');
  });

  // ─── Riesgo 5: SessionExercise tiene gif_url opcional ───
  it('SessionExercise en types/session.ts tiene gif_url?: string | null', () => {
    expect(types).toContain('gif_url');
  });

  // ─── Riesgo 6: resolve-media.ts existe ───
  it('lib/exercises/resolve-media.ts existe', () => {
    expect(existsSync(mediaPath)).toBe(true);
  });

  // ─── Riesgo 7: key session.noImage simétrica ES/EN ───
  it('session.noImage existe en es.json y en.json', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );
    expect(es.session?.noImage).toBeTruthy();
    expect(en.session?.noImage).toBeTruthy();
  });
});
