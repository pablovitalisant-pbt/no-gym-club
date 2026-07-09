import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Slice 4 — toggle de audio on/off', () => {
  const runnerPath = resolve(
    root,
    'app/[locale]/(session)/session/[id]/session-runner.tsx',
  );
  const runner = readFileSync(runnerPath, 'utf-8');
  const hookPath = resolve(root, 'lib/useAudioPreference.ts');
  const hook = readFileSync(hookPath, 'utf-8');

  it('useAudioPreference.ts existe y exporta hook', () => {
    expect(hook).toContain('useAudioPreference');
    expect(hook).toContain('localStorage');
  });

  it('session-runner.tsx importa useAudioPreference', () => {
    expect(runner).toContain('useAudioPreference');
  });

  it('playBeep gateado con audioRef.current (no siempre suena)', () => {
    // Debe haber al menos un `if (audioRef.current) playBeep()`
    const gatePattern = 'audioRef.current) playBeep';
    expect(runner).toContain(gatePattern);
  });

  it('Toggle button visible en estados activos', () => {
    // Debe tener un botón toggle con emoji o label
    expect(runner).toContain('toggleAudio');
    // Visible en active/timing/reps/rest pero no en idle/done
    expect(runner).toContain("state !== 'idle'");
    expect(runner).toContain("state !== 'done'");
  });

  it('i18n keys mute/unmute simétricas ES/EN', () => {
    const es = JSON.parse(
      readFileSync(resolve(root, 'messages/es.json'), 'utf-8'),
    );
    const en = JSON.parse(
      readFileSync(resolve(root, 'messages/en.json'), 'utf-8'),
    );
    expect(es.session?.mute, 'falta session.mute en es.json').toBeTruthy();
    expect(es.session?.unmute, 'falta session.unmute en es.json').toBeTruthy();
    expect(en.session?.mute, 'falta session.mute en en.json').toBeTruthy();
    expect(en.session?.unmute, 'falta session.unmute en en.json').toBeTruthy();
  });

  it('localStorage key ngc-audio-enabled usada en hook', () => {
    expect(hook).toContain('ngc-audio-enabled');
  });
});
