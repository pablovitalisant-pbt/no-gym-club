import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Two-pool retrieval — mobility + main, reusing embedding', () => {
  const migPath = resolve(root, 'supabase/migrations/0009_add_filter_category.sql');
  const mig = readFileSync(migPath, 'utf-8');
  const routePath = resolve(root, 'app/api/generate-session/route.ts');
  const route = readFileSync(routePath, 'utf-8');

  // ─── 10: filter_category en search_exercises ───
  it('migración agrega filter_category a search_exercises con security definer', () => {
    expect(mig).toContain('filter_category');
    expect(mig).toContain('security definer');
    expect(mig).toContain('set search_path = public');
  });

  // ─── 11: Dos llamadas a search_exercises ───
  it('route.ts llama search_exercises dos veces (mobility + main)', () => {
    const occurrences = (route.match(/'search_exercises'/g) || []).length;
    expect(occurrences).toBe(2);
  });

  // ─── 12: filter_category con mobility y sin mobility ───
  it('un search_exercises pasa filter_category mobility, el otro lo excluye', () => {
    const firstCall = route.indexOf("'search_exercises'");
    const afterFirst = route.slice(firstCall, firstCall + 500);
    const secondCall = route.indexOf("'search_exercises'", firstCall + 1);
    const afterSecond = route.slice(secondCall, secondCall + 500);
    // Uno debe tener mobility, el otro debe excluirlo
    const hasMobility = afterFirst.includes('mobility') || afterSecond.includes('mobility');
    const hasNotMobility = afterFirst.includes('!==') || afterSecond.includes('!==');
    expect(hasMobility).toBe(true);
    expect(hasNotMobility).toBe(true);
  });

  // ─── 13: Una sola getEmbedding ───
  it('getEmbedding aparece una sola vez (sin llamada extra)', () => {
    const occurrences = (route.match(/getEmbedding\(/g) || []).length;
    expect(occurrences).toBe(1);
  });

  // ─── 14: Error handling sin abortar (ambas llamadas) ───
  it('manejo de error sin NextResponse.json en ninguna de las dos llamadas', () => {
    const firstCall = route.indexOf("'search_exercises'");
    const afterFirst = route.slice(firstCall, firstCall + 800);
    const secondCall = route.indexOf("'search_exercises'", firstCall + 1);
    const afterSecond = route.slice(secondCall, secondCall + 800);
    // Ninguna debe tener NextResponse.json (eso abortaría)
    expect(afterFirst).not.toContain('NextResponse.json');
    expect(afterSecond).not.toContain('NextResponse.json');
  });
});
