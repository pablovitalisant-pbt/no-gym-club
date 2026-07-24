import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Embedding migration + search_exercises', () => {
  const migPath = resolve(root, 'supabase/migrations/0008_exercises_embedding.sql');
  const schemaPath = resolve(root, 'supabase/schema.sql');

  it('migración 0008 existe con vector(1024) e ivfflat', () => {
    expect(existsSync(migPath)).toBe(true);
    const sql = readFileSync(migPath, 'utf-8');
    expect(sql).toContain('vector(1024)');
    expect(sql).toContain('ivfflat');
    expect(sql).toContain('vector_cosine_ops');
  });

  it('search_exercises function definida con 3 parámetros y security definer', () => {
    expect(existsSync(migPath)).toBe(true);
    const sql = readFileSync(migPath, 'utf-8');
    expect(sql).toContain('search_exercises');
    expect(sql).toContain('query_embedding');
    expect(sql).toContain('match_count');
    expect(sql).toContain('filter_equipment');
    expect(sql).toContain('security definer');
    expect(sql).toContain('set search_path = public');
  });

  it('schema.sql refleja columna embedding en exercises', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('embedding');
    expect(schema).toContain('vector(1024)');
  });
});
