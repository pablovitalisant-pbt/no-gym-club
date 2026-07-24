import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

// Mock profile matching ProfileRow shape
const profileMock = {
  id: '00000000-0000-0000-0000-000000000000',
  username: null,
  full_name: null,
  age: 30,
  weight_kg: 75,
  height_cm: 175,
  experience_level: 'intermediate' as const,
  primary_goal: 'general_fitness' as const,
  available_days_per_week: 4,
  available_equipment: ['bodyweight', 'bar'],
  locale: 'es' as const,
  par_q_cleared: true,
  par_q_answered_at: null,
  assessment_completed: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('buildSessionPrompt — availableExercises param', () => {
  const promptPath = resolve(root, 'lib/prompts/build-session-prompt.ts');
  const prompt = readFileSync(promptPath, 'utf-8');

  it('buildSessionPrompt acepta 4to parámetro opcional availableExercises', () => {
    // Buscar la firma de la función
    const fnSig = prompt.indexOf('export function buildSessionPrompt');
    const sigBlock = prompt.slice(fnSig, fnSig + 300);
    // Debe tener un 4to parámetro con ? o = [] como default
    expect(sigBlock).toContain('availableExercises');
  });

  it('prompt con lista vacía es idéntico a antes del cambio', async () => {
    const { buildSessionPrompt } = await import('@/lib/prompts/build-session-prompt');
    const promptEmpty = buildSessionPrompt(profileMock, [], undefined, []);
    const promptNoArg = buildSessionPrompt(profileMock, [], undefined);
    // Ambos deben ser idénticos (lista vacía = sin parámetro)
    expect(promptEmpty.system).toBe(promptNoArg.system);
    expect(promptEmpty.user).toBe(promptNoArg.user);
  });

  it('prompt con datos contiene bloque AVAILABLE EXERCISES y nombre exacto', async () => {
    const { buildSessionPrompt } = await import('@/lib/prompts/build-session-prompt');
    const result = buildSessionPrompt(profileMock, [], undefined, [
      { name_en: 'Push-Up', category: 'push', muscle_groups: ['chest', 'triceps'] },
      { name_en: 'Pull-Up', category: 'pull', muscle_groups: ['back', 'biceps'] },
    ]);
    // Debe incluir el bloque "AVAILABLE EXERCISES"
    expect(result.user).toContain('AVAILABLE EXERCISES');
    // Debe incluir los nombres exactos
    expect(result.user).toContain('Push-Up');
    expect(result.user).toContain('Pull-Up');
    // Debe mencionar la regla de copiar exacto
    expect(result.system).toContain('exact');
  });

  it('regla de copiar exacto no aparece cuando availableExercises está vacío', async () => {
    const { buildSessionPrompt } = await import('@/lib/prompts/build-session-prompt');
    const result = buildSessionPrompt(profileMock, [], undefined, []);
    // Sin lista de ejercicios disponible, no debe haber AVAILABLE EXERCISES
    expect(result.user).not.toContain('AVAILABLE EXERCISES');
  });
});
