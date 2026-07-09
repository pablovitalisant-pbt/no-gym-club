import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Exercise catalog', () => {

  // Riesgo 1: List page existe y fetchea ejercicios
  it('exercises/page.tsx es Server Component y consulta exercises', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/exercises/page.tsx',
    );
    expect(existsSync(path), 'page.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser Server Component').not.toContain("'use client'");
    expect(raw, 'debe consultar tabla exercises').toContain('exercises');
    // Debe filtrar is_active = true
    expect(raw, 'debe filtrar is_active').toContain('is_active');
  });

  // Riesgo 2: Detail page por slug
  it('exercises/[slug]/page.tsx existe y usa params.slug', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/exercises/[slug]/page.tsx',
    );
    expect(existsSync(path), '[slug]/page.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser Server Component').not.toContain("'use client'");
    expect(raw, 'debe usar params.slug').toContain('slug');
    expect(raw, 'debe consultar exercises').toContain('exercises');
  });

  // Riesgo 3: Middleware protege /exercises
  it('middleware.ts protege /exercises', () => {
    const path = resolve(root, 'middleware.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'PROTECTED_PATHS debe incluir /exercises').toContain(
      '/exercises',
    );
  });

  // Riesgo 4: Feature flag exercises_catalog en true
  it('feature-flags.json tiene exercises_catalog: true', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags.exercises_catalog, 'exercises_catalog debe ser true').toBe(
      true,
    );
  });

  // Riesgo 5: i18n keys del catálogo
  it('keys catalog.* son simétricas ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    const requiredKeys = [
      'title',
      'allCategories',
      'allDifficulties',
      'filterCategory',
      'filterDifficulty',
      'instructions',
      'muscles',
      'secondaryMuscles',
      'equipment',
      'progression',
      'regression',
      'backToCatalog',
      'linkedExercises',
    ];

    requiredKeys.forEach((key) => {
      expect(es.catalog?.[key], `falta catalog.${key} en es`).toBeTruthy();
      expect(en.catalog?.[key], `falta catalog.${key} en en`).toBeTruthy();
    });
  });

  // Riesgo 6: Detail page muestra instrucciones bilingües
  it('[slug]/page.tsx usa locale para mostrar contenido bilingüe', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/exercises/[slug]/page.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe usar locale del params para elegir idioma
    expect(raw, 'debe usar params.locale').toContain('locale');
  });
});
