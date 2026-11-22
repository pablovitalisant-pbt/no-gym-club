import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const read = (p: string) => readFileSync(p, 'utf-8');

const pagePath = resolve(root, 'app/[locale]/(app)/dashboard/page.tsx');
const planDir = resolve(root, 'components/plan');

describe('Slice v2-06a — dashboard con plan v2', () => {
  it('el flag training_plan_v2 existe y esta en false', () => {
    const flags = JSON.parse(read(resolve(root, 'config/feature-flags.json')));
    expect(flags.training_plan_v2).toBe(false);
  });

  it('con flag OFF el dashboard conserva el flujo v1 (DashboardClient)', () => {
    const src = read(pagePath);
    expect(src).toContain("getFlag('training_plan_v2')");
    expect(src).toContain('DashboardClient');
    // la rama v2 enciende solo con el flag
    expect(src).toMatch(/showPlanV2\s*\?/);
  });

  it('el dashboard v2 lee el plan activo y el assessment', () => {
    const src = read(pagePath);
    expect(src).toContain("from('training_plans')");
    expect(src).toContain('is_active');
    expect(src).toContain("from('assessment_results')");
  });

  it('las server actions existen y verifican user_id', () => {
    const src = read(resolve(root, 'app/[locale]/(app)/dashboard/plan-actions.ts'));
    expect(src).toContain("'use server'");
    expect(src).toContain('completePlanDay');
    expect(src).toContain('setCurrentPlanDay');
    expect(src).toContain("'user_id'");
  });

  it('componentes de plan en components/plan y cada uno <=150 lineas', () => {
    expect(existsSync(resolve(planDir, 'PlanDashboard.tsx'))).toBe(true);
    expect(existsSync(resolve(planDir, 'DayView.tsx'))).toBe(true);
    expect(existsSync(resolve(planDir, 'CreatePlanCard.tsx'))).toBe(true);
    expect(existsSync(resolve(planDir, 'PlanExerciseList.tsx'))).toBe(true);
    for (const f of [
      'PlanDashboard.tsx',
      'DayView.tsx',
      'CreatePlanCard.tsx',
      'PlanExerciseList.tsx',
    ]) {
      const lines = read(resolve(planDir, f)).split('\n').length;
      expect(lines, `${f} tiene ${lines} lineas`).toBeLessThanOrEqual(150);
    }
  });

  it('DayView renderiza secciones, rest, fase no generada y "Proximamente"', () => {
    const src =
      read(resolve(planDir, 'DayView.tsx')) + read(resolve(planDir, 'PlanExerciseList.tsx'));
    for (const key of ['warmup', 'main', 'finisher', 'cardio', 'cooldown']) {
      expect(src).toContain(key);
    }
    expect(src).toContain("t('restDay')");
    expect(src).toContain("t('phaseNotGenerated')");
    expect(src).toContain("t('startSessionComingSoon')");
    expect(read(resolve(planDir, 'PlanDashboard.tsx'))).toContain('planDayView');
  });

  it('CreatePlanCard llama /api/generate-phase con el phase_index recibido, anti doble envio y refresca', () => {
    const src = read(resolve(planDir, 'CreatePlanCard.tsx'));
    expect(src).toContain('/api/generate-phase');
    expect(src).toContain('phase_index: phaseIndex');
    expect(src).toContain('phaseIndex = 0');
    expect(src).toContain('useRef');
    expect(src).toContain('router.refresh');
    expect(src).toContain("t('createHint')");
  });

  it('keys i18n plan simetricas ES/EN', () => {
    const es = JSON.parse(read(resolve(root, 'messages/es.json')));
    const en = JSON.parse(read(resolve(root, 'messages/en.json')));
    expect(es.dashboard.plan).toBeDefined();
    expect(en.dashboard.plan).toBeDefined();
    const esKeys = Object.keys(es.dashboard.plan).sort();
    const enKeys = Object.keys(en.dashboard.plan).sort();
    expect(esKeys).toEqual(enKeys);
    expect(esKeys.length).toBeGreaterThan(10);
    for (const k of esKeys) {
      expect(es.dashboard.plan[k]).toBeTruthy();
      expect(en.dashboard.plan[k]).toBeTruthy();
    }
  });
});
