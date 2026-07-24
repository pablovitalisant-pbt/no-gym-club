import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice CircularTimer — integración en session-runner', () => {
  const runnerPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/session-runner.tsx',
  );
  const runner = readFileSync(runnerPath, 'utf-8');

  // ─── 1: Importa CircularTimer desde components/session ───
  it('importa CircularTimer desde @/components/session/CircularTimer', () => {
    expect(runner).toContain('CircularTimer');
    expect(runner).toContain('@/components/session/CircularTimer');
  });

  // ─── 2: Usado en state === rest con restSeconds y prescribedRest ───
  it('se usa en bloque de rest con remaining=restSeconds y total del ref', () => {
    const restBlockStart = runner.indexOf("{state === 'rest'");
    const restBlock = runner.slice(restBlockStart, restBlockStart + 800);
    expect(restBlock).toContain('remaining={restSeconds}');
  });

  // ─── 3: Usado en state === timing con timingSeconds y duration_seconds ───
  it('se usa en bloque de timing con remaining=timingSeconds y total=current?.duration_seconds', () => {
    const timingIdx = runner.indexOf("{state === 'timing'");
    const timingBlock = runner.slice(timingIdx, timingIdx + 800);
    expect(timingBlock).toContain('remaining={timingSeconds}');
    expect(timingBlock).toContain('duration_seconds');
  });

  // ─── 4: Regresión — sigue sin supabase ───
  it('runner sigue sin importar supabase (server ni client)', () => {
    expect(runner).not.toContain('@/lib/supabase/server');
    expect(runner).not.toContain('@/lib/supabase/client');
  });

  // ─── 5: No toca persistence ni actions ───
  it('runner-persistence.ts y actions.ts no mencionan CircularTimer', () => {
    const persistence = readFileSync(
      resolve(root, 'lib/session/runner-persistence.ts'),
      'utf-8',
    );
    const actions = readFileSync(
      resolve(root, 'app/[locale]/(session)/session/[id]/actions.ts'),
      'utf-8',
    );
    expect(persistence).not.toContain('CircularTimer');
    expect(actions).not.toContain('CircularTimer');
  });
});
