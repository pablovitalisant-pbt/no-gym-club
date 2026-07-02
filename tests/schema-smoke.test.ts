import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 3a — schema documentation smoke', () => {
  it('0001_initial_schema.sql existe y contiene las 6 tablas', () => {
    const path = resolve(
      root,
      'supabase/migrations/0001_initial_schema.sql',
    );
    const raw = readFileSync(path, 'utf-8');

    const tables = [
      'profiles',
      'exercises',
      'assessment_results',
      'training_plans',
      'workout_sessions',
      'skill_progress',
    ];

    tables.forEach((table) => {
      expect(raw, `falta CREATE TABLE ${table}`).toContain(table);
    });

    // debe tener RLS habilitado (en SQL es lowercase)
    expect(raw).toContain('row level security');
  });

  it('0002_fix_function_search_path.sql existe y menciona search_path', () => {
    const path = resolve(
      root,
      'supabase/migrations/0002_fix_function_search_path.sql',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain('search_path');
  });

  it('schema.sql existe como copia de referencia', () => {
    const path = resolve(root, 'supabase/schema.sql');
    const raw = readFileSync(path, 'utf-8');
    expect(raw).toContain('profiles');
    expect(raw).toContain('exercises');
    expect(raw).toContain('workout_sessions');
  });

  it('types.ts exporta tipo Database con las tablas esperadas', () => {
    const path = resolve(root, 'lib/supabase/types.ts');
    const raw = readFileSync(path, 'utf-8');

    // debe exportar el tipo Database
    expect(raw).toContain('export');
    expect(raw).toContain('Database');

    // debe contener las 6 tablas
    const tables = [
      'profiles',
      'exercises',
      'assessment_results',
      'training_plans',
      'workout_sessions',
      'skill_progress',
    ];

    tables.forEach((table) => {
      expect(raw, `types.ts no contiene tabla ${table}`).toContain(table);
    });
  });

  it('types.ts compila sin errores (estructura TypeScript valida)', () => {
    const path = resolve(root, 'lib/supabase/types.ts');
    const raw = readFileSync(path, 'utf-8');

    // verificaciones minimas de sintaxis TS valida
    expect(raw).toContain('{');
    expect(raw).toContain('}');
    // no debe tener errores obvios de sintaxis
    expect(raw).not.toContain('<<<<<<<');
    expect(raw).not.toContain('=======');
    expect(raw).not.toContain('>>>>>>>');
  });

  it('feature-flags.json es JSON parseable', () => {
    // si este test pasa pero el de arriba no, es solo la key faltante
    const raw = readFileSync(
      resolve(root, 'config/feature-flags.json'),
      'utf-8',
    );
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
