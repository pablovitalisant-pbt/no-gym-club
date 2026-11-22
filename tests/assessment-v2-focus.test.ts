import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { validateProfileV2 } from '@/lib/assessment/validate';

const root = resolve(__dirname, '..');
const migPath = resolve(root, 'supabase/migrations/0011_focus_areas.sql');
const formPath = resolve(root, 'app/[locale]/(app)/assessment/assessment-form.tsx');

function read(p: string) {
  return readFileSync(p, 'utf-8');
}

describe('slice v2-03c — validateProfileV2 focus_areas', () => {
  it('acepta focus_areas vacío (opcional)', () => {
    const r = validateProfileV2({ focus_areas: [] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.focus_areas).toEqual([]);
  });

  it('acepta hasta 3 areas permitidas', () => {
    const r = validateProfileV2({
      focus_areas: ['chest', 'skill_pullup', 'core'],
      focus_notes: 'Dominar la dominada estricta',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.focus_areas).toEqual(['chest', 'skill_pullup', 'core']);
      expect(r.value.focus_notes).toBe('Dominar la dominada estricta');
    }
  });

  it('rechaza un 4o elemento', () => {
    const r = validateProfileV2({
      focus_areas: ['chest', 'shoulders', 'back', 'arms'],
    });
    expect(r.ok).toBe(false);
  });

  it('rechaza valor desconocido', () => {
    const r = validateProfileV2({ focus_areas: ['biceps'] });
    expect(r.ok).toBe(false);
  });

  it('rechaza duplicados', () => {
    const r = validateProfileV2({ focus_areas: ['core', 'core'] });
    expect(r.ok).toBe(false);
  });

  it('rechaza focus_notes de más de 300 caracteres', () => {
    const r = validateProfileV2({ focus_notes: 'x'.repeat(301) });
    expect(r.ok).toBe(false);
  });

  it('acepta focus_notes de 300 caracteres', () => {
    const r = validateProfileV2({ focus_notes: 'x'.repeat(300) });
    expect(r.ok).toBe(true);
  });
});

describe('slice v2-03c — migracion 0011', () => {
  it('existe, es aditiva e idempotente', () => {
    expect(existsSync(migPath)).toBe(true);
    const s = read(migPath);
    expect(s).toContain('add column if not exists focus_areas');
    expect(s).toContain('add column if not exists focus_notes');
    expect(s).not.toMatch(/\bdrop\b/i);
    expect(s).not.toMatch(/\bdelete\b/i);
    expect(s).not.toMatch(/\btruncate\b/i);
  });

  it('limita focus_areas a los valores permitidos', () => {
    const s = read(migPath);
    expect(s).toContain('<@');
    for (const v of [
      'chest',
      'shoulders',
      'back',
      'arms',
      'legs',
      'glutes',
      'core',
      'skill_pullup',
      'skill_handstand',
      'skill_muscleup',
      'skill_pistol',
    ]) {
      expect(s).toContain(`'${v}'`);
    }
  });

  it('schema.sql y types.ts reflejan las columnas', () => {
    expect(read(resolve(root, 'supabase/schema.sql'))).toContain('focus_areas');
    expect(read(resolve(root, 'supabase/schema.sql'))).toContain('focus_notes');
    expect(read(resolve(root, 'lib/supabase/types.ts'))).toContain('focus_areas');
    expect(read(resolve(root, 'lib/supabase/types.ts'))).toContain('focus_notes');
  });
});

describe('slice v2-03c — UI envia focus_areas/focus_notes', () => {
  it('el form pasa focus_areas y focus_notes a saveProfile', () => {
    const src = read(formPath);
    expect(src).toContain('focus_areas');
    expect(src).toContain('focus_notes');
  });
});
