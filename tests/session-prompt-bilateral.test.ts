import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Prompt bilateral — build-session-prompt.ts', () => {
  const promptPath = resolve(root, 'lib/prompts/build-session-prompt.ts');
  const prompt = readFileSync(promptPath, 'utf-8');

  it('SYSTEM_PROMPT contiene regla sobre bilateral con semántica "por lado"', () => {
    expect(prompt).toContain('bilateral');
    // Debe aclarar que duration_seconds/sets aplican por lado
    const hasPerSide = prompt.includes('por lado') || prompt.includes('per side');
    expect(hasPerSide).toBe(true);
  });

  it('Output Format incluye "bilateral": false en warmup, main y cooldown', () => {
    // Buscar el bloque de output format después de "## Output Format"
    const fmtIdx = prompt.indexOf('## Output Format');
    const fmtBlock = prompt.slice(fmtIdx, fmtIdx + 1500);
    // Debe haber al menos 3 ocurrencias de "bilateral": false
    const occurrences = (fmtBlock.match(/"bilateral":\s*false/g) || []).length;
    expect(occurrences).toBeGreaterThanOrEqual(3);
  });
});
