import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Import full catalog — bodyweight + dumbbell, sin categorizar', () => {
  const scriptPath = resolve(root, 'scripts/import-exercises-dataset.ts');
  const script = readFileSync(scriptPath, 'utf-8');

  it('filtra por body weight OR dumbbell (no uno solo)', () => {
    expect(script).toContain("equipment === 'body weight'");
    expect(script).toContain("equipment === 'dumbbell'");
    // Debe aceptar cualquiera de los dos, no solo bodyweight
    expect(script).toContain('||');
  });

  it('dumbbell asigna equipment_required = ["dumbbell"] directo', () => {
    expect(script).toContain("['dumbbell']");
  });

  it('bodyweight NO asigna equipment_required (null/ausente — lo completa classify)', () => {
    // bodyweight no debe tener literal equipment_required: ['bodyweight']
    // (solo dumbbell lo tiene)
    expect(script).not.toContain("equipment_required: ['bodyweight']");
  });

  it('category solo se asigna a null (ningún valor concreto — lo completa classify)', () => {
    // Debe asignarse explícitamente a null (columna NOT NULL)
    expect(script).toContain('null');
    // No debe tener valores concretos de categoría hardcodeados
    expect(script).not.toContain("category: 'push'");
    expect(script).not.toContain("category: 'pull'");
    expect(script).not.toContain("category: 'core'");
    expect(script).not.toContain("category: 'legs'");
    expect(script).not.toContain('toCategory');
    expect(script).not.toContain('BODY_PART_MAP');
  });

  it('dry-run por defecto, --write requerido', () => {
    expect(script).toContain('--write');
    expect(script).toContain('DRY-RUN');
  });
});
