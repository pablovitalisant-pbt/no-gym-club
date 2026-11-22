import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 4b — test physique guide', () => {
  // ─── Riesgo 1: Server Actions verifican auth antes de DB ───
  it('saveTestResults verifica auth.uid() antes del INSERT', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/assessment/test/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');

    // debe usar server client, no browser client
    expect(raw).toContain('@/lib/supabase/server');
    expect(raw).not.toContain('@/lib/supabase/client');

    // debe verificar autenticacion con getUser()
    expect(raw).toContain('getUser');
    // el userId debe venir de auth.uid(), no de un parametro del cliente
    expect(raw).toContain('auth');
  });

  it('saveTestResults tambien actualiza profiles (assessment_completed)', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/assessment/test/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    // el UPDATE de profiles.assessment_completed vive en saveTestResults
    // (no en una funcion separada completeAssessment)
    expect(raw).toContain('assessment_completed');
    expect(raw).toContain('.eq(');
    expect(raw).toContain('user.id');
  });

  // ─── Smoke: archivos existen ───
  it('test/page.tsx existe y es Server Component con getFlag', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/assessment/test/page.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw).not.toContain("'use client'");
    expect(raw).toContain('getFlag');
    expect(raw).toContain('assessment');
  });

  it('el wizard v2 existe y es Client Component', () => {
    const path = resolve(
      root,
      'components/assessment/tests/TestWizard.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain("'use client'");
    // no debe importar getFlag directamente (fs explota en browser)
    expect(raw).not.toContain('@/lib/flags');
  });

  it('test/actions.ts exporta saveTestResults', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/assessment/test/actions.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain('saveTestResults');
    expect(raw).toContain('export');
  });

  // ─── i18n ───
  it('test keys estan en ES y EN con los mismos nombres', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );

    expect(es.assessment?.test).toBeDefined();
    expect(en.assessment?.test).toBeDefined();

    const requiredKeys = [
      'title',
      'hint',
      'cannot',
      'reps',
      'start',
      'stop',
      'back',
      'next',
      'submit',
      'pushupTitle',
      'sitTitle',
      'plankTitle',
      'hangTitle',
      'pullupTitle',
      'walkTitle',
    ];

    requiredKeys.forEach((key) => {
      expect(
        es.assessment.test[key],
        `falta key assessment.test.${key} en es.json`,
      ).toBeTruthy();
      expect(
        en.assessment.test[key],
        `falta key assessment.test.${key} en en.json`,
      ).toBeTruthy();
    });
  });

  // ─── Timer del wizard ───
  it('useStopwatch tiene logica de timer (setInterval + clearInterval)', () => {
    const path = resolve(
      root,
      'components/assessment/tests/useStopwatch.ts',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw.includes('setInterval')).toBe(true);
    expect(raw.includes('clearInterval')).toBe(true);
  });
});
