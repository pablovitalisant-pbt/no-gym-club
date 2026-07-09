import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Progress — re-assessment', () => {

  it('progress/page.tsx es Server Component y consulta assessment_results', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/progress/page.tsx',
    );
    expect(existsSync(path), 'page.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser Server Component').not.toContain("'use client'");
    expect(raw, 'debe consultar assessment_results').toContain(
      'assessment_results',
    );
    expect(raw, 'debe filtrar por user_id').toContain('user_id');
  });

  it('page.tsx calcula comparación con assessment anterior', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/progress/page.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe comparar actual vs anterior
    expect(raw, 'debe mostrar diff o cambio').toMatch(/diff|cambio|change|previous/);
  });

  it('page.tsx detecta 30+ días desde último assessment', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/progress/page.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe calcular días desde el último assessment
    expect(raw, 'debe calcular días desde último').toMatch(/days|días|30/);
  });

  it('middleware.ts protege /progress', () => {
    const path = resolve(root, 'middleware.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe incluir /progress').toContain('/progress');
  });

  it('feature-flags.json tiene progress: true', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags.progress, 'progress debe ser true').toBe(true);
  });

  it('keys progress.* son simétricas ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    const requiredKeys = [
      'title',
      'reassessmentPrompt',
      'reassessButton',
      'comparison',
      'exercise',
      'current',
      'previous',
      'change',
      'history',
      'noData',
      'daysAgo',
      'reassessmentLabel',
      'historyImprovedAll',
      'historyImproved',
      'historyDeclined',
      'historyMixed',
      'historyInitialBaseline',
      'historyAssessmentNumber',
    ];

    requiredKeys.forEach((key) => {
      expect(es.progress?.[key], `falta progress.${key} en es`).toBeTruthy();
      expect(en.progress?.[key], `falta progress.${key} en en`).toBeTruthy();
    });
  });
});
