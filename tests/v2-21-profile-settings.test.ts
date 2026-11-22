import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const migPath = resolve(root, 'supabase/migrations/0013_profile_settings.sql');

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf-8');
}

describe('Slice v2-21 — migración 0013: nombre, avatar y preferencias', () => {
  it('existe y es aditiva', () => {
    expect(existsSync(migPath)).toBe(true);
    expect(readFileSync(migPath, 'utf-8')).toContain('add column if not exists');
  });

  it('profiles: display_name con límite de 40, avatar_url y theme_preference', () => {
    const s = readFileSync(migPath, 'utf-8');
    expect(s).toMatch(/display_name\s+text[\s\S]*char_length\(display_name\)\s*<=\s*40/i);
    expect(s).toMatch(/avatar_url\s+text/i);
    expect(s).toMatch(/theme_preference\s+text\s+(not null\s+)?default\s+'dark'/i);
    expect(s).toMatch(/'light'\s*,\s*'dark'\s*,\s*'system'/i);
  });

  it('bucket avatars público y policies por carpeta del usuario', () => {
    const s = readFileSync(migPath, 'utf-8');
    expect(s).toMatch(/storage\.buckets[\s\S]*'avatars'[\s\S]*true/i);
    expect(s).toContain('storage.foldername(name)[1] = auth.uid()::text');
    expect(s).toMatch(/for insert/i);
    expect(s).toMatch(/for update/i);
    expect(s).toMatch(/for delete/i);
    expect(s).toMatch(/bucket_id\s*=\s*'avatars'/i);
  });

  it('no destructiva: sin drop de tabla/columna/policy, sin delete from ni truncate', () => {
    const s = readFileSync(migPath, 'utf-8');
    expect(s).not.toMatch(/drop\s+(table|column|policy)/i);
    expect(s).not.toMatch(/delete\s+from/i);
    expect(s).not.toMatch(/\btruncate\b/i);
  });

  it('schema.sql y types.ts reflejan las columnas', () => {
    const schema = read('supabase/schema.sql');
    expect(schema).toContain('display_name');
    expect(schema).toContain('avatar_url');
    expect(schema).toContain('theme_preference');

    const types = read('lib/supabase/types.ts');
    expect(types).toContain('display_name');
    expect(types).toContain('avatar_url');
    expect(types).toContain('theme_preference');
  });

  it('feature flag profile_settings existe y es booleano', () => {
    const flags = JSON.parse(read('config/feature-flags.json'));
    expect(typeof flags.profile_settings).toBe('boolean');
  });
});

describe('Slice v2-21 — validación de nombre e imagen', () => {
  it('nombre: trim, colapsa espacios, vacío = sin nombre, >40 rechaza', async () => {
    const { normalizeDisplayName } = await import('../lib/settings/validate');
    expect(normalizeDisplayName('  Pablo  ')).toEqual({ ok: true, value: 'Pablo' });
    expect(normalizeDisplayName('Ana   María')).toEqual({ ok: true, value: 'Ana María' });
    expect(normalizeDisplayName('   ')).toEqual({ ok: true, value: null });
    expect(normalizeDisplayName(null)).toEqual({ ok: true, value: null });
    expect(normalizeDisplayName('a'.repeat(40)).ok).toBe(true);
    expect(normalizeDisplayName('a'.repeat(41)).ok).toBe(false);
  });

  it('imagen: solo image/* y máximo 1 MB', async () => {
    const { validateAvatarFile, AVATAR_MAX_BYTES } = await import('../lib/settings/validate');
    expect(AVATAR_MAX_BYTES).toBe(1024 * 1024);
    expect(validateAvatarFile({ type: 'image/jpeg', size: 500_000 }).ok).toBe(true);
    expect(validateAvatarFile({ type: 'text/plain', size: 1000 }).ok).toBe(false);
    expect(validateAvatarFile({ type: 'image/png', size: 0 }).ok).toBe(false);
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 }).ok).toBe(false);
  });

  it('tema: solo light/dark/system', async () => {
    const { isTheme } = await import('../lib/settings/validate');
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('system')).toBe(true);
    expect(isTheme('blue')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe('Slice v2-21 — saludo con y sin nombre', () => {
  it('greetingText devuelve el texto solo si hay nombre', async () => {
    const { greetingText } = await import('../lib/settings/greeting');
    expect(greetingText('Hola, {name}', 'Pablo')).toBe('Hola, Pablo');
    expect(greetingText('Hola, {name}', '  ')).toBeNull();
    expect(greetingText('Hola, {name}', null)).toBeNull();
  });

  it('dashboard y pantalla final usan el saludo condicional', () => {
    const dashboard = read('app/[locale]/(app)/dashboard/page.tsx');
    expect(dashboard).toContain('display_name');
    expect(dashboard).toContain('greetingText');
    expect(dashboard).toContain("t('greeting'");

    const summary = read('components/session/ContinuousSummary.tsx');
    expect(summary).toContain('displayName');
    expect(summary).toContain('greetingText');
    expect(summary).toMatch(/summaryGreeting|summaryTitle/);
  });
});

describe('Slice v2-21 — ruta protegida y preferencias', () => {
  it('middleware protege /settings', () => {
    const mw = read('middleware.ts');
    expect(mw).toContain("'/settings'");
  });

  it('ThemeSelector avisa al elegir y settings guarda en el perfil', () => {
    const selector = read('components/settings/ThemeSelector.tsx');
    expect(selector).toContain('onSelect');
    const client = read('app/[locale]/(app)/settings/settings-client.tsx');
    expect(client).toContain('saveThemePreference');
  });

  it('acciones de servidor verifican usuario', () => {
    const actions = read('app/[locale]/(app)/settings/actions.ts');
    expect(actions).toContain('getUser');
    expect(actions).toContain('saveDisplayName');
    expect(actions).toContain('saveAvatarUrl');
    expect(actions).toContain('saveThemePreference');
  });

  it('i18n: settings y nav.settings en ES y EN', () => {
    const es = JSON.parse(read('messages/es.json'));
    const en = JSON.parse(read('messages/en.json'));
    expect(typeof es.settings?.title).toBe('string');
    expect(typeof en.settings?.title).toBe('string');
    expect(typeof es.nav.settings).toBe('string');
    expect(typeof en.nav.settings).toBe('string');
    expect(Object.keys(es.settings).sort()).toEqual(Object.keys(en.settings).sort());
  });
});
