import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const summary = readFileSync(resolve(__dirname, '../components/session/ContinuousSummary.tsx'), 'utf8');
const body = summary.slice(summary.indexOf('async function handleSave'), summary.indexOf('const greeting'));

describe('v3-08 · guardado de reps que lanza excepcion', () => {
  it('saveExerciseReps rechazado (red caida) cae en try/catch y muestra error', () => {
    expect(body).toMatch(/try\s*\{[\s\S]*await saveExerciseReps\([\s\S]*\}\s*catch/);
    expect(body).toMatch(/catch[\s\S]*setSaveError\(true\)/);
  });
  it('en cualquier salida (rechazo o success:false) se suelta saving', () => {
    expect(body).toMatch(/finally\s*\{[\s\S]*setSaving\(false\)/);
  });
  it('success:false sigue marcando error sin llamar onDone', () => {
    expect(body).toMatch(/!res\.success[\s\S]*setSaveError\(true\)/);
  });
});
