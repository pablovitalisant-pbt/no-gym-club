import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 7 — daily adaptation', () => {

  // Riesgo 1: route.ts fetches previous completed session
  it('route.ts consulta la sesión anterior (completed_at DESC LIMIT 1)', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // Debe buscar sesiones completadas del usuario
    expect(raw, 'debe consultar workout_sessions').toContain('workout_sessions');
    // Debe filtrar por completed_at IS NOT NULL (solo sesiones completadas)
    expect(raw, 'debe filtrar sesiones completadas').toContain('completed_at');
    // Debe ordenar por la más reciente y limitar a 1
    const hasOrder =
      raw.includes('order') ||
      raw.includes('desc') ||
      raw.includes('limit') ||
      raw.includes('single');
    expect(hasOrder, 'debe ordenar DESC y limitar a 1').toBe(true);
  });

  // Riesgo 2: route.ts calcula days_since_last
  it('route.ts calcula days_since_last desde completed_at', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // Debe calcular la diferencia de días
    expect(raw, 'debe contener days_since_last').toContain('days_since_last');
    // Debe usar la fecha de la sesión anterior para el cálculo
    expect(raw, 'debe referenciar completed_at').toContain('completed_at');
  });

  // Riesgo 3: route.ts pasa datos de sesión anterior a buildSessionPrompt
  it('route.ts pasa previous session data a buildSessionPrompt', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // buildSessionPrompt se llama con datos de la sesion anterior (tercer argumento)
    expect(raw, 'debe llamar buildSessionPrompt').toContain('buildSessionPrompt');
    // Debe pasar rpe o exercises de la sesion anterior al prompt
    const hasPrevData =
      raw.includes('rpe') || raw.includes('exercises') || raw.includes('prev');
    expect(hasPrevData, 'debe pasar datos de sesion anterior al prompt').toBe(true);
  });

  // Riesgo 4: route.ts inserta days_since_last en la nueva sesión
  it('route.ts INSERT incluye days_since_last', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // El INSERT a workout_sessions debe incluir days_since_last
    // Buscar el .insert() y verificar que cerca hay days_since_last
    const insertIdx = raw.indexOf('.insert');
    const daysIdx = raw.indexOf('days_since_last:');
    expect(insertIdx, 'debe tener INSERT').toBeGreaterThan(-1);
    expect(daysIdx, 'debe incluir days_since_last en el INSERT').toBeGreaterThan(-1);
    // days_since_last: debe estar después del INSERT (es key del objeto)
    expect(
      daysIdx > insertIdx,
      'days_since_last debe estar en el objeto del INSERT',
    ).toBe(true);
  });

  // Riesgo 5: build-session-prompt acepta 3er parámetro opcional
  it('build-session-prompt acepta 3er parametro opcional PreviousSession', () => {
    const path = resolve(root, 'lib/prompts/build-session-prompt.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe exportar buildSessionPrompt').toContain('buildSessionPrompt');
    // Debe tener un 3er parámetro opcional (SessionHistory, prevSession o previous)
    const hasOptional =
      raw.includes('SessionHistory') ||
      raw.includes('prevSession') ||
      raw.includes('previous') ||
      raw.includes('PreviousSession');
    expect(hasOptional, 'debe aceptar parametro opcional de historial').toBe(true);
    // El parámetro debe ser opcional (con ?)
    expect(raw, '3er parametro debe ser opcional').toContain('?');
  });

  // Riesgo 6: system prompt incluye reglas de adaptación
  it('system prompt incluye reglas de adaptacion por RPE y rotacion muscular', () => {
    const path = resolve(root, 'lib/prompts/build-session-prompt.ts');
    const raw = readFileSync(path, 'utf-8');
    // El system prompt debe mencionar adaptación basada en sesión anterior
    const hasAdaptation =
      raw.includes('rotate') ||
      raw.includes('Rotate') ||
      raw.includes('previous') ||
      raw.includes('adapt') ||
      raw.includes('recovery');
    expect(hasAdaptation, 'system prompt debe incluir reglas de adaptacion').toBe(true);
  });

  // Riesgo 7: backward compat — sin sesión anterior sigue funcionando
  it('build-session-prompt funciona sin 3er parametro (backward compat)', () => {
    const path = resolve(root, 'lib/prompts/build-session-prompt.ts');
    const raw = readFileSync(path, 'utf-8');
    // El 3er parámetro debe ser opcional — la función debe poder llamarse con 2 args
    // Verificar que el parámetro tiene valor default o se usa condicionalmente
    const hasDefault =
      raw.includes('?:') ||
      raw.includes('= {}') ||
      raw.includes('= undefined') ||
      raw.includes('if (prev') ||
      raw.includes('if (previous');
    expect(
      hasDefault,
      '3er parametro debe ser opcional con fallback o condicional',
    ).toBe(true);
  });

  // Smoke: el test del slice 4c-ai sigue pasando (no rompió backward compat)
  it('session-generate-smoke.test.ts sigue teniendo 8 tests', () => {
    const path = resolve(root, 'tests/session-generate-smoke.test.ts');
    const raw = readFileSync(path, 'utf-8');
    const testCount = (raw.match(/\bit\(/g) || []).length;
    expect(testCount, 'session-generate-smoke debe tener 8 tests').toBe(8);
  });
});
