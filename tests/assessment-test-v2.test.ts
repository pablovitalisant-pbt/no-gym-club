import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { buildTestResults, WALK_MINUTES } from '@/lib/assessment/test-flow';
import { validateTestResultsV2 } from '@/lib/assessment/validate';

const root = resolve(__dirname, '..');
const read = (p: string) => readFileSync(p, 'utf-8');

const defaultAnswers = {
  pushup: 'floor' as const,
  pushupReps: 10,
  sitToStand: 12,
  plankType: 'full' as const,
  plankSeconds: 40,
  deadHangSeconds: 20,
  maxPullups: 3,
  walk: '20' as const,
};

describe('Slice v2-13 — flujo assessment → tests físicos v2', () => {
  it('tras el PAR-Q aprobado redirige a /assessment/test', () => {
    const src = read(resolve(root, 'app/[locale]/(app)/assessment/assessment-form.tsx'));
    expect(src).toContain("router.push('/assessment/test')");
    expect(src).not.toContain("router.push('/dashboard?assessment=done')");
  });

  it('el dashboard con PAR-Q pero sin resultados lleva el CTA a /assessment/test', () => {
    const page = read(resolve(root, 'app/[locale]/(app)/dashboard/page.tsx'));
    expect(page).toContain('par_q_cleared');
    expect(page).toContain('/assessment/test');

    const dash = read(resolve(root, 'components/plan/PlanDashboard.tsx'));
    expect(dash).toContain('assessmentHref');
    expect(dash).toContain('href={assessmentHref}');
    expect(dash).not.toContain('href="/assessment"');
  });

  it('el wizard vive en components/assessment/tests y cada archivo tiene <=150 líneas', () => {
    const dir = resolve(root, 'components/assessment/tests');
    for (const f of ['TestWizard.tsx', 'useStopwatch.ts']) {
      expect(existsSync(resolve(dir, f)), `falta ${f}`).toBe(true);
      const lines = read(resolve(dir, f)).split('\n').length;
      expect(lines, `${f} tiene ${lines} líneas`).toBeLessThanOrEqual(150);
    }
  });

  it('el wizard guarda con saveTestResults y vuelve al dashboard', () => {
    const src = read(resolve(root, 'components/assessment/tests/TestWizard.tsx'));
    expect(src).toContain('saveTestResults');
    expect(src).toContain("router.push('/dashboard')");
    expect(src).toContain('buildTestResults');
  });

  it('el cronómetro usa setInterval', () => {
    const src = read(resolve(root, 'components/assessment/tests/useStopwatch.ts'));
    expect(src).toContain('setInterval');
    expect(src).toContain('clearInterval');
  });

  it('push-up: "no puedo" mapea a variante none con 0 reps', () => {
    const r = buildTestResults({ ...defaultAnswers, pushup: 'none', pushupReps: 99 });
    expect(r.pushup_variant).toBe('none');
    expect(r.pushup_variant_reps).toBe(0);
    expect(r.max_pushups).toBe(0);
  });

  it('push-up de suelo guarda reps y tambien max_pushups', () => {
    const r = buildTestResults({ ...defaultAnswers, pushup: 'floor', pushupReps: 14 });
    expect(r.pushup_variant).toBe('floor');
    expect(r.pushup_variant_reps).toBe(14);
    expect(r.max_pushups).toBe(14);
  });

  it('push-up de rodillas no llena max_pushups', () => {
    const r = buildTestResults({ ...defaultAnswers, pushup: 'knee', pushupReps: 8 });
    expect(r.pushup_variant_reps).toBe(8);
    expect(r.max_pushups).toBe(0);
  });

  it('plancha completa y de rodillas van a la columna correcta', () => {
    const full = buildTestResults({ ...defaultAnswers, plankType: 'full', plankSeconds: 35 });
    expect(full.plank_seconds).toBe(35);
    expect(full.knee_plank_seconds).toBeNull();

    const knee = buildTestResults({ ...defaultAnswers, plankType: 'knee', plankSeconds: 50 });
    expect(knee.knee_plank_seconds).toBe(50);
    expect(knee.plank_seconds).toBe(0);
  });

  it('"no puedo" en plancha deja ambas columnas en null', () => {
    const knee = buildTestResults({ ...defaultAnswers, plankType: 'knee', plankSeconds: null });
    const full = buildTestResults({ ...defaultAnswers, plankType: 'full', plankSeconds: null });
    expect(knee.knee_plank_seconds).toBeNull();
    expect(full.plank_seconds).toBe(0);
  });

  it('caminata: cada rango guarda su valor inferior y "no puedo" es null', () => {
    expect(WALK_MINUTES).toEqual({ '0': 0, '5': 5, '10': 10, '20': 20, '30': 30 });
    for (const key of ['0', '5', '10', '20', '30'] as const) {
      const r = buildTestResults({ ...defaultAnswers, walk: key });
      expect(r.walk_minutes).toBe(WALK_MINUTES[key]);
    }
    expect(buildTestResults({ ...defaultAnswers, walk: null }).walk_minutes).toBeNull();
  });

  it('el payload del wizard pasa el validador v2 incluso sin barra', () => {
    const r = buildTestResults({
      ...defaultAnswers,
      deadHangSeconds: null,
      maxPullups: null,
      plankType: 'knee',
      plankSeconds: null,
      walk: null,
    });
    const v = validateTestResultsV2(r);
    expect(v.ok).toBe(true);
  });

  it('keys i18n del wizard simetricas ES/EN y en español neutro', () => {
    const es = JSON.parse(read(resolve(root, 'messages/es.json')));
    const en = JSON.parse(read(resolve(root, 'messages/en.json')));
    expect(Object.keys(es.assessment.test).sort()).toEqual(Object.keys(en.assessment.test).sort());

    const required = [
      'title', 'hint', 'cannot', 'back', 'next', 'submit', 'seconds', 'reps',
      'start', 'stop', 'manualSeconds',
      'pushupTitle', 'pushupHint', 'pushup_floor', 'pushup_knee',
      'pushup_incline', 'pushup_wall', 'pushup_none',
      'sitTitle', 'sitHint', 'sitResult',
      'plankTitle', 'plankHint', 'plankKnee', 'plankFull',
      'hangTitle', 'hangHint', 'pullupTitle', 'pullupHint',
      'walkTitle', 'walkHint', 'walk_0', 'walk_5', 'walk_10', 'walk_20', 'walk_30',
    ];
    for (const key of required) {
      expect(es.assessment.test[key], `falta assessment.test.${key} en es.json`).toBeTruthy();
      expect(en.assessment.test[key], `falta assessment.test.${key} en en.json`).toBeTruthy();
    }
    const esText = JSON.stringify(es.assessment.test);
    for (const voseo of ['Elegí', 'Hacé', 'Tenés', 'Podés', 'Ingresá']) {
      expect(esText).not.toContain(voseo);
    }
  });
});
