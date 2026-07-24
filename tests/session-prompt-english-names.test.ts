import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Prompt — exercise names in English', () => {
  const promptPath = resolve(root, 'lib/prompts/build-session-prompt.ts');
  const prompt = readFileSync(promptPath, 'utf-8');

  it('SYSTEM_PROMPT instruye que exercise debe ir en inglés', () => {
    // Debe mencionar "exercise" cerca de "English" o "in English"
    const systemStart = prompt.indexOf('SYSTEM_PROMPT');
    const systemBlock = prompt.slice(systemStart, systemStart + 3000);
    expect(systemBlock).toContain('exercise');
    const hasEnglishRule =
      systemBlock.includes('"exercise"') &&
      (systemBlock.includes('English') || systemBlock.includes('english') || systemBlock.includes('in English'));
    expect(hasEnglishRule).toBe(true);
  });
});
