import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

// Bug #10: ningun test debe escribir el config/feature-flags.json real.
// Si lo hace, un servidor leyendo flags por request puede recibir JSON a medias.
const testsDir = resolve(__dirname);
const SELF = 'flags-write-guard.test.ts';
const REAL = 'config/feature-flags.json';

describe('guard: ningun test escribe config/feature-flags.json', () => {
  it('no hay writeFileSync sobre la ruta real', () => {
    const offenders = readdirSync(testsDir)
      .filter((f) => f.endsWith('.ts') && f !== SELF)
      .filter((f) => {
        const src = readFileSync(join(testsDir, f), 'utf-8');
        return src.split('\n').some(
          (line) =>
            line.includes('writeFileSync') &&
            (line.includes('writeFileSync(flagsPath') || line.includes(REAL)),
        );
      });

    expect(offenders).toEqual([]);
  });
});
