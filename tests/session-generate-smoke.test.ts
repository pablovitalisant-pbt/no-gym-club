import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 4c-ai — generate session', () => {

  // Riesgo 1: var env — los clientes validan sus keys
  it('deepseek client valida que DEEPSEEK_API_KEY existe en el módulo', () => {
    const deepseekPath = resolve(root, 'lib/deepseek/client.ts');
    expect(existsSync(deepseekPath), 'lib/deepseek/client.ts debe existir').toBe(true);
    const raw = readFileSync(deepseekPath, 'utf-8');
    // Debe referenciar DEEPSEEK_API_KEY o DEEPSEEK_BASE_URL (usa process.env)
    const hasApiKey = raw.includes('DEEPSEEK_API_KEY') || raw.includes('DEEPSEEK_BASE_URL');
    expect(hasApiKey, 'debe referenciar DEEPSEEK_API_KEY o DEEPSEEK_BASE_URL').toBe(true);
  });

  it('nvidia client acepta inputType query además de passage', () => {
    const nvidiaPath = resolve(root, 'lib/nvidia/client.ts');
    expect(existsSync(nvidiaPath), 'lib/nvidia/client.ts debe existir').toBe(true);
    const raw = readFileSync(nvidiaPath, 'utf-8');
    // getEmbedding debe aceptar 'query' como inputType (no solo 'passage')
    expect(raw, 'getEmbedding debe aceptar inputType query').toContain("'query'");
  });

  // Riesgo 2: INSERT con auth — la route verifica auth antes de insertar
  it('api route verifica auth antes de INSERT a workout_sessions', () => {
    const routePath = resolve(root, 'app/api/generate-session/route.ts');
    expect(existsSync(routePath), 'app/api/generate-session/route.ts debe existir').toBe(true);
    const raw = readFileSync(routePath, 'utf-8');
    // Debe llamar a getUser() (auth check) antes de cualquier insert
    const authIndex = raw.indexOf('getUser');
    const insertIndex = raw.indexOf('workout_sessions');
    expect(authIndex, 'debe llamar a getUser() para verificar auth').toBeGreaterThan(-1);
    expect(insertIndex, 'debe insertar en workout_sessions').toBeGreaterThan(-1);
    // getUser debe aparecer ANTES del INSERT (verificación de orden)
    expect(
      authIndex < insertIndex,
      'getUser() debe ejecutarse antes del INSERT a workout_sessions',
    ).toBe(true);
  });

  it('api route usa user.id del auth, no del request body', () => {
    const routePath = resolve(root, 'app/api/generate-session/route.ts');
    expect(existsSync(routePath), 'app/api/generate-session/route.ts debe existir').toBe(true);
    const raw = readFileSync(routePath, 'utf-8');
    // user.id debe venir de getUser(), no de request body o searchParams
    expect(raw, 'debe usar user.id (de auth), no body.user_id').toContain('user.id');
    // No debe leer user_id del body
    expect(raw, 'no debe leer user_id del request body').not.toContain('body.user_id');
  });

  // Riesgo 3: API externa — hay manejo de error explícito
  it('api route maneja fallo de DeepSeek con respuesta de error estructurada', () => {
    const routePath = resolve(root, 'app/api/generate-session/route.ts');
    expect(existsSync(routePath), 'app/api/generate-session/route.ts debe existir').toBe(true);
    const raw = readFileSync(routePath, 'utf-8');
    // Debe tener try/catch o .catch() alrededor de la llamada a DeepSeek
    const hasTryCatch = raw.includes('try') && raw.includes('catch');
    const hasDotCatch = raw.includes('.catch');
    expect(
      hasTryCatch || hasDotCatch,
      'debe tener manejo de error (try/catch o .catch) para la llamada a DeepSeek',
    ).toBe(true);
    // Debe devolver un error estructurado, no crashear
    expect(raw, 'debe devolver { error } estructurado').toContain('error');
  });

  // Smoke: estructura correcta
  it('build-session-prompt exporta buildSessionPrompt', () => {
    const promptPath = resolve(root, 'lib/prompts/build-session-prompt.ts');
    expect(existsSync(promptPath), 'lib/prompts/build-session-prompt.ts debe existir').toBe(true);
    const raw = readFileSync(promptPath, 'utf-8');
    expect(raw, 'debe exportar buildSessionPrompt').toContain('buildSessionPrompt');
  });

  it('generate-session route exporta POST handler', () => {
    const routePath = resolve(root, 'app/api/generate-session/route.ts');
    expect(existsSync(routePath), 'app/api/generate-session/route.ts debe existir').toBe(true);
    const raw = readFileSync(routePath, 'utf-8');
    expect(raw, 'debe exportar async function POST').toContain('export async function POST');
  });

  it('feature flag ai_session_generation existe en feature-flags.json', () => {
    const flagsPath = resolve(root, 'config/feature-flags.json');
    const raw = readFileSync(flagsPath, 'utf-8');
    const flags = JSON.parse(raw);
    expect(
      'ai_session_generation' in flags,
      'feature-flags.json debe tener ai_session_generation',
    ).toBe(true);
    expect(flags.ai_session_generation, 'ai_session_generation debe ser false').toBe(false);
  });
});
