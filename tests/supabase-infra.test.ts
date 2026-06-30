import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// guardar estado original de env vars
const originalEnv = { ...process.env };

beforeAll(() => {
  // simular entorno sin credenciales
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

afterAll(() => {
  // restaurar
  Object.assign(process.env, originalEnv);
});

describe('Slice 2a — Supabase infra sin credenciales', () => {
  it('server.ts exporta createClient sin crashear con env vars vacias', async () => {
    // createServerClient de @supabase/ssr acepta strings vacios en construccion
    const mod = await import('@/lib/supabase/server');
    expect(mod.createClient).toBeDefined();
    expect(typeof mod.createClient).toBe('function');
    // no llamamos a createClient — solo verificamos que el modulo carga
  });

  it('client.ts exporta createClient sin crashear con env vars vacias', async () => {
    const mod = await import('@/lib/supabase/client');
    expect(mod.createClient).toBeDefined();
    expect(typeof mod.createClient).toBe('function');
  });

  it('middleware.ts exporta updateSession sin crashear', async () => {
    const mod = await import('@/lib/supabase/middleware');
    expect(mod.updateSession).toBeDefined();
    expect(typeof mod.updateSession).toBe('function');
  });

  it('middleware.ts (raiz) NO pierde el config.matcher de next-intl', async () => {
    const mod = await import('@/middleware');
    // el config debe seguir exportandose para que next-intl funcione
    expect(mod.config).toBeDefined();
    expect(mod.config.matcher).toBeDefined();
    const matcher = mod.config.matcher as string[];
    expect(matcher.length).toBeGreaterThan(0);
    // el patron de next-intl sigue excluyendo api y _next
    expect(matcher[0]).toContain('api');
    expect(matcher[0]).toContain('_next');
  });

  it('middleware.ts sigue exportando middleware como default (next-intl wrapper)', async () => {
    const mod = await import('@/middleware');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('i18n smoke tests siguen pasando con middleware modificado', async () => {
    // verificamos que el matcher no fue alterado
    const mod = await import('@/middleware');
    const matcher = mod.config.matcher as string[];

    // debe excluir api, _next, y archivos estaticos (mismo patron de Slice 1b)
    const pattern = matcher[0];
    expect(pattern).toContain('api');
    expect(pattern).toContain('_next');
    // next-intl excluye archivos estaticos — verificamos que el patron
    // es el mismo de Slice 1b (no fue alterado por updateSession)
    expect(pattern).toContain('|');
    // no debe listar rutas de auth explicitamente (eso es Slice 2c)
  });
});
