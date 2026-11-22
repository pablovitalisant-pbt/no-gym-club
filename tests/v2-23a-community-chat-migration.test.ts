import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const migPath = resolve(root, 'supabase/migrations/0015_community_chat.sql');

function sql(): string {
  return existsSync(migPath) ? readFileSync(migPath, 'utf-8') : '';
}

describe('v2-23a migracion 0015 chat y conexiones', () => {
  it('existe y es aditiva (sin drop/delete/truncate)', () => {
    expect(existsSync(migPath)).toBe(true);
    const s = sql();
    expect(s).not.toMatch(/drop\s+(table|column|function)/i);
    expect(s).not.toMatch(/\bdelete\s+from\b/i);
    expect(s).not.toMatch(/\btruncate\b/i);
  });

  it('crea las dos tablas con RLS habilitado', () => {
    const s = sql();
    for (const table of ['community_connections', 'community_messages']) {
      expect(s).toMatch(new RegExp(`create table[\\s\\S]*?${table}`, 'i'));
      expect(s).toMatch(new RegExp(`alter table ${table} enable row level security`, 'i'));
    }
  });

  it('connections: estados, partes distintas e indice unico por par ordenado', () => {
    const s = sql();
    expect(s).toMatch(/status text[\s\S]*?check\s*\(\s*status in\s*\(\s*'pending'\s*,\s*'accepted'\s*,\s*'declined'\s*,\s*'cancelled'\s*\)/i);
    expect(s).toMatch(/check\s*\(\s*requester_id\s*<>\s*addressee_id\s*\)/i);
    expect(s).toMatch(/unique index[\s\S]*?least\(\s*requester_id\s*,\s*addressee_id\s*\)[\s\S]*?greatest\(\s*requester_id\s*,\s*addressee_id\s*\)/i);
  });

  it('connections: RLS select solo para las partes y sin policies de insert/update', () => {
    const s = sql();
    expect(s).toMatch(
      /on community_connections\s+for select using[\s\S]*?requester_id\s*=\s*auth\.uid\(\)[\s\S]*?addressee_id\s*=\s*auth\.uid\(\)/i,
    );
    expect(s).not.toMatch(/on community_connections\s+for insert/i);
    expect(s).not.toMatch(/on community_connections\s+for update/i);
    expect(s).not.toMatch(/on community_connections\s+for delete/i);
  });

  it('messages: cuerpo 1..1000 y RLS de lectura/escritura solo en conexion aceptada y sin bloqueo', () => {
    const s = sql();
    expect(s).toMatch(/char_length\(\s*btrim\(body\)\s*\)\s+between\s+1\s+and\s+1000/i);
    expect(s).toMatch(/on community_messages\s+for select using[\s\S]*?status\s*=\s*'accepted'/i);
    expect(s).toMatch(/on community_messages\s+for select using[\s\S]*?community_pair_blocked\(/i);
    expect(s).toMatch(/on community_messages\s+for insert with check[\s\S]*?sender_id\s*=\s*auth\.uid\(\)/i);
    expect(s).toMatch(/on community_messages\s+for insert with check[\s\S]*?status\s*=\s*'accepted'/i);
    expect(s).not.toMatch(/on community_messages\s+for update/i);
  });

  it('request_connection: security definer, publico, adulto, bloqueo y limite 20/24h', () => {
    const s = sql();
    expect(s).toMatch(
      /function request_connection\(target uuid\)[\s\S]*?security definer[\s\S]*?set search_path = public/i,
    );
    expect(s).toMatch(/cp\.is_public/i);
    expect(s).toMatch(/coalesce\(\s*p\.age\s*,\s*0\s*\)\s*>=\s*18/i);
    expect(s).toMatch(/community_pair_blocked\(\s*me\s*,\s*target\s*\)/i);
    expect(s).toMatch(/count\(\*\)[\s\S]*?interval '24 hours'/i);
    expect(s).toMatch(/recent_count\s*>=\s*20/i);
    expect(s).toMatch(/status\s*=\s*'pending'/i);
    expect(s).toMatch(/status in\s*\(\s*'declined'\s*,\s*'cancelled'\s*\)|status in\s*\(\s*'pending'\s*,\s*'accepted'\s*\)/i);
  });

  it('respond_connection: solo destinatario y solo pending', () => {
    const s = sql();
    expect(s).toMatch(
      /function respond_connection\(connection_id uuid, accept boolean\)[\s\S]*?security definer/i,
    );
    expect(s).toMatch(/addressee_id\s*=\s*me[\s\S]*?status\s*=\s*'pending'/i);
    expect(s).toMatch(/'accepted'\s*[\s\S]*?'declined'|'declined'\s*[\s\S]*?'accepted'/i);
  });

  it('cancel_connection: solicitante si pending, cualquiera si accepted, deja cancelled', () => {
    const s = sql();
    expect(s).toMatch(/function cancel_connection\(connection_id uuid\)[\s\S]*?security definer/i);
    expect(s).toMatch(/status\s*=\s*'cancelled'/i);
    expect(s).toMatch(/status\s*=\s*'pending'/i);
    expect(s).toMatch(/status\s*=\s*'accepted'/i);
  });

  it('mark_messages_read: solo el destinatario marca read_at', () => {
    const s = sql();
    expect(s).toMatch(/function mark_messages_read\(connection_id uuid\)[\s\S]*?security definer/i);
    expect(s).toMatch(/sender_id\s*<>\s*me/i);
    expect(s).toMatch(/set read_at\s*=\s*now\(\)/i);
  });

  it('trigger de bloqueo cancela la conexion del par', () => {
    const s = sql();
    expect(s).toMatch(/after insert on community_blocks/i);
    expect(s).toMatch(/set status\s*=\s*'cancelled'/i);
    expect(s).toMatch(/requester_id\s*=\s*new\.blocker_id\s+and\s+addressee_id\s*=\s*new\.blocked_id/i);
    expect(s).toMatch(/requester_id\s*=\s*new\.blocked_id\s+and\s+addressee_id\s*=\s*new\.blocker_id/i);
  });

  it('trigger de tasa: maximo 30 mensajes por minuto del mismo emisor', () => {
    const s = sql();
    expect(s).toMatch(/before insert on community_messages/i);
    expect(s).toMatch(/count\(\*\)[\s\S]*?interval '1 minute'/i);
    expect(s).toMatch(/>=?\s*30/i);
  });

  it('realtime: publicacion idempotente de community_messages', () => {
    const s = sql();
    expect(s).toMatch(/pg_publication_tables/i);
    expect(s).toMatch(/alter publication supabase_realtime add table community_messages/i);
  });

  it('permisos: grants explicitos a authenticated y revoke a anon', () => {
    const s = sql();
    expect(s).toMatch(/grant select on (table )?community_connections to authenticated/i);
    expect(s).toMatch(/grant select,\s*insert on (table )?community_messages to authenticated/i);
    for (const fn of [
      'request_connection\\(uuid\\)',
      'respond_connection\\(uuid,\\s*boolean\\)',
      'cancel_connection\\(uuid\\)',
      'mark_messages_read\\(uuid\\)',
    ]) {
      expect(s).toMatch(new RegExp(`revoke execute on function ${fn}[\\s\\S]*?anon`, 'i'));
      expect(s).toMatch(new RegExp(`grant execute on function ${fn}\\s*to authenticated`, 'i'));
    }
    expect(s).toMatch(
      /revoke all on (table )?community_connections,\s*community_messages from anon/i,
    );
  });

  it('flag community_chat existe en false y schema.sql documenta las tablas', () => {
    const flags = JSON.parse(readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'));
    expect(flags.community_chat).toBe(false);
    const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');
    expect(schema).toContain('community_connections');
    expect(schema).toContain('community_messages');
  });
});
