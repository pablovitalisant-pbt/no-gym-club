import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const migPath = resolve(root, 'supabase/migrations/0012_training_plan_state.sql');

function sql(): string {
  return readFileSync(migPath, 'utf-8');
}

describe('migracion 0012 training plan state', () => {
  it('existe y es aditiva/idempotente', () => {
    expect(existsSync(migPath)).toBe(true);
    expect(sql()).toContain('add column if not exists');
  });

  it('training_plans: columnas del estado del plan', () => {
    const s = sql();
    expect(s).toMatch(/current_day_index\s+int\s+not null default 0/i);
    expect(s).toContain('84');
    expect(s).toMatch(/completed_day_indexes\s+int\[\]\s+not null default '\{\}'/i);
    expect(s).toMatch(/start_level\s+text/i);
    expect(s).toMatch(/status\s+text\s+not null default 'active'/i);
    expect(s).toContain("'abandoned'");
  });

  it('workout_sessions: plan_day_index + indice', () => {
    const s = sql();
    expect(s).toMatch(/plan_day_index\s+int/i);
    expect(s).toMatch(/create index if not exists[\s\S]*plan_id[\s\S]*plan_day_index/i);
  });

  it('un solo plan activo por usuario (indice unico parcial)', () => {
    const s = sql();
    expect(s).toMatch(/create unique index if not exists[\s\S]*training_plans\s*\(\s*user_id\s*\)[\s\S]*where\s+is_active/i);
  });

  it('no destructiva', () => {
    const s = sql();
    expect(s).not.toMatch(/drop\s+(table|column)/i);
    expect(s).not.toMatch(/\bdelete\b/i);
    expect(s).not.toMatch(/\btruncate\b/i);
  });

  it('schema.sql refleja las columnas nuevas', () => {
    const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');
    expect(schema).toContain('current_day_index');
    expect(schema).toContain('completed_day_indexes');
    expect(schema).toContain('plan_day_index');
  });

  it('feature flag training_plan_v2 existe y es booleano', () => {
    const flags = JSON.parse(readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'));
    expect(typeof flags.training_plan_v2).toBe('boolean');
  });
});
