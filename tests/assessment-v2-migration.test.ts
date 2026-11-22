import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const migPath = resolve(root, 'supabase/migrations/0010_assessment_v2.sql');

function sql(): string {
  return readFileSync(migPath, 'utf-8');
}

describe('migracion 0010 assessment v2', () => {
  it('existe y es aditiva/idempotente', () => {
    expect(existsSync(migPath)).toBe(true);
    expect(sql()).toContain('add column if not exists');
  });

  it('profiles: columnas nuevas con checks', () => {
    const s = sql();
    expect(s).toMatch(/training_history/);
    expect(s).toContain("'never','past','active'");
    expect(s).toContain('health_limitations text[]');
    expect(s).toContain('<@');
    expect(s).toContain('limitations_notes text');
    expect(s).toContain('cardio_preference');
    expect(s).toContain("'none','light','moderate','intense'");
    expect(s).toMatch(/timezone text/);
  });

  it('assessment_results: columnas nuevas con checks', () => {
    const s = sql();
    expect(s).toContain('pushup_variant');
    expect(s).toContain("'floor','knee','incline','wall','none'");
    expect(s).toContain('pushup_variant_reps');
    expect(s).toContain('dead_hang_seconds');
    expect(s).toContain('knee_plank_seconds');
    expect(s).toContain('sit_to_stand_30s');
    expect(s).toContain('walk_minutes');
  });

  it('no destructiva', () => {
    const s = sql();
    expect(s).not.toMatch(/drop\s+table/i);
    expect(s).not.toMatch(/\bdelete\b/i);
    expect(s).not.toMatch(/\btruncate\b/i);
  });

  it('schema.sql refleja columnas nuevas', () => {
    const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');
    expect(schema).toContain('training_history');
    expect(schema).toContain('health_limitations');
    expect(schema).toContain('pushup_variant');
    expect(schema).toContain('sit_to_stand_30s');
    expect(schema).toContain('walk_minutes');
  });
});
