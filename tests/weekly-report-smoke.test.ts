import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Weekly report', () => {

  it('weekly-report/page.tsx es Server Component y consulta workout_sessions', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/weekly-report/page.tsx',
    );
    expect(existsSync(path), 'page.tsx debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe ser Server Component').not.toContain("'use client'");
    expect(raw, 'debe consultar workout_sessions').toContain('workout_sessions');
    expect(raw, 'debe filtrar por user_id').toContain('user_id');
    expect(raw, 'debe filtrar por completed_at').toContain('completed_at');
  });

  it('page.tsx calcula averageRpe, sessionsCompleted, total sets', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/weekly-report/page.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe calcular averageRpe').toContain('averageRpe');
    expect(raw, 'debe contar sesiones').toMatch(/sessionsCompleted|sessionCount|completed/);
  });

  it('middleware.ts protege /weekly-report', () => {
    const path = resolve(root, 'middleware.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe incluir /weekly-report').toContain('/weekly-report');
  });

  it('feature-flags.json tiene weekly_report: true', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(flags.weekly_report, 'weekly_report debe ser true').toBe(true);
  });

  it('keys weekly.* son simétricas ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    const requiredKeys = [
      'title',
      'sessionsThisWeek',
      'averageRpe',
      'totalSets',
      'muscleDistribution',
      'consistency',
      'previousWeek',
      'trendUp',
      'trendDown',
      'trendStable',
      'noData',
      'daysTrained',
      'vsLastWeek',
    ];

    requiredKeys.forEach((key) => {
      expect(es.weekly?.[key], `falta weekly.${key} en es`).toBeTruthy();
      expect(en.weekly?.[key], `falta weekly.${key} en en`).toBeTruthy();
    });
  });
});
