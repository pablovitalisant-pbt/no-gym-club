import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 3b — seed catalog smoke', () => {
  it('seed.sql existe', () => {
    const raw = readFileSync(resolve(root, 'supabase/seed.sql'), 'utf-8');
    expect(raw.length).toBeGreaterThan(0);
  });

  it('contiene al menos 30 ejercicios', () => {
    const raw = readFileSync(resolve(root, 'supabase/seed.sql'), 'utf-8');
    const inserts = raw.match(/INSERT INTO exercises/gi);
    expect(inserts).not.toBeNull();
    expect(inserts!.length).toBeGreaterThanOrEqual(30);
  });

  it('cada INSERT tiene slug, name_es, name_en, category, difficulty', () => {
    const raw = readFileSync(resolve(root, 'supabase/seed.sql'), 'utf-8');
    const blocks = raw
      .split('INSERT INTO exercises')
      .filter((b) => b.includes('VALUES')); // skip header comments

    blocks.forEach((block, i) => {
      expect(block, `ejercicio ${i + 1}: falta slug`).toContain('slug');
      expect(block, `ejercicio ${i + 1}: falta name_es`).toContain('name_es');
      expect(block, `ejercicio ${i + 1}: falta name_en`).toContain('name_en');
      expect(block, `ejercicio ${i + 1}: falta category`).toContain('category');
      expect(block, `ejercicio ${i + 1}: falta difficulty`).toContain('difficulty');
    });
  });

  it('todas las categorias estan cubiertas (7)', () => {
    const raw = readFileSync(resolve(root, 'supabase/seed.sql'), 'utf-8');
    const categories = ['push', 'pull', 'core', 'legs', 'cardio', 'mobility', 'skill'];

    categories.forEach((cat) => {
      expect(raw, `falta categoria ${cat}`).toContain(`'${cat}'`);
    });
  });

  it('todos los niveles de dificultad estan cubiertos', () => {
    const raw = readFileSync(resolve(root, 'supabase/seed.sql'), 'utf-8');
    expect(raw).toContain("'beginner'");
    expect(raw).toContain("'intermediate'");
    expect(raw).toContain("'advanced'");
  });

  it('equipamiento valido — solo bodyweight, bar, ground, wall, dumbbell', () => {
    const raw = readFileSync(resolve(root, 'supabase/seed.sql'), 'utf-8');
    // no debe haber equipamiento invalido
    expect(raw).not.toMatch(/'machine'/i);
    expect(raw).not.toMatch(/'cable'/i);
    expect(raw).not.toMatch(/'barbell'/i);
    expect(raw).not.toMatch(/'kettlebell'/i);
  });

  it('SQL es sintacticamente valido — cada INSERT cierra con ) y ;', () => {
    const raw = readFileSync(resolve(root, 'supabase/seed.sql'), 'utf-8');
    const blocks = raw
      .split('INSERT INTO exercises')
      .filter((b) => b.includes('VALUES'));

    blocks.forEach((block, i) => {
      // cada bloque debe contener ); (cierre de VALUES)
      expect(
        block,
        `ejercicio ${i + 1}: INSERT no cierra correctamente`,
      ).toContain(');');
    });
  });
});
