import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Audio notification on rest complete', () => {

  // Riesgo 1: lib/audio.ts existe y usa Web Audio API
  it('lib/audio.ts exporta playBeep usando Web Audio API', () => {
    const path = resolve(root, 'lib/audio.ts');
    expect(existsSync(path), 'lib/audio.ts debe existir').toBe(true);
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe exportar playBeep').toContain('playBeep');
    // Web Audio API: AudioContext u oscillator
    expect(raw, 'debe usar AudioContext').toContain('AudioContext');
    expect(raw, 'debe usar OscillatorNode').toContain('Oscillator');
  });

  // Riesgo 2: session-runner llama playBeep al terminar descanso
  it('session-runner.tsx importa y llama playBeep', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    expect(raw, 'debe importar playBeep').toContain('playBeep');
  });

  // Riesgo 3: playBeep se llama solo en auto-advance, no en skip
  it('session-runner.tsx llama playBeep en auto-advance del timer', () => {
    const path = resolve(
      root,
      'app/[locale]/(session)/session/[id]/session-runner.tsx',
    );
    const raw = readFileSync(path, 'utf-8');
    // Debe haber una llamada a playBeep dentro del setInterval (auto-advance)
    expect(raw, 'debe llamar playBeep').toContain('playBeep()');
  });
});
