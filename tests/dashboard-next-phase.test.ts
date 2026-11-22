import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { needsNextPhase } from '../lib/plan/plan';
import type { PlanData } from '../lib/types/plan';

const root = resolve(__dirname, '..');
const read = (p: string) => readFileSync(p, 'utf-8');

describe('Slice v2-08 — tarjeta de fase siguiente', () => {
  const plan = (count: number) =>
    ({ version: 2, total_weeks: 12, phase_weeks: 4, phases: Array(count).fill({}) }) as unknown as PlanData;

  it('en el dia 28 sin fase 2 necesita la fase siguiente', () => {
    expect(needsNextPhase(plan(1), { current_day_index: 28, completed_day_indexes: [] })).toBe(true);
  });

  it('PlanDashboard muestra la tarjeta cuando needsNextPhase', () => {
    const src = read(resolve(root, 'components/plan/PlanDashboard.tsx'));
    expect(src).toContain('needsNextPhase');
    expect(src).toMatch(/<CreatePlanCard[^>]*phaseIndex/);
  });

  it('CreatePlanCard acepta phaseIndex y lo envia a la API', () => {
    const src = read(resolve(root, 'components/plan/CreatePlanCard.tsx'));
    expect(src).toMatch(/phaseIndex\s*=\s*0/);
    expect(src).toContain('phase_index: phaseIndex');
    expect(src).toContain("t('nextPhaseTitle'");
  });

  it('el texto de la tarjeta existe en ES y EN con keys simetricas', () => {
    const es = JSON.parse(read(resolve(root, 'messages/es.json')));
    const en = JSON.parse(read(resolve(root, 'messages/en.json')));
    expect(es.dashboard.plan.nextPhaseTitle).toBe(
      'Terminaste la fase {n}. Generemos la fase {next} con tus resultados.',
    );
    expect(en.dashboard.plan.nextPhaseTitle).toBeTruthy();
    const esKeys = Object.keys(es.dashboard.plan).sort();
    const enKeys = Object.keys(en.dashboard.plan).sort();
    expect(esKeys).toEqual(enKeys);
  });
});
