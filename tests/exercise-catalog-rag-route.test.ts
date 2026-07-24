import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('generate-session route — exercise RAG', () => {
  const routePath = resolve(root, 'app/api/generate-session/route.ts');
  const route = readFileSync(routePath, 'utf-8');

  // ─── 7: Reusa el mismo embedding (no llama getEmbedding dos veces) ───
  it('reusa embedding variable (no segunda llamada a getEmbedding)', () => {
    // Debe haber exactamente 1 llamada a getEmbedding
    const occurrences = (route.match(/getEmbedding\(/g) || []).length;
    expect(occurrences).toBe(1);
  });

  // ─── 8: Pasa filter_equipment a search_exercises ───
  it('llama search_exercises con filter_equipment desde available_equipment', () => {
    expect(route).toContain('search_exercises');
    expect(route).toContain('filter_equipment');
    expect(route).toContain('available_equipment');
  });

  // ─── 9: Manejo de error/resultado vacío sin abortar ───
  it('error en search_exercises no aborta la generación (fallback a [])', () => {
    // Debe manejar error con !exercisesError (falsy check local)
    expect(route).toContain('exercisesError');
    // Debe tener fallback a [] en el ternario de availableExercises
    expect(route).toContain('!exercisesError');
    expect(route).toContain('? (exercisesResult');
    expect(route).toContain(': []');
    // No debe haber un return NextResponse.json después de la llamada
    const searchIdx = route.indexOf("'search_exercises'");
    const afterCall = route.slice(searchIdx, searchIdx + 1000);
    expect(afterCall).not.toContain('NextResponse.json');
  });
});
