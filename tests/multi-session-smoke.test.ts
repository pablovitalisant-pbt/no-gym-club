import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Multi-session analysis', () => {

  // Riesgo 1: route.ts fetches last 5 sessions
  it('route.ts consulta las ultimas 5 sesiones (limit 5)', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe consultar workout_sessions').toContain('workout_sessions');
    // Debe usar limit(5) en vez de limit(1)
    expect(raw, 'debe usar limit 5').toMatch(/limit\(5\)/);
  });

  // Riesgo 2: SessionHistory reemplaza PreviousSession
  it('build-session-prompt.ts exporta SessionHistory', () => {
    const path = resolve(root, 'lib/prompts/build-session-prompt.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe exportar SessionHistory').toContain('SessionHistory');
    expect(raw, 'debe contener averageRpe').toContain('averageRpe');
    expect(raw, 'debe contener rpeTrend').toContain('rpeTrend');
    expect(raw, 'debe contener sessionsThisWeek').toContain(
      'sessionsThisWeek',
    );
  });

  // Riesgo 3: route.ts calcula tendencias (avgRpe, rpeTrend, sessionsThisWeek)
  it('route.ts calcula averageRpe y rpeTrend', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe calcular averageRpe').toContain('averageRpe');
    expect(raw, 'debe calcular rpeTrend').toContain('rpeTrend');
    expect(raw, 'debe calcular sessionsThisWeek').toContain('sessionsThisWeek');
  });

  // Riesgo 4: system prompt menciona analisis multi-sesión
  it('system prompt incluye reglas de tendencia multi-sesión', () => {
    const path = resolve(root, 'lib/prompts/build-session-prompt.ts');
    const raw = readFileSync(path, 'utf-8');
    const hasMultiSession =
      raw.includes('trend') ||
      raw.includes('sessions this week') ||
      raw.includes('average') ||
      raw.includes('history');
    expect(
      hasMultiSession,
      'system prompt debe mencionar tendencias multi-sesión',
    ).toBe(true);
  });

  // Riesgo 5: backward compat — adaptation-smoke tests intactos
  it('adaptation-smoke.test.ts sigue teniendo 8 tests', () => {
    const path = resolve(root, 'tests/adaptation-smoke.test.ts');
    const raw = readFileSync(path, 'utf-8');
    const testCount = (raw.match(/\bit\(/g) || []).length;
    expect(testCount, 'debe mantener 8 tests').toBe(8);
  });
});
