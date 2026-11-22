import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateFixture } from '../.pbravot/qa-preparar.mjs';

const root = resolve(__dirname, '..');

describe('entorno QA', () => {
  it('declara la excepcion y el comando local', () => {
    const qa = JSON.parse(readFileSync(resolve(root, '.pbravot/qa-entorno.json'), 'utf8'));
    expect(qa.url).toBe('http://localhost:3123');
    expect(qa.comando).toContain('3123');
    expect(qa.env.QA_EXCEPCION_PRODUCCION).toBe('pablo-2026-11-21');
    expect(qa.guardas).toEqual([]);
  });

  it('preparador usa Admin API, limpia por user_id y no imprime contraseñas', () => {
    const raw = readFileSync(resolve(root, '.pbravot/qa-preparar.mjs'), 'utf8');
    expect(raw).toContain('auth.admin');
    expect(raw).toContain('user_id');
    expect(raw).toContain('cuentas.json');
    expect(raw).toContain('email_confirm: true');
    expect(raw).not.toMatch(/console\.log\([^\n]*password/i);
  });

  it('incluye las tres cuentas sintéticas y el barrido', () => {
    const raw = readFileSync(resolve(root, '.pbravot/qa-preparar.mjs'), 'utf8');
    const sweep = readFileSync(resolve(root, '.pbravot/qa-barrido.md'), 'utf8');
    for (const email of ['qa.extremo@nogym.test', 'qa.intermedio@nogym.test', 'qa.nuevo@nogym.test']) {
      expect(raw).toContain(email);
    }
    for (const route of ['landing', 'login', 'dashboard', 'assessment', 'exercises', 'progress', 'weekly-report']) {
      expect(sweep).toContain(route);
    }
  });

  it('los fixtures de fase 0 son fases reales validas', () => {
    for (const file of ['fase0-extremo.json', 'fase0-intermedio.json']) {
      const phase = JSON.parse(readFileSync(resolve(root, '.pbravot/fixtures', file), 'utf8'));
      expect(() => validateFixture(phase, file)).not.toThrow();
      expect(phase.week_template).toHaveLength(7);
      expect(phase.week_template.filter((d: { type: string }) => d.type === 'rest').length).toBeGreaterThan(0);
    }
  });

  it('rechaza una fase sin 7 dias o sin rest', () => {
    expect(() => validateFixture({ index: 0, week_template: [] }, 'x')).toThrow();
    expect(() =>
      validateFixture({ index: 0, week_template: Array(7).fill({ type: 'full' }) }, 'x'),
    ).toThrow();
  });

  it('siembra un plan activo para extremo e intermedio y ninguno para nuevo', () => {
    const raw = readFileSync(resolve(root, '.pbravot/qa-preparar.mjs'), 'utf8');
    expect(raw).toContain('fase0-extremo.json');
    expect(raw).toContain('fase0-intermedio.json');
    expect(raw).toContain("from('training_plans')");
    expect(raw).toContain('version: 2');
    expect(raw).toContain('total_weeks: 12');
    expect(raw).toContain('phase_weeks: 4');
    expect(raw).toContain('current_day_index: 0');
    expect(raw).toContain('completed_day_indexes: []');
    expect(raw).toContain('is_active: true');
    expect(raw).toContain('untrained_extreme');
    expect(raw).toContain("'intermediate'");
    expect(raw.indexOf('validateFixture(')).toBeLessThan(raw.indexOf("from('training_plans')"));
  });
});
