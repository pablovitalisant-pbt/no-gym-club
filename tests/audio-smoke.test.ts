import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Audio notification on rest complete', () => {

  // Riesgo 1: lib/audio.ts existe y usa Web Audio API
  it('lib/audio.ts exporta las alarmas usando Web Audio API', () => {
    const path = resolve(root, 'lib/audio.ts');
    expect(existsSync(path), 'lib/audio.ts debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    for (const fn of ['playTick', 'playTransition', 'playDone']) {
      expect(raw, `debe exportar ${fn}`).toContain(fn);
    }
    // Web Audio API: AudioContext u oscillator
    expect(raw, 'debe usar AudioContext').toContain('AudioContext');
    expect(raw, 'debe usar OscillatorNode').toContain('Oscillator');
  });

  // Riesgo 2: session-runner usa el audio nuevo
  it('session-runner.tsx importa y usa las alarmas nuevas', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe importar playTransition').toContain('playTransition');
  });

  // Riesgo 3: la alarma suena en auto-advance del timer
  it('session-runner.tsx llama playTransition en auto-advance del timer', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe llamar playTransition').toContain('playTransition()');
  });
});
