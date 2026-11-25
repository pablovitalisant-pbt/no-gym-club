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

describe('v3-ref-3a — pantallas presentacionales idle/active/timing', () => {
  it.each(['IdleScreen', 'ActiveScreen', 'TimingScreen'])('%s existe', (n) => {
    expect(existsSync(resolve(root, dir, `${n}.tsx`))).toBe(true);
  });

  it('IdleScreen: BackButton y ModeToggle una sola vez, botones de inicio', () => {
    const s = src('IdleScreen.tsx');
    expect(s.match(/<BackButton/g)).toHaveLength(1);
    expect(s.match(/<ModeToggle/g)).toHaveLength(1);
    expect(s).toContain('backToPanel');
    expect(s).toContain('continuousStart');
    expect(s).toContain('stepByStep');
    expect(s).toContain('startOptions');
    expect(s).toContain('title_es');
  });

  it('ActiveScreen: imagen, placeholder, onError, badge, botones', () => {
    const s = src('ActiveScreen.tsx');
    expect(s).toContain('gif_url');
    expect(s).toContain('noImage');
    expect(s).toContain('onError={onImageError}');
    expect(s).toContain('SECTION_BADGES');
    expect(s).toContain('displayExerciseName');
    expect(s).toContain('startTimer');
    expect(s).toContain("t('done')");
    expect(s).toContain('technique');
  });

  it('TimingScreen: CircularTimer con remaining=timingSeconds y duration_seconds', () => {
    const s = src('TimingScreen.tsx');
    expect(s).toContain('@/components/session/CircularTimer');
    expect(s).toContain('remaining={timingSeconds}');
    expect(s).toContain('duration_seconds');
    expect(s).toContain('displayExerciseName');
    expect(s).toContain("t('side', { n: side })");
    expect(s).toContain('nextExercise');
  });

  it('sin hex sueltos en las pantallas', () => {
    for (const f of ['IdleScreen.tsx', 'ActiveScreen.tsx', 'TimingScreen.tsx']) {
      expect(src(f).match(/#[0-9a-fA-F]{3,8}/g) ?? [], f).toEqual([]);
    }
  });

  it('el runner las monta y ya no tiene ese JSX', () => {
    for (const n of ['IdleScreen', 'ActiveScreen', 'TimingScreen']) {
      expect(runner).toContain(`<${n}`);
    }
    expect(runner).not.toContain('<ModeToggle');
    expect(runner).not.toContain('<BackButton');
    expect(runner).not.toContain('<CircularTimer remaining={timingSeconds}');
    expect(runner).not.toContain('SECTION_BADGES');
  });
});
