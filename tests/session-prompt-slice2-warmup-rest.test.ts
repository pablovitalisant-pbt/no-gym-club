import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 2 — descanso warmup generado por IA', () => {
  const promptPath = resolve(root, 'lib/prompts/build-session-prompt.ts');
  const prompt = readFileSync(promptPath, 'utf-8');

  it('SYSTEM_PROMPT instruye asignar rest_seconds a warmup', () => {
    // Debe mencionar warmup y rest_seconds juntos en el system prompt
    const systemStart = prompt.indexOf('SYSTEM_PROMPT');
    const userStart = prompt.indexOf('export function buildSessionPrompt');
    const systemBlock = prompt.slice(systemStart, userStart);

    expect(systemBlock).toContain('rest_seconds');
    expect(systemBlock).toContain('warmup');
  });

  it('Output format example incluye rest_seconds para warmup', () => {
    // El objeto warmup específicamente debe tener rest_seconds
    const warmupMatch = prompt.match(/"warmup":\s*\[\s*\{[^}]+}/);
    expect(warmupMatch, 'debe existir el objeto warmup').toBeTruthy();
    if (warmupMatch) {
      expect(warmupMatch[0], 'warmup debe incluir rest_seconds').toContain(
        'rest_seconds',
      );
    }
  });

  it('No rompe tests existentes del prompt', () => {
    // El archivo sigue exportando buildSessionPrompt
    expect(prompt).toContain('buildSessionPrompt');
    expect(prompt).toContain('SessionPrompt');
  });
});
