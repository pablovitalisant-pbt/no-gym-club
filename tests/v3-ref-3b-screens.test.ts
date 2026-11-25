import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const dir = 'components/session/runner';
const src = (f: string) => readFileSync(resolve(root, dir, f), 'utf-8');
const runner = readFileSync(
  resolve(root, 'app/[locale]/(session)/session/[id]/session-runner.tsx'),
  'utf-8',
);
const NAMES = ['RunnerRepsScreen', 'RunnerRestScreen', 'RunnerDoneScreen'];

describe('v3-ref-3b — pantallas presentacionales reps/rest/done', () => {
  it.each(NAMES)('%s existe', (n) => {
    expect(existsSync(resolve(root, dir, `${n}.tsx`))).toBe(true);
  });

  it('RunnerRepsScreen: inputs por serie, bilateral lado 1 y 2, índice en onChange', () => {
    const s = src('RunnerRepsScreen.tsx');
    expect(s).toContain('repsInputs');
    expect(s).toContain('setRepsInputs((prev) => prev.map(');
    expect(s).not.toMatch(/setRepsInputs\s*\(\s*e\s*\.\s*target\s*\.\s*value\s*\)/);
    expect(s).toContain('current.bilateral');
    expect(s).toContain("t('side', { n: 2 })");
    expect(s).toContain("t('side', { n: 1 })");
    expect(s).toContain('(current.sets ?? 0) + i');
    expect(s).toContain("t('confirmReps')");
    expect(s).toContain('autoFocus={i === 0}');
  });

  it('RunnerRestScreen: CircularTimer remaining=restSeconds, skip, próximo ejercicio', () => {
    const s = src('RunnerRestScreen.tsx');
    expect(s).toContain('@/components/session/CircularTimer');
    expect(s).toContain('remaining={restSeconds}');
    expect(s).toContain("t('skipRest')");
    expect(s).toContain("t('nextExercise')");
    expect(s).toContain('restSeconds <= 3');
  });

  it('RunnerDoneScreen: único render de LogForm, con saludo', () => {
    const s = src('RunnerDoneScreen.tsx');
    expect(s.match(/<LogForm/g)).toHaveLength(1);
    expect(s).toContain('completeGreeting');
    expect(s).toContain('greetingText');
  });

  it('el runner las monta y ya no tiene ese JSX (LogForm solo en DoneScreen)', () => {
    for (const n of NAMES) expect(runner).toContain(`<${n}`);
    expect(runner).not.toContain('<LogForm');
    expect(runner).not.toContain('<CircularTimer');
    expect(runner).not.toContain("t('confirmReps')");
    expect(runner).not.toContain("t('skipRest')");
  });

  it('sin hex sueltos en las pantallas', () => {
    for (const n of NAMES) {
      expect(src(`${n}.tsx`).match(/#[0-9a-fA-F]{3,8}/g) ?? [], n).toEqual([]);
    }
  });
});
