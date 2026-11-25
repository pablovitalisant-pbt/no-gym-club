import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { useRunnerAdvance } from '../lib/session/useRunnerAdvance';

function setup(audio: boolean, total = 3) {
  const calls: string[] = [];
  const setIndex = vi.fn((fn: (i: number) => number) => calls.push(`idx:${fn(1)}`));
  const deps = {
    saveSnap: vi.fn((s: string, i: number, o?: object) => calls.push(`snap:${s}:${i}:${JSON.stringify(o)}`)),
    setState: vi.fn((s: string) => calls.push(`state:${s}`)),
    setIndex,
    playDone: vi.fn(() => calls.push('done')),
    playTransition: vi.fn(() => calls.push('trans')),
    audioRef: { current: audio },
    total,
  };
  return { calls, ...useRunnerAdvance(deps as never) };
}

describe('v3-ref-2 · useRunnerAdvance (caracterización)', () => {
  it('advance: snapshot active index+1 con refs nulos, luego state y index (en ese orden)', () => {
    const { calls, advance } = setup(true);
    advance(1);
    expect(calls).toEqual([
      'snap:active:2:{"restEndsAt":null,"timingEndsAt":null}',
      'state:active',
      'idx:2',
    ]);
  });

  it('finishExercise intermedio: playTransition y luego active + index+1, sin snapshot', () => {
    const { calls, finishExercise } = setup(true);
    finishExercise(0);
    expect(calls).toEqual(['trans', 'state:active', 'idx:2']);
  });

  it('finishExercise en el último: playDone y luego done', () => {
    const { calls, finishExercise } = setup(true);
    finishExercise(2);
    expect(calls).toEqual(['done', 'state:done']);
  });

  it('finishExercise con audio apagado: sin sonidos', () => {
    const { calls, finishExercise } = setup(false);
    finishExercise(0);
    expect(calls).toEqual(['state:active', 'idx:2']);
  });

  it('el runner usa advance() y finishExercise() y no repite los bloques', () => {
    const runner = readFileSync(
      resolve(__dirname, '..', 'app/[locale]/(session)/session/[id]/session-runner.tsx'),
      'utf-8',
    );
    expect(runner).toContain('useRunnerAdvance');
    expect((runner.match(/advance\(index\)/g) || []).length).toBe(3);
    expect((runner.match(/finishExercise\(snapshot\.index\)/g) || []).length).toBe(5);
    expect(runner).not.toContain("saveSnap('active', index + 1");
  });
});
