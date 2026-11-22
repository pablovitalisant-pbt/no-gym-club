import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const migPath = resolve(root, 'supabase/migrations/0014_community.sql');

function sql(): string {
  return existsSync(migPath) ? readFileSync(migPath, 'utf-8') : '';
}

describe('v2-22 migracion 0014 comunidad', () => {
  it('existe y es aditiva (sin drop/delete/truncate)', () => {
    expect(existsSync(migPath)).toBe(true);
    const s = sql();
    expect(s).not.toMatch(/drop\s+(table|column|function)/i);
    expect(s).not.toMatch(/\bdelete\s+from\b/i);
    expect(s).not.toMatch(/\btruncate\b/i);
  });

  it('crea las tres tablas con RLS habilitado', () => {
    const s = sql();
    for (const table of ['community_profiles', 'community_blocks', 'community_reports']) {
      expect(s).toMatch(new RegExp(`create table[\\s\\S]*?${table}`, 'i'));
      expect(s).toMatch(
        new RegExp(`alter table ${table} enable row level security`, 'i'),
      );
    }
  });

  it('community_profiles: columnas y limites de privacidad', () => {
    const s = sql();
    expect(s).toMatch(/is_public\s+bool(ean)?\s+not null default false/i);
    expect(s).toMatch(/bio[\s\S]*?char_length\(bio\)\s*<=\s*280/i);
    expect(s).toMatch(/comuna[\s\S]*?char_length\(comuna\)\s*<=\s*60/i);
    expect(s).toMatch(/show_photo\s+bool(ean)?(\s+not null)?\s+default true/i);
    expect(s).toMatch(/show_level\s+bool(ean)?(\s+not null)?\s+default true/i);
    expect(s).toMatch(/show_goal\s+bool(ean)?(\s+not null)?\s+default true/i);
    expect(s).toMatch(/geo_lat\s+numeric\(5,2\)/i);
    expect(s).toMatch(/geo_lng\s+numeric\(5,2\)/i);
  });

  it('RLS: solo el dueno lee su fila; nadie mas lee la tabla', () => {
    const s = sql();
    expect(s).toMatch(/on community_profiles\s+for select using \(auth\.uid\(\) = user_id\)/i);
    expect(s).toMatch(/on community_profiles\s+for insert with check \(auth\.uid\(\) = user_id\)/i);
    expect(s).toMatch(/on community_profiles\s+for update using \(auth\.uid\(\) = user_id\)/i);
    expect(s).not.toMatch(/on community_profiles\s+for select[\s\S]*?true\s*\)/i);
  });

  it('bloqueos: pk compuesta, dueño insert/select/delete y exclusion bidireccional', () => {
    const s = sql();
    expect(s).toMatch(/primary key\s*\(\s*blocker_id\s*,\s*blocked_id\s*\)/i);
    expect(s).toMatch(/on community_blocks\s+for insert with check \(auth\.uid\(\) = blocker_id\)/i);
    expect(s).toMatch(/on community_blocks\s+for select using \(auth\.uid\(\) = blocker_id\)/i);
    expect(s).toMatch(/on community_blocks\s+for delete using \(auth\.uid\(\) = blocker_id\)/i);
    expect(s).toMatch(/b\.blocker_id\s*=\s*auth\.uid\(\)\s*and\s*b\.blocked_id\s*=\s*cp\.user_id/i);
    expect(s).toMatch(/b\.blocker_id\s*=\s*cp\.user_id\s*and\s*b\.blocked_id\s*=\s*auth\.uid\(\)/i);
  });

  it('reportes: solo insert del reporter, sin select para usuarios', () => {
    const s = sql();
    expect(s).toMatch(/on community_reports\s+for insert with check \(auth\.uid\(\) = reporter_id\)/i);
    expect(s).not.toMatch(/on community_reports\s+for select/i);
    expect(s).toMatch(/reason text[\s\S]*?char_length\(reason\)\s*<=\s*500/i);
  });

  it('nearby_community_profiles: security definer, search_path, edad 18 y publico', () => {
    const s = sql();
    expect(s).toMatch(
      /function nearby_community_profiles\(radius_km int\)[\s\S]*?security definer[\s\S]*?set search_path = public/i,
    );
    expect(s).toMatch(/coalesce\(p\.age,\s*0\)\s*>=\s*18/i);
    expect(s).toMatch(/cp\.is_public/i);
    expect(s).toMatch(/cp\.user_id\s*<>\s*auth\.uid\(\)/i);
    expect(s).toMatch(/limit 50/i);
  });

  it('ninguna funcion devuelve lat/lng y la distancia se redondea (minimo 1 km)', () => {
    const s = sql();
    const returns = [...s.matchAll(/returns table\s*\(([\s\S]*?)\)\s*language/gi)];
    expect(returns.length).toBeGreaterThanOrEqual(2);
    for (const match of returns) {
      expect(match[1]).not.toMatch(/geo_lat|geo_lng|latitude|longitude/i);
    }
    expect(s).toMatch(/greatest\s*\(\s*1\s*,\s*round\s*\(/i);
    expect(s).toMatch(/::int|as integer/i);
  });

  it('radius_km filtra por distancia real antes de redondear con tope de 25 km', () => {
    const s = sql();
    expect(s).toMatch(/raw_km\s*<=\s*least\s*\(\s*coalesce\(radius_km,\s*5\)\s*,\s*25\s*\)/i);
  });

  it('revoca anon y concede a authenticated', () => {
    const s = sql();
    expect(s).toMatch(
      /revoke execute on function nearby_community_profiles\s*\(\s*int\s*\)[\s\S]*?anon/i,
    );
    expect(s).toMatch(
      /grant execute on function nearby_community_profiles\s*\(\s*int\s*\)\s*to authenticated/i,
    );
    expect(s).toMatch(
      /revoke execute on function community_profile\s*\(\s*uuid\s*\)[\s\S]*?anon/i,
    );
  });

  it('grants explicitos a authenticated y revoke a anon', () => {
    const s = sql();
    expect(s).toMatch(/grant select,\s*insert,\s*update on (table )?community_profiles to authenticated/i);
    expect(s).toMatch(/grant select,\s*insert,\s*delete on (table )?community_blocks to authenticated/i);
    expect(s).toMatch(/grant insert on (table )?community_reports to authenticated/i);
    expect(s).toMatch(
      /revoke all on (table )?community_profiles,\s*community_blocks,\s*community_reports from anon/i,
    );
  });

  it('flag community existe y es booleano, y schema.sql documenta las tablas', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    );
    expect(typeof flags.community).toBe('boolean');
    const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');
    expect(schema).toContain('community_profiles');
    expect(schema).toContain('community_blocks');
    expect(schema).toContain('community_reports');
  });
});
