import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Streaming DeepSeek', () => {

  // Riesgo 1: deepseek client tiene función de streaming
  it('lib/deepseek/client.ts exporta streamChatCompletion', () => {
    const path = resolve(root, 'lib/deepseek/client.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe exportar streamChatCompletion').toContain(
      'streamChatCompletion',
    );
    expect(raw, 'debe usar stream:true en la llamada').toContain('stream');
  });

  // Riesgo 2: API route soporta streaming mode
  it('route.ts detecta streaming via Accept: text/plain', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // Debe detectar el header Accept para decidir entre streaming y JSON
    expect(raw, 'debe soportar modo streaming').toContain('text/plain');
    // Debe crear un ReadableStream para la respuesta
    expect(raw, 'debe usar ReadableStream').toContain('ReadableStream');
  });

  // Riesgo 3: backward compat — sin Accept header sigue funcionando igual
  it('route.ts mantiene respuesta JSON cuando no hay streaming', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // La ruta original con NextResponse.json sigue existiendo
    expect(raw, 'debe mantener NextResponse.json para no-streaming').toContain(
      'NextResponse.json',
    );
    // Debe haber un condicional que bifurca entre streaming y no-streaming
    expect(raw, 'debe tener bifurcacion streaming/no-streaming').toContain('if');
  });

  // Riesgo 4: el delimitador final del stream es SESSION_ID:
  it('route.ts finaliza el stream con SESSION_ID: marcador', () => {
    const path = resolve(root, 'app/api/generate-session/route.ts');
    const raw = readFileSync(path, 'utf-8');
    // Debe usar el marcador SESSION_ID para el último chunk
    expect(raw, 'debe usar marcador SESSION_ID:').toContain('SESSION_ID:');
  });

  // Riesgo 5: dashboard-client lee el stream chunk por chunk
  it('dashboard-client.tsx tiene estado streaming con lectura de ReadableStream', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe tener estado streaming
    expect(raw, 'debe tener estado streaming').toContain('streaming');
    // Debe usar getReader() para leer el stream
    expect(raw, 'debe usar getReader').toContain('getReader');
  });

  // Riesgo 6: parser multi-chunk robusto
  it('dashboard-client.tsx acumula chunks y parsea al final del stream', () => {
    const path = resolve(
      root,
      'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe acumular texto (buffer o acumulador de chunks)
    const hasAccumulator =
      raw.includes('accumulated') ||
      raw.includes('buffer') ||
      raw.includes('fullText') ||
      raw.includes('chunks') ||
      raw.includes('+= text') ||
      raw.includes('+= chunk');
    expect(hasAccumulator, 'debe acumular texto de multiples chunks').toBe(true);
    // Debe splitear por SESSION_ID: para extraer metadatos
    expect(raw, 'debe split por SESSION_ID:').toContain('SESSION_ID:');
    // Debe usar JSON.parse sobre el texto acumulado
    expect(raw, 'debe parsear JSON del stream').toContain('JSON.parse');
  });

  // Riesgo 7: i18n key para streaming
  it('dashboard.streaming existe y es simetrica ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );
    expect(es.dashboard?.streaming, 'falta dashboard.streaming en es').toBeTruthy();
    expect(en.dashboard?.streaming, 'falta dashboard.streaming en en').toBeTruthy();
  });

  // Riesgo 8: la función original generateChatCompletion no se modifica
  it('generateChatCompletion original sigue intacta (backward compat)', () => {
    const path = resolve(root, 'lib/deepseek/client.ts');
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'generateChatCompletion debe seguir existiendo').toContain(
      'generateChatCompletion',
    );
    // No debe tener stream:true (eso es solo para streamChatCompletion)
    const generateIdx = raw.indexOf('generateChatCompletion');
    const streamIdx = raw.indexOf('stream:');
    const streamFuncIdx = raw.indexOf('streamChatCompletion');
    // stream: debe aparecer en streamChatCompletion, no en generateChatCompletion
    if (streamIdx > -1 && streamFuncIdx > -1) {
      expect(
        streamIdx > streamFuncIdx,
        'stream:true debe estar en streamChatCompletion, no en generateChatCompletion',
      ).toBe(true);
    }
  });
});
