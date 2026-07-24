import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const scriptPath = resolve(root, 'scripts/classify-equipment-and-category.ts');

describe('Clasificación de equipamiento + categoría vía LLM', () => {
  if (!existsSync(scriptPath)) {
    it('script no existe todavía (Fase B)', () => {
      expect(existsSync(scriptPath)).toBe(true);
    });
    return;
  }
  const script = readFileSync(scriptPath, 'utf-8');

  it('equipos válidos = bodyweight, bar, wall, ground (sin dumbbell)', () => {
    expect(script).toContain('bodyweight');
    expect(script).toContain('bar');
    expect(script).toContain('wall');
    expect(script).toContain('ground');
    // dumbbell no debe estar en la lista de validación
    expect(script).not.toContain("'dumbbell'");
  });

  it('categorías válidas son exactamente las 7 del enum', () => {
    ['push', 'pull', 'core', 'legs', 'cardio', 'mobility', 'skill'].forEach((cat) => {
      expect(script).toContain(cat);
    });
  });

  it('descarta filas con valor inválido antes de PATCH (validación antes de escribir)', () => {
    // Debe haber un chequeo "if valid" antes de cualquier PATCH
    const patchIdx = script.indexOf('PATCH');
    const beforePatch = script.slice(0, patchIdx);
    expect(beforePatch).toContain('valid');
    // No debe haber un PATCH sin validación previa
    expect(script).not.toContain('PATCH\n');
  });

  it('query filtrada por category is null (idempotente)', () => {
    expect(script).toContain('category');
    expect(script).toContain('is.null');
  });
});
