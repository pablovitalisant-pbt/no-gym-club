import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const reps = readFileSync('components/session/player/RepsScreen.tsx', 'utf8');
const rest = readFileSync('components/session/player/RestScreen.tsx', 'utf8');

describe('v3-13', () => {
  it('RepsScreen no usa e.currentTarget dentro de setTimeout y lo captura antes', () => {
    expect(reps).not.toMatch(/setTimeout\(\(\) => e\.currentTarget/);
    expect(reps).toMatch(/const el = e\.currentTarget;/);
  });
  it('RestScreen separa el bloque "Sigue" y permite wrap de la serie', () => {
    expect(rest).toMatch(/mt-4 font-body-lg/);
    expect(rest).toMatch(/flex flex-wrap/);
  });
});
