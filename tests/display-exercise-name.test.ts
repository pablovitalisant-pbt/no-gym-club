import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { displayExerciseName } from '../lib/exercises/display-name';

describe('displayExerciseName', () => {
  it('quita el sufijo (male)', () => {
    expect(displayExerciseName('Push-Up (male)')).toBe('Push-Up');
  });

  it('quita el sufijo (female)', () => {
    expect(displayExerciseName('Squat (female)')).toBe('Squat');
  });

  it('no distingue mayúsculas', () => {
    expect(displayExerciseName('Plank (MALE)')).toBe('Plank');
    expect(displayExerciseName('Lunge (Female)')).toBe('Lunge');
  });

  it('colapsa espacios sobrantes alrededor del segmento', () => {
    expect(displayExerciseName('Deadlift   (male)')).toBe('Deadlift');
    expect(displayExerciseName('  Row (male)  ')).toBe('Row');
  });

  it('quita el segmento aunque no esté al final', () => {
    expect(displayExerciseName('Bicep Curl (male) Alternating')).toBe(
      'Bicep Curl Alternating',
    );
  });

  it('deja intactos los nombres sin sufijo (sin traducir)', () => {
    expect(displayExerciseName('Sentadilla')).toBe('Sentadilla');
    expect(displayExerciseName('Jumping Jack')).toBe('Jumping Jack');
  });
});

describe('componentes muestran el nombre vía displayExerciseName', () => {
  const components = [
    'components/plan/PlanExerciseList.tsx',
    'app/[locale]/(app)/dashboard/dashboard-client.tsx',
    'app/[locale]/(session)/session/[id]/session-runner.tsx',
    'components/session/ContinuousPlayer.tsx',
    'components/session/runner/ActiveScreen.tsx',
    'components/session/runner/TimingScreen.tsx',
    'components/session/ContinuousSummary.tsx',
    'app/[locale]/(app)/exercises/page.tsx',
    'app/[locale]/(app)/exercises/[slug]/page.tsx',
  ];

  it.each(components)('%s importa displayExerciseName', (file) => {
    const source = readFileSync(resolve(__dirname, '..', file), 'utf-8');
    expect(source).toContain('displayExerciseName');
  });
});
